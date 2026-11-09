/**
 * Financial Crisis Rehearsal Engine — a "fire drill" for your money.
 * Pure, deterministic day-by-day cash-flow simulation (no AI does the maths),
 * so it runs instantly in the browser as the user changes the scenario.
 */
import { addDays, addMonths, dayOfMonth, parseISODate } from './dates'
import { formatDate, formatINR } from './format'
import type { Frequency } from './types'

export type ScenarioKind = 'salary_delay' | 'medical' | 'income_cut' | 'job_loss' | 'big_expense'

export interface Scenario {
  kind: ScenarioKind
  /** ₹ for medical / big_expense */
  amount: number
  /** days for salary_delay */
  days: number
  /** % for income_cut */
  percent: number
}

export interface DrillBill {
  name: string
  amount: number
  frequency: Frequency
  essential: boolean
  /** Next date this bill must be paid (may be in the past if overdue). */
  nextDue: string
}

export interface DrillBudget {
  label: string
  monthly: number
  essential: boolean
}

export interface DrillInput {
  today: string
  balance: number
  reserve: number
  monthlyIncome: number
  salaryDay: number
  bills: DrillBill[]
  budgets: DrillBudget[]
}

export interface PlanOptions {
  useReserve: boolean
  /** 0–100: how much flexible spending is cut during the drill. */
  cutFlexiblePct: number
  pauseFlexibleBills: boolean
  /** ₹ requested from family / flatmates, arriving at the start. */
  contribution: number
}

export const NO_PLAN: PlanOptions = { useReserve: false, cutFlexiblePct: 0, pauseFlexibleBills: false, contribution: 0 }

export interface DayPoint {
  date: string
  balance: number
}

export interface BillHit {
  name: string
  date: string
  amount: number
  essential: boolean
  balanceAfter: number
}

export interface DrillResult {
  points: DayPoint[]
  lowest: DayPoint
  firstShortDate: string | null
  /** Bills that would bounce: the balance is below zero right after paying them. */
  billsAtRisk: BillHit[]
  pausedBills: BillHit[]
  passed: boolean
  shortfall: number
  score: number
  monthlyOutflow: number
}

export const SCENARIOS: { kind: ScenarioKind; title: string; blurb: string }[] = [
  { kind: 'salary_delay', title: 'Salary arrives late', blurb: 'Your next salary comes days or weeks late.' },
  { kind: 'medical', title: 'Medical emergency', blurb: 'A sudden hospital or medicine bill.' },
  { kind: 'big_expense', title: 'Big unexpected expense', blurb: 'Phone, bike or home repair you can’t avoid.' },
  { kind: 'income_cut', title: 'Income drops', blurb: 'Fewer hours, a pay cut or a lost client.' },
  { kind: 'job_loss', title: 'Job loss', blurb: 'No salary at all for the whole drill.' },
]

export function scenarioLabel(s: Scenario): string {
  switch (s.kind) {
    case 'salary_delay':
      return `Salary ${s.days} days late`
    case 'medical':
      return `Medical emergency of ${formatINR(s.amount)}`
    case 'big_expense':
      return `Unexpected expense of ${formatINR(s.amount)}`
    case 'income_cut':
      return `Income drops by ${s.percent}%`
    case 'job_loss':
      return 'Job loss (no salary)'
  }
}

function step(date: string, f: Frequency): string | null {
  switch (f) {
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

function monthlyEquivalent(amount: number, f: Frequency): number {
  switch (f) {
    case 'once':
      return 0
    case 'weekly':
      return (amount * 52) / 12
    case 'monthly':
      return amount
    case 'quarterly':
      return amount / 3
    case 'yearly':
      return amount / 12
  }
}

/** Dates a bill must be paid within (today, end]; overdue amounts are paid today. */
function billDates(bill: DrillBill, today: string, end: string): string[] {
  const out: string[] = []
  let cur: string | null = bill.nextDue
  for (let guard = 0; cur && guard < 200; guard++) {
    const at: string = cur < today ? today : cur
    if (at > end) break
    out.push(at)
    cur = step(cur, bill.frequency)
  }
  return out
}

function salaryDates(today: string, end: string, salaryDay: number): string[] {
  const out: string[] = []
  const t = parseISODate(today)
  for (let m = 0; m < 5; m++) {
    const d = dayOfMonth(t.getFullYear(), t.getMonth() + m, salaryDay)
    if (d > today && d <= end) out.push(d)
  }
  return out
}

export function simulate(input: DrillInput, scenario: Scenario, plan: PlanOptions, horizon: number): DrillResult {
  const { today } = input
  const end = addDays(today, horizon)

  const inflows = new Map<string, number>()
  const outflows = new Map<string, { name: string; amount: number; essential: boolean; isBill: boolean }[]>()
  const addOut = (date: string, item: { name: string; amount: number; essential: boolean; isBill: boolean }) => {
    const list = outflows.get(date) ?? []
    list.push(item)
    outflows.set(date, list)
  }

  // Salary
  salaryDates(today, end, input.salaryDay).forEach((d, i) => {
    let date = d
    let amount = input.monthlyIncome
    if (scenario.kind === 'salary_delay' && i === 0) date = addDays(d, Math.max(0, scenario.days))
    if (scenario.kind === 'income_cut') amount = Math.round(amount * (1 - Math.min(100, scenario.percent) / 100))
    if (scenario.kind === 'job_loss') amount = 0
    if (amount > 0 && date <= end) inflows.set(date, (inflows.get(date) ?? 0) + amount)
  })

  // The emergency itself lands in two days.
  if ((scenario.kind === 'medical' || scenario.kind === 'big_expense') && scenario.amount > 0) {
    addOut(addDays(today, 2), {
      name: scenario.kind === 'medical' ? 'Medical emergency' : 'Unexpected expense',
      amount: scenario.amount,
      essential: true,
      isBill: false,
    })
  }

  // Bills
  const pausedBills: BillHit[] = []
  for (const bill of input.bills) {
    for (const date of billDates(bill, today, end)) {
      if (plan.pauseFlexibleBills && !bill.essential) {
        pausedBills.push({ name: bill.name, date, amount: bill.amount, essential: false, balanceAfter: 0 })
        continue
      }
      addOut(date, { name: bill.name, amount: bill.amount, essential: bill.essential, isBill: true })
    }
  }

  // Everyday spending, spread evenly per day.
  const cut = Math.min(100, Math.max(0, plan.cutFlexiblePct)) / 100
  const daily = input.budgets.reduce((sum, b) => sum + (b.monthly / 30) * (b.essential ? 1 : 1 - cut), 0)

  let balance = input.balance + (plan.useReserve ? input.reserve : 0) + plan.contribution
  const points: DayPoint[] = []
  const billsAtRisk: BillHit[] = []
  let lowest: DayPoint = { date: today, balance }
  let firstShortDate: string | null = null

  for (let i = 0; i <= horizon; i++) {
    const date = addDays(today, i)
    balance += inflows.get(date) ?? 0
    // Essentials are paid first.
    const outs = (outflows.get(date) ?? []).sort((a, b) => Number(b.essential) - Number(a.essential))
    for (const o of outs) {
      balance -= o.amount
      if (o.isBill && balance < 0) {
        billsAtRisk.push({ name: o.name, date, amount: o.amount, essential: o.essential, balanceAfter: balance })
      }
    }
    if (i > 0) balance -= daily
    const point = { date, balance: Math.round(balance) }
    points.push(point)
    if (point.balance < lowest.balance) lowest = point
    if (point.balance < 0 && !firstShortDate) firstShortDate = date
  }

  const monthlyOutflow =
    input.budgets.reduce((s, b) => s + b.monthly, 0) +
    input.bills.reduce((s, b) => s + monthlyEquivalent(b.amount, b.frequency), 0)
  const passed = lowest.balance >= 0
  const shortfall = passed ? 0 : -lowest.balance
  const score = passed
    ? 60 + Math.round(40 * Math.min(1, lowest.balance / Math.max(1, monthlyOutflow * 0.5)))
    : Math.max(5, Math.round(59 * (1 - Math.min(1, shortfall / Math.max(1, monthlyOutflow)))))

  return { points, lowest, firstShortDate, billsAtRisk, pausedBills, passed, shortfall, score, monthlyOutflow }
}

export interface PlanStep {
  key: 'useReserve' | 'cutFlexible' | 'pauseFlexibleBills' | 'contribution'
  title: string
  detail: string
  amount: number
}

/**
 * Builds the least-disruptive recovery plan: use savings first, then trim
 * flexible spending, then pause non-essential bills, and only then ask people for help.
 * Essential bills are never cut.
 */
export function suggestPlan(input: DrillInput, scenario: Scenario, horizon: number): { options: PlanOptions; steps: PlanStep[] } {
  const steps: PlanStep[] = []
  const options: PlanOptions = { ...NO_PLAN }
  let result = simulate(input, scenario, options, horizon)
  if (result.passed) return { options, steps }

  if (input.reserve > 0) {
    options.useReserve = true
    steps.push({
      key: 'useReserve',
      title: 'Use your emergency reserve',
      detail: `Move ${formatINR(input.reserve)} from savings into spending money.`,
      amount: input.reserve,
    })
    result = simulate(input, scenario, options, horizon)
    if (result.passed) return { options, steps }
  }

  const flexible = input.budgets.filter((b) => !b.essential && b.monthly > 0)
  if (flexible.length) {
    options.cutFlexiblePct = 50
    const saved = Math.round(flexible.reduce((s, b) => s + b.monthly / 30, 0) * horizon * 0.5)
    steps.push({
      key: 'cutFlexible',
      title: 'Halve flexible spending',
      detail: `Spend half as much on ${flexible.map((b) => b.label.toLowerCase()).join(', ')} for ${horizon} days.`,
      amount: saved,
    })
    result = simulate(input, scenario, options, horizon)
    if (result.passed) return { options, steps }
  }

  const flexibleBills = input.bills.filter((b) => !b.essential)
  if (flexibleBills.length) {
    options.pauseFlexibleBills = true
    const paused = simulate(input, scenario, options, horizon)
    const saved = paused.pausedBills.reduce((s, b) => s + b.amount, 0)
    if (saved > 0) {
      steps.push({
        key: 'pauseFlexibleBills',
        title: 'Pause non-essential bills',
        detail: `Pause ${[...new Set(paused.pausedBills.map((b) => b.name))].join(', ')} until things settle.`,
        amount: saved,
      })
      result = paused
      if (result.passed) return { options, steps }
    } else {
      options.pauseFlexibleBills = false
    }
  }

  const contribution = Math.ceil(result.shortfall / 500) * 500
  options.contribution = contribution
  const by = result.firstShortDate ? ` before ${formatDate(result.firstShortDate)}` : ''
  steps.push({
    key: 'contribution',
    title: 'Ask family or flatmates for help',
    detail: `Request ${formatINR(contribution)}${by}. Tinku tracks who has paid.`,
    amount: contribution,
  })
  return { options, steps }
}

export function verdictText(r: DrillResult): string {
  if (r.passed) return `You’d get through this. Your lowest balance would be ${formatINR(r.lowest.balance)} on ${formatDate(r.lowest.date)}.`
  return `You’d run short by ${formatINR(r.shortfall)}. Money runs out on ${formatDate(r.firstShortDate ?? r.lowest.date)}.`
}
