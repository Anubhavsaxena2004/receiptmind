import Link from 'next/link'
import {
  ArrowRight,
  CalendarClock,
  CircleCheck,
  CircleDashed,
  Info,
  PiggyBank,
  Plus,
  ReceiptText,
  ShieldAlert,
  Sparkles,
  Users,
  Wallet,
} from 'lucide-react'
import { ActionButton } from '@/components/action-button'
import { Meter, Notice, SectionTitle } from '@/components/bits'
import { OccurrenceActions } from '@/components/occurrence-actions'
import { PageHeader } from '@/components/page-header'
import { SpendingTrend, type TrendPoint } from '@/components/spending-trend'
import { ModeBadge, OccurrenceBadge } from '@/components/status'
import { buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { loadSampleData } from '@/lib/actions/misc'
import { billViews, needsAction } from '@/lib/bills'
import { category } from '@/lib/categories'
import { getData } from '@/lib/data'
import { monthKey, shiftMonthKey, todayISO } from '@/lib/dates'
import { dueLabel, formatDate, formatDateLong, formatDateTime, formatINR } from '@/lib/format'
import { getViewer } from '@/lib/session'
import { cn } from '@/lib/utils'

const shortMonth = (key: string) => new Date(`${key}-01T00:00:00`).toLocaleString('en-IN', { month: 'short' })

export default async function HomePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const [db, viewer, sp] = await Promise.all([getData(), getViewer(), searchParams])
  const guest = viewer.kind === 'guest'
  const today = todayISO()
  const month = monthKey(today)
  const p = db.profile

  const views = billViews(db, today)
  const action = needsAction(views)
  const upcoming = views.filter((v) => v.occ && v.occ.status === 'upcoming' && (v.daysLeft ?? 99) <= 14).slice(0, 5)
  const due7 = views.filter((v) => v.occ && (v.daysLeft ?? 99) <= 7 && v.occ.status !== 'processing')
  const due7Total = due7.reduce((s, v) => s + (v.occ?.amount ?? 0), 0)

  const spent = db.expenses.filter((e) => monthKey(e.date) === month).reduce((s, e) => s + e.amount, 0)
  const budget = db.budgets.reduce((s, b) => s + b.limit, 0)
  const everydayBudget = db.budgets.filter((b) => category(b.category).kind === 'spending').reduce((s, b) => s + b.limit, 0)

  // "Money available" = the balance the person entered, minus what was recorded since.
  const since = db.expenses.filter((e) => e.createdAt > p.balanceUpdatedAt)
  const spentSince = since.reduce((s, e) => s + e.amount, 0)
  const entered = p.currentBalance + spentSince
  const afterBills = p.currentBalance - due7Total

  const trend: TrendPoint[] = Array.from({ length: 6 }, (_, i) => {
    const key = shiftMonthKey(month, i - 5)
    return {
      month: key,
      label: shortMonth(key),
      total: db.expenses.filter((e) => e.source !== 'bill' && monthKey(e.date) === key).reduce((s, e) => s + e.amount, 0),
    }
  })
  const hasTrend = trend.some((t) => t.total > 0)

  const lastDrill = db.drills[0]
  const recent = db.notifications.slice(0, 4)

  // First-run checklist for a brand-new (empty) account.
  const steps = [
    { done: Boolean(p.setupAt), label: 'Set your balance, income and salary day', href: '/settings', cta: 'Open Settings' },
    { done: db.bills.length > 0, label: 'Add your first bill and choose how it’s paid', href: '/bills/new', cta: 'Add a bill' },
    { done: db.expenses.length > 0, label: 'Record an expense (or scan a receipt)', href: '/expenses/new', cta: 'Add expense' },
    { done: db.budgets.length > 0, label: 'Set monthly budgets', href: '/budgets/edit', cta: 'Set budgets' },
    { done: db.drills.length > 0, label: 'Run a crisis drill on your own numbers', href: '/drill', cta: 'Run a drill' },
  ]
  const fresh = !guest && db.bills.length === 0 && db.expenses.length === 0
  const showChecklist = !guest && steps.some((s) => !s.done) && (fresh || db.bills.length + db.expenses.length < 3)

  const quick = [
    { href: '/expenses/new', label: 'Add expense', icon: Plus, tone: 'bg-success-soft text-success' },
    { href: '/bills/new', label: 'Add a bill', icon: ReceiptText, tone: 'bg-secondary text-secondary-foreground' },
    { href: '/budgets', label: 'Check budgets', icon: PiggyBank, tone: 'bg-warning-soft text-warning' },
    { href: '/drill', label: 'Run crisis drill', icon: ShieldAlert, tone: 'bg-danger-soft text-danger' },
    { href: '/groups', label: 'Split with group', icon: Users, tone: 'bg-muted text-foreground' },
  ]

  return (
    <>
      <PageHeader
        title={guest ? `Sample household: ${p.name}’s money` : `Hi ${p.name} 👋`}
        description={`${formatDateLong(today)}. ${action.length ? 'Here’s what needs your attention.' : 'Here’s where things stand.'}`}
      />

      {sp.welcome && !guest && (
        <Notice tone="success" className="mb-5" title="You’re in. This is your own account.">
          It starts empty, so nothing from the sample household was copied. Follow the steps below, or load sample data from Settings → Demo tools to
          try every feature.
        </Notice>
      )}
      {sp.sample && !guest && (
        <Notice tone="success" className="mb-5" title="Sample data loaded into your account">
          Try paying a bill, setting up AutoPay or running a crisis drill. Clear it anytime in Settings → Demo tools.
        </Notice>
      )}
      {sp.deleted && <Notice tone="info" className="mb-5" title="Your account was deleted">Your login and all your data were erased.</Notice>}

      {guest && (
        <Card className="mb-6 overflow-hidden border-primary/25 bg-gradient-to-br from-secondary/80 to-card p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <p className="flex items-center gap-2 text-xs font-bold tracking-wider text-secondary-foreground uppercase">
                <Sparkles className="size-4" aria-hidden /> Explore without an account
              </p>
              <h2 className="mt-2 text-xl font-bold tracking-tight">Track spending, choose how each bill gets paid, and rehearse money emergencies.</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Everything here is sample data. Look around freely: when you want to save something of your own, Tinku asks you to sign up and keeps
                what you typed.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:items-end">
              <Link href="/signup" className={buttonVariants({ size: 'lg' })}>
                Create free account
              </Link>
              <Link href="/drill" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
                <ShieldAlert /> Try the crisis drill
              </Link>
            </div>
          </div>
        </Card>
      )}

      {showChecklist && (
        <Card className="mb-6 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-bold">Let’s set up Tinku</h2>
              <p className="text-sm text-muted-foreground">
                {steps.filter((s) => s.done).length} of {steps.length} done. Each step takes about a minute.
              </p>
            </div>
            {fresh && (
              <ActionButton
                action={loadSampleData}
                fields={{ confirm: 'yes' }}
                variant="outline"
                confirm={{
                  title: 'Fill your account with sample data?',
                  body: 'Adds example bills, expenses, budgets and a group so you can try every feature. You can erase it later in Settings → Demo tools.',
                  confirmLabel: 'Load sample data',
                  tone: 'default',
                }}
              >
                <Sparkles /> Or try with sample data
              </ActionButton>
            )}
          </div>
          <ol className="mt-4 divide-y rounded-xl border">
            {steps.map((s) => (
              <li key={s.label} className="flex items-center gap-3 px-4 py-3">
                {s.done ? (
                  <CircleCheck className="size-5 shrink-0 text-success" aria-label="Done" />
                ) : (
                  <CircleDashed className="size-5 shrink-0 text-muted-foreground" aria-label="To do" />
                )}
                <span className={cn('flex-1 text-sm', s.done && 'text-muted-foreground line-through')}>{s.label}</span>
                {!s.done && (
                  <Link href={s.href} className={buttonVariants({ size: 'sm', variant: 'outline' })}>
                    {s.cta}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </Card>
      )}

      {/* Primary: money available, with how it's worked out */}
      <Card className="p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
              <Wallet className="size-6" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Money available</p>
              <p className={cn('text-4xl font-bold tracking-tight tabular-nums', p.currentBalance < 0 && 'text-danger')}>{formatINR(p.currentBalance)}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                After bills due in the next 7 days:{' '}
                <span className={cn('font-semibold', afterBills < 0 ? 'text-danger' : 'text-foreground')}>{formatINR(afterBills)}</span>
              </p>
            </div>
          </div>
          <details className="group rounded-xl border bg-muted/40 px-4 py-3 text-sm md:max-w-sm">
            <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold">
              <Info className="size-4 text-primary" aria-hidden /> How is this calculated?
            </summary>
            <ul className="mt-2 space-y-1 text-muted-foreground">
              <li>
                {formatINR(entered)} you set on {formatDateTime(p.balanceUpdatedAt)}
              </li>
              <li>
                − {formatINR(spentSince)} in {since.length} expense{since.length === 1 ? '' : 's'} and bill payment{since.length === 1 ? '' : 's'} recorded
                since then
              </li>
              <li className="font-semibold text-foreground">= {formatINR(p.currentBalance)} available now</li>
              <li className="pt-1">
                Your {formatINR(p.emergencyReserve)} emergency reserve is kept separate and isn’t counted.{' '}
                {!guest && (
                  <Link href="/settings" className="font-medium text-primary hover:underline">
                    Update your balance
                  </Link>
                )}
              </li>
            </ul>
          </details>
        </div>
      </Card>

      {/* Secondary: this month and the next 7 days */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Link href="/budgets" className="rounded-2xl border bg-card p-5 transition hover:border-primary/40">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-medium text-muted-foreground">Spent this month</p>
            <PiggyBank className="size-5 text-muted-foreground" aria-hidden />
          </div>
          <p className="mt-1 text-2xl font-bold tracking-tight tabular-nums">{formatINR(spent)}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {budget > 0 ? (spent > budget ? `${formatINR(spent - budget)} over your ${formatINR(budget)} budget` : `${formatINR(budget - spent)} left of ${formatINR(budget)}`) : 'No budget set yet'}
          </p>
          {budget > 0 && (
            <div className="mt-3">
              <Meter value={spent} max={budget} label="Spent this month against budget" />
            </div>
          )}
        </Link>
        <Link href="/bills" className="rounded-2xl border bg-card p-5 transition hover:border-primary/40">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-medium text-muted-foreground">Bills due in the next 7 days</p>
            <CalendarClock className="size-5 text-muted-foreground" aria-hidden />
          </div>
          <p className="mt-1 text-2xl font-bold tracking-tight tabular-nums">{formatINR(due7Total)}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {due7.length === 0 ? 'Nothing due this week' : `${due7.length} bill${due7.length === 1 ? '' : 's'}: ${due7.map((v) => v.bill.name).slice(0, 3).join(', ')}${due7.length > 3 ? '…' : ''}`}
          </p>
        </Link>
      </div>

      {/* Next: what needs the person, with the reason and the action */}
      <section className="mt-8">
        <SectionTitle>Needs your action</SectionTitle>
        {action.length === 0 ? (
          <Card className="flex items-center gap-3 p-5">
            <CircleCheck className="size-6 text-success" aria-hidden />
            <div>
              <p className="font-semibold">You’re all caught up</p>
              <p className="text-sm text-muted-foreground">
                {db.bills.length ? 'No bills are waiting for you right now.' : 'Add a bill and Tinku will tell you here when it needs you.'}
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {action.map(({ bill, occ, due }) => (
              <Card key={occ!.id} className="border-l-4 border-l-warning-fill p-5">
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
                    </p>
                    {occ!.note && <p className="mt-1 text-sm">Why: {occ!.note}</p>}
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
          <div className="space-y-2">
            {quick.map(({ href, label, icon: Icon, tone }) => (
              <Link key={href} href={href} className="flex items-center gap-3 rounded-xl border bg-card p-3 transition hover:border-primary/40 hover:shadow-sm">
                <span className={cn('flex size-9 items-center justify-center rounded-lg', tone)}>
                  <Icon className="size-[18px]" aria-hidden />
                </span>
                <span className="flex-1 text-sm font-semibold">{label}</span>
                <ArrowRight className="size-4 text-muted-foreground" aria-hidden />
              </Link>
            ))}
          </div>
          <Link
            href="/drill"
            className={cn('mt-3 flex items-center gap-3 rounded-2xl border p-4 transition hover:shadow-sm', lastDrill ? 'bg-card' : 'border-primary/30 bg-secondary/60')}
          >
            <ShieldAlert className="size-5 shrink-0 text-primary" aria-hidden />
            <div className="min-w-0 flex-1 text-sm">
              {lastDrill ? (
                <>
                  <p className="font-semibold">
                    Last drill: {lastDrill.passed ? 'passed' : 'ran short'} · {lastDrill.score}/100
                  </p>
                  <p className="truncate text-muted-foreground">{lastDrill.scenarioLabel}</p>
                </>
              ) : (
                <>
                  <p className="font-semibold">Could you handle an emergency?</p>
                  <p className="text-muted-foreground">Run a 1-minute drill on {guest ? 'the sample' : 'your'} bills.</p>
                </>
              )}
            </div>
          </Link>
        </section>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section>
          <SectionTitle
            action={
              <Link href="/expenses" className="text-sm font-semibold text-primary hover:underline">
                Expenses
              </Link>
            }
          >
            Spending trend
          </SectionTitle>
          <Card className="p-5">
            <p className="mb-3 text-sm text-muted-foreground">Day-to-day spending per month (bills not included)</p>
            {hasTrend ? (
              <SpendingTrend points={trend} budget={everydayBudget} />
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">Your trend appears after you record a few expenses.</p>
            )}
          </Card>
        </section>

        <section>
          <SectionTitle
            action={
              <Link href="/notifications" className="text-sm font-semibold text-primary hover:underline">
                See all
              </Link>
            }
          >
            Recent activity
          </SectionTitle>
          <Card className="divide-y">
            {recent.length === 0 && <p className="p-5 text-sm text-muted-foreground">No updates yet.</p>}
            {recent.map((n) => (
              <Link key={n.id} href={n.href ?? '/notifications'} className="flex items-start gap-3 p-4 hover:bg-muted/50">
                <span className={cn('mt-1.5 size-2 shrink-0 rounded-full', n.read ? 'bg-border' : 'bg-primary')} aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{n.title}</p>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{n.body}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{formatDateTime(n.at)}</p>
                </div>
              </Link>
            ))}
          </Card>
        </section>
      </div>
    </>
  )
}
