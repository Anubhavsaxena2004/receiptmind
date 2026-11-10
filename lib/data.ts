import { cache } from 'react'
import { connection } from 'next/server'
import { headers } from 'next/headers'
import { sampleDb } from './demo'
import { currentUser } from './session'
import { readUserDb } from './store'
import type { Db } from './types'

/**
 * Data for the page being rendered: the signed-in user's own data, or the
 * read-only sample household for guests. connection() keeps pages dynamic.
 */
export const getData = cache(async (): Promise<Db> => {
  await connection()
  const user = await currentUser()
  return user ? readUserDb(user.id) : sampleDb()
})

/** Public origin for PayPal/Google return URLs. APP_URL wins (set it in production). */
export async function getOrigin(): Promise<string> {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, '')
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000'
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
  return `${proto}://${host}`
}
