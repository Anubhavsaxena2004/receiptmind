import { toPublicUser } from '@/lib/auth/accounts'
import { apiCaller, json, UNAUTHORIZED } from '@/lib/api'

/** GET → the signed-in user. */
export async function GET(request: Request) {
  const caller = await apiCaller(request)
  if (!caller) return UNAUTHORIZED()
  return json({ user: toPublicUser(caller.user) })
}
