import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getUser } from '@/lib/auth/accounts'
import { paypalWebhookConfigured } from '@/lib/config'
import { applyWebhookEvent, parseCustomId } from '@/lib/payments'
import { verifyWebhookSignature } from '@/lib/paypal'
import { updateUserDb } from '@/lib/store'

/**
 * PayPal webhook: PAYMENT.CAPTURE.* events.
 * 1. Verify the signature with PayPal (rejects forged calls).
 * 2. Route to the owner using custom_id ("<userId>:<paymentId>", set by our server).
 * 3. De-duplicate by event id (PayPal retries deliveries).
 * 4. Apply through the same verified-outcome path as the checkout return.
 */
export async function POST(request: Request) {
  if (!paypalWebhookConfigured()) {
    return NextResponse.json({ error: 'PayPal webhook is not configured' }, { status: 503 })
  }
  const raw = await request.text()
  let event: { id?: string; event_type?: string; resource?: { custom_id?: string } }
  try {
    event = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  if (!event.id || !event.event_type) return NextResponse.json({ error: 'Not a PayPal event' }, { status: 400 })

  let verified = false
  try {
    verified = await verifyWebhookSignature(request.headers, event)
  } catch (err) {
    console.error('[paypal webhook] verification call failed', err)
    // 5xx so PayPal retries later.
    return NextResponse.json({ error: 'Could not verify right now' }, { status: 502 })
  }
  if (!verified) return NextResponse.json({ error: 'Signature verification failed' }, { status: 401 })

  const owner = parseCustomId(event.resource?.custom_id)
  if (!owner || !(await getUser(owner.userId))) return NextResponse.json({ ok: true, outcome: 'ignored' })

  const outcome = await updateUserDb(owner.userId, (db) =>
    applyWebhookEvent(db, event as Parameters<typeof applyWebhookEvent>[1], owner.paymentId),
  )
  revalidatePath('/', 'layout')
  return NextResponse.json({ ok: true, outcome })
}
