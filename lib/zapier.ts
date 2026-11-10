import { after } from 'next/server'
import type { AppNotification } from './types'

/**
 * Zapier is an optional delivery channel for a user's own notifications (email,
 * Sheets, Slack, WhatsApp via their Zap). It never approves, captures or verifies a
 * payment, and Tinku keeps working if Zapier is down.
 *
 * Only Zapier Catch Hook URLs are accepted, so the server can't be pointed at
 * arbitrary addresses, and redirects are refused.
 */
const HOOK = /^https:\/\/hooks\.zapier\.com\/hooks\/catch\/\d+\/[A-Za-z0-9]+\/?$/

export function isZapierHook(url: string): boolean {
  return HOOK.test(url.trim())
}

/** Exactly what leaves Tinku. Shown to the user before they connect. */
export function zapierPayload(n: Pick<AppNotification, 'kind' | 'title' | 'body' | 'href' | 'at'>) {
  const base = process.env.APP_URL?.replace(/\/$/, '') ?? ''
  return {
    app: 'Tinku',
    event: n.kind,
    title: n.title,
    message: n.body,
    link: n.href ? `${base}${n.href}` : undefined,
    at: n.at,
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Posts once, retrying network errors, 429 and 5xx up to 3 tries in total. */
export async function postToZapier(url: string, body: unknown, tries = 3): Promise<{ ok: boolean; detail: string }> {
  let detail = 'unknown error'
  for (let i = 0; i < tries; i++) {
    if (i > 0) await sleep(1000 * 2 ** (i - 1))
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
        redirect: 'error',
        cache: 'no-store',
        signal: AbortSignal.timeout(5000),
      })
      if (res.ok) return { ok: true, detail: i ? `Delivered after ${i + 1} tries` : 'Delivered' }
      detail = `Zapier answered HTTP ${res.status}`
      if (res.status < 500 && res.status !== 429) break
    } catch (err) {
      detail = err instanceof Error ? err.message : 'network error'
    }
  }
  return { ok: false, detail: `Not delivered: ${detail}` }
}

/** Runs work after the response is sent (falls back to fire-and-forget outside a request). */
export function runAfterResponse(task: () => Promise<void>): void {
  const safe = () => task().catch((err) => console.warn('[zapier]', err instanceof Error ? err.message : err))
  try {
    after(safe)
  } catch {
    void safe()
  }
}
