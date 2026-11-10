import { NextResponse } from 'next/server'
import { apiCaller, apiError, authedJson, json, UNAUTHORIZED } from '@/lib/api'
import { getOrigin } from '@/lib/data'
import { startCheckout, UserError } from '@/lib/payments'
import { isVerified } from '@/lib/session'
import { readUserDb } from '@/lib/store'

/** GET ?status= → { payments } (newest first). */
export async function GET(request: Request) {
  const caller = await apiCaller(request)
  if (!caller) return UNAUTHORIZED()
  const status = new URL(request.url).searchParams.get('status')
  const db = await readUserDb(caller.user.id)
  const payments = db.payments.filter((p) => !status || p.status === status)
  return json({ count: payments.length, payments })
}

/**
 * POST { occurrenceId } → 201 { paymentId, approveUrl }. Open approveUrl in a browser
 * to approve on PayPal Sandbox (or the labelled simulator). Needs a verified email.
 */
export async function POST(request: Request) {
  const ctx = await authedJson(request)
  if (ctx instanceof NextResponse) return ctx
  const { user } = ctx.caller
  if (!isVerified(user)) return apiError(403, 'Verify your email before making payments (POST /api/auth/verify).', { needs: 'verify' })
  try {
    const origin = await getOrigin()
    const { url, paymentId } = await startCheckout(user.id, String(ctx.body.occurrenceId ?? ''), origin)
    return json({ paymentId, approveUrl: url.startsWith('/') ? `${origin}${url}` : url, statusPage: `${origin}/payments/${paymentId}` }, 201)
  } catch (err) {
    if (err instanceof UserError) return apiError(400, err.message)
    console.error(err)
    return apiError(502, 'Could not start the payment.')
  }
}
