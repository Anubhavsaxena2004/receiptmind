let fixed: ((prefix: string) => string) | null = null

export function newId(prefix: string): string {
  if (fixed) return fixed(prefix)
  return `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`
}

/**
 * Runs a synchronous function with predictable IDs. Used for the shared sample
 * household, which every server instance builds in memory: the same IDs everywhere
 * keep links valid no matter which instance serves the next page.
 */
export function withFixedIds<T>(tag: string, fn: () => T): T {
  const prev = fixed
  let n = 0
  fixed = (prefix) => `${prefix}_${tag}${String(++n).padStart(3, '0')}`
  try {
    return fn()
  } finally {
    fixed = prev
  }
}
