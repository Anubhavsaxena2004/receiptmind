export type CategoryId =
  | 'food'
  | 'groceries'
  | 'transport'
  | 'shopping'
  | 'health'
  | 'entertainment'
  | 'rent'
  | 'utilities'
  | 'subscriptions'
  | 'education'
  | 'insurance'
  | 'other'

export interface Profile {
  name: string
  monthlyIncome: number
  /** Day of the month salary usually arrives (1–31). */
  salaryDay: number
  /** Money available right now, entered by the user. Tinku lowers it when expenses/bills are recorded. */
  currentBalance: number
  balanceUpdatedAt: string
  /** Savings kept aside for emergencies. Not spent unless a recovery plan uses it. */
  emergencyReserve: number
  /** Demo switch: the next simulated charge fails, to show failure handling. */
  demoFailNextCharge: boolean
  /** When the user first saved their own income/balance (drives the first-run checklist). */
  setupAt?: string
}

export interface Expense {
  id: string
  title: string
  amount: number
  category: CategoryId
  date: string
  note?: string
  source: 'manual' | 'receipt' | 'bill'
  billId?: string
  createdAt: string
}

export interface Budget {
  category: CategoryId
  limit: number
}

export type Frequency = 'once' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'

/** reminder = notify only · manual = ask before paying · autopay = pay within an approved limit */
export type PaymentMode = 'reminder' | 'manual' | 'autopay'

export interface Bill {
  id: string
  name: string
  payee: string
  amount: number
  category: CategoryId
  essential: boolean
  frequency: Frequency
  mode: PaymentMode
  active: boolean
  createdAt: string
}

/**
 * upcoming   – not due yet
 * due        – needs the user (approve, pay outside, or AutoPay was blocked)
 * processing – a payment is pending with the provider
 * failed     – last payment attempt failed; bill still unpaid
 */
export type OccurrenceStatus =
  | 'upcoming'
  | 'due'
  | 'processing'
  | 'paid'
  | 'paid_outside'
  | 'skipped'
  | 'failed'

export interface Occurrence {
  id: string
  billId: string
  dueDate: string
  amount: number
  status: OccurrenceStatus
  /** Postpone moves only this occurrence's reminder/attempt date. */
  postponedTo?: string
  remindedAt?: string
  dueNotifiedAt?: string
  paymentId?: string
  resolvedAt?: string
  /** Why the occurrence needs attention, shown to the user. */
  note?: string
}

export type MandateStatus = 'active' | 'paused' | 'revoked' | 'expired'

export interface Mandate {
  id: string
  billId: string
  maxAmount: number
  status: MandateStatus
  authorizedAt: string
  expiresOn: string
  provider: 'simulated'
  /** What the user agreed to, when, and as whom. AutoPay always needs this explicit consent. */
  consent?: { at: string; by: string; text: string }
}

export type PaymentStatus = 'created' | 'pending' | 'captured' | 'failed' | 'cancelled' | 'refunded'
export type PaymentProvider = 'paypal_sandbox' | 'simulated'

export interface PaymentEvent {
  at: string
  status: PaymentStatus
  message: string
}

export interface Payment {
  id: string
  occurrenceId?: string
  billId?: string
  label: string
  payee: string
  amountInr: number
  /** Amount actually sent to the provider (USD Sandbox demo charge). */
  chargeAmount: string
  chargeCurrency: 'USD'
  fxRate: number
  provider: PaymentProvider
  mode: 'manual' | 'autopay'
  status: PaymentStatus
  providerOrderId?: string
  providerCaptureId?: string
  approveUrl?: string
  idempotencyKey: string
  createdAt: string
  updatedAt: string
  events: PaymentEvent[]
}

export type NotificationKind = 'reminder' | 'approval' | 'payment' | 'autopay' | 'drill' | 'group' | 'system'

export interface AppNotification {
  id: string
  at: string
  kind: NotificationKind
  title: string
  body: string
  href?: string
  read: boolean
}

export interface GroupMember {
  id: string
  name: string
  isYou?: boolean
}

export interface Group {
  id: string
  name: string
  members: GroupMember[]
  createdAt: string
}

export interface GroupExpense {
  id: string
  groupId: string
  title: string
  amount: number
  paidBy: string
  splitAmong: string[]
  date: string
}

export interface Settlement {
  id: string
  groupId: string
  from: string
  to: string
  amount: number
  date: string
}

export interface DrillRecord {
  id: string
  at: string
  scenarioLabel: string
  horizonDays: number
  passed: boolean
  score: number
  shortfall: number
  lowestBalance: number
  lowestDate: string
  planSteps: string[]
}

export interface ZapierDelivery {
  at: string
  title: string
  ok: boolean
  detail: string
}

/** The user's own Zapier "Catch Hook". Only set after they agree to what gets sent. */
export interface ZapierSettings {
  url: string
  consentAt: string
  log: ZapierDelivery[]
}

export interface Db {
  version: 1
  /** sample = the user chose "Load sample data", so the account shows example records. */
  meta: { createdAt: string; lastSchedulerRun?: string; sample?: boolean }
  profile: Profile
  expenses: Expense[]
  budgets: Budget[]
  bills: Bill[]
  occurrences: Occurrence[]
  mandates: Mandate[]
  payments: Payment[]
  notifications: AppNotification[]
  groups: Group[]
  groupExpenses: GroupExpense[]
  settlements: Settlement[]
  drills: DrillRecord[]
  processedWebhookIds: string[]
  integrations?: { zapier?: ZapierSettings }
}

/** Returned by server actions used with useActionState. */
export interface ActionState {
  error?: string
  message?: string
  duplicateOf?: { title: string; amount: number; date: string }
  /** The action needs a signed-in (or verified) user. The UI offers to log in / verify. */
  needsAuth?: 'login' | 'verify'
  /** Auth actions used inside the login popup report success instead of redirecting. */
  ok?: boolean
}
