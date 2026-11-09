import { NextResponse, type NextRequest } from 'next/server'
import { revalidatePath } from 'next/cache'
import { cancelCheckout } from '@/lib/payments'

/** PayPal sends the buyer here when they cancel. Nothing was charged. */
export async function GET(request: NextRequest) {
  const paymentId = request.nextUrl.searchParams.get('payment')
  if (!paymentId) return NextResponse.redirect(new URL('/history', request.url))
  await cancelCheckout(paymentId)
  revalidatePath('/', 'layout')
  return NextResponse.redirect(new URL(`/payments/${encodeURIComponent(paymentId)}`, request.url))
}
