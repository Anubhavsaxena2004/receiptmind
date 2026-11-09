import { connection } from 'next/server'
import { headers } from 'next/headers'
import { readDb } from './db'
import type { Db } from './types'

/** Load the store for a page. connection() keeps the page dynamic (never prerendered with stale data). */
export async function getData(): Promise<Db> {
  await connection()
  return readDb()
}

/** Public origin for PayPal return URLs. APP_URL wins (set it in production). */
export async function getOrigin(): Promise<string> {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, '')
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000'
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
  return `${proto}://${host}`
}
