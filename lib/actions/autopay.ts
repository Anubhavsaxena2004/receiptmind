'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { openOccurrence } from '../bills'
import { addMonths, todayISO } from '../dates'
import { readDb, updateDb } from '../db'
import { formatINR } from '../format'
import { newId } from '../ids'
import { notify } from '../notify'
import { runScheduler } from '../scheduler'
import type { ActionState, MandateStatus } from '../types'

export async function authorizeAutopay(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const billId = String(fd.get('billId') ?? '')
  const maxAmount = Number(fd.get('maxAmount'))
  const months = Number(fd.get('months'))
  if (fd.get('consent') !== 'on') return { error: 'Tick the box to confirm you authorize these charges.' }
  if (!Number.isFinite(maxAmount) || maxAmount <= 0) return { error: 'Set the most Tinku may charge each time.' }
  if (![3, 6, 12].includes(months)) return { error: 'Pick how long this authorization lasts.' }

  const error = await updateDb((db) => {
    const bill = db.bills.find((b) => b.id === billId && b.active)
    if (!bill) return 'This bill no longer exists.'
    if (maxAmount < bill.amount) return `The limit must be at least the bill amount (${formatINR(bill.amount)}).`
    const now = new Date().toISOString()
    for (const m of db.mandates) if (m.billId === billId && m.status !== 'revoked') m.status = 'revoked'
    db.mandates.push({
      id: newId('mnd'),
      billId,
      maxAmount: Math.round(maxAmount),
      status: 'active',
      authorizedAt: now,
      expiresOn: addMonths(todayISO(), months),
      provider: 'simulated',
    })
    bill.mode = 'autopay'
    const occ = openOccurrence(db, billId)
    // A payment that was waiting for the user can now run on the next daily check.
    if (occ && occ.status === 'due' && occ.amount <= maxAmount) {
      occ.status = 'upcoming'
      occ.note = undefined
    }
    notify(db, {
      kind: 'autopay',
      title: `AutoPay is on: ${bill.name}`,
      body: `Tinku may charge up to ${formatINR(maxAmount)} on each due date for ${months} months. Pause or cancel anytime.`,
      href: '/autopay',
    })
    return null
  })
  if (error) return { error }
  revalidatePath('/', 'layout')
  redirect('/autopay?authorized=1')
}

async function setMandateStatus(id: string, status: MandateStatus): Promise<ActionState> {
  const result = await updateDb((db): ActionState => {
    const m = db.mandates.find((x) => x.id === id)
    if (!m) return { error: 'AutoPay authorization not found.' }
    const bill = db.bills.find((b) => b.id === m.billId)
    m.status = status
    if (status === 'revoked' && bill) {
      bill.mode = 'manual'
      notify(db, { kind: 'autopay', title: `AutoPay cancelled: ${bill.name}`, body: 'Tinku will now ask you before paying this bill.', href: `/bills/${bill.id}` })
      return { message: 'AutoPay cancelled. This bill now asks you before paying.' }
    }
    if (status === 'paused') return { message: 'AutoPay paused. Nothing will be charged until you resume.' }
    return { message: 'AutoPay resumed.' }
  })
  revalidatePath('/', 'layout')
  return result
}

export async function pauseMandate(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return setMandateStatus(String(fd.get('mandateId') ?? ''), 'paused')
}

export async function resumeMandate(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return setMandateStatus(String(fd.get('mandateId') ?? ''), 'active')
}

export async function revokeMandate(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return setMandateStatus(String(fd.get('mandateId') ?? ''), 'revoked')
}

export async function runSchedulerNow(_prev: ActionState): Promise<ActionState> {
  const s = await runScheduler()
  revalidatePath('/', 'layout')
  const parts = [
    s.autopayPaid && `${s.autopayPaid} paid by AutoPay`,
    s.autopayFailed && `${s.autopayFailed} AutoPay failed`,
    s.autopayBlocked && `${s.autopayBlocked} AutoPay need you`,
    s.awaitingYou && `${s.awaitingYou} waiting for you`,
    s.reminders && `${s.reminders} reminders sent`,
  ].filter(Boolean)
  return { message: parts.length ? `Done: ${parts.join(' · ')}.` : 'Checked all bills. Nothing new today.' }
}

/** Called once per day from the browser while the app is open (stands in for a cron job). */
export async function runDailyCheckIfNeeded(): Promise<boolean> {
  const db = await readDb()
  if (db.meta.lastSchedulerRun === todayISO()) return false
  await runScheduler()
  revalidatePath('/', 'layout')
  return true
}
