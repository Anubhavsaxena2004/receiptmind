'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { effectiveDate, isResolved, settleOccurrence } from '../bills'
import { addDays, todayISO } from '../dates'
import { getOrigin } from '../data'
import { notify } from '../notify'
import { approveSimulated, cancelCheckout, refreshPayment, startCheckout, UserError } from '../payments'
import { saveBillFor } from '../services'
import { currentUser, isVerified, NEED_LOGIN, NEED_VERIFY } from '../session'
import { updateUserDb } from '../store'
import type { ActionState } from '../types'

export async function saveBill(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await currentUser()
  if (!user) return NEED_LOGIN
  const result = await saveBillFor(user.id, Object.fromEntries(fd))
  if ('error' in result) return { error: result.error }
  const { bill, needsAutopayAuthorization } = result.ok
  revalidatePath('/', 'layout')
  redirect(needsAutopayAuthorization ? `/autopay/new?bill=${bill.id}` : `/bills/${bill.id}?saved=1`)
}

export async function deleteBill(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await currentUser()
  if (!user) return NEED_LOGIN
  const id = String(fd.get('id') ?? '')
  const error = await updateUserDb(user.id, (db) => {
    const bill = db.bills.find((b) => b.id === id)
    if (!bill) return 'This bill no longer exists.'
    if (db.occurrences.some((o) => o.billId === id && o.status === 'processing'))
      return 'A payment for this bill is still processing. Wait for it to finish first.'
    bill.active = false
    db.occurrences = db.occurrences.filter((o) => o.billId !== id || isResolved(o.status))
    for (const m of db.mandates) if (m.billId === id && m.status !== 'revoked') m.status = 'revoked'
    return null
  })
  if (error) return { error }
  revalidatePath('/', 'layout')
  redirect('/bills')
}

const occurrenceId = (fd: FormData) => String(fd.get('occurrenceId') ?? '')

export async function postponeOccurrence(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await currentUser()
  if (!user) return NEED_LOGIN
  const occId = occurrenceId(fd)
  const days = Math.min(30, Math.max(1, Number(fd.get('days') ?? 3) || 3))
  const today = todayISO()
  const result = await updateUserDb(user.id, (db): ActionState => {
    const occ = db.occurrences.find((o) => o.id === occId)
    if (!occ || isResolved(occ.status)) return { error: 'This bill is already settled.' }
    if (occ.status === 'processing') return { error: 'A payment is processing for this bill. Check its status first.' }
    const from = effectiveDate(occ) > today ? effectiveDate(occ) : today
    occ.postponedTo = addDays(from, days)
    occ.status = 'upcoming'
    occ.remindedAt = undefined
    occ.note = undefined
    return { message: `Postponed by ${days} days. Only this payment moved; the bill still repeats as usual.` }
  })
  revalidatePath('/', 'layout')
  return result
}

export async function skipOccurrence(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await currentUser()
  if (!user) return NEED_LOGIN
  const occId = occurrenceId(fd)
  const result = await updateUserDb(user.id, (db): ActionState => {
    const occ = db.occurrences.find((o) => o.id === occId)
    if (!occ || isResolved(occ.status)) return { error: 'This bill is already settled.' }
    if (occ.status === 'processing') return { error: 'A payment is processing for this bill. Check its status first.' }
    settleOccurrence(db, occ, 'skipped', { note: 'Skipped by you — left unpaid' })
    return { message: 'Skipped this one. It stays unpaid; future bills are not affected.' }
  })
  revalidatePath('/', 'layout')
  return result
}

export async function markPaidOutside(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await currentUser()
  if (!user) return NEED_LOGIN
  const occId = occurrenceId(fd)
  const result = await updateUserDb(user.id, (db): ActionState => {
    const occ = db.occurrences.find((o) => o.id === occId)
    if (!occ || isResolved(occ.status)) return { error: 'This bill is already settled.' }
    if (occ.status === 'processing') return { error: 'A payment is processing in Tinku. Check its status before marking it paid elsewhere.' }
    settleOccurrence(db, occ, 'paid_outside', { note: 'You paid this outside Tinku' })
    const bill = db.bills.find((b) => b.id === occ.billId)
    notify(db, { kind: 'payment', title: `Marked paid: ${bill?.name ?? 'Bill'}`, body: 'Recorded as paid outside Tinku. No scheduled payment will run for it.', href: `/bills/${occ.billId}` })
    return { message: 'Marked as paid. Tinku won’t try to charge it.' }
  })
  revalidatePath('/', 'layout')
  return result
}

export async function payNow(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await currentUser()
  if (!user) return NEED_LOGIN
  if (!isVerified(user)) return NEED_VERIFY
  let url: string
  try {
    url = (await startCheckout(user.id, occurrenceId(fd), await getOrigin())).url
  } catch (err) {
    if (err instanceof UserError) return { error: err.message }
    console.error(err)
    return { error: 'Could not start the payment. Please try again.' }
  }
  revalidatePath('/', 'layout')
  redirect(url)
}

export async function approveSimulatedPayment(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await currentUser()
  if (!user) return NEED_LOGIN
  if (!isVerified(user)) return NEED_VERIFY
  const id = String(fd.get('paymentId') ?? '')
  try {
    await approveSimulated(user.id, id)
  } catch (err) {
    return { error: err instanceof UserError ? err.message : 'Could not complete the payment.' }
  }
  revalidatePath('/', 'layout')
  redirect(`/payments/${id}`)
}

export async function cancelSimulatedPayment(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await currentUser()
  if (!user) return NEED_LOGIN
  const id = String(fd.get('paymentId') ?? '')
  await cancelCheckout(user.id, id)
  revalidatePath('/', 'layout')
  redirect(`/payments/${id}`)
}

export async function refreshPaymentStatus(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await currentUser()
  if (!user) return NEED_LOGIN
  const id = String(fd.get('paymentId') ?? '')
  try {
    await refreshPayment(user.id, id)
  } catch (err) {
    console.error(err)
    return { error: 'Could not reach PayPal. Try again in a moment.' }
  }
  revalidatePath('/', 'layout')
  return { message: 'Checked with PayPal just now.' }
}
