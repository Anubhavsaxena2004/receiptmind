import Link from 'next/link'
import {
  ArrowRight,
  CalendarClock,
  CircleCheck,
  Plus,
  ReceiptText,
  ShieldAlert,
  Users,
  Wallet,
} from 'lucide-react'
import { Meter, SectionTitle, StatTile } from '@/components/bits'
import { OccurrenceActions } from '@/components/occurrence-actions'
import { PageHeader } from '@/components/page-header'
import { ModeBadge, OccurrenceBadge } from '@/components/status'
import { Card } from '@/components/ui/card'
import { billViews, needsAction } from '@/lib/bills'
import { getData } from '@/lib/data'
import { monthKey, todayISO } from '@/lib/dates'
import { dueLabel, formatDate, formatDateLong, formatDateTime, formatINR } from '@/lib/format'
import { cn } from '@/lib/utils'

export default async function HomePage() {
  const db = await getData()
  const today = todayISO()
  const month = monthKey(today)

  const views = billViews(db, today)
  const action = needsAction(views)
  const upcoming = views.filter((v) => v.occ && v.occ.status === 'upcoming' && (v.daysLeft ?? 99) <= 14).slice(0, 5)
  const due7 = views.filter((v) => v.occ && (v.daysLeft ?? 99) <= 7 && v.occ.status !== 'processing')
  const due7Total = due7.reduce((s, v) => s + (v.occ?.amount ?? 0), 0)

  const spent = db.expenses.filter((e) => monthKey(e.date) === month).reduce((s, e) => s + e.amount, 0)
  const budget = db.budgets.reduce((s, b) => s + b.limit, 0)
  const lastDrill = db.drills[0]
  const recent = db.notifications.slice(0, 4)

  return (
    <>
      <PageHeader
        title={`Hi ${db.profile.name} 👋`}
        description={`${formatDateLong(today)}. Here’s what needs your attention.`}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Spent this month" value={formatINR(spent)} helper={`of ${formatINR(budget)} budget`}>
          <div className="mt-3">
            <Meter value={spent} max={budget} label="Spent this month against budget" />
          </div>
        </StatTile>
        <StatTile
          label="Due in the next 7 days"
          value={formatINR(due7Total)}
          helper={`${due7.length} bill${due7.length === 1 ? '' : 's'}`}
          icon={CalendarClock}
        />
        <StatTile
          label="Money available"
          value={formatINR(db.profile.currentBalance)}
          helper={
            <Link href="/settings" className="underline-offset-2 hover:underline">
              Update in Settings
            </Link>
          }
          icon={Wallet}
        />
      </div>

      <section className="mt-8">
        <SectionTitle>Needs your action</SectionTitle>
        {action.length === 0 ? (
          <Card className="flex items-center gap-3 p-5">
            <CircleCheck className="size-6 text-success" aria-hidden />
            <div>
              <p className="font-semibold">You’re all caught up</p>
              <p className="text-sm text-muted-foreground">No bills are waiting for you right now.</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {action.map(({ bill, occ, due }) => (
              <Card key={occ!.id} className="p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/bills/${bill.id}`} className="font-semibold hover:underline">
                        {bill.name}
                      </Link>
                      <OccurrenceBadge status={occ!.status} mode={bill.mode} />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground">{formatINR(occ!.amount)}</span> · {dueLabel(due!, today)}
                      {occ!.note ? ` · ${occ!.note}` : ''}
                    </p>
                  </div>
                  <OccurrenceActions occ={occ!} bill={bill} />
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section>
          <SectionTitle
            action={
              <Link href="/bills" className="text-sm font-semibold text-primary hover:underline">
                All bills
              </Link>
            }
          >
            Coming up
          </SectionTitle>
          <Card className="divide-y">
            {upcoming.length === 0 && <p className="p-5 text-sm text-muted-foreground">Nothing due in the next two weeks.</p>}
            {upcoming.map(({ bill, occ, due }) => (
              <Link key={bill.id} href={`/bills/${bill.id}`} className="flex items-center gap-3 p-4 hover:bg-muted/50">
                <div className="flex size-11 shrink-0 flex-col items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                  <span className="text-[10px] leading-none font-bold uppercase">{formatDate(due!).split(' ')[1]}</span>
                  <span className="text-base leading-tight font-bold">{formatDate(due!).split(' ')[0]}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{bill.name}</p>
                  <p className="text-sm text-muted-foreground">{dueLabel(due!, today)}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="font-semibold">{formatINR(occ!.amount)}</span>
                  <ModeBadge mode={bill.mode} />
                </div>
              </Link>
            ))}
          </Card>
        </section>

        <section>
          <SectionTitle>Quick actions</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            {[
              { href: '/expenses/new', label: 'Add expense', icon: Plus },
              { href: '/bills/new', label: 'Add a bill', icon: ReceiptText },
              { href: '/drill', label: 'Run crisis drill', icon: ShieldAlert },
              { href: '/groups', label: 'Split with group', icon: Users },
            ].map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex flex-col gap-3 rounded-2xl border bg-card p-4 transition hover:border-primary/40 hover:shadow-sm"
              >
                <span className="flex size-9 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                  <Icon className="size-[18px]" />
                </span>
                <span className="text-sm font-semibold">{label}</span>
              </Link>
            ))}
          </div>

          <Link
            href="/drill"
            className={cn(
              'mt-3 flex items-center gap-3 rounded-2xl border p-4 transition hover:shadow-sm',
              lastDrill ? 'bg-card' : 'border-primary/30 bg-secondary/60',
            )}
          >
            <ShieldAlert className="size-5 shrink-0 text-primary" aria-hidden />
            <div className="min-w-0 flex-1 text-sm">
              {lastDrill ? (
                <>
                  <p className="font-semibold">Last drill: {lastDrill.passed ? 'passed' : 'ran short'} · {lastDrill.score}/100</p>
                  <p className="truncate text-muted-foreground">{lastDrill.scenarioLabel}</p>
                </>
              ) : (
                <>
                  <p className="font-semibold">Could you handle an emergency?</p>
                  <p className="text-muted-foreground">Run a 1-minute drill on your real bills.</p>
                </>
              )}
            </div>
            <ArrowRight className="size-4 text-muted-foreground" aria-hidden />
          </Link>
        </section>
      </div>

      <section className="mt-8">
        <SectionTitle
          action={
            <Link href="/notifications" className="text-sm font-semibold text-primary hover:underline">
              See all
            </Link>
          }
        >
          Recent updates
        </SectionTitle>
        <Card className="divide-y">
          {recent.length === 0 && <p className="p-5 text-sm text-muted-foreground">No updates yet.</p>}
          {recent.map((n) => (
            <Link key={n.id} href={n.href ?? '/notifications'} className="flex items-start gap-3 p-4 hover:bg-muted/50">
              <span className={cn('mt-1.5 size-2 shrink-0 rounded-full', n.read ? 'bg-border' : 'bg-primary')} aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{n.title}</p>
                <p className="text-sm text-muted-foreground">{n.body}</p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">{formatDateTime(n.at)}</span>
            </Link>
          ))}
        </Card>
      </section>
    </>
  )
}
