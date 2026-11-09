import { currentMandate, effectiveDate, openOccurrence } from './bills'
import { DEMO_INR_PER_USD } from './config'
import { diffDays, todayISO } from './dates'
import { updateDb } from './db'
import { formatDate, formatINR } from './format'
import { newId } from './ids'
import { notify } from './notify'
import { applyOutcome, toUsd } from './payments'
import type { Payment, PaymentMode } from './types'

export interface SchedulerSummary {
  ranFor: string
  reminders: number
  awaitingYou: number
  autopayPaid: number
  autopayBlocked: number
  autopayFailed: number
}

function modeHint(mode: PaymentMode): string {
  if (mode === 'reminder') return 'Pay it your usual way, then mark it as paid in Tinku.'
  if (mode === 'manual') return 'Tinku will ask you to approve it on the due date.'
  return 'AutoPay will pay it within your approved limit.'
}

/**
 * The daily check. Safe to run many times a day: every step is guarded so it
 * never sends the same reminder twice and never charges an occurrence twice.
 * Failed charges are never retried automatically.
 */
export function runScheduler(today = todayISO()): Promise<SchedulerSummary> {
  return updateDb((db) => {
    const s: SchedulerSummary = { ranFor: today, reminders: 0, awaitingYou: 0, autopayPaid: 0, autopayBlocked: 0, autopayFailed: 0 }
    const nowIso = () => new Date().toISOString()

    for (const bill of db.bills.filter((b) => b.active)) {
      const occ = openOccurrence(db, bill.id)
      if (!occ || occ.status === 'processing') continue
      const when = effectiveDate(occ)
      const daysLeft = diffDays(today, when)
      const href = `/bills/${bill.id}`

      if (daysLeft > 0) {
        if (daysLeft <= 3 && occ.status === 'upcoming' && !occ.remindedAt) {
          occ.remindedAt = nowIso()
          notify(db, {
            kind: 'reminder',
            title: `${bill.name} is due ${daysLeft === 1 ? 'tomorrow' : `in ${daysLeft} days`}`,
            body: `${formatINR(occ.amount)} on ${formatDate(when)}. ${modeHint(bill.mode)}`,
            href,
          })
          s.reminders++
        }
        continue
      }

      // Due today or overdue. Anything not "upcoming" is already waiting for the user.
      if (occ.status !== 'upcoming') continue

      if (bill.mode === 'reminder') {
        occ.status = 'due'
        occ.note = 'Pay it your usual way, then mark it as paid.'
        occ.dueNotifiedAt = nowIso()
        notify(db, { kind: 'reminder', title: `${bill.name} is due`, body: `${formatINR(occ.amount)}. ${occ.note}`, href })
        s.awaitingYou++
        continue
      }

      if (bill.mode === 'manual') {
        occ.status = 'due'
        occ.note = 'Waiting for your approval'
        occ.dueNotifiedAt = nowIso()
        notify(db, {
          kind: 'approval',
          title: `Approve payment: ${bill.name}`,
          body: `${formatINR(occ.amount)} is due. Pay now, postpone or skip.`,
          href,
        })
        s.awaitingYou++
        continue
      }

      // AutoPay — only within an active, unexpired authorization and its limit.
      const block = (reason: string) => {
        occ.status = 'due'
        occ.note = reason
        occ.dueNotifiedAt = nowIso()
        notify(db, { kind: 'autopay', title: `AutoPay needs you: ${bill.name}`, body: reason, href })
        s.autopayBlocked++
      }
      const mandate = currentMandate(db, bill.id)
      if (!mandate) {
        block('AutoPay is not authorized for this bill yet. Approve this payment yourself or set up AutoPay.')
        continue
      }
      if (mandate.status === 'active' && mandate.expiresOn < today) mandate.status = 'expired'
      if (mandate.status === 'expired') {
        block('Your AutoPay authorization has expired. Re-authorize it, or approve this payment yourself.')
        continue
      }
      if (mandate.status === 'paused') {
        block('AutoPay is paused for this bill, so Tinku did not charge it.')
        continue
      }
      if (occ.amount > mandate.maxAmount) {
        block(`${formatINR(occ.amount)} is above your AutoPay limit of ${formatINR(mandate.maxAmount)}. Approve this one yourself.`)
        continue
      }

      const key = `autopay-${occ.id}`
      if (db.payments.some((p) => p.idempotencyKey === key)) continue

      const fail = db.profile.demoFailNextCharge
      if (fail) db.profile.demoFailNextCharge = false
      const now = nowIso()
      const payment: Payment = {
        id: newId('pay'),
        occurrenceId: occ.id,
        billId: bill.id,
        label: bill.name,
        payee: bill.payee,
        amountInr: occ.amount,
        chargeAmount: toUsd(occ.amount),
        chargeCurrency: 'USD',
        fxRate: DEMO_INR_PER_USD,
        provider: 'simulated',
        mode: 'autopay',
        status: 'created',
        idempotencyKey: key,
        createdAt: now,
        updatedAt: now,
        events: [
          {
            at: now,
            status: 'created',
            message: `AutoPay attempt: ${formatINR(occ.amount)} is within your ${formatINR(mandate.maxAmount)} limit`,
          },
        ],
      }
      db.payments.unshift(payment)
      applyOutcome(
        db,
        payment.id,
        fail
          ? { status: 'failed', message: 'The simulated provider declined the AutoPay charge. Tinku will not retry automatically.' }
          : { status: 'captured', message: 'Simulated provider confirmed the charge; verified on the server.', captureId: newId('simcap') },
      )
      if (fail) s.autopayFailed++
      else s.autopayPaid++
    }

    db.meta.lastSchedulerRun = today
    return s
  })
}
