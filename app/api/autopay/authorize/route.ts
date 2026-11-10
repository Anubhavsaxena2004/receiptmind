import { NextResponse } from 'next/server'
import { apiError, authedJson, json } from '@/lib/api'
import { authorizeAutopayFor } from '@/lib/services'
import { isVerified } from '@/lib/session'

/** POST { billId, maxAmount, months: 3|6|12, consent: true } → 201 { mandate }. Verified email + explicit consent required. */
export async function POST(request: Request) {
  const ctx = await authedJson(request)
  if (ctx instanceof NextResponse) return ctx
  const { user } = ctx.caller
  if (!isVerified(user)) return apiError(403, 'Verify your email before authorizing AutoPay.', { needs: 'verify' })
  if (ctx.body.consent !== true) return apiError(400, 'AutoPay needs explicit consent: send "consent": true after showing the person the terms.')
  const result = await authorizeAutopayFor(user, ctx.body)
  if ('error' in result) return apiError(400, result.error)
  return json({ mandate: result.ok }, 201)
}
