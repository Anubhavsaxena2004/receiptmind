import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { newToken } from '@/lib/auth/crypto'
import { googleAuthUrl, googleConfigured, OAUTH_COOKIE } from '@/lib/auth/google'
import { getOrigin } from '@/lib/data'
import { safeNext } from '@/lib/session'

/** Starts "Continue with Google": remembers state + PKCE verifier in a short-lived cookie. */
export async function GET(request: NextRequest) {
  const next = safeNext(request.nextUrl.searchParams.get('next'))
  if (!googleConfigured()) {
    return NextResponse.redirect(new URL(`/login?error=google&next=${encodeURIComponent(next)}`, request.url))
  }
  const state = newToken()
  const verifier = newToken()
  ;(await cookies()).set(OAUTH_COOKIE, JSON.stringify({ state, verifier, next }), {
    httpOnly: true,
    sameSite: 'lax',
    secure: request.nextUrl.protocol === 'https:',
    path: '/api/auth/google',
    maxAge: 600,
  })
  const redirectUri = `${await getOrigin()}/api/auth/google/callback`
  return NextResponse.redirect(googleAuthUrl({ redirectUri, state, verifier }))
}
