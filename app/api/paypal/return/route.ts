import { NextResponse, type NextRequest } from 'next/server'
import { revalidatePath } from 'next/cache'
import { capturePayPalPayment } from '@/lib/payments'

/** PayPal sends the buyer here after approval. Capture + verify happen on the server. */
export async function GET(request: NextRequest) {
  const paymentId = request.nextUrl.searchParams.get('payment')
  const orderId = request.nextUrl.searchParams.get('token')
  if (!paymentId) return NextResponse.redirect(new URL('/history', request.url))
  try {
    await capturePayPalPayment(paymentId, orderId)
  } catch (err) {
    console.error('[paypal return]', err)
  }
  revalidatePath('/', 'layout')
  return NextResponse.redirect(new URL(`/payments/${encodeURIComponent(paymentId)}`, request.url))
}
