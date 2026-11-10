import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createSession, upsertGoogleUser } from '@/lib/auth/accounts'
import { sameHash } from '@/lib/auth/crypto'
import { googleConfigured, googleProfile, OAUTH_COOKIE } from '@/lib/auth/google'
import { getOrigin } from '@/lib/data'
import { safeNext, setSessionCookie } from '@/lib/session'

/** Google sends the person back here. Check state, exchange the code, then sign in. */
export async function GET(request: NextRequest) {
  const jar = await cookies()
  const raw = jar.get(OAUTH_COOKIE)?.value
  jar.delete({ name: OAUTH_COOKIE, path: '/api/auth/google' })
  const fail = (next = '/') => NextResponse.redirect(new URL(`/login?error=google&next=${encodeURIComponent(next)}`, request.url))

  let saved: { state?: string; verifier?: string; next?: string } = {}
  try {
    saved = raw ? JSON.parse(raw) : {}
  } catch {}
  const next = safeNext(saved.next)
  const code = request.nextUrl.searchParams.get('code')
  const state = request.nextUrl.searchParams.get('state') ?? ''
  if (!googleConfigured() || !code || !saved.state || !saved.verifier || !sameHash(state, saved.state)) return fail(next)

  try {
    const profile = await googleProfile({ code, verifier: saved.verifier, redirectUri: `${await getOrigin()}/api/auth/google/callback` })
    const user = await upsertGoogleUser(profile)
    const session = await createSession(user.id)
    await setSessionCookie(session.token, session.expiresAt)
    return NextResponse.redirect(new URL(next, request.url))
  } catch (err) {
    console.error('[google sign-in]', err instanceof Error ? err.message : err)
    return fail(next)
  }
}
