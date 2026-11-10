import { isResolved, settleOccurrence } from './bills'
import { DEMO_INR_PER_USD, paypalConfigured } from './config'
import { formatINR } from './format'
import { newId } from './ids'
import { notify } from './notify'
import * as paypal from './paypal'
import { readUserDb, updateUserDb } from './store'
import type { Db, Payment, PaymentStatus } from './types'

/** An error whose message is safe and useful to show to the user. */
export class UserError extends Error {}

export function toUsd(inr: number): string {
  return Math.max(inr / DEMO_INR_PER_USD, 0.01).toFixed(2)
}

export function providerName(p: Pick<Payment, 'provider'>): string {
  return p.provider === 'paypal_sandbox' ? 'PayPal Sandbox' : 'the simulated provider'
}

/**
 * PayPal's custom_id carries the owner and our payment id, so a signature-verified
 * webhook can be routed to the right account without trusting anything else.
 */
export function paypalCustomId(userId: string, paymentId: string): string {
  return `${userId}:${paymentId}`
}

export function parseCustomId(customId: string | undefined): { userId: string; paymentId: string } | null {
  const m = /^(usr_[A-Za-z0-9]+):(pay_[A-Za-z0-9]+)$/.exec(customId ?? '')
  return m ? { userId: m[1], paymentId: m[2] } : null
}

export interface Outcome {
  status: Exclude<PaymentStatus, 'created'>
  message: string
  captureId?: string
}

/**
 * The only place a payment's final state is applied. A bill is marked paid
 * only from here, and only for a provider result the server has verified.
 * Applying the same outcome twice is a no-op (duplicate webhooks / retries).
 */
export function applyOutcome(db: Db, paymentId: string, outcome: Outcome): Payment | undefined {
  const p = db.payments.find((x) => x.id === paymentId)
  if (!p) return undefined
  if (p.status === outcome.status) return p
  if (p.status === 'captured' && outcome.status !== 'refunded') return p
  if (p.status === 'refunded') return p

  const now = new Date().toISOString()
  p.status = outcome.status
  p.updatedAt = now
  if (outcome.captureId) p.providerCaptureId = outcome.captureId
  p.events.push({ at: now, status: outcome.status, message: outcome.message })

  const occ = p.occurrenceId ? db.occurrences.find((o) => o.id === p.occurrenceId) : undefined
  const open = occ !== undefined && !isResolved(occ.status)
  const href = `/payments/${p.id}`

  switch (outcome.status) {
    case 'captured':
      if (occ && open) settleOccurrence(db, occ, 'paid', { paymentId: p.id })
      notify(db, {
        kind: p.mode === 'autopay' ? 'autopay' : 'payment',
        title: `Paid: ${p.label}`,
        body: `${formatINR(p.amountInr)} confirmed by ${providerName(p)} and verified by Tinku.`,
        href,
      })
      break
    case 'pending':
      if (occ && open) {
        occ.status = 'processing'
        occ.paymentId = p.id
        occ.note = outcome.message
      }
      notify(db, {
        kind: 'payment',
        title: `Payment pending: ${p.label}`,
        body: 'The provider has not confirmed it yet. The bill stays unpaid until it does.',
        href,
      })
      break
    case 'failed':
      if (occ && open) {
        occ.status = 'failed'
        occ.paymentId = p.id
        occ.note = outcome.message
      }
      notify(db, { kind: 'payment', title: `Payment failed: ${p.label}`, body: `${outcome.message} The bill is still unpaid.`, href })
      break
    case 'cancelled':
      if (occ && open && occ.status === 'processing') occ.status = 'due'
      break
    case 'refunded':
      if (occ) occ.note = 'This payment was refunded by the provider.'
      notify(db, { kind: 'payment', title: `Refunded: ${p.label}`, body: `${formatINR(p.amountInr)} was refunded.`, href })
      break
  }
  return p
}

/** Creates a payment for a bill occurrence and returns where to send the user to approve it. */
export async function startCheckout(userId: string, occurrenceId: string, origin: string): Promise<{ url: string; paymentId: string }> {
  const usePaypal = paypalConfigured()
  const created = await updateUserDb(userId, (db) => {
    const occ = db.occurrences.find((o) => o.id === occurrenceId)
    if (!occ) throw new UserError('This bill could not be found.')
    if (isResolved(occ.status)) throw new UserError('This bill is already settled.')
    if (occ.status === 'processing') throw new UserError('A payment for this bill is still processing. Check its status first.')
    const bill = db.bills.find((b) => b.id === occ.billId)
    if (!bill) throw new UserError('This bill could not be found.')

    const now = new Date().toISOString()
    // Close any checkout the user started earlier and abandoned, so only one can complete.
    for (const old of db.payments) {
      if (old.occurrenceId === occ.id && old.status === 'created') {
        old.status = 'cancelled'
        old.updatedAt = now
        old.events.push({ at: now, status: 'cancelled', message: 'Replaced by a newer checkout' })
      }
    }
    const attempt = db.payments.filter((p) => p.occurrenceId === occ.id).length + 1
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
      provider: usePaypal ? 'paypal_sandbox' : 'simulated',
      mode: 'manual',
      status: 'created',
      idempotencyKey: `checkout-${occ.id}-${attempt}`,
      createdAt: now,
      updatedAt: now,
      events: [{ at: now, status: 'created', message: 'Checkout started by you' }],
    }
    db.payments.unshift(payment)
    return payment
  })

  if (!usePaypal) return { url: `/pay/simulated?payment=${created.id}`, paymentId: created.id }

  try {
    const order = await paypal.createOrder({
      // Unique per payment: sample bills share IDs across accounts, so a bill-based key could
      // make PayPal hand one account's order to another.
      requestId: `create-${created.id}`,
      amount: created.chargeAmount,
      currency: 'USD',
      customId: paypalCustomId(userId, created.id),
      description: `${created.label} (Tinku demo)`,
      returnUrl: `${origin}/api/paypal/return?payment=${created.id}`,
      cancelUrl: `${origin}/api/paypal/cancel?payment=${created.id}`,
    })
    await updateUserDb(userId, (db) => {
      const p = db.payments.find((x) => x.id === created.id)
      if (!p) return
      p.providerOrderId = order.id
      p.approveUrl = order.approveUrl
      p.events.push({ at: new Date().toISOString(), status: 'created', message: `PayPal order ${order.id} created` })
    })
    return { url: order.approveUrl, paymentId: created.id }
  } catch (err) {
    const message = err instanceof paypal.PayPalError ? err.message : 'Could not reach PayPal.'
    if (!(err instanceof paypal.PayPalError)) console.error('[paypal create order]', err)
    await updateUserDb(userId, (db) => {
      const p = db.payments.find((x) => x.id === created.id)
      if (!p) return
      // Nothing was charged, so the bill itself is left exactly as it was.
      const now = new Date().toISOString()
      p.status = 'failed'
      p.updatedAt = now
      p.events.push({ at: now, status: 'failed', message: `Checkout could not start: ${message}` })
    })
    return { url: `/payments/${created.id}`, paymentId: created.id }
  }
}

/** Checks a PayPal order and turns it into a verified outcome. */
export function verifyOrder(order: paypal.PayPalOrder, p: Payment, expectedCustomId: string): Outcome {
  const capture = order.purchase_units?.[0]?.payments?.captures?.[0]
  if (!capture) {
    if (['CREATED', 'APPROVED', 'PAYER_ACTION_REQUIRED', 'SAVED'].includes(order.status)) {
      return { status: 'pending', message: `PayPal order is ${order.status.toLowerCase()} but not captured yet.` }
    }
    return { status: 'failed', message: `PayPal returned no capture (order status ${order.status}).` }
  }
  if (capture.amount.currency_code !== p.chargeCurrency || capture.amount.value !== p.chargeAmount) {
    return {
      status: 'failed',
      message: `Amount mismatch: PayPal reported ${capture.amount.value} ${capture.amount.currency_code}, expected ${p.chargeAmount} ${p.chargeCurrency}. Flagged for review, not marked paid.`,
    }
  }
  if (capture.custom_id && capture.custom_id !== expectedCustomId) {
    return { status: 'failed', message: 'PayPal capture belongs to a different payment. Not marked paid.' }
  }
  switch (capture.status) {
    case 'COMPLETED':
      return { status: 'captured', message: `PayPal capture ${capture.id} completed and verified on the server.`, captureId: capture.id }
    case 'PENDING':
      return {
        status: 'pending',
        message: `PayPal is holding the payment (${capture.status_details?.reason?.toLowerCase().replace(/_/g, ' ') ?? 'pending review'}).`,
        captureId: capture.id,
      }
    case 'REFUNDED':
    case 'PARTIALLY_REFUNDED':
      return { status: 'refunded', message: `PayPal reports the capture as ${capture.status.toLowerCase()}.`, captureId: capture.id }
    default:
      return { status: 'failed', message: `PayPal capture status is ${capture.status.toLowerCase()}.`, captureId: capture.id }
  }
}

const ALREADY_SETTLED: Outcome = {
  status: 'cancelled',
  message: 'This bill was already settled, so this checkout was not completed. Nothing was charged.',
}

function billAlreadySettled(db: Db, p: Payment): boolean {
  const occ = p.occurrenceId ? db.occurrences.find((o) => o.id === p.occurrenceId) : undefined
  return occ !== undefined && isResolved(occ.status)
}

/** Called when the buyer returns from PayPal: capture on the server, then verify. */
export async function capturePayPalPayment(userId: string, paymentId: string, orderIdFromUrl: string | null): Promise<void> {
  const db = await readUserDb(userId)
  const p = db.payments.find((x) => x.id === paymentId)
  if (!p) throw new UserError('Payment not found.')
  // Only a live checkout may be captured: a replaced/cancelled/failed one never is.
  if ((p.status !== 'created' && p.status !== 'pending') || !p.providerOrderId) return
  if (p.status === 'created' && billAlreadySettled(db, p)) {
    await updateUserDb(userId, (d) => applyOutcome(d, p.id, ALREADY_SETTLED))
    return
  }
  if (orderIdFromUrl && orderIdFromUrl !== p.providerOrderId) {
    await updateUserDb(userId, (d) =>
      applyOutcome(d, p.id, { status: 'failed', message: 'The returned PayPal order did not match this payment. Nothing was marked paid.' }),
    )
    return
  }

  let order: paypal.PayPalOrder
  try {
    order = await paypal.captureOrder(p.providerOrderId, `capture-${p.id}`)
  } catch (err) {
    if (err instanceof paypal.PayPalError && err.issue === 'ORDER_ALREADY_CAPTURED') {
      order = await paypal.getOrder(p.providerOrderId)
    } else {
      const outcome: Outcome =
        err instanceof paypal.PayPalError
          ? { status: 'failed', message: `PayPal could not complete the payment: ${err.message}.` }
          : { status: 'pending', message: 'Could not confirm with PayPal yet. Check the status again in a moment.' }
      await updateUserDb(userId, (d) => applyOutcome(d, p.id, outcome))
      return
    }
  }
  const outcome = verifyOrder(order, p, paypalCustomId(userId, p.id))
  await updateUserDb(userId, (d) => applyOutcome(d, p.id, outcome))
}

/** Re-checks a pending PayPal payment with the provider. */
export async function refreshPayment(userId: string, paymentId: string): Promise<void> {
  const db = await readUserDb(userId)
  const p = db.payments.find((x) => x.id === paymentId)
  if (!p) throw new UserError('Payment not found.')
  if (p.provider !== 'paypal_sandbox' || !p.providerOrderId) return
  const order = await paypal.getOrder(p.providerOrderId)
  if (order.status === 'APPROVED') {
    await capturePayPalPayment(userId, p.id, null)
    return
  }
  const outcome = verifyOrder(order, p, paypalCustomId(userId, p.id))
  await updateUserDb(userId, (d) => applyOutcome(d, p.id, outcome))
}

export function cancelCheckout(userId: string, paymentId: string): Promise<void> {
  return updateUserDb(userId, (db) => {
    const p = db.payments.find((x) => x.id === paymentId)
    if (!p || p.status !== 'created') return
    applyOutcome(db, p.id, { status: 'cancelled', message: 'You cancelled the checkout. Nothing was charged.' })
  })
}

/** Simulated provider used when PayPal credentials are not configured. */
export function approveSimulated(userId: string, paymentId: string): Promise<void> {
  return updateUserDb(userId, (db) => {
    const p = db.payments.find((x) => x.id === paymentId)
    if (!p || p.provider !== 'simulated') throw new UserError('Payment not found.')
    if (p.status !== 'created') return
    if (billAlreadySettled(db, p)) {
      applyOutcome(db, p.id, ALREADY_SETTLED)
      return
    }
    const fail = db.profile.demoFailNextCharge
    if (fail) db.profile.demoFailNextCharge = false
    applyOutcome(
      db,
      p.id,
      fail
        ? { status: 'failed', message: 'The simulated provider declined the charge (demo failure switch).' }
        : { status: 'captured', message: 'Simulated provider confirmed the charge; verified on the server.', captureId: newId('simcap') },
    )
  })
}

interface WebhookEvent {
  id: string
  event_type: string
  resource?: paypal.PayPalCapture
}

const WEBHOOK_STATUS: Record<string, Outcome['status']> = {
  'PAYMENT.CAPTURE.COMPLETED': 'captured',
  'PAYMENT.CAPTURE.PENDING': 'pending',
  'PAYMENT.CAPTURE.DENIED': 'failed',
  'PAYMENT.CAPTURE.DECLINED': 'failed',
  'PAYMENT.CAPTURE.REFUNDED': 'refunded',
  'PAYMENT.CAPTURE.REVERSED': 'refunded',
}

/** Applies a signature-verified webhook once (de-duplicated by event id). */
export function applyWebhookEvent(db: Db, event: WebhookEvent, paymentId: string): 'duplicate' | 'ignored' | 'applied' {
  if (db.processedWebhookIds.includes(event.id)) return 'duplicate'
  db.processedWebhookIds.unshift(event.id)
  if (db.processedWebhookIds.length > 500) db.processedWebhookIds.length = 500

  const status = WEBHOOK_STATUS[event.event_type]
  const r = event.resource
  if (!status || !r) return 'ignored'
  const p = db.payments.find((x) => x.id === paymentId)
  if (!p) return 'ignored'
  if (r.amount && (r.amount.value !== p.chargeAmount || r.amount.currency_code !== p.chargeCurrency)) return 'ignored'
  applyOutcome(db, p.id, { status, message: `PayPal webhook ${event.event_type} (signature verified).`, captureId: r.id })
  return 'applied'
}
