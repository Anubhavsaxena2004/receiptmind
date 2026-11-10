import { NextResponse } from 'next/server'
import { createSession, logIn, toPublicUser } from '@/lib/auth/accounts'
import { apiError, crossSiteBlock, json, readJson } from '@/lib/api'
import { setSessionCookie } from '@/lib/session'

/** POST { email, password } → { user, token, expiresAt } (also sets the session cookie). */
export async function POST(request: Request) {
  const blocked = crossSiteBlock(request, null)
  if (blocked) return blocked
  const body = await readJson(request)
  if (body instanceof NextResponse) return body
  const result = await logIn(String(body.email ?? ''), String(body.password ?? ''))
  if ('error' in result) return apiError(result.error.startsWith('Too many') ? 429 : 401, result.error)
  const session = await createSession(result.user.id)
  await setSessionCookie(session.token, session.expiresAt)
  return json({ user: toPublicUser(result.user), token: session.token, expiresAt: session.expiresAt })
}
