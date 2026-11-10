import { readDoc, updateDoc } from '../db'
import { newId } from '../ids'
import { createUserDb, deleteUserDb } from '../store'
import { dummyHash, hashPassword, newToken, sameHash, sha256, sixDigitCode, verifyPassword } from './crypto'
import { emailConfigured } from './email'

/**
 * Accounts, sessions and one-time codes live in their own document, apart from
 * anyone's money data. Session tokens, reset tokens and codes are stored only as
 * SHA-256 hashes; passwords as scrypt hashes.
 */

export interface User {
  id: string
  email: string
  name: string
  passwordHash?: string
  googleSub?: string
  emailVerifiedAt?: string
  /** demo-code = verified with an on-screen code because this deployment can't send email. */
  verifiedVia?: 'email' | 'demo-code' | 'google'
  createdAt: string
}

interface Session {
  tokenHash: string
  userId: string
  createdAt: string
  expiresAt: string
}

interface EmailCode {
  userId: string
  codeHash: string
  sentAt: string
  expiresAt: string
  attempts: number
  /** Only when email isn't configured: the code is shown on screen, labelled as a demo. */
  demoCode?: string
}

interface ResetToken {
  userId: string
  tokenHash: string
  expiresAt: string
}

interface Throttle {
  key: string
  failures: number
  windowStart: string
  lockedUntil?: string
}

interface Accounts {
  version: 1
  users: User[]
  sessions: Session[]
  codes: EmailCode[]
  resets: ResetToken[]
  throttles: Throttle[]
}

/** What the UI may know about the signed-in person. */
export interface PublicUser {
  id: string
  email: string
  name: string
  verified: boolean
  verifiedVia?: User['verifiedVia']
  hasPassword: boolean
  google: boolean
  createdAt: string
}

export function toPublicUser(u: User): PublicUser {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    verified: Boolean(u.emailVerifiedAt),
    verifiedVia: u.verifiedVia,
    hasPassword: Boolean(u.passwordHash),
    google: Boolean(u.googleSub),
    createdAt: u.createdAt,
  }
}

export const SESSION_DAYS = 30
const CODE_MINUTES = 15
const RESET_MINUTES = 30
const MAX_FAILURES = 5
const LOCK_MINUTES = 15

const KEY = 'accounts'
const empty = (): Accounts => ({ version: 1, users: [], sessions: [], codes: [], resets: [], throttles: [] })
const minutes = (n: number) => n * 60_000
const iso = (ms: number) => new Date(ms).toISOString()

async function readAccounts(): Promise<Accounts> {
  return (await readDoc<Accounts>(KEY)) ?? empty()
}

function updateAccounts<T>(fn: (a: Accounts) => T): Promise<T> {
  return updateDoc(KEY, empty, (a) => {
    const now = Date.now()
    a.sessions = a.sessions.filter((s) => Date.parse(s.expiresAt) > now)
    a.codes = a.codes.filter((c) => Date.parse(c.expiresAt) > now)
    a.resets = a.resets.filter((r) => Date.parse(r.expiresAt) > now)
    a.throttles = a.throttles.filter((t) => now - Date.parse(t.windowStart) < minutes(24 * 60))
    return fn(a)
  })
}

// ---------- Validation ----------

export const normalizeEmail = (email: string) => email.trim().toLowerCase()
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function emailError(email: string): string | null {
  if (!email) return 'Enter your email.'
  if (email.length > 200 || !EMAIL_RE.test(email)) return 'That email doesn’t look right.'
  return null
}

export function passwordError(password: string): string | null {
  if (password.length < 8) return 'Use at least 8 characters for your password.'
  if (password.length > 200) return 'That password is too long.'
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return 'Use letters and at least one number in your password.'
  return null
}

// ---------- Users ----------

export async function getUser(userId: string): Promise<User | null> {
  return (await readAccounts()).users.find((u) => u.id === userId) ?? null
}

export async function listUserIds(): Promise<string[]> {
  return (await readAccounts()).users.map((u) => u.id)
}

export async function signUp(input: { name: string; email: string; password: string }): Promise<{ user: User } | { error: string }> {
  const name = input.name.trim().slice(0, 40)
  const email = normalizeEmail(input.email)
  if (!name) return { error: 'Enter your name.' }
  const bad = emailError(email) ?? passwordError(input.password)
  if (bad) return { error: bad }
  const passwordHash = await hashPassword(input.password)
  const result = await updateAccounts((a): { user: User } | { error: string } => {
    if (a.users.some((u) => u.email === email)) return { error: 'An account with this email already exists. Log in instead.' }
    const user: User = { id: newId('usr'), email, name, passwordHash, createdAt: new Date().toISOString() }
    a.users.push(user)
    return { user }
  })
  if ('user' in result) await createUserDb(result.user.id, name)
  return result
}

function throttleFor(a: Accounts, key: string): Throttle | undefined {
  return a.throttles.find((t) => t.key === key)
}

function lockMessage(t: Throttle | undefined): string | null {
  if (!t?.lockedUntil) return null
  const left = Date.parse(t.lockedUntil) - Date.now()
  if (left <= 0) return null
  return `Too many tries. Wait ${Math.ceil(left / 60_000)} minute${left > 60_000 ? 's' : ''} and try again.`
}

/** Checks email + password, with a lock after repeated failures for that email. */
export async function logIn(emailRaw: string, password: string): Promise<{ user: User } | { error: string }> {
  const email = normalizeEmail(emailRaw)
  if (!email || !password) return { error: 'Enter your email and password.' }
  const key = `login:${email}`
  const a = await readAccounts()
  const locked = lockMessage(throttleFor(a, key))
  if (locked) return { error: locked }

  const user = a.users.find((u) => u.email === email)
  // Always run scrypt, so a wrong email and a wrong password take the same time.
  const ok = await verifyPassword(password, user?.passwordHash ?? (await dummyHash()))
  if (user && user.passwordHash && ok) {
    await updateAccounts((acc) => {
      acc.throttles = acc.throttles.filter((t) => t.key !== key)
    })
    return { user }
  }
  const lockedNow = await updateAccounts((acc) => {
    const now = Date.now()
    let t = throttleFor(acc, key)
    if (!t || now - Date.parse(t.windowStart) > minutes(LOCK_MINUTES)) {
      acc.throttles = acc.throttles.filter((x) => x.key !== key)
      t = { key, failures: 0, windowStart: iso(now) }
      acc.throttles.push(t)
    }
    t.failures++
    if (t.failures >= MAX_FAILURES) t.lockedUntil = iso(now + minutes(LOCK_MINUTES))
    return lockMessage(t)
  })
  if (user && !user.passwordHash && !lockedNow) return { error: 'This account uses Google sign-in. Continue with Google, or reset your password to add one.' }
  return { error: lockedNow ?? 'Email or password is incorrect.' }
}

// ---------- Sessions ----------

export async function createSession(userId: string): Promise<{ token: string; expiresAt: string }> {
  const token = newToken()
  const now = Date.now()
  const expiresAt = iso(now + SESSION_DAYS * 24 * 60 * 60_000)
  await updateAccounts((a) => {
    a.sessions.push({ tokenHash: sha256(token), userId, createdAt: iso(now), expiresAt })
  })
  return { token, expiresAt }
}

export async function userForToken(token: string): Promise<User | null> {
  if (!token || token.length > 200) return null
  const a = await readAccounts()
  const hash = sha256(token)
  const s = a.sessions.find((x) => sameHash(x.tokenHash, hash))
  if (!s || Date.parse(s.expiresAt) <= Date.now()) return null
  return a.users.find((u) => u.id === s.userId) ?? null
}

export async function endSession(token: string): Promise<void> {
  const hash = sha256(token)
  await updateAccounts((a) => {
    a.sessions = a.sessions.filter((s) => s.tokenHash !== hash)
  })
}

// ---------- Email verification ----------

/** Creates a fresh 6-digit code (old ones stop working). Limited to one per 30 seconds. */
export async function newEmailCode(userId: string): Promise<{ code: string; email: string } | { error: string }> {
  const code = sixDigitCode()
  const demo = !emailConfigured()
  return updateAccounts((a) => {
    const user = a.users.find((u) => u.id === userId)
    if (!user) return { error: 'Account not found.' }
    if (user.emailVerifiedAt) return { error: 'Your email is already verified.' }
    const last = a.codes.find((c) => c.userId === userId)
    if (last && Date.now() - Date.parse(last.sentAt) < 30_000) return { error: 'A code was just sent. Wait 30 seconds before asking for another.' }
    a.codes = a.codes.filter((c) => c.userId !== userId)
    const now = Date.now()
    a.codes.push({
      userId,
      codeHash: sha256(`${userId}:${code}`),
      sentAt: iso(now),
      expiresAt: iso(now + minutes(CODE_MINUTES)),
      attempts: 0,
      demoCode: demo ? code : undefined,
    })
    return { code, email: user.email }
  })
}

/** The on-screen code, only on deployments that can't send email. */
export async function demoCodeFor(userId: string): Promise<string | null> {
  const c = (await readAccounts()).codes.find((x) => x.userId === userId && Date.parse(x.expiresAt) > Date.now())
  return c?.demoCode ?? null
}

export async function confirmEmailCode(userId: string, codeRaw: string): Promise<{ ok: true } | { error: string }> {
  const code = codeRaw.replace(/\D/g, '')
  if (code.length !== 6) return { error: 'Enter the 6-digit code.' }
  return updateAccounts((a) => {
    const user = a.users.find((u) => u.id === userId)
    if (!user) return { error: 'Account not found.' }
    if (user.emailVerifiedAt) return { ok: true as const }
    const c = a.codes.find((x) => x.userId === userId)
    if (!c) return { error: 'That code has expired. Send a new one.' }
    if (c.attempts >= 5) return { error: 'Too many wrong codes. Send a new one.' }
    if (!sameHash(c.codeHash, sha256(`${userId}:${code}`))) {
      c.attempts++
      return { error: c.attempts >= 5 ? 'Too many wrong codes. Send a new one.' : 'That code isn’t right. Check it and try again.' }
    }
    user.emailVerifiedAt = new Date().toISOString()
    user.verifiedVia = c.demoCode ? 'demo-code' : 'email'
    a.codes = a.codes.filter((x) => x.userId !== userId)
    return { ok: true as const }
  })
}

// ---------- Password reset & change ----------

/** Returns a reset token to email, or null (unknown email or rate-limited) — the UI says the same thing either way. */
export async function newResetToken(emailRaw: string): Promise<{ token: string; user: User } | null> {
  const email = normalizeEmail(emailRaw)
  const token = newToken()
  return updateAccounts((a) => {
    const user = a.users.find((u) => u.email === email)
    if (!user) return null
    const key = `reset:${user.id}`
    const t = throttleFor(a, key)
    if (t && Date.now() - Date.parse(t.windowStart) < 60_000) return null
    a.throttles = a.throttles.filter((x) => x.key !== key)
    a.throttles.push({ key, failures: 0, windowStart: new Date().toISOString() })
    a.resets = a.resets.filter((r) => r.userId !== user.id)
    a.resets.push({ userId: user.id, tokenHash: sha256(token), expiresAt: iso(Date.now() + minutes(RESET_MINUTES)) })
    return { token, user }
  })
}

export async function resetPassword(token: string, password: string): Promise<{ user: User } | { error: string }> {
  const bad = passwordError(password)
  if (bad) return { error: bad }
  const passwordHash = await hashPassword(password)
  const hash = sha256(token)
  return updateAccounts((a) => {
    const r = a.resets.find((x) => sameHash(x.tokenHash, hash))
    const user = r && a.users.find((u) => u.id === r.userId)
    if (!r || !user || Date.parse(r.expiresAt) <= Date.now()) return { error: 'This reset link has expired. Ask for a new one.' }
    user.passwordHash = passwordHash
    // The link proves the person reads this inbox.
    if (!user.emailVerifiedAt) {
      user.emailVerifiedAt = new Date().toISOString()
      user.verifiedVia = 'email'
    }
    a.resets = a.resets.filter((x) => x.userId !== user.id)
    a.sessions = a.sessions.filter((s) => s.userId !== user.id)
    a.throttles = a.throttles.filter((t) => t.key !== `login:${user.email}`)
    return { user }
  })
}

export async function changePassword(userId: string, current: string, next: string, keepToken: string): Promise<{ ok: true } | { error: string }> {
  const user = await getUser(userId)
  if (!user) return { error: 'Account not found.' }
  if (user.passwordHash && !(await verifyPassword(current, user.passwordHash))) return { error: 'Your current password isn’t right.' }
  const bad = passwordError(next)
  if (bad) return { error: bad }
  const passwordHash = await hashPassword(next)
  const keep = sha256(keepToken)
  return updateAccounts((a) => {
    const u = a.users.find((x) => x.id === userId)
    if (!u) return { error: 'Account not found.' }
    u.passwordHash = passwordHash
    // Sign out everywhere else.
    a.sessions = a.sessions.filter((s) => s.userId !== userId || s.tokenHash === keep)
    return { ok: true as const }
  })
}

// ---------- Google ----------

export async function upsertGoogleUser(g: { sub: string; email: string; name: string }): Promise<User> {
  const email = normalizeEmail(g.email)
  const result = await updateAccounts((a) => {
    let user = a.users.find((u) => u.googleSub === g.sub) ?? a.users.find((u) => u.email === email)
    const created = !user
    if (!user) {
      user = { id: newId('usr'), email, name: (g.name || email.split('@')[0]).slice(0, 40), createdAt: new Date().toISOString() }
      a.users.push(user)
    }
    if (!created && !user.googleSub && (!user.emailVerifiedAt || user.verifiedVia === 'demo-code')) {
      // Nobody proved they own this email before, so whoever set the existing password
      // may not be the inbox owner. Google just proved ownership: drop that password
      // and its sessions so a squatter can't keep access to the linked account.
      user.passwordHash = undefined
      user.emailVerifiedAt = undefined
      a.sessions = a.sessions.filter((s) => s.userId !== user!.id)
    }
    user.googleSub = g.sub
    // Google only returns verified emails here (checked by the caller).
    if (!user.emailVerifiedAt) {
      user.emailVerifiedAt = new Date().toISOString()
      user.verifiedVia = 'google'
    }
    return { user, created }
  })
  if (result.created) await createUserDb(result.user.id, result.user.name)
  return result.user
}

// ---------- Delete ----------

export async function deleteAccount(userId: string): Promise<void> {
  await updateAccounts((a) => {
    a.users = a.users.filter((u) => u.id !== userId)
    a.sessions = a.sessions.filter((s) => s.userId !== userId)
    a.codes = a.codes.filter((c) => c.userId !== userId)
    a.resets = a.resets.filter((r) => r.userId !== userId)
  })
  await deleteUserDb(userId)
}

export async function renameUser(userId: string, name: string): Promise<void> {
  await updateAccounts((a) => {
    const u = a.users.find((x) => x.id === userId)
    if (u) u.name = name.slice(0, 40)
  })
}
