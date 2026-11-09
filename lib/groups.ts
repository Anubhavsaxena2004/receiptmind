import type { Group, GroupExpense, Settlement } from './types'

/** Net balance per member: positive = others owe them, negative = they owe. */
export function groupBalances(group: Group, expenses: GroupExpense[], settlements: Settlement[]): Record<string, number> {
  const bal: Record<string, number> = Object.fromEntries(group.members.map((m) => [m.id, 0]))
  for (const e of expenses) {
    if (e.groupId !== group.id || e.splitAmong.length === 0) continue
    const share = e.amount / e.splitAmong.length
    bal[e.paidBy] = (bal[e.paidBy] ?? 0) + e.amount
    for (const m of e.splitAmong) bal[m] = (bal[m] ?? 0) - share
  }
  for (const s of settlements) {
    if (s.groupId !== group.id) continue
    bal[s.from] = (bal[s.from] ?? 0) + s.amount
    bal[s.to] = (bal[s.to] ?? 0) - s.amount
  }
  return bal
}

export interface Debt {
  from: string
  to: string
  amount: number
}

/** Fewest payments that settle everyone up (greedy largest-first). */
export function simplifyDebts(balances: Record<string, number>): Debt[] {
  const creditors = Object.entries(balances)
    .filter(([, v]) => v > 0.5)
    .map(([id, v]) => ({ id, v }))
    .sort((a, b) => b.v - a.v)
  const debtors = Object.entries(balances)
    .filter(([, v]) => v < -0.5)
    .map(([id, v]) => ({ id, v: -v }))
    .sort((a, b) => b.v - a.v)
  const out: Debt[] = []
  let i = 0
  let j = 0
  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].v, creditors[j].v)
    if (Math.round(pay) > 0) out.push({ from: debtors[i].id, to: creditors[j].id, amount: Math.round(pay) })
    debtors[i].v -= pay
    creditors[j].v -= pay
    if (debtors[i].v < 0.5) i++
    if (creditors[j].v < 0.5) j++
  }
  return out
}
