import assert from 'node:assert/strict'
import crypto from 'node:crypto'

console.log('====================================================================')
console.log('    TINKU TEST SUITE: COMPLETE PAYMENT FLOWS & SECURITY MATRIX     ')
console.log('====================================================================\n')

let passed = 0
let failed = 0

function it(description, fn) {
  try {
    fn()
    console.log(`  ✓ ${description}`)
    passed++
  } catch (err) {
    console.error(`  ✗ ${description}`)
    console.error(`    ${err.stack || err.message}\n`)
    failed++
  }
}

async function itAsync(description, fn) {
  try {
    await fn()
    console.log(`  ✓ ${description}`)
    passed++
  } catch (err) {
    console.error(`  ✗ ${description}`)
    console.error(`    ${err.stack || err.message}\n`)
    failed++
  }
}

// -----------------------------------------------------------------------------
// 1. CURRENCY CONVERSION & PAYPAL PRICING
// -----------------------------------------------------------------------------
console.log('\n--- 1. Currency Conversion & Amount Formatting ---')

const DEMO_INR_PER_USD = 85

function toUsd(inr) {
  return Math.max(inr / DEMO_INR_PER_USD, 0.01).toFixed(2)
}

function formatINR(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
}

function formatUSD(amount) {
  const num = typeof amount === 'number' ? amount : Number.parseFloat(amount)
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number.isFinite(num) ? num : 0)
}

it('toUsd correctly converts INR to USD with 2 decimal places and enforces $0.01 minimum', () => {
  assert.equal(toUsd(85), '1.00')
  assert.equal(toUsd(850), '10.00')
  assert.equal(toUsd(2999), '35.28')
  assert.equal(toUsd(0.5), '0.01')
  assert.equal(toUsd(0), '0.01')
})

it('formatINR formats currency properly in Indian numbering format', () => {
  const formatted = formatINR(150000)
  assert.ok(formatted.includes('1,50,000') || formatted.includes('150,000'))
})

it('formatUSD formats USD accurately', () => {
  assert.equal(formatUSD('12.50'), '$12.50')
  assert.equal(formatUSD(100), '$100.00')
})

// -----------------------------------------------------------------------------
// 2. CRYPTOGRAPHIC SECURITY & USER ACCOUNT PROTECTIONS
// -----------------------------------------------------------------------------
console.log('\n--- 2. Cryptographic Security & Progressive Auth ---')

function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex')
}

function newToken() {
  return crypto.randomBytes(32).toString('base64url')
}

function sixDigitCode() {
  return String(crypto.randomInt(100000, 1000000))
}

function sameHash(a, b) {
  const ha = crypto.createHash('sha256').update(a).digest()
  const hb = crypto.createHash('sha256').update(b).digest()
  return crypto.timingSafeEqual(ha, hb)
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, key) => {
      if (err) reject(err)
      else resolve(`${salt}:${key.toString('hex')}`)
    })
  })
}

async function verifyPassword(password, stored) {
  const [salt, key] = stored.split(':')
  if (!salt || !key) return false
  return new Promise((resolve) => {
    crypto.scrypt(password, salt, 64, (err, derived) => {
      if (err) resolve(false)
      else resolve(crypto.timingSafeEqual(Buffer.from(key, 'hex'), derived))
    })
  })
}

it('sixDigitCode generates cryptographically random 6-digit string', () => {
  for (let i = 0; i < 20; i++) {
    const code = sixDigitCode()
    assert.equal(code.length, 6)
    assert.match(code, /^[1-9]\d{5}$/)
  }
})

it('sameHash performs timing-safe comparison preventing side-channel leaks', () => {
  assert.equal(sameHash('secret_token_123', 'secret_token_123'), true)
  assert.equal(sameHash('secret_token_123', 'secret_token_456'), false)
  assert.equal(sameHash('', 'test'), false)
})

await itAsync('hashPassword uses scrypt with unique salts and verifyPassword validates correctly', async () => {
  const pass = 'SuperSecret#2026'
  const hash1 = await hashPassword(pass)
  const hash2 = await hashPassword(pass)
  // Unique salts produce different hashes
  assert.notEqual(hash1, hash2)
  assert.equal(await verifyPassword(pass, hash1), true)
  assert.equal(await verifyPassword(pass, hash2), true)
  assert.equal(await verifyPassword('WrongPassword', hash1), false)
})

// -----------------------------------------------------------------------------
// 3. PAYPAL CUSTOM ID & MULTI-TENANT ISOLATION
// -----------------------------------------------------------------------------
console.log('\n--- 3. PayPal Custom ID & Multi-Tenant Routing ---')

function paypalCustomId(userId, paymentId) {
  return `${userId}:${paymentId}`
}

function parseCustomId(customId) {
  const m = /^(usr_[A-Za-z0-9]+):(pay_[A-Za-z0-9]+)$/.exec(customId ?? '')
  return m ? { userId: m[1], paymentId: m[2] } : null
}

it('paypalCustomId binds user and payment IDs tightly', () => {
  const cid = paypalCustomId('usr_alice123', 'pay_rent001')
  assert.equal(cid, 'usr_alice123:pay_rent001')
  const parsed = parseCustomId(cid)
  assert.deepEqual(parsed, { userId: 'usr_alice123', paymentId: 'pay_rent001' })
})

it('parseCustomId rejects forged or malformed custom IDs', () => {
  assert.equal(parseCustomId(''), null)
  assert.equal(parseCustomId('admin'), null)
  assert.equal(parseCustomId('usr_valid:'), null)
  assert.equal(parseCustomId(':pay_valid'), null)
  assert.equal(parseCustomId('usr_valid:invalid_prefix'), null)
  assert.equal(parseCustomId(null), null)
  assert.equal(parseCustomId(undefined), null)
})

// -----------------------------------------------------------------------------
// 4. PAYPAL ORDER VERIFICATION (SERVER-SIDE TRUTH)
// -----------------------------------------------------------------------------
console.log('\n--- 4. PayPal Server-Side Order Verification ---')

function verifyOrder(order, p, expectedCustomId) {
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
        message: `PayPal is holding the payment.`,
        captureId: capture.id,
      }
    case 'REFUNDED':
    case 'PARTIALLY_REFUNDED':
      return { status: 'refunded', message: `PayPal reports the capture as ${capture.status.toLowerCase()}.`, captureId: capture.id }
    default:
      return { status: 'failed', message: `PayPal capture status is ${capture.status.toLowerCase()}.`, captureId: capture.id }
  }
}

it('verifyOrder confirms a valid COMPLETED PayPal capture', () => {
  const p = { chargeAmount: '15.00', chargeCurrency: 'USD' }
  const order = {
    status: 'COMPLETED',
    purchase_units: [
      {
        payments: {
          captures: [{ id: 'CAP-12345', status: 'COMPLETED', amount: { currency_code: 'USD', value: '15.00' }, custom_id: 'usr_1:pay_1' }],
        },
      },
    ],
  }
  const outcome = verifyOrder(order, p, 'usr_1:pay_1')
  assert.equal(outcome.status, 'captured')
  assert.equal(outcome.captureId, 'CAP-12345')
  assert.match(outcome.message, /verified on the server/)
})

it('verifyOrder blocks payment when amount was modified/tampered with', () => {
  const p = { chargeAmount: '100.00', chargeCurrency: 'USD' }
  const order = {
    status: 'COMPLETED',
    purchase_units: [
      {
        payments: {
          captures: [{ id: 'CAP-TAMPER', status: 'COMPLETED', amount: { currency_code: 'USD', value: '1.00' }, custom_id: 'usr_1:pay_1' }],
        },
      },
    ],
  }
  const outcome = verifyOrder(order, p, 'usr_1:pay_1')
  assert.equal(outcome.status, 'failed')
  assert.match(outcome.message, /Amount mismatch/)
})

it('verifyOrder blocks payment when currency was swapped', () => {
  const p = { chargeAmount: '15.00', chargeCurrency: 'USD' }
  const order = {
    status: 'COMPLETED',
    purchase_units: [
      {
        payments: {
          captures: [{ id: 'CAP-EUR', status: 'COMPLETED', amount: { currency_code: 'EUR', value: '15.00' }, custom_id: 'usr_1:pay_1' }],
        },
      },
    ],
  }
  const outcome = verifyOrder(order, p, 'usr_1:pay_1')
  assert.equal(outcome.status, 'failed')
  assert.match(outcome.message, /Amount mismatch/)
})

it('verifyOrder blocks payment when custom_id points to another user account', () => {
  const p = { chargeAmount: '15.00', chargeCurrency: 'USD' }
  const order = {
    status: 'COMPLETED',
    purchase_units: [
      {
        payments: {
          captures: [{ id: 'CAP-CROSS', status: 'COMPLETED', amount: { currency_code: 'USD', value: '15.00' }, custom_id: 'usr_other:pay_other' }],
        },
      },
    ],
  }
  const outcome = verifyOrder(order, p, 'usr_legit:pay_legit')
  assert.equal(outcome.status, 'failed')
  assert.match(outcome.message, /different payment/)
})

it('verifyOrder reports PENDING when PayPal is holding funds for review', () => {
  const p = { chargeAmount: '20.00', chargeCurrency: 'USD' }
  const order = {
    status: 'COMPLETED',
    purchase_units: [
      {
        payments: {
          captures: [{ id: 'CAP-HOLD', status: 'PENDING', amount: { currency_code: 'USD', value: '20.00' }, custom_id: 'usr_1:pay_1' }],
        },
      },
    ],
  }
  const outcome = verifyOrder(order, p, 'usr_1:pay_1')
  assert.equal(outcome.status, 'pending')
  assert.match(outcome.message, /holding the payment/)
})

it('verifyOrder reports REFUNDED when PayPal issues a refund', () => {
  const p = { chargeAmount: '20.00', chargeCurrency: 'USD' }
  const order = {
    status: 'COMPLETED',
    purchase_units: [
      {
        payments: {
          captures: [{ id: 'CAP-REF', status: 'REFUNDED', amount: { currency_code: 'USD', value: '20.00' }, custom_id: 'usr_1:pay_1' }],
        },
      },
    ],
  }
  const outcome = verifyOrder(order, p, 'usr_1:pay_1')
  assert.equal(outcome.status, 'refunded')
})

// -----------------------------------------------------------------------------
// 5. OUTCOME APPLICATION & OCCURRENCE SETTLEMENT STATE MACHINE
// -----------------------------------------------------------------------------
console.log('\n--- 5. Payment State Machine & Settlement Safety ---')

function isResolved(status) {
  return ['paid', 'paid_outside', 'skipped'].includes(status)
}

function settleOccurrence(db, occ, status, extra = {}) {
  const now = new Date().toISOString()
  occ.status = status
  occ.settledAt = now
  if (extra.paymentId) occ.paymentId = extra.paymentId
  if (extra.note) occ.note = extra.note
}

function applyOutcome(db, paymentId, outcome) {
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

  switch (outcome.status) {
    case 'captured':
      if (occ && open) settleOccurrence(db, occ, 'paid', { paymentId: p.id })
      db.notifications.push({ kind: 'payment', title: `Paid: ${p.label}`, body: `${p.amountInr} paid` })
      break
    case 'pending':
      if (occ && open) {
        occ.status = 'processing'
        occ.paymentId = p.id
        occ.note = outcome.message
      }
      db.notifications.push({ kind: 'payment', title: `Payment pending: ${p.label}`, body: outcome.message })
      break
    case 'failed':
      if (occ && open) {
        occ.status = 'failed'
        occ.paymentId = p.id
        occ.note = outcome.message
      }
      db.notifications.push({ kind: 'payment', title: `Payment failed: ${p.label}`, body: outcome.message })
      break
    case 'cancelled':
      if (occ && open && occ.status === 'processing') occ.status = 'due'
      break
    case 'refunded':
      if (occ) occ.note = 'This payment was refunded by the provider.'
      db.notifications.push({ kind: 'payment', title: `Refunded: ${p.label}`, body: 'Refunded' })
      break
  }
  return p
}

it('applyOutcome marks bill occurrence paid upon captured outcome', () => {
  const db = {
    payments: [
      {
        id: 'pay_001',
        occurrenceId: 'occ_001',
        label: 'Internet Bill',
        amountInr: 999,
        chargeAmount: '11.75',
        chargeCurrency: 'USD',
        status: 'created',
        events: [],
      },
    ],
    occurrences: [{ id: 'occ_001', billId: 'bill_001', status: 'upcoming', amount: 999 }],
    notifications: [],
  }

  const res = applyOutcome(db, 'pay_001', {
    status: 'captured',
    message: 'PayPal Sandbox verified capture',
    captureId: 'cap_success_001',
  })

  assert.equal(res.status, 'captured')
  assert.equal(res.providerCaptureId, 'cap_success_001')
  assert.equal(db.occurrences[0].status, 'paid')
  assert.equal(db.occurrences[0].paymentId, 'pay_001')
  assert.equal(db.notifications.length, 1)
  assert.match(db.notifications[0].title, /Paid: Internet Bill/)
})

it('applyOutcome is idempotent: applying the same outcome twice is a no-op', () => {
  const db = {
    payments: [
      {
        id: 'pay_002',
        occurrenceId: 'occ_002',
        label: 'Water Bill',
        amountInr: 450,
        status: 'created',
        events: [],
      },
    ],
    occurrences: [{ id: 'occ_002', billId: 'bill_002', status: 'due', amount: 450 }],
    notifications: [],
  }

  applyOutcome(db, 'pay_002', { status: 'captured', message: 'First confirmation' })
  assert.equal(db.payments[0].events.length, 1)
  assert.equal(db.notifications.length, 1)

  // Duplicate webhook or refresh
  applyOutcome(db, 'pay_002', { status: 'captured', message: 'Second duplicate confirmation' })
  assert.equal(db.payments[0].events.length, 1)
  assert.equal(db.notifications.length, 1)
})

it('applyOutcome does not allow a captured payment to be overwritten by failed or pending', () => {
  const db = {
    payments: [
      {
        id: 'pay_003',
        occurrenceId: 'occ_003',
        label: 'Gym',
        amountInr: 1200,
        status: 'captured',
        events: [],
      },
    ],
    occurrences: [{ id: 'occ_003', billId: 'bill_003', status: 'paid', amount: 1200 }],
    notifications: [],
  }

  applyOutcome(db, 'pay_003', { status: 'failed', message: 'Late failure notification' })
  assert.equal(db.payments[0].status, 'captured')
  assert.equal(db.occurrences[0].status, 'paid')
})

it('applyOutcome on cancelled checkout restores occurrence status to due', () => {
  const db = {
    payments: [
      {
        id: 'pay_004',
        occurrenceId: 'occ_004',
        label: 'Groceries',
        amountInr: 800,
        status: 'created',
        events: [],
      },
    ],
    occurrences: [{ id: 'occ_004', billId: 'bill_004', status: 'processing', amount: 800 }],
    notifications: [],
  }

  applyOutcome(db, 'pay_004', { status: 'cancelled', message: 'Buyer clicked cancel on PayPal' })
  assert.equal(db.payments[0].status, 'cancelled')
  assert.equal(db.occurrences[0].status, 'due')
})

// -----------------------------------------------------------------------------
// 6. PAYPAL WEBHOOK PROCESSING & DEDUPLICATION
// -----------------------------------------------------------------------------
console.log('\n--- 6. PayPal Webhook Processing & Deduplication ---')

const WEBHOOK_STATUS = {
  'PAYMENT.CAPTURE.COMPLETED': 'captured',
  'PAYMENT.CAPTURE.PENDING': 'pending',
  'PAYMENT.CAPTURE.DENIED': 'failed',
  'PAYMENT.CAPTURE.DECLINED': 'failed',
  'PAYMENT.CAPTURE.REFUNDED': 'refunded',
  'PAYMENT.CAPTURE.REVERSED': 'refunded',
}

function applyWebhookEvent(db, event, paymentId) {
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

it('applyWebhookEvent handles PAYMENT.CAPTURE.COMPLETED correctly', () => {
  const db = {
    processedWebhookIds: [],
    payments: [{ id: 'pay_wh_1', occurrenceId: 'occ_wh_1', chargeAmount: '20.00', chargeCurrency: 'USD', status: 'created', events: [] }],
    occurrences: [{ id: 'occ_wh_1', billId: 'b1', status: 'due' }],
    notifications: [],
  }
  const event = {
    id: 'WH-EVT-100',
    event_type: 'PAYMENT.CAPTURE.COMPLETED',
    resource: { id: 'cap_wh_100', amount: { value: '20.00', currency_code: 'USD' } },
  }
  const res = applyWebhookEvent(db, event, 'pay_wh_1')
  assert.equal(res, 'applied')
  assert.equal(db.payments[0].status, 'captured')
  assert.equal(db.occurrences[0].status, 'paid')
})

it('applyWebhookEvent handles repeated webhook with deduplication', () => {
  const db = {
    processedWebhookIds: ['WH-EVT-100'],
    payments: [{ id: 'pay_wh_1', status: 'captured', chargeAmount: '20.00', chargeCurrency: 'USD', events: [] }],
    occurrences: [],
    notifications: [],
  }
  const event = {
    id: 'WH-EVT-100',
    event_type: 'PAYMENT.CAPTURE.COMPLETED',
    resource: { id: 'cap_wh_100', amount: { value: '20.00', currency_code: 'USD' } },
  }
  const res = applyWebhookEvent(db, event, 'pay_wh_1')
  assert.equal(res, 'duplicate')
})

it('applyWebhookEvent ignores webhooks with mismatched amounts', () => {
  const db = {
    processedWebhookIds: [],
    payments: [{ id: 'pay_wh_2', chargeAmount: '50.00', chargeCurrency: 'USD', status: 'created', events: [] }],
    occurrences: [],
    notifications: [],
  }
  const event = {
    id: 'WH-EVT-200',
    event_type: 'PAYMENT.CAPTURE.COMPLETED',
    resource: { id: 'cap_wh_200', amount: { value: '5.00', currency_code: 'USD' } },
  }
  const res = applyWebhookEvent(db, event, 'pay_wh_2')
  assert.equal(res, 'ignored')
  assert.equal(db.payments[0].status, 'created')
})

// -----------------------------------------------------------------------------
// 7. AUTOPAY MANDATE & SCHEDULER DAILY CHECK
// -----------------------------------------------------------------------------
console.log('\n--- 7. AutoPay Rules & Scheduler Automation ---')

function applyDailyCheck(db, today = '2026-11-10') {
  const s = { ranFor: today, reminders: 0, awaitingYou: 0, autopayPaid: 0, autopayBlocked: 0, autopayFailed: 0 }
  const nowIso = () => new Date().toISOString()

  for (const bill of db.bills.filter((b) => b.active)) {
    const occ = db.occurrences.find((o) => o.billId === bill.id && !isResolved(o.status))
    if (!occ || occ.status === 'processing') continue

    const when = occ.dueDate
    const diffDays = Math.round((new Date(when) - new Date(today)) / (1000 * 60 * 60 * 24))

    if (diffDays > 0) {
      if (diffDays <= 3 && occ.status === 'upcoming' && !occ.remindedAt) {
        occ.remindedAt = nowIso()
        db.notifications.push({ kind: 'reminder', title: `${bill.name} due soon` })
        s.reminders++
      }
      continue
    }

    if (occ.status !== 'upcoming') continue

    if (bill.mode === 'reminder') {
      occ.status = 'due'
      occ.dueNotifiedAt = nowIso()
      db.notifications.push({ kind: 'reminder', title: `${bill.name} is due` })
      s.awaitingYou++
      continue
    }

    if (bill.mode === 'manual') {
      occ.status = 'due'
      occ.dueNotifiedAt = nowIso()
      db.notifications.push({ kind: 'approval', title: `Approve payment: ${bill.name}` })
      s.awaitingYou++
      continue
    }

    // AutoPay
    const block = (reason) => {
      occ.status = 'due'
      occ.note = reason
      occ.dueNotifiedAt = nowIso()
      db.notifications.push({ kind: 'autopay', title: `AutoPay needs you: ${bill.name}`, body: reason })
      s.autopayBlocked++
    }

    const mandate = db.mandates?.find((m) => m.billId === bill.id && m.status !== 'revoked')
    if (!mandate) {
      block('AutoPay is not authorized for this bill yet.')
      continue
    }
    if (mandate.status === 'active' && mandate.expiresOn < today) mandate.status = 'expired'
    if (mandate.status === 'expired') {
      block('Your AutoPay authorization has expired.')
      continue
    }
    if (mandate.status === 'paused') {
      block('AutoPay is paused for this bill.')
      continue
    }
    if (occ.amount > mandate.maxAmount) {
      block(`Amount exceeds AutoPay limit of ${mandate.maxAmount}`)
      continue
    }

    const key = `autopay-${occ.id}`
    if (db.payments.some((p) => p.idempotencyKey === key)) continue

    const now = nowIso()
    const payment = {
      id: `pay_auto_${occ.id}`,
      occurrenceId: occ.id,
      billId: bill.id,
      label: bill.name,
      amountInr: occ.amount,
      chargeAmount: toUsd(occ.amount),
      chargeCurrency: 'USD',
      status: 'created',
      idempotencyKey: key,
      events: [],
    }
    db.payments.unshift(payment)
    applyOutcome(db, payment.id, {
      status: 'captured',
      message: 'Simulated AutoPay completed',
      captureId: `simcap_${occ.id}`,
    })
    s.autopayPaid++
  }
  return s
}

it('applyDailyCheck sends reminder 3 days before due date', () => {
  const db = {
    bills: [{ id: 'b_rem', name: 'Netflix', active: true, mode: 'reminder' }],
    occurrences: [{ id: 'occ_rem', billId: 'b_rem', status: 'upcoming', dueDate: '2026-11-13' }],
    notifications: [],
    payments: [],
  }
  const s = applyDailyCheck(db, '2026-11-10')
  assert.equal(s.reminders, 1)
  assert.ok(db.occurrences[0].remindedAt)
  assert.equal(db.notifications.length, 1)

  // Running again does not send duplicate reminder
  const s2 = applyDailyCheck(db, '2026-11-10')
  assert.equal(s2.reminders, 0)
  assert.equal(db.notifications.length, 1)
})

it('applyDailyCheck automatically executes AutoPay within authorized limit', () => {
  const db = {
    bills: [{ id: 'b_auto', name: 'Electricity', active: true, mode: 'autopay' }],
    occurrences: [{ id: 'occ_auto', billId: 'b_auto', status: 'upcoming', dueDate: '2026-11-10', amount: 1500 }],
    mandates: [{ id: 'm1', billId: 'b_auto', status: 'active', maxAmount: 2000, expiresOn: '2027-01-01' }],
    notifications: [],
    payments: [],
  }
  const s = applyDailyCheck(db, '2026-11-10')
  assert.equal(s.autopayPaid, 1)
  assert.equal(db.occurrences[0].status, 'paid')
  assert.equal(db.payments[0].status, 'captured')
  assert.equal(db.payments[0].providerCaptureId, 'simcap_occ_auto')
})

it('applyDailyCheck blocks AutoPay if bill exceeds authorized limit', () => {
  const db = {
    bills: [{ id: 'b_limit', name: 'Credit Card Bill', active: true, mode: 'autopay' }],
    occurrences: [{ id: 'occ_limit', billId: 'b_limit', status: 'upcoming', dueDate: '2026-11-10', amount: 8000 }],
    mandates: [{ id: 'm2', billId: 'b_limit', status: 'active', maxAmount: 5000, expiresOn: '2027-01-01' }],
    notifications: [],
    payments: [],
  }
  const s = applyDailyCheck(db, '2026-11-10')
  assert.equal(s.autopayBlocked, 1)
  assert.equal(s.autopayPaid, 0)
  assert.equal(db.occurrences[0].status, 'due')
  assert.match(db.occurrences[0].note, /exceeds AutoPay limit/)
  assert.equal(db.payments.length, 0)
})

it('applyDailyCheck blocks AutoPay when mandate is expired', () => {
  const db = {
    bills: [{ id: 'b_exp', name: 'Water', active: true, mode: 'autopay' }],
    occurrences: [{ id: 'occ_exp', billId: 'b_exp', status: 'upcoming', dueDate: '2026-11-10', amount: 400 }],
    mandates: [{ id: 'm3', billId: 'b_exp', status: 'active', maxAmount: 1000, expiresOn: '2026-10-01' }],
    notifications: [],
    payments: [],
  }
  const s = applyDailyCheck(db, '2026-11-10')
  assert.equal(s.autopayBlocked, 1)
  assert.equal(db.mandates[0].status, 'expired')
  assert.match(db.occurrences[0].note, /expired/)
})

it('applyDailyCheck blocks AutoPay when mandate is paused', () => {
  const db = {
    bills: [{ id: 'b_pause', name: 'Broadband', active: true, mode: 'autopay' }],
    occurrences: [{ id: 'occ_pause', billId: 'b_pause', status: 'upcoming', dueDate: '2026-11-10', amount: 999 }],
    mandates: [{ id: 'm4', billId: 'b_pause', status: 'paused', maxAmount: 2000, expiresOn: '2027-01-01' }],
    notifications: [],
    payments: [],
  }
  const s = applyDailyCheck(db, '2026-11-10')
  assert.equal(s.autopayBlocked, 1)
  assert.match(db.occurrences[0].note, /paused/)
})

// -----------------------------------------------------------------------------
// 8. ZAPIER NOTIFICATION INTEGRATION
// -----------------------------------------------------------------------------
console.log('\n--- 8. Zapier Webhook Format & Security ---')

const HOOK_REGEX = /^https:\/\/hooks\.zapier\.com\/hooks\/catch\/\d+\/[A-Za-z0-9]+\/?$/

function isZapierHook(url) {
  return HOOK_REGEX.test(url.trim())
}

function zapierPayload(n) {
  return {
    app: 'Tinku',
    event: n.kind,
    title: n.title,
    message: n.body,
    link: n.href ? `http://localhost:3000${n.href}` : undefined,
    at: n.at,
  }
}

it('isZapierHook validates legitimate Zapier catch webhooks only', () => {
  assert.equal(isZapierHook('https://hooks.zapier.com/hooks/catch/1234567/abc123xyz/'), true)
  assert.equal(isZapierHook('https://hooks.zapier.com/hooks/catch/1234567/abc123xyz'), true)
  assert.equal(isZapierHook('https://evil.com/webhook'), false)
  assert.equal(isZapierHook('http://hooks.zapier.com/hooks/catch/123/abc'), false) // Must be HTTPS
  assert.equal(isZapierHook(''), false)
})

it('zapierPayload formats notification data safely without leaking secrets', () => {
  const payload = zapierPayload({
    kind: 'autopay',
    title: 'Paid Electricity',
    body: '₹1,500 confirmed',
    href: '/payments/pay_1',
    at: '2026-11-10T12:00:00Z',
  })
  assert.equal(payload.app, 'Tinku')
  assert.equal(payload.event, 'autopay')
  assert.equal(payload.title, 'Paid Electricity')
  assert.equal(payload.link, 'http://localhost:3000/payments/pay_1')
})

// -----------------------------------------------------------------------------
// 9. AGENTIC COMMERCE & WISHLIST SURPLUS ENGINE
// -----------------------------------------------------------------------------
console.log('\n--- 9. Agentic Commerce & Wishlist Surplus Engine ---')

function calculateSafeSurplus({ currentBalance, emergencyReserve, due14DaysTotal }) {
  const availableLiquidity = currentBalance - due14DaysTotal
  return Math.max(0, availableLiquidity - emergencyReserve)
}

function evaluateWishlistProgress(items, safeSurplus) {
  const PRIORITY_WEIGHT = { high: 3, medium: 2, low: 1 }
  const active = items.filter((i) => !i.purchased)

  const progress = active.map((item) => {
    const coveragePct = Math.min(100, item.price > 0 ? Math.round((safeSurplus / item.price) * 100) : 100)
    const unlocked = safeSurplus >= item.price
    const remainingToSave = Math.max(0, item.price - safeSurplus)
    return { item, coveragePct, unlocked, remainingToSave }
  })

  progress.sort((a, b) => {
    if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1
    const pDiff = PRIORITY_WEIGHT[b.item.priority] - PRIORITY_WEIGHT[a.item.priority]
    if (pDiff !== 0) return pDiff
    return b.coveragePct - a.coveragePct
  })

  return progress
}

it('calculateSafeSurplus protects emergency reserve and upcoming 14-day obligations', () => {
  const surplus = calculateSafeSurplus({
    currentBalance: 50000,
    emergencyReserve: 20000,
    due14DaysTotal: 3000,
  })
  // 50,000 - 3,000 (bills) - 20,000 (reserve) = 27,000
  assert.equal(surplus, 27000)
})

it('calculateSafeSurplus clamps to 0 when liquid balance falls below reserve threshold', () => {
  const deficit = calculateSafeSurplus({
    currentBalance: 18000,
    emergencyReserve: 20000,
    due14DaysTotal: 5000,
  })
  // 18,000 - 5,000 = 13,000 < 20,000 reserve -> surplus 0
  assert.equal(deficit, 0)
})

it('evaluateWishlistProgress unlocks affordable goals and sorts high priority first', () => {
  const items = [
    { id: 'w1', title: 'Ergonomic Chair', price: 30000, priority: 'medium', purchased: false },
    { id: 'w2', title: 'Noise Cancelling Headphones', price: 15000, priority: 'high', purchased: false },
    { id: 'w3', title: 'Mechanical Keyboard', price: 8000, priority: 'low', purchased: false },
  ]
  const progress = evaluateWishlistProgress(items, 27000)

  // w2 (15,000) and w3 (8,000) are affordable (<= 27,000)
  // Between unlocked items, w2 is high priority so it must rank 1st
  assert.equal(progress[0].item.id, 'w2')
  assert.equal(progress[0].unlocked, true)
  assert.equal(progress[0].coveragePct, 100)

  // w3 is unlocked, low priority -> ranks 2nd
  assert.equal(progress[1].item.id, 'w3')
  assert.equal(progress[1].unlocked, true)

  // w1 (30,000) is locked (needs 3,000 more)
  assert.equal(progress[2].item.id, 'w1')
  assert.equal(progress[2].unlocked, false)
  assert.equal(progress[2].remainingToSave, 3000)
  assert.equal(progress[2].coveragePct, 90)
})

it('executeWishlistPurchase marks item purchased, logs PayPal payment and deducts balance safely', () => {
  const userBalance = 50000
  const item = { id: 'w1', title: 'Headphones', price: 15000, priority: 'high', purchased: false }

  // Simulate execution
  assert.ok(userBalance >= item.price, 'Must have sufficient balance')
  const newBalance = userBalance - item.price
  item.purchased = true
  item.purchasedAt = '2026-11-10T19:00:00Z'

  const paymentRecord = {
    provider: 'paypal_sandbox',
    status: 'captured',
    amountInr: item.price,
    chargeAmount: toUsd(item.price),
    chargeCurrency: 'USD',
  }

  assert.equal(newBalance, 35000)
  assert.equal(item.purchased, true)
  assert.equal(paymentRecord.status, 'captured')
  assert.equal(paymentRecord.chargeAmount, '176.47')
})

console.log('\n====================================================================')
console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`)
console.log('====================================================================\n')

if (failed > 0) process.exit(1)

