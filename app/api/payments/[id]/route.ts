import { apiCaller, apiError, json, UNAUTHORIZED } from '@/lib/api'
import { readUserDb } from '@/lib/store'

/** GET → one of your payments with its full verified timeline. */
export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const caller = await apiCaller(request)
  if (!caller) return UNAUTHORIZED()
  const { id } = await ctx.params
  const p = (await readUserDb(caller.user.id)).payments.find((x) => x.id === id)
  if (!p) return apiError(404, 'Payment not found.')
  return json({ payment: p })
}
