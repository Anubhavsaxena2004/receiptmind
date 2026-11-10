import type { Metadata } from 'next'
import Link from 'next/link'
import { CalendarClock, CircleCheck, Plus, TriangleAlert } from 'lucide-react'
import { Notice } from '@/components/bits'
import { OccurrenceActions } from '@/components/occurrence-actions'
import { PageHeader } from '@/components/page-header'
import { MODE_INFO, ModeBadge, OccurrenceBadge } from '@/components/status'
import { buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmptyState, SectionHeader } from '@/components/tinku'
import { billViews, isResolved, type BillView } from '@/lib/bills'
import { getData } from '@/lib/data'
import { addDays, todayISO } from '@/lib/dates'
import { FREQUENCY_LABEL, dueLabel, formatDate, formatDateTime, formatINR } from '@/lib/format'
import type { PaymentMode } from '@/lib/types'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Bills' }

function BillItemCard({ view: { bill, occ, due, mandate }, today }: { view: BillView; today: string }) {
  const late = occ && due && due < today && occ.status !== 'processing'
  const needsAuth = bill.mode === 'autopay' && mandate?.status !== 'active'
  const amount = occ?.amount ?? bill.amount

  return (
    <Card className={cn('p-4 sm:p-5 border-border bg-card shadow-xs transition-all hover:shadow-sm', late && 'border-l-4 border-l-danger')}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {due ? (
            <div
              className={cn(
                'flex size-12 shrink-0 flex-col items-center justify-center rounded-xl border',
                late
                  ? 'border-danger/40 bg-danger-soft text-danger'
                  : 'border-border bg-secondary text-secondary-foreground',
              )}
            >
              <span className="text-[10px] leading-none font-bold uppercase">{formatDate(due).split(' ')[1]}</span>
              <span className="text-lg leading-tight font-extrabold">{formatDate(due).split(' ')[0]}</span>
            </div>
          ) : (
            <div className="size-12 shrink-0 rounded-xl bg-muted border border-border" />
          )}
          <div className="min-w-0">
            <Link href={`/bills/${bill.id}`} className="font-bold text-base text-foreground hover:text-primary transition-colors">
              {bill.name}
            </Link>
            <p className="truncate text-sm text-muted-foreground">
              <span className="font-semibold text-foreground tabular-nums">{formatINR(amount)}</span> · {FREQUENCY_LABEL[bill.frequency]}
              {due && occ ? ` · ${dueLabel(due, today)}` : ''}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <ModeBadge mode={bill.mode} />
              {occ && <OccurrenceBadge status={occ.status} mode={bill.mode} />}
            </div>
          </div>
        </div>
        <div className="md:max-w-[52%] shrink-0">
          {needsAuth ? (
            <Link href={`/autopay/new?bill=${bill.id}`} className={cn(buttonVariants({ size: 'sm', variant: 'outline' }), 'font-semibold gap-1.5')}>
              <TriangleAlert className="size-4 text-warning" /> Authorize AutoPay
            </Link>
          ) : (
            occ && <OccurrenceActions occ={occ} bill={bill} />
          )}
        </div>
      </div>
      {occ?.note && (occ.status === 'due' || occ.status === 'failed') && (
        <p className="mt-3 rounded-xl border border-warning/30 bg-warning-soft px-3 py-2 text-xs font-medium text-warning">
          {occ.note}
        </p>
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
    <div className="space-y-6">
      <PageHeader
        title="Bills"
        description="Overdue first, then what’s coming up and what you’ve paid. For each bill, choose how it gets paid."
        action={
          <Link href="/bills/new" className={cn(buttonVariants({ size: 'lg', variant: 'default' }), 'gap-1.5 font-semibold shadow-sm')}>
            <Plus className="size-4 stroke-[2.5]" /> Add a bill
          </Link>
        }
      />

      {/* Payment Modes Info Grid */}
      <div className="grid gap-3 sm:grid-cols-3">
        {(Object.keys(MODE_INFO) as PaymentMode[]).map((m) => {
          const { icon: Icon, label, description } = MODE_INFO[m]
          return (
            <div key={m} className="flex gap-3 rounded-2xl border border-border bg-card p-4 shadow-2xs">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary border border-primary/20">
                <Icon className="size-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
              </div>
            </div>
          )
        })}
      </div>

      {views.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="No bills configured yet"
          description="Track recurring rent, electricity, mobile, and broadband bills. Tinku reminds you, requests your approval, or pays automatically."
          action={{
            label: 'Add a bill',
            href: '/bills/new',
          }}
        />
      ) : (
        <div className="space-y-8">
          {/* Overdue / Action Needed */}
          <section aria-labelledby="overdue" className="space-y-3">
            <SectionHeader
              title="Overdue or needs attention"
              count={overdue.length}
            />
            {overdue.length === 0 ? (
              <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground shadow-2xs">
                <CircleCheck className="size-4 text-success" aria-hidden="true" /> Nothing overdue. All bills are on schedule.
              </div>
            ) : (
              <div className="space-y-3">
                {overdue.map((v) => (
                  <BillItemCard key={v.bill.id} view={v} today={today} />
                ))}
              </div>
            )}
          </section>

          {/* Upcoming Bills */}
          <section aria-labelledby="upcoming" className="space-y-3">
            <SectionHeader
              title="Upcoming Bills"
              count={upcoming.length}
            />
            {upcoming.length === 0 ? (
              <p className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground shadow-2xs">
                No upcoming bills in the next 14 days.
              </p>
            ) : (
              <div className="space-y-3">
                {upcoming.map((v) => (
                  <BillItemCard key={v.bill.id} view={v} today={today} />
                ))}
              </div>
            )}
          </section>

          {/* Paid in last 30 days */}
          <section aria-labelledby="paid" className="space-y-3">
            <SectionHeader
              title="Paid in the last 30 days"
              count={paid.length}
              viewAllHref="/history"
              viewAllLabel="Payment history"
            />
            {paid.length === 0 ? (
              <p className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground shadow-2xs">
                Nothing settled in the last 30 days.
              </p>
            ) : (
              <Card className="divide-y divide-border border-border bg-card shadow-xs overflow-hidden">
                {paid.map(({ occ, bill }) => (
                  <Link
                    key={occ.id}
                    href={occ.paymentId ? `/payments/${occ.paymentId}` : `/bills/${occ.billId}`}
                    className="flex items-center gap-3 p-4 hover:bg-muted/40 transition-colors group"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                        {bill?.name ?? 'Bill'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Due {formatDate(occ.dueDate)} · settled {formatDateTime(occ.resolvedAt!)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="font-bold text-sm tabular-nums text-foreground">{formatINR(occ.amount)}</span>
                      <OccurrenceBadge status={occ.status} mode={bill?.mode ?? 'manual'} />
                    </div>
                  </Link>
                ))}
              </Card>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
