import { NextResponse } from 'next/server'
import { confirmEmailCode, demoCodeFor, getUser, newEmailCode, toPublicUser } from '@/lib/auth/accounts'
import { emailConfigured, sendEmail } from '@/lib/auth/email'
import { apiError, authedJson, json } from '@/lib/api'

/** POST { code } verifies the email; POST { resend: true } sends a new code. */
export async function POST(request: Request) {
  const ctx = await authedJson(request)
  if (ctx instanceof NextResponse) return ctx
  const { caller, body } = ctx
  if (body.resend === true) {
    const r = await newEmailCode(caller.user.id)
    if ('error' in r) return apiError(400, r.error)
    if (emailConfigured()) await sendEmail(r.email, `Your Tinku code: ${r.code}`, `Your Tinku verification code is ${r.code}. It expires in 15 minutes.`)
    return json({ sent: emailConfigured() ? 'emailed' : 'demo', demoCode: emailConfigured() ? undefined : await demoCodeFor(caller.user.id) })
  }
  const result = await confirmEmailCode(caller.user.id, String(body.code ?? ''))
  if ('error' in result) return apiError(400, result.error)
  const user = await getUser(caller.user.id)
  return json({ user: user ? toPublicUser(user) : null })
}
