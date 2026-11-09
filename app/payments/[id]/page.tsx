import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Ban, CircleCheck, CircleX, CreditCard, Hourglass, RefreshCw, Repeat } from 'lucide-react'
import { ActionButton } from '@/components/action-button'
import { PageHeader } from '@/components/page-header'
import { PAYMENT_STATUS_INFO, PaymentBadge } from '@/components/status'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { refreshPaymentStatus } from '@/lib/actions/bills'
import { isResolved } from '@/lib/bills'
import { getData } from '@/lib/data'
import { formatDateTime, formatINR, formatUSD } from '@/lib/format'
import type { PaymentStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Payment' }

const HERO: Record<PaymentStatus, { title: string; body: string; icon: React.ComponentType<{ className?: string }>; tone: string }> = {
  captured: { title: 'Payment verified', body: 'The provider confirmed it and Tinku checked the amount on the server. Your bill is marked paid.', icon: CircleCheck, tone: 'bg-success-soft text-success' },
  pending: { title: 'Payment pending', body: 'The provider hasn’t confirmed it yet. Your bill stays unpaid until it does — nothing will be charged twice.', icon: Hourglass, tone: 'bg-warning-soft text-warning' },
  failed: { title: 'Payment failed', body: 'Nothing was marked paid. Your bill is still unpaid — you can try again.', icon: CircleX, tone: 'bg-danger-soft text-danger' },
  cancelled: { title: 'Payment cancelled', body: 'You left the checkout. Nothing was charged.', icon: Ban, tone: 'bg-muted text-muted-foreground' },
  created: { title: 'Waiting for your approval', body: 'The checkout was started but not approved yet.', icon: Hourglass, tone: 'bg-muted text-muted-foreground' },
  refunded: { title: 'Payment refunded', body: 'The provider refunded this payment.', icon: Repeat, tone: 'bg-muted text-muted-foreground' },
}

export default async function PaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = await getData()
  const p = db.payments.find((x) => x.id === id)
  if (!p) notFound()
  const occ = p.occurrenceId ? db.occurrences.find((o) => o.id === p.occurrenceId) : undefined
  const canRetry = occ && !isResolved(occ.status) && occ.status !== 'processing' && (p.status === 'failed' || p.status === 'cancelled' || p.status === 'created')
  const hero = HERO[p.status]
  const Icon = hero.icon

  const details: [string, React.ReactNode][] = [
    ['Bill', p.billId ? <Link key="b" href={`/bills/${p.billId}`} className="font-medium text-primary hover:underline">{p.label}</Link> : p.label],
    ['Paid to', p.payee],
    ['Bill amount', formatINR(p.amountInr)],
    ['Charged', `${formatUSD(p.chargeAmount)} ${p.chargeCurrency} (demo rate ₹${p.fxRate} = $1)`],
    ['How', p.mode === 'autopay' ? 'AutoPay (pre-authorized)' : 'Approved by you'],
    ['Provider', p.provider === 'paypal_sandbox' ? 'PayPal Sandbox' : 'Simulated provider'],
    ['Status', <PaymentBadge key="s" status={p.status} />],
  ]
  if (p.providerOrderId) details.push(['PayPal order', <code key="o" className="text-xs">{p.providerOrderId}</code>])
  if (p.providerCaptureId) details.push(['Capture ID', <code key="c" className="text-xs">{p.providerCaptureId}</code>])
  details.push(['Reference', <code key="r" className="text-xs">{p.id}</code>])

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Payment details" back={{ href: '/history', label: 'Payment history' }} />

      <Card className="flex items-start gap-4 p-5">
        <span className={cn('flex size-12 shrink-0 items-center justify-center rounded-2xl', hero.tone)}>
          <Icon className="size-6" />
        </span>
        <div className="min-w-0">
          <p className="text-lg font-semibold">{hero.title}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{hero.body}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {p.status === 'pending' && p.provider === 'paypal_sandbox' && (
              <ActionButton action={refreshPaymentStatus} fields={{ paymentId: p.id }} variant="outline">
                <RefreshCw /> Check status again
              </ActionButton>
            )}
            {canRetry && (
              <Link href={`/pay/${occ.id}`} className={buttonVariants()}>
                <CreditCard /> Try again
              </Link>
            )}
            {p.billId && (
              <Link href={`/bills/${p.billId}`} className={buttonVariants({ variant: 'outline' })}>
                Go to bill
              </Link>
            )}
          </div>
        </div>
      </Card>

      <Card className="mt-5">
        <dl className="divide-y">
          {details.map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-4 px-5 py-3">
              <dt className="text-sm text-muted-foreground">{k}</dt>
              <dd className="text-right text-sm">{v}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card className="mt-5">
        <CardHeader title="Timeline" description="Every step is recorded for your audit trail." />
        <CardBody>
          <ol className="relative space-y-4 border-l pl-5">
            {p.events.map((e, i) => {
              const info = PAYMENT_STATUS_INFO[e.status]
              return (
                <li key={i} className="relative">
                  <span className="absolute top-1.5 -left-[26px] size-2.5 rounded-full border-2 border-card bg-primary" aria-hidden />
                  <p className="text-sm font-medium">{e.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(e.at)} · {info.label}
                  </p>
                </li>
              )
            })}
          </ol>
        </CardBody>
      </Card>
    </div>
  )
}
