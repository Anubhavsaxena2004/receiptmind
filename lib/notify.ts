import { newId } from './ids'
import type { AppNotification, Db } from './types'

/**
 * Notifications are stored in-app and, when ZAPIER_WEBHOOK_URL is set, forwarded
 * to a Zapier "Catch Hook" so a Zap can send email / WhatsApp / Slack or log to a sheet.
 * Zapier only receives side-effect events — it never decides whether a payment succeeded.
 */
const outbox: AppNotification[] = []

export function notify(db: Db, n: Omit<AppNotification, 'id' | 'at' | 'read'>): AppNotification {
  const item: AppNotification = { id: newId('ntf'), at: new Date().toISOString(), read: false, ...n }
  db.notifications.unshift(item)
  if (db.notifications.length > 200) db.notifications.length = 200
  outbox.push(item)
  return item
}

export function outboxMark(): number {
  return outbox.length
}

export function discardOutbox(fromIndex: number): void {
  outbox.splice(fromIndex)
}

export function flushOutbox(): void {
  const items = outbox.splice(0)
  const url = process.env.ZAPIER_WEBHOOK_URL
  if (!url || items.length === 0) return
  const base = process.env.APP_URL?.replace(/\/$/, '') ?? ''
  for (const item of items) {
    void fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        app: 'Tinku',
        event: item.kind,
        title: item.title,
        message: item.body,
        link: item.href ? `${base}${item.href}` : undefined,
        at: item.at,
      }),
      signal: AbortSignal.timeout(5000),
    }).catch((err: unknown) => {
      console.warn('[zapier] delivery failed:', err instanceof Error ? err.message : err)
    })
  }
}
