'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createOccurrence, currentMandate, effectiveDate, isResolved, openOccurrence, settleOccurrence } from '../bills'
import { isCategoryId } from '../categories'
import { addDays, isISODate, todayISO } from '../dates'
import { updateDb } from '../db'
import { getOrigin } from '../data'
import { newId } from '../ids'
import { notify } from '../notify'
import { approveSimulated, cancelCheckout, refreshPayment, startCheckout, UserError } from '../payments'
import type { ActionState, Bill, Frequency, PaymentMode } from '../types'

const FREQUENCIES: Frequency[] = ['once', 'weekly', 'monthly', 'quarterly', 'yearly']
const MODES: PaymentMode[] = ['reminder', 'manual', 'autopay']

export async function saveBill(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const id = String(fd.get('id') ?? '') || undefined
  const name = String(fd.get('name') ?? '').trim()
  const payee = String(fd.get('payee') ?? '').trim()
  const amount = Number(fd.get('amount'))
  const cat = fd.get('category')
  const frequency = fd.get('frequency') as Frequency
  const mode = fd.get('mode') as PaymentMode
  const dueDate = fd.get('dueDate')
  const essential = fd.get('essential') === 'on'

  if (!name) return { error: 'Give the bill a name, like “Electricity”.' }
  if (!Number.isFinite(amount) || amount <= 0) return { error: 'Enter the bill amount.' }
  if (!isCategoryId(cat)) return { error: 'Pick a category.' }
  if (!FREQUENCIES.includes(frequency)) return { error: 'Pick how often this bill repeats.' }
  if (!MODES.includes(mode)) return { error: 'Choose how Tinku should handle this bill.' }
  if (!isISODate(dueDate)) return { error: 'Pick the next due date.' }

  const result = await updateDb((db) => {
    let bill: Bill | undefined
    if (id) {
      bill = db.bills.find((b) => b.id === id)
      if (!bill) return { error: 'This bill no longer exists.' }
      Object.assign(bill, { name, payee: payee || name, amount: Math.round(amount), category: cat, frequency, mode, essential })
      const occ = openOccurrence(db, bill.id)
      if (occ && occ.status !== 'processing') {
        occ.amount = bill.amount
        if (occ.dueDate !== dueDate) {
          occ.dueDate = dueDate
          occ.postponedTo = undefined
          occ.remindedAt = undefined
          if (occ.status === 'due') occ.status = 'upcoming'
        }
      } else if (!occ) {
        createOccurrence(db, bill, dueDate)
      }
    } else {
      bill = {
        id: newId('bill'),
        name,
        payee: payee || name,
        amount: Math.round(amount),
        category: cat,
        essential,
        frequency,
        mode,
        active: true,
        createdAt: new Date().toISOString(),
      }
      db.bills.push(bill)
      createOccurrence(db, bill, dueDate)
    }
    const needsAuth = bill.mode === 'autopay' && currentMandate(db, bill.id)?.status !== 'active'
    return { billId: bill.id, needsAuth }
  })
  if ('error' in result) return { error: result.error }

  revalidatePath('/', 'layout')
  redirect(result.needsAuth ? `/autopay/new?bill=${result.billId}` : `/bills/${result.billId}?saved=1`)
}

export async function deleteBill(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const id = String(fd.get('id') ?? '')
  const error = await updateDb((db) => {
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

function findOpen(fd: FormData) {
  return String(fd.get('occurrenceId') ?? '')
}

export async function postponeOccurrence(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const occId = findOpen(fd)
  const days = Math.min(30, Math.max(1, Number(fd.get('days') ?? 3) || 3))
  const today = todayISO()
  const result = await updateDb((db) => {
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
  const occId = findOpen(fd)
  const result = await updateDb((db) => {
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
  const occId = findOpen(fd)
  const result = await updateDb((db) => {
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
  const occId = findOpen(fd)
  let url: string
  try {
    url = await startCheckout(occId, await getOrigin())
  } catch (err) {
    if (err instanceof UserError) return { error: err.message }
    console.error(err)
    return { error: 'Could not start the payment. Please try again.' }
  }
  revalidatePath('/', 'layout')
  redirect(url)
}

export async function approveSimulatedPayment(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const id = String(fd.get('paymentId') ?? '')
  try {
    await approveSimulated(id)
  } catch (err) {
    return { error: err instanceof UserError ? err.message : 'Could not complete the payment.' }
  }
  revalidatePath('/', 'layout')
  redirect(`/payments/${id}`)
}

export async function cancelSimulatedPayment(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const id = String(fd.get('paymentId') ?? '')
  await cancelCheckout(id)
  revalidatePath('/', 'layout')
  redirect(`/payments/${id}`)
}

export async function refreshPaymentStatus(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const id = String(fd.get('paymentId') ?? '')
  try {
    await refreshPayment(id)
  } catch (err) {
    console.error(err)
    return { error: 'Could not reach PayPal. Try again in a moment.' }
  }
  revalidatePath('/', 'layout')
  return { message: 'Checked with PayPal just now.' }
}
