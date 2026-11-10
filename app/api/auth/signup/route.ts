import { NextResponse } from 'next/server'
import { createSession, demoCodeFor, newEmailCode, signUp, toPublicUser } from '@/lib/auth/accounts'
import { emailConfigured, sendEmail } from '@/lib/auth/email'
import { apiError, crossSiteBlock, json, readJson } from '@/lib/api'
import { setSessionCookie } from '@/lib/session'

/** POST { name, email, password } → 201 { user, token, expiresAt, verification } */
export async function POST(request: Request) {
  const blocked = crossSiteBlock(request, null)
  if (blocked) return blocked
  const body = await readJson(request)
  if (body instanceof NextResponse) return body
  const result = await signUp({ name: String(body.name ?? ''), email: String(body.email ?? ''), password: String(body.password ?? '') })
  if ('error' in result) return apiError(result.error.includes('already exists') ? 409 : 400, result.error)
  const session = await createSession(result.user.id)
  await setSessionCookie(session.token, session.expiresAt)
  const code = await newEmailCode(result.user.id)
  if ('code' in code && emailConfigured()) {
    await sendEmail(code.email, `Your Tinku code: ${code.code}`, `Your Tinku verification code is ${code.code}. It expires in 15 minutes.`)
  }
  return json(
    {
      user: toPublicUser(result.user),
      token: session.token,
      expiresAt: session.expiresAt,
      verification: emailConfigured() ? 'emailed' : 'demo',
      // Only on deployments that cannot send email (clearly a demo).
      demoCode: emailConfigured() ? undefined : await demoCodeFor(result.user.id),
    },
    201,
  )
}
