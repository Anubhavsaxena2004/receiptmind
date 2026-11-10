import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { userForToken, type User } from './auth/accounts'
import { SESSION_COOKIE } from './session'

/**
 * JSON API helpers. Callers authenticate with the session cookie (browser) or
 * `Authorization: Bearer <token>` (Postman / scripts; the token comes from
 * POST /api/auth/login). Ownership is enforced by loading only the caller's data.
 */

export function json(data: unknown, status = 200, init?: ResponseInit): NextResponse {
  return NextResponse.json(data, { status, ...init, headers: { 'cache-control': 'no-store', ...init?.headers } })
}

export function apiError(status: number, error: string, extra?: Record<string, unknown>): NextResponse {
  return json({ error, ...extra }, status)
}

export interface ApiCaller {
  user: User
  /** How the caller authenticated; cookie requests get same-origin checks. */
  via: 'bearer' | 'cookie'
  token: string
}

export async function apiCaller(request: Request): Promise<ApiCaller | null> {
  const auth = request.headers.get('authorization')
  if (auth?.toLowerCase().startsWith('bearer ')) {
    const token = auth.slice(7).trim()
    const user = await userForToken(token)
    return user ? { user, via: 'bearer', token } : null
  }
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  if (!token) return null
  const user = await userForToken(token)
  return user ? { user, via: 'cookie', token } : null
}

export const UNAUTHORIZED = () =>
  apiError(401, 'Log in first: POST /api/auth/login, then send the session cookie or "Authorization: Bearer <token>".')

/**
 * Blocks cross-site use of the cookie: a state-changing cookie request must come
 * from this site (Origin check) and, when it has a body, be JSON (which a plain
 * HTML form on another site cannot send).
 */
export function crossSiteBlock(request: Request, caller: Pick<ApiCaller, 'via'> | null): NextResponse | null {
  if (caller?.via === 'bearer') return null
  const origin = request.headers.get('origin')
  if (origin) {
    const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
    try {
      if (new URL(origin).host !== host) return apiError(403, 'Cross-site request blocked.')
    } catch {
      return apiError(403, 'Cross-site request blocked.')
    }
  }
  return null
}

/** Parses a JSON object body (415 if it isn't JSON). */
export async function readJson(request: Request): Promise<Record<string, unknown> | NextResponse> {
  if (!(request.headers.get('content-type') ?? '').toLowerCase().includes('application/json')) {
    return apiError(415, 'Send a JSON body with "Content-Type: application/json".')
  }
  try {
    const body = await request.json()
    if (!body || typeof body !== 'object' || Array.isArray(body)) return apiError(400, 'The body must be a JSON object.')
    return body as Record<string, unknown>
  } catch {
    return apiError(400, 'The body is not valid JSON.')
  }
}

/** Common preamble for authenticated, state-changing JSON endpoints. */
export async function authedJson(request: Request): Promise<{ caller: ApiCaller; body: Record<string, unknown> } | NextResponse> {
  const caller = await apiCaller(request)
  if (!caller) return UNAUTHORIZED()
  const blocked = crossSiteBlock(request, caller)
  if (blocked) return blocked
  const body = await readJson(request)
  if (body instanceof NextResponse) return body
  return { caller, body }
}
