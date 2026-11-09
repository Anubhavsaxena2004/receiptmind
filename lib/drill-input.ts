import { effectiveDate, openOccurrence } from './bills'
import { category } from './categories'
import type { DrillInput } from './rehearsal'
import type { Db } from './types'

/** Turns the user's real bills, budgets and balance into crisis-drill input. */
export function buildDrillInput(db: Db, today: string): DrillInput {
  const bills = db.bills
    .filter((b) => b.active)
    .flatMap((b) => {
      const occ = openOccurrence(db, b.id)
      if (!occ) return []
      return [{ name: b.name, amount: occ.amount, frequency: b.frequency, essential: b.essential, nextDue: effectiveDate(occ) }]
    })
  // Day-to-day spending comes from budgets of "spending" categories (bills are counted separately).
  const budgets = db.budgets
    .filter((b) => b.limit > 0 && category(b.category).kind === 'spending')
    .map((b) => ({ label: category(b.category).label, monthly: b.limit, essential: category(b.category).essential }))
  return {
    today,
    balance: db.profile.currentBalance,
    reserve: db.profile.emergencyReserve,
    monthlyIncome: db.profile.monthlyIncome,
    salaryDay: db.profile.salaryDay,
    bills,
    budgets,
  }
}
