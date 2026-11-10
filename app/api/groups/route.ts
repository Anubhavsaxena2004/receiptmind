import { NextResponse } from 'next/server'
import { apiCaller, apiError, authedJson, json, UNAUTHORIZED } from '@/lib/api'
import { groupBalances } from '@/lib/groups'
import { createGroupFor } from '@/lib/services'
import { readUserDb } from '@/lib/store'

/** GET → { groups: [{ ...group, balances: { memberId: amount }, expenses }] } (+ = is owed, − = owes). */
export async function GET(request: Request) {
  const caller = await apiCaller(request)
  if (!caller) return UNAUTHORIZED()
  const db = await readUserDb(caller.user.id)
  const groups = db.groups.map((g) => ({
    ...g,
    balances: groupBalances(g, db.groupExpenses, db.settlements),
    expenses: db.groupExpenses.filter((e) => e.groupId === g.id),
  }))
  return json({ count: groups.length, groups })
}

/** POST { name, members: ["Kabir", "Meera"] } → 201 { group } */
export async function POST(request: Request) {
  const ctx = await authedJson(request)
  if (ctx instanceof NextResponse) return ctx
  const result = await createGroupFor(ctx.caller.user.id, ctx.body)
  if ('error' in result) return apiError(400, result.error)
  return json({ group: result.ok }, 201)
}
