import { promises as fs } from 'node:fs'
import path from 'node:path'
import { discardOutbox, flushOutbox, outboxMark } from './notify'
import { createSeed } from './seed'
import type { Db } from './types'

/**
 * Tiny JSON-file store for the hackathon MVP. All writes go through one queue so
 * they never interleave. Swap this module for Postgres (e.g. on Render) later —
 * the rest of the app only uses readDb() / updateDb().
 */
const DATA_DIR = process.env.TINKU_DATA_DIR ?? path.join(process.cwd(), 'data')
const DB_FILE = path.join(DATA_DIR, 'db.json')

let queue: Promise<unknown> = Promise.resolve()

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task)
  queue = run.catch(() => undefined)
  return run
}

async function readFileDb(): Promise<Db | null> {
  try {
    return JSON.parse(await fs.readFile(DB_FILE, 'utf8')) as Db
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw err
  }
}

async function writeFileDb(db: Db): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true })
  const json = JSON.stringify(db, null, 2)
  const tmp = `${DB_FILE}.${process.pid}.tmp`
  await fs.writeFile(tmp, json, 'utf8')
  try {
    await fs.rename(tmp, DB_FILE)
  } catch {
    // Windows can refuse the rename while another process has the file open.
    await fs.writeFile(DB_FILE, json, 'utf8')
    await fs.rm(tmp, { force: true })
  }
}

export async function readDb(): Promise<Db> {
  const db = await readFileDb()
  if (db) return db
  return enqueue(async () => {
    const existing = await readFileDb()
    if (existing) return existing
    const seeded = createSeed()
    await writeFileDb(seeded)
    return seeded
  })
}

/**
 * Apply a synchronous change and save it. The callback must not do network
 * calls — do those before/after so the store is never locked while waiting.
 */
export function updateDb<T>(fn: (db: Db) => T): Promise<T> {
  return enqueue(async () => {
    const db = (await readFileDb()) ?? createSeed()
    const mark = outboxMark()
    let result: T
    try {
      result = fn(db)
    } catch (err) {
      discardOutbox(mark)
      throw err
    }
    await writeFileDb(db)
    flushOutbox()
    return result
  })
}

export function resetDb(): Promise<void> {
  return enqueue(async () => {
    discardOutbox(0)
    await writeFileDb(createSeed())
  })
}
