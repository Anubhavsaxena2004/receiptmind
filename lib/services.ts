import { createOccurrence, currentMandate, openOccurrence } from './bills'
import { CATEGORIES, isCategoryId } from './categories'
import { addMonths, diffDays, isISODate, todayISO } from './dates'
import { formatINR } from './format'
import { newId } from './ids'
import { notify } from './notify'
import { updateUserDb } from './store'
import type { Bill, Budget, Expense, Frequency, Group, Mandate, PaymentMode } from './types'

/**
 * The rules for creating things, shared by the web forms (server actions) and the
 * JSON API, so both validate the same way. Every function takes the owner's id
 * from the server-side session — never from the request body.
 */

type Input = Record<string, unknown>
const str = (v: unknown) => (typeof v === 'string' ? v : v == null ? '' : String(v)).trim()
const num = (v: unknown) => (typeof v === 'number' ? v : str(v) === '' ? NaN : Number(str(v)))
const bool = (v: unknown) => v === true || v === 'on' || v === 'true' || v === '1'

export type Result<T> = { ok: T } | { error: string }

// ---------- Expenses ----------

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')

export type AddExpenseResult = { ok: Expense } | { error: string } | { duplicateOf: { title: string; amount: number; date: string } }

export async function addExpenseFor(userId: string, input: Input): Promise<AddExpenseResult> {
  const title = str(input.title)
  const amount = num(input.amount)
  const category = str(input.category)
  const date = str(input.date) || todayISO()
  const note = str(input.note)
  const source = str(input.source) === 'receipt' ? 'receipt' : 'manual'
  const confirmed = bool(input.confirmDuplicate)

  if (!title) return { error: 'Add a short name, like “Groceries”.' }
  if (!Number.isFinite(amount) || amount <= 0) return { error: 'Enter an amount above ₹0.' }
  if (amount > 10_000_000) return { error: 'That amount looks too large. Check it again.' }
  if (!isCategoryId(category)) return { error: 'Pick a category.' }
  if (!isISODate(date)) return { error: 'Pick a date.' }

  return updateUserDb(userId, (db): AddExpenseResult => {
    if (!confirmed) {
      const dup = db.expenses.find(
        (e) =>
          Math.abs(e.amount - amount) < 1 &&
          Math.abs(diffDays(e.date, date)) <= 1 &&
          (e.category === category || norm(e.title) === norm(title)),
      )
      if (dup) return { duplicateOf: { title: dup.title, amount: dup.amount, date: dup.date } }
    }
    const expense: Expense = {
      id: newId('exp'),
      title: title.slice(0, 80),
      amount: Math.round(amount * 100) / 100,
      category,
      date,
      note: note ? note.slice(0, 200) : undefined,
      source,
      createdAt: new Date().toISOString(),
    }
    db.expenses.unshift(expense)
    db.profile.currentBalance -= expense.amount
    return { ok: expense }
  })
}

// ---------- Budgets ----------

/** Accepts { limit_groceries: 8000, ... } (form) or { limits: { groceries: 8000 } } (API). */
export async function saveBudgetsFor(userId: string, input: Input): Promise<Result<Budget[]>> {
  const nested = (input.limits && typeof input.limits === 'object' ? input.limits : {}) as Input
  const budgets: Budget[] = []
  for (const c of CATEGORIES) {
    const raw = input[`limit_${c.id}`] ?? nested[c.id]
    const value = str(raw) === '' ? 0 : num(raw)
    if (!Number.isFinite(value) || value < 0 || value > 10_000_000) return { error: `Check the limit for ${c.label}.` }
    if (value > 0) budgets.push({ category: c.id, limit: Math.round(value) })
  }
  await updateUserDb(userId, (db) => {
    db.budgets = budgets
  })
  return { ok: budgets }
}

// ---------- Bills ----------

const FREQUENCIES: Frequency[] = ['once', 'weekly', 'monthly', 'quarterly', 'yearly']
const MODES: PaymentMode[] = ['reminder', 'manual', 'autopay']

export async function saveBillFor(userId: string, input: Input): Promise<Result<{ bill: Bill; needsAutopayAuthorization: boolean }>> {
  const id = str(input.id) || undefined
  const name = str(input.name)
  const payee = str(input.payee)
  const amount = num(input.amount)
  const category = str(input.category)
  const frequency = str(input.frequency) as Frequency
  const mode = str(input.mode) as PaymentMode
  const dueDate = str(input.dueDate)
  const essential = bool(input.essential)

  if (!name) return { error: 'Give the bill a name, like “Electricity”.' }
  if (!Number.isFinite(amount) || amount <= 0 || amount > 10_000_000) return { error: 'Enter the bill amount.' }
  if (!isCategoryId(category)) return { error: 'Pick a category.' }
  if (!FREQUENCIES.includes(frequency)) return { error: 'Pick how often this bill repeats.' }
  if (!MODES.includes(mode)) return { error: 'Choose how Tinku should handle this bill.' }
  if (!isISODate(dueDate)) return { error: 'Pick the next due date.' }

  return updateUserDb(userId, (db) => {
    let bill: Bill | undefined
    if (id) {
      bill = db.bills.find((b) => b.id === id && b.active)
      if (!bill) return { error: 'This bill no longer exists.' }
      Object.assign(bill, { name: name.slice(0, 60), payee: (payee || name).slice(0, 60), amount: Math.round(amount), category, frequency, mode, essential })
      const occ = openOccurrence(db, bill.id)
      if (occ && occ.status !== 'processing') {
        occ.amount = bill.amount
        if (occ.dueDate !== dueDate) {
          occ.dueDate = dueDate
          occ.postponedTo = undefined
          occ.remindedAt = undefined
          if (occ.status === 'due') occ.status = 'upcoming'
        }
      } else if (!occ) {
        createOccurrence(db, bill, dueDate)
      }
    } else {
      bill = {
        id: newId('bill'),
        name: name.slice(0, 60),
        payee: (payee || name).slice(0, 60),
        amount: Math.round(amount),
        category,
        essential,
        frequency,
        mode,
        active: true,
        createdAt: new Date().toISOString(),
      }
      db.bills.push(bill)
      createOccurrence(db, bill, dueDate)
    }
    const needsAutopayAuthorization = bill.mode === 'autopay' && currentMandate(db, bill.id)?.status !== 'active'
    return { ok: { bill, needsAutopayAuthorization } }
  })
}

// ---------- AutoPay ----------

export const AUTOPAY_MONTHS = [3, 6, 12] as const

export function autopayConsentText(billName: string, payee: string, maxAmount: number, months: number): string {
  return `I authorize Tinku to charge up to ${formatINR(maxAmount)} for ${billName} (${payee}) on each due date for ${months} months. Anything above this limit will wait for my approval. I can pause or cancel anytime, and failed charges are not retried automatically.`
}

/** AutoPay needs a signed-in, verified user AND an explicit consent flag; login alone is never enough. */
export async function authorizeAutopayFor(user: { id: string; email: string }, input: Input): Promise<Result<Mandate>> {
  const billId = str(input.billId)
  const maxAmount = num(input.maxAmount)
  const months = num(input.months)
  if (!bool(input.consent)) return { error: 'Tick the box to confirm you authorize these charges.' }
  if (!Number.isFinite(maxAmount) || maxAmount <= 0 || maxAmount > 10_000_000) return { error: 'Set the most Tinku may charge each time.' }
  if (!(AUTOPAY_MONTHS as readonly number[]).includes(months)) return { error: 'Pick how long this authorization lasts.' }

  return updateUserDb(user.id, (db): Result<Mandate> => {
    const bill = db.bills.find((b) => b.id === billId && b.active)
    if (!bill) return { error: 'This bill no longer exists.' }
    if (maxAmount < bill.amount) return { error: `The limit must be at least the bill amount (${formatINR(bill.amount)}).` }
    const now = new Date().toISOString()
    for (const m of db.mandates) if (m.billId === billId && m.status !== 'revoked') m.status = 'revoked'
    const mandate: Mandate = {
      id: newId('mnd'),
      billId,
      maxAmount: Math.round(maxAmount),
      status: 'active',
      authorizedAt: now,
      expiresOn: addMonths(todayISO(), months),
      provider: 'simulated',
      consent: { at: now, by: user.email, text: autopayConsentText(bill.name, bill.payee, Math.round(maxAmount), months) },
    }
    db.mandates.push(mandate)
    bill.mode = 'autopay'
    const occ = openOccurrence(db, billId)
    // A payment that was waiting for the user can now run on the next daily check.
    if (occ && occ.status === 'due' && occ.amount <= maxAmount) {
      occ.status = 'upcoming'
      occ.note = undefined
    }
    notify(db, {
      kind: 'autopay',
      title: `AutoPay is on: ${bill.name}`,
      body: `Tinku may charge up to ${formatINR(maxAmount)} on each due date for ${months} months. Pause or cancel anytime.`,
      href: '/autopay',
    })
    return { ok: mandate }
  })
}

// ---------- Groups ----------

export async function createGroupFor(userId: string, input: Input): Promise<Result<Group>> {
  const name = str(input.name)
  const rawMembers = Array.isArray(input.members) ? input.members.map(str) : str(input.members).split(/[,\n]/)
  const others = rawMembers.map((s) => s.trim()).filter(Boolean).slice(0, 20)
  if (!name) return { error: 'Give the group a name, like “Flat 302”.' }
  if (others.length === 0) return { error: 'Add at least one other person.' }
  return updateUserDb(userId, (db) => {
    const group: Group = {
      id: newId('grp'),
      name: name.slice(0, 40),
      createdAt: new Date().toISOString(),
      members: [{ id: 'mem_you', name: db.profile.name, isYou: true }, ...others.map((n) => ({ id: newId('mem'), name: n.slice(0, 40) }))],
    }
    db.groups.push(group)
    return { ok: group }
  })
}
