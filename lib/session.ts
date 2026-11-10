import { cache } from 'react'
import { cookies, headers } from 'next/headers'
import { toPublicUser, userForToken, type PublicUser, type User } from './auth/accounts'
import type { ActionState } from './types'

export const SESSION_COOKIE = 'tinku_session'

/** The signed-in user for this request, or null for a guest. Looked up once per request. */
export const currentUser = cache(async (): Promise<User | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  return token ? userForToken(token) : null
})

export type Viewer = { kind: 'guest' } | { kind: 'user'; user: PublicUser }

export const getViewer = cache(async (): Promise<Viewer> => {
  const user = await currentUser()
  return user ? { kind: 'user', user: toPublicUser(user) } : { kind: 'guest' }
})

async function secureCookies(): Promise<boolean> {
  if (process.env.NODE_ENV !== 'production') return false
  const h = await headers()
  const host = (h.get('x-forwarded-host') ?? h.get('host') ?? '').split(':')[0]
  // Browsers treat http://localhost as secure, but API tools often don't; keep local runs simple.
  return !['localhost', '127.0.0.1'].includes(host)
}

export async function setSessionCookie(token: string, expiresAt: string): Promise<void> {
  ;(await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: await secureCookies(),
    path: '/',
    expires: new Date(expiresAt),
  })
}

export async function sessionToken(): Promise<string | undefined> {
  return (await cookies()).get(SESSION_COOKIE)?.value
}

export async function clearSessionCookie(): Promise<void> {
  ;(await cookies()).delete(SESSION_COOKIE)
}

export const isVerified = (u: Pick<User, 'emailVerifiedAt'>) => Boolean(u.emailVerifiedAt)

/** Returned by actions a guest tries; the page offers to log in or sign up. */
export const NEED_LOGIN: ActionState = {
  error: 'This is the sample household. Log in or create a free account to manage your own money.',
  needsAuth: 'login',
}

/** Payments and AutoPay need a verified email (an extra check on top of logging in). */
export const NEED_VERIFY: ActionState = {
  error: 'Verify your email first. Tinku only moves money for verified accounts.',
  needsAuth: 'verify',
}

/** Only same-site relative paths, so a `next` link can't send someone to another website. */
export function safeNext(next: unknown, fallback = '/'): string {
  const s = typeof next === 'string' ? next : ''
  return s.startsWith('/') && !s.startsWith('//') && !s.startsWith('/\\') ? s : fallback
}
