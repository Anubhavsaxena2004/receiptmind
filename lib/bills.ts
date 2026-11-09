import { addDays, addMonths, diffDays, todayISO } from './dates'
import { newId } from './ids'
import type { Bill, Db, Frequency, Mandate, Occurrence, OccurrenceStatus } from './types'

export const RESOLVED_STATUSES: OccurrenceStatus[] = ['paid', 'paid_outside', 'skipped']

export function isResolved(status: OccurrenceStatus): boolean {
  return RESOLVED_STATUSES.includes(status)
}

export function nextDue(date: string, frequency: Frequency): string | null {
  switch (frequency) {
    case 'once':
      return null
    case 'weekly':
      return addDays(date, 7)
    case 'monthly':
      return addMonths(date, 1)
    case 'quarterly':
      return addMonths(date, 3)
    case 'yearly':
      return addMonths(date, 12)
  }
}

/** The date Tinku acts on: the postponed date if the user postponed this occurrence. */
export function effectiveDate(o: Occurrence): string {
  return o.postponedTo ?? o.dueDate
}

export function openOccurrence(db: Db, billId: string): Occurrence | undefined {
  return db.occurrences
    .filter((o) => o.billId === billId && !isResolved(o.status))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0]
}

/** The most recent AutoPay authorization for a bill that hasn't been cancelled. */
export function currentMandate(db: Db, billId: string): Mandate | undefined {
  return db.mandates
    .filter((m) => m.billId === billId && m.status !== 'revoked')
    .sort((a, b) => b.authorizedAt.localeCompare(a.authorizedAt))[0]
}

export function createOccurrence(db: Db, bill: Bill, dueDate: string): Occurrence {
  const occ: Occurrence = { id: newId('occ'), billId: bill.id, dueDate, amount: bill.amount, status: 'upcoming' }
  db.occurrences.push(occ)
  return occ
}

/**
 * Close an occurrence and, for recurring bills, open the next one.
 * Paid (in app or outside) also records the expense and lowers available money.
 */
export function settleOccurrence(
  db: Db,
  occ: Occurrence,
  status: 'paid' | 'paid_outside' | 'skipped',
  opts: { paymentId?: string; note?: string } = {},
): void {
  const bill = db.bills.find((b) => b.id === occ.billId)
  const now = new Date().toISOString()
  occ.status = status
  occ.resolvedAt = now
  occ.note = opts.note
  if (opts.paymentId) occ.paymentId = opts.paymentId

  if (status !== 'skipped' && bill) {
    db.expenses.unshift({
      id: newId('exp'),
      title: bill.name,
      amount: occ.amount,
      category: bill.category,
      date: todayISO(),
      source: 'bill',
      billId: bill.id,
      note: status === 'paid_outside' ? 'Paid outside Tinku' : 'Paid through Tinku',
      createdAt: now,
    })
    db.profile.currentBalance -= occ.amount
  }

  if (bill && bill.active) {
    const next = nextDue(occ.dueDate, bill.frequency)
    const alreadyOpen = openOccurrence(db, bill.id)
    if (next && !alreadyOpen) createOccurrence(db, bill, next)
  }
}

export interface BillView {
  bill: Bill
  occ?: Occurrence
  mandate?: Mandate
  /** Effective date of the open occurrence. */
  due?: string
  daysLeft?: number
}

export function billViews(db: Db, today: string): BillView[] {
  return db.bills
    .filter((b) => b.active)
    .map((bill) => {
      const occ = openOccurrence(db, bill.id)
      const due = occ ? effectiveDate(occ) : undefined
      return {
        bill,
        occ,
        mandate: currentMandate(db, bill.id),
        due,
        daysLeft: due ? diffDays(today, due) : undefined,
      }
    })
    .sort((a, b) => (a.due ?? '9999').localeCompare(b.due ?? '9999'))
}

/** Occurrences that need the user right now. */
export function needsAction(views: BillView[]): BillView[] {
  return views.filter((v) => v.occ && (v.occ.status === 'due' || v.occ.status === 'failed'))
}
