import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PencilLine, Trash2 } from 'lucide-react'
import { ActionButton } from '@/components/action-button'
import { Notice } from '@/components/bits'
import { OccurrenceActions } from '@/components/occurrence-actions'
import { PageHeader } from '@/components/page-header'
import { MODE_INFO, MandateBadge, ModeBadge, OccurrenceBadge, PaymentBadge } from '@/components/status'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { deleteBill } from '@/lib/actions/bills'
import { currentMandate, effectiveDate, isResolved, openOccurrence } from '@/lib/bills'
import { category } from '@/lib/categories'
import { getData } from '@/lib/data'
import { todayISO } from '@/lib/dates'
import { FREQUENCY_LABEL, dueLabel, formatDate, formatDateLong, formatDateTime, formatINR } from '@/lib/format'

export const metadata: Metadata = { title: 'Bill' }

export default async function BillPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ saved?: string }>
}) {
  const { id } = await params
  const sp = await searchParams
  const db = await getData()
  const bill = db.bills.find((b) => b.id === id && b.active)
  if (!bill) notFound()
  const today = todayISO()
  const occ = openOccurrence(db, bill.id)
  const mandate = currentMandate(db, bill.id)
  const history = db.occurrences
    .filter((o) => o.billId === bill.id && isResolved(o.status))
    .sort((a, b) => b.dueDate.localeCompare(a.dueDate))
  const payments = db.payments.filter((p) => p.billId === bill.id)
  const ModeIcon = MODE_INFO[bill.mode].icon

  return (
    <>
      <PageHeader
        title={bill.name}
        description={`${bill.payee} · ${FREQUENCY_LABEL[bill.frequency]} · ${category(bill.category).label}${bill.essential ? ' · Essential' : ''}`}
        back={{ href: '/bills', label: 'Bills' }}
        action={
          <Link href={`/bills/${bill.id}/edit`} className={buttonVariants({ variant: 'outline', size: 'lg' })}>
            <PencilLine /> Edit
          </Link>
        }
      />
      {sp.saved && <Notice tone="success" className="mb-5">Bill saved.</Notice>}

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Next payment" />
          <CardBody>
            {occ ? (
              <>
                <p className="text-3xl font-bold tracking-tight">{formatINR(occ.amount)}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatDateLong(effectiveDate(occ))} · {dueLabel(effectiveDate(occ), today)}
                  {occ.postponedTo && ` · postponed from ${formatDate(occ.dueDate)}`}
                </p>
                <div className="mt-3">
                  <OccurrenceBadge status={occ.status} mode={bill.mode} />
                </div>
                {occ.note && <p className="mt-3 rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground">{occ.note}</p>}
                <div className="mt-5">
                  <OccurrenceActions occ={occ} bill={bill} />
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No upcoming payment. One-time bills close after they’re paid.</p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="How it’s paid" />
          <CardBody>
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                <ModeIcon className="size-5" />
              </span>
              <div>
                <ModeBadge mode={bill.mode} />
                <p className="mt-1.5 text-sm text-muted-foreground">{MODE_INFO[bill.mode].description}</p>
              </div>
            </div>
            {bill.mode === 'autopay' && (
              <div className="mt-4 rounded-xl border p-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">AutoPay authorization</span>
                  <MandateBadge status={mandate?.status ?? 'none'} />
                </div>
                {mandate ? (
                  <p className="mt-1 text-muted-foreground">
                    Up to {formatINR(mandate.maxAmount)} per payment · valid until {formatDate(mandate.expiresOn)}
                  </p>
                ) : (
                  <p className="mt-1 text-muted-foreground">Not authorized yet — Tinku will ask you instead of paying.</p>
                )}
                <Link href={mandate?.status === 'active' || mandate?.status === 'paused' ? '/autopay' : `/autopay/new?bill=${bill.id}`} className="mt-2 inline-block font-semibold text-primary hover:underline">
                  {mandate?.status === 'active' || mandate?.status === 'paused' ? 'Manage AutoPay' : 'Authorize AutoPay'}
                </Link>
              </div>
            )}
            <Link href={`/bills/${bill.id}/edit`} className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">
              Change how it’s paid
            </Link>
          </CardBody>
        </Card>
      </div>

      <Card className="mt-5">
        <CardHeader title="History" description="Past payments for this bill." />
        <CardBody className="pt-3">
          {history.length === 0 && payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing yet.</p>
          ) : (
            <ul className="divide-y">
              {history.map((o) => (
                <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <span className="text-sm">
                    <span className="font-medium">{formatDate(o.dueDate)}</span> · {formatINR(o.amount)}
                  </span>
                  <span className="flex items-center gap-2">
                    <OccurrenceBadge status={o.status} mode={bill.mode} />
                    {o.paymentId && (
                      <Link href={`/payments/${o.paymentId}`} className="text-sm font-semibold text-primary hover:underline">
                        Details
                      </Link>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {payments.length > 0 && (
            <>
              <p className="mt-4 mb-1 text-sm font-semibold">Payment attempts</p>
              <ul className="divide-y">
                {payments.map((p) => (
                  <li key={p.id}>
                    <Link href={`/payments/${p.id}`} className="flex flex-wrap items-center justify-between gap-2 py-3 hover:bg-muted/40">
                      <span className="text-sm">
                        {formatDateTime(p.createdAt)} · {p.mode === 'autopay' ? 'AutoPay' : 'You paid'}
                      </span>
                      <PaymentBadge status={p.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </CardBody>
      </Card>

      <div className="mt-8 border-t pt-6">
        <ActionButton
          action={deleteBill}
          fields={{ id: bill.id }}
          variant="destructive"
          confirm={`Delete “${bill.name}”? Its history stays, AutoPay is cancelled and no more reminders are sent.`}
        >
          <Trash2 /> Delete this bill
        </ActionButton>
      </div>
    </>
  )
}
