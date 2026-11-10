import { createHash } from 'node:crypto'

/**
 * Optional "Continue with Google" (OAuth 2.0 authorization code flow with PKCE and
 * a state check). Enabled when GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set.
 * Redirect URI to register in Google Cloud: <APP_URL>/api/auth/google/callback
 */
export function googleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
}

export const OAUTH_COOKIE = 'tinku_oauth'

export function pkceChallenge(verifier: string): string {
  return createHash('sha256').update(verifier).digest('base64url')
}

export function googleAuthUrl(opts: { redirectUri: string; state: string; verifier: string }): string {
  const u = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  u.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID!)
  u.searchParams.set('redirect_uri', opts.redirectUri)
  u.searchParams.set('response_type', 'code')
  u.searchParams.set('scope', 'openid email profile')
  u.searchParams.set('state', opts.state)
  u.searchParams.set('code_challenge', pkceChallenge(opts.verifier))
  u.searchParams.set('code_challenge_method', 'S256')
  u.searchParams.set('prompt', 'select_account')
  return u.toString()
}

export interface GoogleProfile {
  sub: string
  email: string
  name: string
}

/** Exchanges the code server-to-server, then reads the profile. Only verified emails are accepted. */
export async function googleProfile(opts: { code: string; verifier: string; redirectUri: string }): Promise<GoogleProfile> {
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      code: opts.code,
      code_verifier: opts.verifier,
      grant_type: 'authorization_code',
      redirect_uri: opts.redirectUri,
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
  })
  const token = (await tokenRes.json().catch(() => ({}))) as { access_token?: string; error?: string }
  if (!tokenRes.ok || !token.access_token) throw new Error(`Google token exchange failed: ${token.error ?? tokenRes.status}`)

  const infoRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${token.access_token}` },
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
  })
  const info = (await infoRes.json().catch(() => ({}))) as { sub?: string; email?: string; email_verified?: boolean; name?: string }
  if (!infoRes.ok || !info.sub || !info.email) throw new Error('Google did not return a profile.')
  if (info.email_verified !== true) throw new Error('Your Google email is not verified.')
  return { sub: info.sub, email: info.email, name: info.name ?? '' }
}
