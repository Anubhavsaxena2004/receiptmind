import { NextResponse, type NextRequest } from 'next/server'
import { revalidatePath } from 'next/cache'
import { cancelCheckout } from '@/lib/payments'
import { currentUser } from '@/lib/session'

/** PayPal sends the buyer here when they cancel. Nothing was charged. */
export async function GET(request: NextRequest) {
  const paymentId = request.nextUrl.searchParams.get('payment')
  if (!paymentId) return NextResponse.redirect(new URL('/history', request.url))
  const target = `/payments/${encodeURIComponent(paymentId)}`
  const user = await currentUser()
  if (!user) return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(target)}`, request.url))
  await cancelCheckout(user.id, paymentId)
  revalidatePath('/', 'layout')
  return NextResponse.redirect(new URL(target, request.url))
}
