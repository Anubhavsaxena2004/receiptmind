import { NextResponse } from 'next/server'
import { apiCaller, apiError, authedJson, json, UNAUTHORIZED } from '@/lib/api'
import { monthKey, todayISO } from '@/lib/dates'
import { saveBudgetsFor } from '@/lib/services'
import { readUserDb } from '@/lib/store'

/** GET → { month, budgets: [{ category, limit, spent }] } */
export async function GET(request: Request) {
  const caller = await apiCaller(request)
  if (!caller) return UNAUTHORIZED()
  const db = await readUserDb(caller.user.id)
  const month = monthKey(todayISO())
  const budgets = db.budgets.map((b) => ({
    ...b,
    spent: db.expenses.filter((e) => e.category === b.category && monthKey(e.date) === month).reduce((s, e) => s + e.amount, 0),
  }))
  return json({ month, budgets })
}

/** PUT { limits: { groceries: 8000, food: 5000, ... } } → { budgets }. Missing categories are cleared. */
export async function PUT(request: Request) {
  const ctx = await authedJson(request)
  if (ctx instanceof NextResponse) return ctx
  const result = await saveBudgetsFor(ctx.caller.user.id, { limits: ctx.body.limits })
  if ('error' in result) return apiError(400, result.error)
  return json({ budgets: result.ok })
}
