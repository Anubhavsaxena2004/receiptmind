import { createHash, randomBytes, randomInt, scrypt, timingSafeEqual, type ScryptOptions } from 'node:crypto'

const KEYLEN = 64
const PARAMS = { N: 16384, r: 8, p: 1 }

function scryptAsync(password: string, salt: Buffer, keylen: number, opts: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scrypt(password.normalize('NFKC'), salt, keylen, opts, (err, key) => (err ? reject(err) : resolve(key))),
  )
}

/** scrypt with a random salt. Stored as `scrypt$N$r$p$salt$hash` (base64url). */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16)
  const key = await scryptAsync(password, salt, KEYLEN, PARAMS)
  return ['scrypt', PARAMS.N, PARAMS.r, PARAMS.p, salt.toString('base64url'), key.toString('base64url')].join('$')
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algo, n, r, p, salt, hash] = stored.split('$')
  if (algo !== 'scrypt' || !salt || !hash) return false
  const expected = Buffer.from(hash, 'base64url')
  const key = await scryptAsync(password, Buffer.from(salt, 'base64url'), expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
  })
  return key.length === expected.length && timingSafeEqual(key, expected)
}

/** A password hash for unknown emails, so a failed login takes the same time either way. */
let dummy: Promise<string> | null = null
export function dummyHash(): Promise<string> {
  dummy ??= hashPassword(randomBytes(12).toString('hex'))
  return dummy
}

/** 256-bit random token for sessions, reset links and OAuth state. */
export function newToken(): string {
  return randomBytes(32).toString('base64url')
}

/** Tokens and codes are stored only as hashes. */
export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

export function sixDigitCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0')
}

export function sameHash(a: string, b: string): boolean {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}
