import { deleteDoc, readDoc, updateDoc, writeDoc } from './db'
import { takePending } from './notify'
import { createEmptyDb, createSeed } from './seed'
import type { Db } from './types'
import { envZapierUrl, isZapierHook, postToZapier, runAfterResponse, zapierPayload } from './zapier'

/**
 * One document per account. The key always comes from the signed-in session on
 * the server (never from a URL or form), so a user can only ever load their own data.
 */
const userKey = (userId: string) => `user:${userId}`

export async function readUserDb(userId: string): Promise<Db> {
  return (await readDoc<Db>(userKey(userId))) ?? createEmptyDb()
}

/** Apply a synchronous change to the user's data and save it; then deliver new notifications. */
export function updateUserDb<T>(userId: string, fn: (db: Db) => T): Promise<T> {
  return updateDoc(userKey(userId), () => createEmptyDb(), fn, (db) => deliver(userId, db))
}

export function createUserDb(userId: string, name: string): Promise<void> {
  return writeDoc(userKey(userId), () => createEmptyDb(name))
}

/** Explicitly requested by the owner: replace their data with the sample household. */
export function loadSampleIntoUserDb(userId: string, name: string, keep?: Pick<Db, 'integrations'>): Promise<void> {
  return writeDoc(userKey(userId), () => ({ ...createSeed(undefined, { name, forAccount: true }), integrations: keep?.integrations }))
}

/** Start fresh: an empty account that keeps only the person's name and their connections. */
export function eraseUserDb(userId: string, name: string, keep?: Pick<Db, 'integrations'>): Promise<void> {
  return writeDoc(userKey(userId), () => ({ ...createEmptyDb(name), integrations: keep?.integrations }))
}

export function deleteUserDb(userId: string): Promise<void> {
  return deleteDoc(userKey(userId))
}

/** Hands this save's new notifications to the user's own Zapier hook, after the response. */
function deliver(userId: string, db: Db): void {
  const items = takePending(db)
  const envHook = envZapierUrl()
  const hook = db.integrations?.zapier ?? (envHook ? { url: envHook, consentAt: new Date().toISOString(), log: [] } : undefined)
  if (!items.length || !hook || !isZapierHook(hook.url)) return
  runAfterResponse(async () => {
    const results = []
    for (const item of items) {
      const r = await postToZapier(hook.url, zapierPayload(item))
      results.push({ at: new Date().toISOString(), title: item.title, ...r })
    }
    await logZapier(userId, results)
  })
}

export function logZapier(userId: string, entries: { at: string; title: string; ok: boolean; detail: string }[]): Promise<void> {
  return updateUserDb(userId, (db) => {
    db.integrations ??= {}
    db.integrations.zapier ??= {
      url: envZapierUrl() ?? '',
      consentAt: new Date().toISOString(),
      log: [],
    }
    const z = db.integrations.zapier
    z.log = [...entries.reverse(), ...z.log].slice(0, 20)
  })
}
