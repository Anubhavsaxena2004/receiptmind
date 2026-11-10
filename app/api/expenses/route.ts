import { NextResponse } from 'next/server'
import { apiCaller, apiError, authedJson, json, UNAUTHORIZED } from '@/lib/api'
import { addExpenseFor } from '@/lib/services'
import { readUserDb } from '@/lib/store'

/** GET ?month=YYYY-MM&category=&q= → { expenses } (your own only). */
export async function GET(request: Request) {
  const caller = await apiCaller(request)
  if (!caller) return UNAUTHORIZED()
  const p = new URL(request.url).searchParams
  const month = p.get('month')
  const category = p.get('category')
  const q = p.get('q')?.toLowerCase()
  const db = await readUserDb(caller.user.id)
  const expenses = db.expenses.filter(
    (e) => (!month || e.date.startsWith(month)) && (!category || e.category === category) && (!q || e.title.toLowerCase().includes(q)),
  )
  return json({ count: expenses.length, expenses })
}

/** POST { title, amount, category, date?, note?, confirmDuplicate? } → 201 { expense } · 409 { duplicateOf } */
export async function POST(request: Request) {
  const ctx = await authedJson(request)
  if (ctx instanceof NextResponse) return ctx
  const result = await addExpenseFor(ctx.caller.user.id, ctx.body)
  if ('error' in result) return apiError(400, result.error)
  if ('duplicateOf' in result) {
    return apiError(409, 'This looks like an expense you already added. Send "confirmDuplicate": true to save it anyway.', {
      duplicateOf: result.duplicateOf,
    })
  }
  return json({ expense: result.ok }, 201)
}
