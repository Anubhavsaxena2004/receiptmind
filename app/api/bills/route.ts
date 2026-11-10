import { NextResponse } from 'next/server'
import { apiCaller, apiError, authedJson, json, UNAUTHORIZED } from '@/lib/api'
import { billViews } from '@/lib/bills'
import { todayISO } from '@/lib/dates'
import { saveBillFor } from '@/lib/services'
import { readUserDb } from '@/lib/store'

/** GET → { bills: [{ ...bill, next: { occurrenceId, dueDate, amount, status }, autopay }] } */
export async function GET(request: Request) {
  const caller = await apiCaller(request)
  if (!caller) return UNAUTHORIZED()
  const db = await readUserDb(caller.user.id)
  const bills = billViews(db, todayISO()).map(({ bill, occ, due, daysLeft, mandate }) => ({
    ...bill,
    next: occ ? { occurrenceId: occ.id, dueDate: due, daysLeft, amount: occ.amount, status: occ.status, note: occ.note } : null,
    autopay: mandate ? { mandateId: mandate.id, status: mandate.status, maxAmount: mandate.maxAmount, expiresOn: mandate.expiresOn } : null,
  }))
  return json({ count: bills.length, bills })
}

/** POST { name, amount, category, frequency, mode, dueDate, payee?, essential? } → 201 { bill } */
export async function POST(request: Request) {
  const ctx = await authedJson(request)
  if (ctx instanceof NextResponse) return ctx
  // Creating only: editing goes through the app.
  const input = { ...ctx.body, id: undefined }
  const result = await saveBillFor(ctx.caller.user.id, input)
  if ('error' in result) return apiError(400, result.error)
  return json(
    {
      bill: result.ok.bill,
      needsAutopayAuthorization: result.ok.needsAutopayAuthorization,
      next: result.ok.needsAutopayAuthorization ? 'POST /api/autopay/authorize with { billId, maxAmount, months, consent: true }' : undefined,
    },
    201,
  )
}
