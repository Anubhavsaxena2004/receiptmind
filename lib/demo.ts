import { todayISO } from './dates'
import { withFixedIds } from './ids'
import { applyDailyCheck } from './scheduler'
import { createSeed } from './seed'
import type { Db } from './types'

/**
 * The sample household guests explore. It is built in memory (never saved), is
 * read-only, and never mixes with anyone's account. Today's daily check is applied
 * so the sample shows reminders and an AutoPay payment, with the same IDs on every
 * server instance.
 */
let cache: { day: string; db: Db } | null = null

export function sampleDb(today = todayISO()): Db {
  if (cache?.day !== today) {
    const db = withFixedIds('demo', () => {
      const d = createSeed(today)
      applyDailyCheck(d, today)
      return d
    })
    cache = { day: today, db }
  }
  return structuredClone(cache.db)
}
