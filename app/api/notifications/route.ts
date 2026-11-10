import { apiCaller, json, UNAUTHORIZED } from '@/lib/api'
import { readUserDb } from '@/lib/store'

/** GET → { unread, notifications } (newest first, each with a deep link). */
export async function GET(request: Request) {
  const caller = await apiCaller(request)
  if (!caller) return UNAUTHORIZED()
  const db = await readUserDb(caller.user.id)
  return json({ unread: db.notifications.filter((n) => !n.read).length, notifications: db.notifications })
}
