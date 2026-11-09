import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { CreditCard, Lock } from 'lucide-react'
import { ActionButton } from '@/components/action-button'
import { Notice } from '@/components/bits'
import { PageHeader } from '@/components/page-header'
import { buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { payNow } from '@/lib/actions/bills'
import { effectiveDate, isResolved } from '@/lib/bills'
import { DEMO_INR_PER_USD, paypalConfigured } from '@/lib/config'
import { getData } from '@/lib/data'
import { todayISO } from '@/lib/dates'
import { dueLabel, formatINR, formatUSD } from '@/lib/format'
import { toUsd } from '@/lib/payments'

export const metadata: Metadata = { title: 'Review payment' }

export default async function PayPage({ params }: { params: Promise<{ occurrenceId: string }> }) {
  const { occurrenceId } = await params
  const db = await getData()
  const occ = db.occurrences.find((o) => o.id === occurrenceId)
  if (!occ) notFound()
  const bill = db.bills.find((b) => b.id === occ.billId)
  if (!bill) notFound()
  if (isResolved(occ.status)) redirect(`/bills/${bill.id}`)
  if (occ.status === 'processing' && occ.paymentId) redirect(`/payments/${occ.paymentId}`)

  const usePaypal = paypalConfigured()
  const today = todayISO()
  const rows: [string, React.ReactNode][] = [
    ['Bill', bill.name],
    ['Paid to', bill.payee],
    ['Due', dueLabel(effectiveDate(occ), today)],
    ['Bill amount', <span key="a" className="font-semibold">{formatINR(occ.amount)}</span>],
    [
      usePaypal ? 'PayPal Sandbox charge' : 'Simulated charge',
      <span key="c">
        <span className="font-semibold">{formatUSD(toUsd(occ.amount))} USD</span>
        <span className="block text-xs text-muted-foreground">Demo rate: ₹{DEMO_INR_PER_USD} = $1 · no fees in Sandbox</span>
      </span>,
    ],
    ['Payment method', usePaypal ? 'PayPal (Sandbox test account)' : 'Simulated provider — no PayPal keys set'],
  ]

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="Review payment" description="Check everything before you approve." back={{ href: `/bills/${bill.id}`, label: bill.name }} />
      <Card>
        <dl className="divide-y">
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-start justify-between gap-4 px-5 py-3.5">
              <dt className="text-sm text-muted-foreground">{k}</dt>
              <dd className="text-right text-sm">{v}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <Notice tone="info" className="mt-4" title="Demo payment">
        This is a {usePaypal ? 'PayPal Sandbox' : 'simulated'} test payment, not a real payment to your biller. PayPal India does not support
        domestic Indian bill payments, so real settlement would use a bill-payment partner (future scope).
      </Notice>

      <div className="mt-6 flex flex-wrap items-start gap-2">
        <ActionButton action={payNow} fields={{ occurrenceId: occ.id }} size="lg">
          <CreditCard /> {usePaypal ? 'Continue to PayPal' : 'Continue to simulated checkout'}
        </ActionButton>
        <Link href={`/bills/${bill.id}`} className={buttonVariants({ variant: 'ghost', size: 'lg' })}>
          Cancel
        </Link>
      </div>
      <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Lock className="size-3.5" aria-hidden /> Your bill is marked paid only after Tinku’s server verifies the result with the provider.
      </p>
    </div>
  )
}
