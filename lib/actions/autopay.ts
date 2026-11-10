'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { todayISO } from '../dates'
import { notify } from '../notify'
import { runScheduler } from '../scheduler'
import { authorizeAutopayFor } from '../services'
import { currentUser, isVerified, NEED_LOGIN, NEED_VERIFY } from '../session'
import { readUserDb, updateUserDb } from '../store'
import type { ActionState, MandateStatus } from '../types'

export async function authorizeAutopay(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await currentUser()
  if (!user) return NEED_LOGIN
  if (!isVerified(user)) return NEED_VERIFY
  const result = await authorizeAutopayFor(user, Object.fromEntries(fd))
  if ('error' in result) return { error: result.error }
  revalidatePath('/', 'layout')
  redirect('/autopay?authorized=1')
}

async function setMandateStatus(id: string, status: MandateStatus): Promise<ActionState> {
  const user = await currentUser()
  if (!user) return NEED_LOGIN
  if (status === 'active' && !isVerified(user)) return NEED_VERIFY
  const result = await updateUserDb(user.id, (db): ActionState => {
    const m = db.mandates.find((x) => x.id === id)
    if (!m || m.status === 'revoked') return { error: 'AutoPay authorization not found.' }
    const bill = db.bills.find((b) => b.id === m.billId)
    if (status === 'active' && m.expiresOn < todayISO()) return { error: 'This authorization has expired. Set up AutoPay again.' }
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
  const user = await currentUser()
  if (!user) return NEED_LOGIN
  const s = await runScheduler(user.id)
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
  const user = await currentUser()
  if (!user) return false
  const db = await readUserDb(user.id)
  if (db.meta.lastSchedulerRun === todayISO()) return false
  await runScheduler(user.id)
  revalidatePath('/', 'layout')
  return true
}
