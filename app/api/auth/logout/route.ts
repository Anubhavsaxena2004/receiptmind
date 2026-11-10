import { endSession } from '@/lib/auth/accounts'
import { apiCaller, crossSiteBlock, json, UNAUTHORIZED } from '@/lib/api'
import { clearSessionCookie } from '@/lib/session'

/** POST → ends the current session (cookie or bearer token). */
export async function POST(request: Request) {
  const caller = await apiCaller(request)
  if (!caller) return UNAUTHORIZED()
  const blocked = crossSiteBlock(request, caller)
  if (blocked) return blocked
  await endSession(caller.token)
  if (caller.via === 'cookie') await clearSessionCookie()
  return json({ ok: true })
}
