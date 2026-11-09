import type { Metadata } from 'next'
import Link from 'next/link'
import { CalendarClock, Plus, TriangleAlert } from 'lucide-react'
import { EmptyState } from '@/components/bits'
import { OccurrenceActions } from '@/components/occurrence-actions'
import { PageHeader } from '@/components/page-header'
import { MODE_INFO, ModeBadge, OccurrenceBadge } from '@/components/status'
import { buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { billViews } from '@/lib/bills'
import { getData } from '@/lib/data'
import { todayISO } from '@/lib/dates'
import { FREQUENCY_LABEL, dueLabel, formatDate, formatINR } from '@/lib/format'
import type { PaymentMode } from '@/lib/types'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Bills' }

export default async function BillsPage() {
  const db = await getData()
  const today = todayISO()
  const views = billViews(db, today)

  return (
    <>
      <PageHeader
        title="Bills"
        description="Your regular payments, soonest first. For each bill, choose how it gets paid."
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
        <div className="space-y-3">
          {views.map(({ bill, occ, due, mandate }) => {
            const late = occ && due && due < today && occ.status !== 'processing'
            const needsAuth = bill.mode === 'autopay' && mandate?.status !== 'active'
            return (
              <Card key={bill.id} className="p-4 sm:p-5">
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
          })}
        </div>
      )}
    </>
  )
}
