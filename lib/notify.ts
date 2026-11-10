import { newId } from './ids'
import type { AppNotification, Db } from './types'

/**
 * Notifications are stored in the user's own data. New ones are also remembered
 * against that exact data object until it is saved; then (and only then) they are
 * handed to the user's own Zapier hook, if they connected one. Keying by the data
 * object means one person's notifications can never be forwarded to someone else.
 */
const pending = new WeakMap<Db, AppNotification[]>()

export function notify(db: Db, n: Omit<AppNotification, 'id' | 'at' | 'read'>): AppNotification {
  const item: AppNotification = { id: newId('ntf'), at: new Date().toISOString(), read: false, ...n }
  db.notifications.unshift(item)
  if (db.notifications.length > 200) db.notifications.length = 200
  const list = pending.get(db) ?? []
  list.push(item)
  pending.set(db, list)
  return item
}

/** Notifications created on this data object since it was loaded (cleared on read). */
export function takePending(db: Db): AppNotification[] {
  const list = pending.get(db) ?? []
  pending.delete(db)
  return list
}
