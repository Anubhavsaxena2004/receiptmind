import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { discardOutbox, flushOutbox, outboxMark } from './notify'
import { createSeed } from './seed'
import type { Db } from './types'

/**
 * The whole app state is one JSON document. Where it lives:
 *
 * - **Upstash Redis** when UPSTASH_REDIS_REST_URL/TOKEN (or Vercel's KV_REST_API_URL/TOKEN)
 *   are set. Use this on Vercel or any serverless host. Saves are conflict-checked,
 *   so two requests at the same moment can't overwrite each other.
 * - **A file** (`data/db.json`, or TINKU_DATA_DIR) for local dev and servers with a disk.
 * - **Temporary file in /tmp** on Vercel without Redis: the app works, but data can reset
 *   and separate server instances don't share changes. Settings shows a warning.
 *
 * The rest of the app only calls readDb() / updateDb().
 */

export type StorageKind = 'redis' | 'file' | 'temporary'

interface Snapshot {
  db: Db | null
  /** Revision the snapshot was read at; used for conflict-checked saves. */
  rev: string
}

interface Store {
  kind: StorageKind
  load(): Promise<Snapshot>
  /** Saves only if nobody saved since `rev` was read. Returns false on a conflict. */
  save(db: Db, rev: string): Promise<boolean>
}

function fileStore(dir: string, kind: StorageKind): Store {
  const file = path.join(dir, 'db.json')
  return {
    kind,
    async load() {
      try {
        return { db: JSON.parse(await fs.readFile(file, 'utf8')) as Db, rev: '0' }
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code === 'ENOENT') return { db: null, rev: '0' }
        throw err
      }
    },
    async save(db) {
      await fs.mkdir(dir, { recursive: true })
      const json = JSON.stringify(db, null, 2)
      const tmp = `${file}.${process.pid}.tmp`
      await fs.writeFile(tmp, json, 'utf8')
      try {
        await fs.rename(tmp, file)
      } catch {
        // Windows can refuse the rename while another process has the file open.
        await fs.writeFile(file, json, 'utf8')
        await fs.rm(tmp, { force: true })
      }
      return true
    },
  }
}

// Atomic compare-and-set: write the document only if the revision is unchanged.
const SAVE_SCRIPT = `
local cur = redis.call('GET', KEYS[2])
if (cur or '0') ~= ARGV[2] then return 0 end
redis.call('SET', KEYS[1], ARGV[1])
redis.call('SET', KEYS[2], ARGV[3])
return 1`

function redisStore(url: string, token: string): Store {
  const DOC = process.env.TINKU_REDIS_KEY ?? 'tinku:db'
  const REV = `${DOC}:rev`
  async function call(command: string[]): Promise<unknown> {
    const res = await fetch(url.replace(/\/$/, ''), {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(command),
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    })
    const data = (await res.json().catch(() => ({}))) as { result?: unknown; error?: string }
    if (!res.ok || data.error) throw new Error(`Redis ${command[0]} failed: ${data.error ?? `HTTP ${res.status}`}`)
    return data.result
  }
  return {
    kind: 'redis',
    async load() {
      const [doc, rev] = (await call(['MGET', DOC, REV])) as [string | null, string | null]
      return { db: doc ? (JSON.parse(doc) as Db) : null, rev: rev ?? '0' }
    },
    async save(db, rev) {
      const ok = await call(['EVAL', SAVE_SCRIPT, '2', DOC, REV, JSON.stringify(db), rev, String(Number(rev) + 1)])
      return Number(ok) === 1
    },
  }
}

let store: Store | null = null

function getStore(): Store {
  if (store) return store
  // `||` (not `??`) so blank values copied from .env.example don't hide Vercel's KV_* vars.
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN
  if (url && token) {
    store = redisStore(url, token)
  } else if (process.env.TINKU_DATA_DIR) {
    store = fileStore(process.env.TINKU_DATA_DIR, 'file')
  } else if (process.env.VERCEL) {
    // The deployment folder is read-only on Vercel; only /tmp is writable (and temporary).
    store = fileStore(path.join(os.tmpdir(), 'tinku-data'), 'temporary')
  } else {
    store = fileStore(path.join(process.cwd(), 'data'), 'file')
  }
  return store
}

export function storageKind(): StorageKind {
  return getStore().kind
}

// Serialises writes inside one server instance; Redis revisions handle the rest.
let queue: Promise<unknown> = Promise.resolve()

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task)
  queue = run.catch(() => undefined)
  return run
}

export async function readDb(): Promise<Db> {
  const s = getStore()
  const snap = await s.load()
  if (snap.db) return snap.db
  return enqueue(async () => {
    const again = await s.load()
    if (again.db) return again.db
    const seeded = createSeed()
    if (await s.save(seeded, again.rev)) return seeded
    return (await s.load()).db ?? seeded
  })
}

/**
 * Apply a synchronous change and save it. The callback must not do network
 * calls — do those before/after so the store is never locked while waiting.
 * If another request saved first, the change is re-applied to the fresh data.
 */
export function updateDb<T>(fn: (db: Db) => T): Promise<T> {
  return enqueue(async () => {
    const s = getStore()
    for (let attempt = 0; attempt < 10; attempt++) {
      // After a clash, wait a short random time so competing instances stop colliding.
      if (attempt > 0) await new Promise((r) => setTimeout(r, Math.random() * 40 * attempt))
      const snap = await s.load()
      const db = snap.db ?? createSeed()
      const mark = outboxMark()
      let result: T
      try {
        result = fn(db)
      } catch (err) {
        discardOutbox(mark)
        throw err
      }
      if (await s.save(db, snap.rev)) {
        flushOutbox()
        return result
      }
      discardOutbox(mark)
    }
    throw new Error('Your change clashed with another update. Please try again.')
  })
}

export function resetDb(): Promise<void> {
  return enqueue(async () => {
    discardOutbox(0)
    const s = getStore()
    for (let attempt = 0; attempt < 5; attempt++) {
      if (await s.save(createSeed(), (await s.load()).rev)) return
    }
    throw new Error('Could not reset the demo data. Please try again.')
  })
}
