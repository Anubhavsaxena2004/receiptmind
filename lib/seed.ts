import { createOccurrence } from './bills'
import { DEMO_INR_PER_USD } from './config'
import { addDays, addMonths, nextDayOfMonth, todayISO } from './dates'
import type {
  Bill,
  Budget,
  CategoryId,
  Db,
  Expense,
  Frequency,
  GroupMember,
  Mandate,
  Occurrence,
  OccurrenceStatus,
  Payment,
  PaymentMode,
} from './types'

/** Demo data, dated relative to today so the demo always has something due. */
export function createSeed(today = todayISO()): Db {
  const now = new Date().toISOString()
  // Fixed IDs: every server instance that seeds gets the same IDs, so links stay valid
  // even when a host (e.g. Vercel without a database) seeds separately per instance.
  let seq = 0
  const sid = (prefix: string) => `${prefix}_seed${String(++seq).padStart(3, '0')}`
  const at = (date: string, hour = 10) => new Date(`${date}T${String(hour).padStart(2, '0')}:00:00`).toISOString()

  const db: Db = {
    version: 1,
    meta: { createdAt: now },
    profile: {
      name: 'Riya',
      monthlyIncome: 65000,
      salaryDay: 1,
      currentBalance: 38500,
      balanceUpdatedAt: now,
      emergencyReserve: 10000,
      demoFailNextCharge: false,
    },
    expenses: [],
    budgets: [],
    bills: [],
    occurrences: [],
    mandates: [],
    payments: [],
    notifications: [],
    groups: [],
    groupExpenses: [],
    settlements: [],
    drills: [],
    processedWebhookIds: [],
  }

  const budgets: [CategoryId, number][] = [
    ['groceries', 8000],
    ['food', 5000],
    ['transport', 3500],
    ['health', 2500],
    ['shopping', 4000],
    ['entertainment', 2000],
    ['rent', 18000],
    ['utilities', 4500],
    ['education', 3500],
    ['insurance', 1500],
    ['subscriptions', 1000],
    ['other', 1500],
  ]
  db.budgets = budgets.map(([category, limit]): Budget => ({ category, limit }))

  interface BillSeed {
    name: string
    payee: string
    amount: number
    category: CategoryId
    essential: boolean
    frequency: Frequency
    mode: PaymentMode
    due: string
    status?: OccurrenceStatus
    note?: string
    lastCycle?: 'autopay' | 'manual' | 'outside' | 'failed_then_paid'
  }

  const seeds: BillSeed[] = [
    { name: 'House rent', payee: 'Landlord · Flat 302', amount: 18000, category: 'rent', essential: true, frequency: 'monthly', mode: 'reminder', due: nextDayOfMonth(addDays(today, 1), 5), lastCycle: 'outside' },
    { name: 'Electricity bill', payee: 'State electricity board', amount: 2150, category: 'utilities', essential: true, frequency: 'monthly', mode: 'manual', due: addDays(today, 2), lastCycle: 'manual' },
    { name: 'StreamFlix subscription', payee: 'StreamFlix', amount: 649, category: 'subscriptions', essential: false, frequency: 'monthly', mode: 'autopay', due: today, lastCycle: 'autopay' },
    { name: 'Home broadband', payee: 'FiberNet', amount: 999, category: 'utilities', essential: true, frequency: 'monthly', mode: 'autopay', due: addDays(today, 6), lastCycle: 'autopay' },
    { name: 'Mobile recharge', payee: 'Prepaid mobile plan', amount: 299, category: 'utilities', essential: true, frequency: 'monthly', mode: 'manual', due: addDays(today, -1), status: 'due', note: 'Waiting for your approval', lastCycle: 'failed_then_paid' },
    { name: 'Gym membership', payee: 'FitZone', amount: 1500, category: 'health', essential: false, frequency: 'monthly', mode: 'manual', due: addDays(today, 12) },
    { name: 'Coaching class fees', payee: 'Bright Minds Academy', amount: 3500, category: 'education', essential: true, frequency: 'monthly', mode: 'reminder', due: addDays(today, 15) },
    { name: 'Health insurance premium', payee: 'Health insurer', amount: 4200, category: 'insurance', essential: true, frequency: 'quarterly', mode: 'reminder', due: addDays(today, 24) },
  ]

  const usd = (inr: number) => (inr / DEMO_INR_PER_USD).toFixed(2)

  const payment = (
    bill: Bill,
    occ: Occurrence,
    mode: 'manual' | 'autopay',
    status: 'captured' | 'failed',
    date: string,
    attempt: number,
  ): Payment => ({
    id: sid('pay'),
    occurrenceId: occ.id,
    billId: bill.id,
    label: bill.name,
    payee: bill.payee,
    amountInr: occ.amount,
    chargeAmount: usd(occ.amount),
    chargeCurrency: 'USD',
    fxRate: DEMO_INR_PER_USD,
    provider: 'simulated',
    mode,
    status,
    idempotencyKey: `${mode}-${occ.id}-${attempt}`,
    createdAt: at(date, 9),
    updatedAt: at(date, 9),
    events: [
      { at: at(date, 9), status: 'created', message: mode === 'autopay' ? 'AutoPay attempt within your approved limit' : 'Checkout started by you' },
      status === 'captured'
        ? { at: at(date, 9), status: 'captured', message: 'Simulated provider confirmed the charge; verified on the server' }
        : { at: at(date, 9), status: 'failed', message: 'Simulated provider declined the charge. Bill left unpaid.' },
    ],
  })

  for (const s of seeds) {
    const bill: Bill = {
      id: sid('bill'),
      name: s.name,
      payee: s.payee,
      amount: s.amount,
      category: s.category,
      essential: s.essential,
      frequency: s.frequency,
      mode: s.mode,
      active: true,
      createdAt: at(addMonths(today, -3)),
    }
    db.bills.push(bill)

    // Last cycle (history)
    if (s.lastCycle) {
      const months = s.frequency === 'quarterly' ? -3 : -1
      const prevDue = addMonths(s.due, months)
      const prev: Occurrence = { id: sid('occ'), billId: bill.id, dueDate: prevDue, amount: s.amount, status: 'paid', resolvedAt: at(prevDue) }
      db.occurrences.push(prev)
      const expense: Expense = {
        id: sid('exp'),
        title: bill.name,
        amount: s.amount,
        category: bill.category,
        date: prevDue,
        source: 'bill',
        billId: bill.id,
        note: 'Paid through Tinku',
        createdAt: at(prevDue),
      }
      if (s.lastCycle === 'outside') {
        prev.status = 'paid_outside'
        expense.note = 'Paid outside Tinku'
      } else if (s.lastCycle === 'failed_then_paid') {
        db.payments.push(payment(bill, prev, 'manual', 'failed', prevDue, 1))
        const ok = payment(bill, prev, 'manual', 'captured', addDays(prevDue, 1), 2)
        db.payments.push(ok)
        prev.paymentId = ok.id
      } else {
        const p = payment(bill, prev, s.lastCycle === 'autopay' ? 'autopay' : 'manual', 'captured', prevDue, 1)
        db.payments.push(p)
        prev.paymentId = p.id
      }
      db.expenses.push(expense)
    }

    // Current (open) occurrence
    const occ = createOccurrence(db, bill, s.due, sid('occ'))
    if (s.status) occ.status = s.status
    if (s.note) occ.note = s.note
    if (s.status === 'due') occ.dueNotifiedAt = now

    if (s.mode === 'autopay') {
      const mandate: Mandate = {
        id: sid('mnd'),
        billId: bill.id,
        maxAmount: Math.ceil((s.amount * 1.2) / 50) * 50,
        status: 'active',
        authorizedAt: at(addMonths(today, -2)),
        expiresOn: addMonths(today, 10),
        provider: 'simulated',
      }
      db.mandates.push(mandate)
    }
  }

  const spend: [number, string, number, CategoryId, 'manual' | 'receipt'][] = [
    [0, 'Chai & snacks', 120, 'food', 'manual'],
    [1, 'Online grocery order', 1840, 'groceries', 'receipt'],
    [1, 'Metro card top-up', 500, 'transport', 'manual'],
    [2, 'Lunch with team', 680, 'food', 'receipt'],
    [3, 'Pharmacy – vitamins', 450, 'health', 'receipt'],
    [4, 'Cab to airport', 740, 'transport', 'manual'],
    [5, 'Movie tickets', 600, 'entertainment', 'manual'],
    [6, 'Vegetable market', 380, 'groceries', 'manual'],
    [7, 'Kurta – online sale', 1499, 'shopping', 'receipt'],
    [8, 'Dinner – biryani', 920, 'food', 'receipt'],
    [9, 'Supermarket groceries', 2260, 'groceries', 'receipt'],
    [11, 'Petrol', 1500, 'transport', 'manual'],
    [13, 'Books', 650, 'shopping', 'manual'],
  ]
  for (const [daysAgo, title, amount, cat, source] of spend) {
    const date = addDays(today, -daysAgo)
    db.expenses.push({ id: sid('exp'), title, amount, category: cat, date, source, createdAt: at(date, 18) })
  }
  db.expenses.sort((a, b) => b.date.localeCompare(a.date))
  db.payments.sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  // A flat-share group
  const you: GroupMember = { id: 'mem_you', name: 'Riya', isYou: true }
  const kabir: GroupMember = { id: sid('mem'), name: 'Kabir' }
  const meera: GroupMember = { id: sid('mem'), name: 'Meera' }
  const groupId = sid('grp')
  const everyone = [you.id, kabir.id, meera.id]
  db.groups.push({ id: groupId, name: 'Flat 302', members: [you, kabir, meera], createdAt: at(addMonths(today, -3)) })
  db.groupExpenses.push(
    { id: sid('gex'), groupId, title: 'Cleaning supplies', amount: 600, paidBy: you.id, splitAmong: everyone, date: addDays(today, -1) },
    { id: sid('gex'), groupId, title: 'Weekly groceries', amount: 2400, paidBy: you.id, splitAmong: everyone, date: addDays(today, -3) },
    { id: sid('gex'), groupId, title: 'Cooking gas cylinder', amount: 1100, paidBy: meera.id, splitAmong: everyone, date: addDays(today, -5) },
    { id: sid('gex'), groupId, title: 'Wi-Fi router', amount: 1800, paidBy: kabir.id, splitAmong: everyone, date: addDays(today, -8) },
  )

  db.notifications.push(
    {
      id: sid('ntf'),
      at: now,
      kind: 'approval',
      title: 'Mobile recharge needs your approval',
      body: '₹299 was due yesterday. Pay it, postpone it or skip it.',
      href: '/bills',
      read: false,
    },
    {
      id: sid('ntf'),
      at: now,
      kind: 'system',
      title: 'Welcome to Tinku',
      body: 'This is demo data. Set your own income and balance in Settings, or reset the demo anytime.',
      href: '/settings',
      read: false,
    },
  )

  return db
}
