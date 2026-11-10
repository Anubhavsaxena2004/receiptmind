import { NextResponse, type NextRequest } from 'next/server'
import { revalidatePath } from 'next/cache'
import { capturePayPalPayment } from '@/lib/payments'
import { currentUser } from '@/lib/session'

/** PayPal sends the buyer here after approval. Capture + verify happen on the server, for the signed-in owner only. */
export async function GET(request: NextRequest) {
  const paymentId = request.nextUrl.searchParams.get('payment')
  const orderId = request.nextUrl.searchParams.get('token')
  if (!paymentId) return NextResponse.redirect(new URL('/history', request.url))
  const target = `/payments/${encodeURIComponent(paymentId)}`
  const user = await currentUser()
  // Without a session we don't capture here; PayPal's signed webhook (or "Check status" after login) completes it.
  if (!user) return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(target)}`, request.url))
  try {
    await capturePayPalPayment(user.id, paymentId, orderId)
  } catch (err) {
    console.error('[paypal return]', err)
  }
  revalidatePath('/', 'layout')
  return NextResponse.redirect(new URL(target, request.url))
}
