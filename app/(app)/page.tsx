import Link from 'next/link'
import {
  AlertCircle,
  ArrowRight,
  CalendarClock,
  CircleCheck,
  CircleDashed,
  Info,
  Layers,
  PiggyBank,
  Plus,
  ReceiptText,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react'
import { ActionButton } from '@/components/action-button'
import { Notice } from '@/components/bits'
import { OccurrenceActions } from '@/components/occurrence-actions'
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
  const upcoming = views.filter((v) => v.occ && v.occ.status === 'upcoming' && (v.daysLeft ?? 99) <= 14).slice(0, 6)
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
  const monthlyIncome = p.monthlyIncome || entered
  const netMonthly = Math.max(0, monthlyIncome - spent)

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

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Welcome! Here’s your financial overview · {formatDateLong(today)}
        </p>
      </div>

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
        <Card className="mb-6 overflow-hidden border-primary/30 bg-gradient-to-br from-secondary/90 via-card to-card p-6 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <p className="flex items-center gap-2 text-xs font-bold tracking-wider text-primary uppercase">
                <Sparkles className="size-4" aria-hidden /> Explore without an account
              </p>
              <h2 className="mt-2 text-xl font-bold tracking-tight text-foreground">
                Track spending, choose how each bill gets paid, and rehearse money emergencies.
              </h2>
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

      {/* Hero Card: Total of All Accounts / Available Balance (DailyDime style) */}
      <Card className="mb-4 p-6 shadow-sm border-slate-200/80 dark:border-slate-800">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400 border border-sky-100 dark:border-sky-900">
              <Wallet className="size-7" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total of All Accounts</p>
              <p className={cn('text-3xl font-extrabold tracking-tight sm:text-4xl tabular-nums text-foreground', p.currentBalance < 0 && 'text-danger')}>
                {formatINR(p.currentBalance)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Combined balance across accounts ·{' '}
                <span className="font-semibold text-foreground">
                  {formatINR(afterBills)}
                </span>{' '}
                available after this week&apos;s bills
              </p>
            </div>
          </div>
          <details className="group rounded-2xl border bg-muted/30 px-4 py-3 text-sm md:max-w-sm">
            <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold text-foreground hover:text-primary">
              <Info className="size-4 text-primary" aria-hidden /> How is this calculated?
            </summary>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              <li>{formatINR(entered)} initial balance on {formatDateTime(p.balanceUpdatedAt)}</li>
              <li>− {formatINR(spentSince)} in {since.length} recorded expenses & bill payments</li>
              <li className="font-semibold text-foreground">= {formatINR(p.currentBalance)} available right now</li>
              <li className="pt-1">
                Emergency reserve: {formatINR(p.emergencyReserve)} kept aside.{' '}
                {!guest && (
                  <Link href="/settings" className="font-medium text-primary hover:underline">
                    Edit balance
                  </Link>
                )}
              </li>
            </ul>
          </details>
        </div>
      </Card>

      {/* 4 Stat Summary Cards (DailyDime Signature 4-Card Row) */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {/* Card 1: Total Bills / Accounts */}
        <Link href="/bills" className="group rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-card p-4 transition-all hover:shadow-md hover:border-primary/40">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400 border border-sky-100 dark:border-sky-900">
              <Layers className="size-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">Active Bills</p>
              <p className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">{db.bills.filter((b) => b.active).length}</p>
            </div>
          </div>
        </Link>

        {/* Card 2: Monthly Income */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-card p-4 transition-all hover:shadow-md">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900">
              <TrendingUp className="size-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">Monthly Income</p>
              <p className="text-xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 sm:text-2xl tabular-nums">
                {formatINR(monthlyIncome)}
              </p>
            </div>
          </div>
        </div>

        {/* Card 3: Monthly Expenses */}
        <Link href="/expenses" className="group rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-card p-4 transition-all hover:shadow-md hover:border-rose-400">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-100 dark:border-rose-900">
              <TrendingDown className="size-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">Monthly Expenses</p>
              <p className="text-xl font-bold tracking-tight text-rose-600 dark:text-rose-400 sm:text-2xl tabular-nums">
                {formatINR(spent)}
              </p>
            </div>
          </div>
        </Link>

        {/* Card 4: Net Monthly */}
        <Link href="/budgets" className="group rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-card p-4 transition-all hover:shadow-md hover:border-teal-400">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-950/50 dark:text-teal-400 border border-teal-100 dark:border-teal-900">
              <PiggyBank className="size-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">Net Monthly</p>
              <p className="text-xl font-bold tracking-tight text-teal-600 dark:text-teal-400 sm:text-2xl tabular-nums">
                {formatINR(netMonthly)}
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Main Two-Column Layout (DailyDime + Mint Budget layout) */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column: Quick Actions + Spending Trend */}
        <div className="space-y-6">
          {/* Quick Actions (Exact DailyDime Pastel Pills) */}
          <Card className="p-5 shadow-sm border-slate-200/80 dark:border-slate-800">
            <h2 className="text-base font-bold text-foreground">Quick Actions</h2>
            <div className="mt-4 space-y-2.5">
              <Link
                href="/expenses/new"
                className="flex items-center justify-between rounded-xl border border-emerald-200/70 bg-emerald-50/70 hover:bg-emerald-100/80 px-4 py-3.5 text-emerald-950 transition dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200 shadow-2xs"
              >
                <span className="flex items-center gap-3 text-sm font-semibold">
                  <ReceiptText className="size-5 text-emerald-700 dark:text-emerald-400" /> Record Expense
                </span>
                <Plus className="size-4 text-emerald-600" />
              </Link>

              <Link
                href="/bills/new"
                className="flex items-center justify-between rounded-xl border border-sky-200/70 bg-sky-50/70 hover:bg-sky-100/80 px-4 py-3.5 text-sky-950 transition dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-200 shadow-2xs"
              >
                <span className="flex items-center gap-3 text-sm font-semibold">
                  <CalendarClock className="size-5 text-sky-700 dark:text-sky-400" /> Add New Bill
                </span>
                <Plus className="size-4 text-sky-600" />
              </Link>

              <Link
                href="/budgets"
                className="flex items-center justify-between rounded-xl border border-purple-200/70 bg-purple-50/70 hover:bg-purple-100/80 px-4 py-3.5 text-purple-950 transition dark:border-purple-900/60 dark:bg-purple-950/40 dark:text-purple-200 shadow-2xs"
              >
                <span className="flex items-center gap-3 text-sm font-semibold">
                  <PiggyBank className="size-5 text-purple-700 dark:text-purple-400" /> Check Budgets
                </span>
                <ArrowRight className="size-4 text-purple-600" />
              </Link>

              <Link
                href="/drill"
                className="flex items-center justify-between rounded-xl border border-rose-200/70 bg-rose-50/70 hover:bg-rose-100/80 px-4 py-3.5 text-rose-950 transition dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200 shadow-2xs"
              >
                <span className="flex items-center gap-3 text-sm font-semibold">
                  <ShieldAlert className="size-5 text-rose-700 dark:text-rose-400" /> Run Crisis Drill
                </span>
                <ArrowRight className="size-4 text-rose-600" />
              </Link>

              <Link
                href="/groups"
                className="flex items-center justify-between rounded-xl border border-amber-200/70 bg-amber-50/70 hover:bg-amber-100/80 px-4 py-3.5 text-amber-950 transition dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200 shadow-2xs"
              >
                <span className="flex items-center gap-3 text-sm font-semibold">
                  <Users className="size-5 text-amber-700 dark:text-amber-400" /> Split with Group
                </span>
                <ArrowRight className="size-4 text-amber-600" />
              </Link>
            </div>
          </Card>

          {/* Spending Trend (Mint Bonus Income Bar Chart Style) */}
          <Card className="p-5 shadow-sm border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-foreground">Monthly Spending Trend</h2>
                <p className="text-xs text-muted-foreground">Day-to-day spending (bills separate)</p>
              </div>
              <Link href="/expenses" className="text-xs font-semibold text-primary hover:underline">
                View all
              </Link>
            </div>
            <div className="mt-4">
              {hasTrend ? (
                <SpendingTrend points={trend} budget={everydayBudget} />
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">Your trend appears after recording expenses.</p>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Upcoming & Action Items (DailyDime Style) */}
        <div className="space-y-6">
          {/* Needs your action */}
          {action.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <AlertCircle className="size-4 text-amber-500" /> Needs your action ({action.length})
              </h2>
              <div className="space-y-2.5">
                {action.map(({ bill, occ, due }) => (
                  <Card key={occ!.id} className="border-l-4 border-l-amber-500 p-4 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Link href={`/bills/${bill.id}`} className="font-semibold text-foreground hover:underline">
                            {bill.name}
                          </Link>
                          <OccurrenceBadge status={occ!.status} mode={bill.mode} />
                        </div>
                        <p className="mt-1 text-sm font-medium text-muted-foreground">
                          <span className="font-bold text-foreground">{formatINR(occ!.amount)}</span> · {dueLabel(due!, today)}
                        </p>
                        {occ!.note && <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-400 font-medium">{occ!.note}</p>}
                      </div>
                      <OccurrenceActions occ={occ!} bill={bill} />
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Upcoming Section (DailyDime signature cards) */}
          <Card className="p-5 shadow-sm border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground">Upcoming Bills</h2>
              <Link href="/bills" className="text-xs font-semibold text-primary hover:underline">
                View all ({upcoming.length})
              </Link>
            </div>
            <div className="mt-4 space-y-2.5">
              {upcoming.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No upcoming bills in the next 14 days.</p>
              ) : (
                upcoming.map(({ bill, occ, due }) => (
                  <Link
                    key={bill.id}
                    href={`/bills/${bill.id}`}
                    className="flex items-center justify-between rounded-xl border border-amber-200/50 bg-amber-50/30 hover:bg-amber-50/70 p-3.5 transition dark:border-amber-900/40 dark:bg-amber-950/20"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
                        <CalendarClock className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate">{bill.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {dueLabel(due!, today)} · {bill.frequency}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-bold text-sm tabular-nums text-foreground">{formatINR(occ!.amount)}</span>
                      <ModeBadge mode={bill.mode} />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </Card>

          {/* Emergency Crisis Drill Teaser */}
          <Card className="p-5 shadow-sm border-slate-200/80 dark:border-slate-800 bg-gradient-to-br from-card to-secondary/30">
            <div className="flex items-start gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ShieldAlert className="size-6" />
              </span>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm text-foreground">
                  {lastDrill ? `Last drill score: ${lastDrill.score}/100` : 'Money Emergency Simulation'}
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {lastDrill
                    ? `Result: ${lastDrill.passed ? 'Safe reserve intact' : 'Shortage detected'} for ${lastDrill.scenarioLabel}`
                    : 'Rehearse a sudden income loss or unexpected expense before it ever happens.'}
                </p>
                <Link href="/drill" className={cn(buttonVariants({ size: 'sm', variant: 'outline' }), 'mt-3 font-semibold')}>
                  Run Simulation
                </Link>
              </div>
            </div>
          </Card>

          {/* Recent Activity */}
          <Card className="p-5 shadow-sm border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground">Recent Activity</h2>
              <Link href="/notifications" className="text-xs font-semibold text-primary hover:underline">
                View all
              </Link>
            </div>
            <div className="mt-3 divide-y">
              {recent.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No updates yet.</p>
              ) : (
                recent.map((n) => (
                  <Link key={n.id} href={n.href ?? '/notifications'} className="flex items-start gap-3 py-3 hover:opacity-80 transition">
                    <span className={cn('mt-1.5 size-2 shrink-0 rounded-full', n.read ? 'bg-border' : 'bg-primary')} aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">{n.title}</p>
                      <p className="line-clamp-1 text-xs text-muted-foreground">{n.body}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{formatDateTime(n.at)}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}
