import type { Metadata } from 'next'
import { AlertCircle, CheckCircle2, History } from 'lucide-react'
import { LedgerGrid, type LedgerRow } from './ledger-grid'
import { PageHeader } from '@/components/page-header'
import { EmptyState, StatCard } from '@/components/tinku'
import { getData } from '@/lib/data'
import { formatINR } from '@/lib/format'

export const metadata: Metadata = { title: 'Payment history' }

export default async function HistoryPage() {
  const db = await getData()
  const rows: LedgerRow[] = db.payments.map((p) => ({
    id: p.id,
    createdAt: p.createdAt,
    label: p.label,
    payee: p.payee,
    amountInr: p.amountInr,
    charge: `$${p.chargeAmount}`,
    provider: p.provider === 'paypal_sandbox' ? 'PayPal Sandbox' : 'Simulated',
    mode: p.mode === 'autopay' ? 'AutoPay' : 'You approved',
    status: p.status,
  }))
  const verified = db.payments.filter((p) => p.status === 'captured')
  const attention = db.payments.filter((p) => p.status === 'pending' || p.status === 'failed').length
  const totalVerifiedAmount = verified.reduce((s, p) => s + p.amountInr, 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment history"
        description="Comprehensive audit ledger of all transaction attempts, payment methods, and provider verification statuses."
      />

      <div className="grid gap-3 sm:gap-4 sm:grid-cols-3">
        <StatCard
          label="Verified Payments"
          value={verified.length}
          icon={CheckCircle2}
          iconColorClass="text-emerald-600 dark:text-emerald-400"
          iconBgClass="bg-emerald-50 dark:bg-emerald-950/50"
          sublabel={`Total: ${formatINR(totalVerifiedAmount)}`}
        />
        <StatCard
          label="Pending or Failed"
          value={attention}
          icon={AlertCircle}
          iconColorClass={attention ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}
          iconBgClass={attention ? 'bg-amber-50 dark:bg-amber-950/50' : 'bg-muted'}
          sublabel={attention ? 'Review required' : 'All clear'}
        />
        <StatCard
          label="Total Attempts"
          value={db.payments.length}
          icon={History}
          iconColorClass="text-sky-600 dark:text-sky-400"
          iconBgClass="bg-sky-50 dark:bg-sky-950/50"
          sublabel="Including cancelled"
        />
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={History}
          title="No payment records yet"
          description="When you initiate or schedule bill payments through Tinku or PayPal Sandbox, completed and pending transactions will be recorded here."
        />
      ) : (
        <div className="rounded-2xl border border-border bg-card p-1 shadow-sm overflow-hidden">
          <LedgerGrid rows={rows} />
        </div>
      )}
    </div>
  )
}
