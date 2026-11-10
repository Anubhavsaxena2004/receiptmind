import type { Metadata } from 'next'
import { History } from 'lucide-react'
import { LedgerGrid, type LedgerRow } from './ledger-grid'
import { EmptyState, StatTile } from '@/components/bits'
import { PageHeader } from '@/components/page-header'
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

  return (
    <>
      <PageHeader
        title="Payment history"
        description="Every payment attempt and its verified status. Click a row for the full timeline."
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatTile label="Verified payments" value={verified.length} helper={formatINR(verified.reduce((s, p) => s + p.amountInr, 0)) + ' in total'} />
        <StatTile label="Pending or failed" value={attention} helper={attention ? 'Open them to retry or re-check' : 'Nothing needs you'} />
        <StatTile label="All attempts" value={db.payments.length} helper="Including cancelled checkouts" />
      </div>
      {rows.length === 0 ? (
        <EmptyState icon={History} title="No payments yet" body="When you pay a bill through Tinku, it shows up here with its status." />
      ) : (
        <LedgerGrid rows={rows} />
      )}
    </>
  )
}
