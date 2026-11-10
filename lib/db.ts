import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

/**
 * A tiny document store. Each document is one JSON value under a key:
 * `accounts` (users and sessions) and `user:<id>` (one person's money data).
 *
 * Where documents live:
 * - **Upstash Redis** when UPSTASH_REDIS_REST_URL/TOKEN (or Vercel's KV_REST_API_URL/TOKEN)
 *   are set. Use this on Vercel or any serverless host. Saves are conflict-checked,
 *   so two requests at the same moment can't overwrite each other.
 * - **Files** (`data/`, or TINKU_DATA_DIR) for local dev and servers with a disk.
 * - **Temporary files in /tmp** on Vercel without Redis: the app works, but data can reset
 *   and separate server instances don't share changes. The app shows a warning.
 */

export type StorageKind = 'redis' | 'file' | 'temporary'

interface Snapshot {
  doc: unknown
  /** Revision the snapshot was read at; used for conflict-checked saves. */
  rev: string
}

interface Store {
  kind: StorageKind
  load(key: string): Promise<Snapshot>
  /** Saves only if nobody saved since `rev` was read. Returns false on a conflict. */
  save(key: string, doc: unknown, rev: string): Promise<boolean>
  remove(key: string): Promise<void>
}

const safeName = (key: string) => key.replace(/[^a-z0-9_-]/gi, '-')

function fileStore(dir: string, kind: StorageKind): Store {
  const fileFor = (key: string) => path.join(dir, `${safeName(key)}.json`)
  return {
    kind,
    async load(key) {
      try {
        return { doc: JSON.parse(await fs.readFile(fileFor(key), 'utf8')), rev: '0' }
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code === 'ENOENT') return { doc: null, rev: '0' }
        throw err
      }
    },
    async save(key, doc) {
      await fs.mkdir(dir, { recursive: true })
      const file = fileFor(key)
      const json = JSON.stringify(doc, null, 2)
      const tmp = `${file}.${process.pid}.${Math.random().toString(36).slice(2)}.tmp`
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
    async remove(key) {
      await fs.rm(fileFor(key), { force: true })
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
  const prefix = process.env.TINKU_REDIS_PREFIX || 'tinku'
  const docKey = (key: string) => `${prefix}:${key}`
  const revKey = (key: string) => `${prefix}:${key}:rev`
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
    async load(key) {
      const [doc, rev] = (await call(['MGET', docKey(key), revKey(key)])) as [string | null, string | null]
      return { doc: doc ? JSON.parse(doc) : null, rev: rev ?? '0' }
    },
    async save(key, doc, rev) {
      const ok = await call(['EVAL', SAVE_SCRIPT, '2', docKey(key), revKey(key), JSON.stringify(doc), rev, String(Number(rev) + 1)])
      return Number(ok) === 1
    },
    async remove(key) {
      // Bump the revision instead of deleting it, so a save that read the old document can't resurrect it.
      await call(['DEL', docKey(key)])
      await call(['INCR', revKey(key)])
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

// Serialises writes to the same document inside one server instance; Redis revisions handle the rest.
const queues = new Map<string, Promise<unknown>>()

function enqueue<T>(key: string, task: () => Promise<T>): Promise<T> {
  const prev = queues.get(key) ?? Promise.resolve()
  const run = prev.then(task, task)
  const tail = run.catch(() => undefined)
  queues.set(key, tail)
  void tail.then(() => {
    if (queues.get(key) === tail) queues.delete(key)
  })
  return run
}

export async function readDoc<T>(key: string): Promise<T | null> {
  return (await getStore().load(key)).doc as T | null
}

/**
 * Apply a synchronous change to a document and save it. The callback must not do
 * network calls — do those before/after so a document is never locked while waiting.
 * If another request saved first, the change is re-applied to the fresh data.
 * `onSaved` runs once, after the save that stuck.
 */
export function updateDoc<T, R>(key: string, init: () => T, fn: (doc: T) => R, onSaved?: (doc: T) => void): Promise<R> {
  return enqueue(key, async () => {
    const s = getStore()
    for (let attempt = 0; attempt < 10; attempt++) {
      // After a clash, wait a short random time so competing instances stop colliding.
      if (attempt > 0) await new Promise((r) => setTimeout(r, Math.random() * 40 * attempt))
      const snap = await s.load(key)
      const doc = (snap.doc as T | null) ?? init()
      const result = fn(doc)
      if (await s.save(key, doc, snap.rev)) {
        onSaved?.(doc)
        return result
      }
    }
    throw new Error('Your change clashed with another update. Please try again.')
  })
}

/** Replace a document entirely (conflict-checked, retried). */
export function writeDoc<T>(key: string, make: () => T): Promise<void> {
  return enqueue(key, async () => {
    const s = getStore()
    for (let attempt = 0; attempt < 5; attempt++) {
      if (await s.save(key, make(), (await s.load(key)).rev)) return
    }
    throw new Error('Could not save. Please try again.')
  })
}

export function deleteDoc(key: string): Promise<void> {
  return enqueue(key, () => getStore().remove(key))
}
