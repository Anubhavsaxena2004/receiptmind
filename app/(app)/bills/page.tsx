import type { Metadata } from 'next'
import Link from 'next/link'
import { CalendarClock, CircleCheck, Plus, TriangleAlert } from 'lucide-react'
import { EmptyState, SectionTitle } from '@/components/bits'
import { OccurrenceActions } from '@/components/occurrence-actions'
import { PageHeader } from '@/components/page-header'
import { MODE_INFO, ModeBadge, OccurrenceBadge } from '@/components/status'
import { buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { billViews, isResolved, type BillView } from '@/lib/bills'
import { getData } from '@/lib/data'
import { addDays, todayISO } from '@/lib/dates'
import { FREQUENCY_LABEL, dueLabel, formatDate, formatDateTime, formatINR } from '@/lib/format'
import type { PaymentMode } from '@/lib/types'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Bills' }

function BillCard({ view: { bill, occ, due, mandate }, today }: { view: BillView; today: string }) {
  const late = occ && due && due < today && occ.status !== 'processing'
  const needsAuth = bill.mode === 'autopay' && mandate?.status !== 'active'
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {due ? (
            <div
              className={cn(
                'flex size-12 shrink-0 flex-col items-center justify-center rounded-xl',
                late ? 'bg-danger-soft text-danger' : 'bg-secondary text-secondary-foreground',
              )}
            >
              <span className="text-[10px] leading-none font-bold uppercase">{formatDate(due).split(' ')[1]}</span>
              <span className="text-lg leading-tight font-bold">{formatDate(due).split(' ')[0]}</span>
            </div>
          ) : (
            <div className="size-12 shrink-0 rounded-xl bg-muted" />
          )}
          <div className="min-w-0">
            <Link href={`/bills/${bill.id}`} className="font-semibold hover:underline">
              {bill.name}
            </Link>
            <p className="truncate text-sm text-muted-foreground">
              {formatINR(occ?.amount ?? bill.amount)} · {FREQUENCY_LABEL[bill.frequency]}
              {due && occ ? ` · ${dueLabel(due, today)}` : ''}
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <ModeBadge mode={bill.mode} />
              {occ && <OccurrenceBadge status={occ.status} mode={bill.mode} />}
            </div>
          </div>
        </div>
        <div className="md:max-w-[52%]">
          {needsAuth ? (
            <Link href={`/autopay/new?bill=${bill.id}`} className={buttonVariants({ size: 'sm', variant: 'outline' })}>
              <TriangleAlert className="text-warning" /> Authorize AutoPay
            </Link>
          ) : (
            occ && <OccurrenceActions occ={occ} bill={bill} />
          )}
        </div>
      </div>
      {occ?.note && (occ.status === 'due' || occ.status === 'failed') && (
        <p className="mt-3 rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground">{occ.note}</p>
      )}
    </Card>
  )
}

export default async function BillsPage() {
  const db = await getData()
  const today = todayISO()
  const views = billViews(db, today)
  const late = (v: BillView) =>
    v.occ !== undefined && v.occ.status !== 'processing' && (v.occ.status === 'due' || v.occ.status === 'failed' || (v.due !== undefined && v.due < today))
  const overdue = views.filter(late)
  const upcoming = views.filter((v) => v.occ && !late(v))
  const monthAgo = addDays(today, -30)
  const paid = db.occurrences
    .filter((o) => isResolved(o.status) && o.resolvedAt && o.resolvedAt.slice(0, 10) >= monthAgo)
    .sort((a, b) => (b.resolvedAt ?? '').localeCompare(a.resolvedAt ?? ''))
    .slice(0, 10)
    .map((o) => ({ occ: o, bill: db.bills.find((b) => b.id === o.billId) }))

  return (
    <>
      <PageHeader
        title="Bills"
        description="Overdue first, then what’s coming up and what you’ve paid. For each bill, choose how it gets paid."
        action={
          <Link href="/bills/new" className={buttonVariants({ size: 'lg' })}>
            <Plus /> Add a bill
          </Link>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {(Object.keys(MODE_INFO) as PaymentMode[]).map((m) => {
          const { icon: Icon, label, description } = MODE_INFO[m]
          return (
            <div key={m} className="flex gap-3 rounded-2xl border bg-card p-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                <Icon className="size-[18px]" />
              </span>
              <div>
                <p className="text-sm font-semibold">{label}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
            </div>
          )
        })}
      </div>

      {views.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="No bills yet"
          body="Add rent, electricity, phone or subscriptions. Tinku will remind you, ask you, or pay them for you."
          action={
            <Link href="/bills/new" className={buttonVariants()}>
              <Plus /> Add a bill
            </Link>
          }
        />
      ) : (
        <div className="space-y-8">
          <section aria-labelledby="overdue">
            <SectionTitle>
              <span id="overdue" className="flex items-center gap-2">
                <TriangleAlert className="size-4 text-warning" aria-hidden /> Overdue or needs you · {overdue.length}
              </span>
            </SectionTitle>
            {overdue.length === 0 ? (
              <p className="flex items-center gap-2 rounded-2xl border bg-card p-4 text-sm text-muted-foreground">
                <CircleCheck className="size-4 text-success" aria-hidden /> Nothing overdue. You’re on top of it.
              </p>
            ) : (
              <div className="space-y-3">
                {overdue.map((v) => (
                  <BillCard key={v.bill.id} view={v} today={today} />
                ))}
              </div>
            )}
          </section>

          <section aria-labelledby="upcoming">
            <SectionTitle>
              <span id="upcoming" className="flex items-center gap-2">
                <CalendarClock className="size-4 text-primary" aria-hidden /> Upcoming · {upcoming.length}
              </span>
            </SectionTitle>
            {upcoming.length === 0 ? (
              <p className="rounded-2xl border bg-card p-4 text-sm text-muted-foreground">No upcoming bills.</p>
            ) : (
              <div className="space-y-3">
                {upcoming.map((v) => (
                  <BillCard key={v.bill.id} view={v} today={today} />
                ))}
              </div>
            )}
          </section>

          <section aria-labelledby="paid">
            <SectionTitle
              action={
                <Link href="/history" className="text-sm font-semibold text-primary hover:underline">
                  Payment history
                </Link>
              }
            >
              <span id="paid" className="flex items-center gap-2">
                <CircleCheck className="size-4 text-success" aria-hidden /> Paid in the last 30 days · {paid.length}
              </span>
            </SectionTitle>
            {paid.length === 0 ? (
              <p className="rounded-2xl border bg-card p-4 text-sm text-muted-foreground">Nothing settled in the last 30 days.</p>
            ) : (
              <Card className="divide-y">
                {paid.map(({ occ, bill }) => (
                  <Link
                    key={occ.id}
                    href={occ.paymentId ? `/payments/${occ.paymentId}` : `/bills/${occ.billId}`}
                    className="flex items-center gap-3 p-4 hover:bg-muted/50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{bill?.name ?? 'Bill'}</p>
                      <p className="text-sm text-muted-foreground">
                        Due {formatDate(occ.dueDate)} · settled {formatDateTime(occ.resolvedAt!)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="font-semibold">{formatINR(occ.amount)}</span>
                      <OccurrenceBadge status={occ.status} mode={bill?.mode ?? 'manual'} />
                    </div>
                  </Link>
                ))}
              </Card>
            )}
          </section>
        </div>
      )}
    </>
  )
}
