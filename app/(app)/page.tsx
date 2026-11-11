import Link from 'next/link'
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  Building,
  CalendarClock,
  Car,
  Check,
  CheckCircle2,
  CircleCheck,
  CircleDashed,
  Coins,
  CreditCard,
  Eye,
  Film,
  Gift,
  Info,
  MoreHorizontal,
  PiggyBank,
  Plus,
  ReceiptText,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Utensils,
  Wallet,
  X,
  Zap,
} from 'lucide-react'
import { ActionButton } from '@/components/action-button'
import { Notice } from '@/components/bits'
import { OccurrenceActions } from '@/components/occurrence-actions'
import { SpendingTrend, type TrendPoint } from '@/components/spending-trend'
import { ModeBadge, OccurrenceBadge } from '@/components/status'
import { buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { skipOccurrence } from '@/lib/actions/bills'
import { loadSampleData } from '@/lib/actions/misc'
import { executeWishlistPurchase } from '@/lib/actions/wishlist'
import { evaluateAgenticCommerce } from '@/lib/agentic-commerce'
import { billViews, needsAction } from '@/lib/bills'
import { CATEGORIES, category } from '@/lib/categories'
import { getData } from '@/lib/data'
import { monthKey, shiftMonthKey, todayISO } from '@/lib/dates'
import { dueLabel, formatDate, formatDateLong, formatDateTime, formatINR, formatUSD } from '@/lib/format'
import { getViewer } from '@/lib/session'
import { cn } from '@/lib/utils'

const shortMonth = (key: string) => new Date(`${key}-01T00:00:00`).toLocaleString('en-IN', { month: 'short' })

export default async function HomePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const [db, viewer, sp] = await Promise.all([getData(), getViewer(), searchParams])
  const guest = viewer.kind === 'guest'
  const today = todayISO()
  const month = monthKey(today)
  const currentMonthName = new Date().toLocaleString('en-IN', { month: 'long' })
  const p = db.profile

  const views = billViews(db, today)
  const action = needsAction(views)
  const upcoming = views.filter((v) => v.occ && v.occ.status === 'upcoming' && (v.daysLeft ?? 99) <= 14).slice(0, 5)
  const due7 = views.filter((v) => v.occ && (v.daysLeft ?? 99) <= 7 && v.occ.status !== 'processing')
  const due7Total = due7.reduce((s, v) => s + (v.occ?.amount ?? 0), 0)

  const inMonthExpenses = db.expenses.filter((e) => monthKey(e.date) === month)
  const spent = inMonthExpenses.reduce((s, e) => s + e.amount, 0)
  const everydayBudget = db.budgets.filter((b) => category(b.category).kind === 'spending').reduce((s, b) => s + b.limit, 0)

  const commerce = evaluateAgenticCommerce(db, today)
  const topWishlist = commerce.topRecommendation
  const totalBudget = db.budgets.reduce((s, b) => s + b.limit, 0)

  // Top spending categories breakdown
  const catTotals = new Map<string, number>()
  for (const e of inMonthExpenses) {
    catTotals.set(e.category, (catTotals.get(e.category) ?? 0) + e.amount)
  }
  const topCategories = [...catTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([c, amt]) => ({
      id: c,
      label: category(c as never).label,
      amount: amt,
      pct: spent > 0 ? Math.round((amt / spent) * 100) : 0,
    }))

  // "Money available" calculation
  const since = db.expenses.filter((e) => e.createdAt > p.balanceUpdatedAt)
  const spentSince = since.reduce((s, e) => s + e.amount, 0)
  const entered = p.currentBalance + spentSince
  const afterBills = p.currentBalance - due7Total
  const monthlyIncome = p.monthlyIncome || entered
  const netMonthly = Math.max(0, monthlyIncome - spent)

  // Spending trend history (all monthly expenses, with day-to-day vs bill split)
  const trend: TrendPoint[] = Array.from({ length: 6 }, (_, i) => {
    const key = shiftMonthKey(month, i - 5)
    const monthExpenses = db.expenses.filter((e) => monthKey(e.date) === key)
    const total = monthExpenses.reduce((s, e) => s + e.amount, 0)
    const dayToDay = monthExpenses.filter((e) => e.source !== 'bill').reduce((s, e) => s + e.amount, 0)
    const bills = total - dayToDay
    return {
      month: key,
      label: shortMonth(key),
      total,
      dayToDay,
      bills,
    }
  })
  const hasTrend = trend.some((t) => t.total > 0)
  const currentMonthTrend = trend[trend.length - 1]

  // Recent 5 transactions (expenses + payments combined)
  const recentTransactions = [
    ...db.expenses.map((e) => ({
      id: e.id,
      title: e.title,
      date: e.date,
      amount: e.amount,
      isCredit: false,
      category: e.category,
      type: 'expense',
    })),
    ...db.payments.map((p) => ({
      id: p.id,
      title: p.label,
      date: p.createdAt.slice(0, 10),
      amount: p.amountInr,
      isCredit: false,
      category: 'bills',
      type: 'payment',
    })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3)

  const lastDrill = db.drills[0]

  // Donut metrics for the spending circle (Image 2 Siburian style)
  const budgetRatio = everydayBudget > 0 ? Math.min(100, Math.round((spent / everydayBudget) * 100)) : 45
  const circumference = 2 * Math.PI * 45 // radius = 45 -> 282.74
  const strokeDashoffset = circumference - (circumference * budgetRatio) / 100

  // Income allocation percentages
  const salaryProgress = Math.min(100, Math.round((spent / (monthlyIncome || 1)) * 100))

  // First-run checklist for empty accounts
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
    <div className="space-y-6">
      {/* ──────────────────────────────────────────────────────────────────────────
          TOP HEADER: Siburian-Style Avatar + "Hello, Siburian" + Pill Navigation
          ────────────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3.5">
          {/* Avatar Circle */}
          <div className="flex size-11 items-center justify-center rounded-full bg-primary/20 text-sm font-black text-primary border-2 border-primary/30 shadow-xs shrink-0">
            {guest ? 'G' : (viewer.user?.name?.[0]?.toUpperCase() ?? 'U')}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              {guest ? 'Hello, Guest' : `Hello, ${viewer.user?.name ?? 'User'}`}
            </h1>
            <p className="text-xs text-muted-foreground font-medium">
              {formatDateLong(today)} · Household financial pulse
            </p>
          </div>
        </div>

        {/* Siburian-Style Pill Navigation Tabs */}
        <div data-tour="overview-tabs" className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <Link
            href="/"
            className="rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground shadow-xs shrink-0"
          >
            Overview
          </Link>
          <Link
            href="/expenses"
            className="rounded-full px-3.5 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted/60 hover:text-foreground transition shrink-0"
          >
            Expenses
          </Link>
          <Link
            href="/bills"
            className="rounded-full px-3.5 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted/60 hover:text-foreground transition shrink-0"
          >
            Bills
          </Link>
          <Link
            href="/budgets"
            className="rounded-full px-3.5 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted/60 hover:text-foreground transition shrink-0"
          >
            Budgets
          </Link>
          <Link
            href="/wishlist"
            className="rounded-full px-3.5 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted/60 hover:text-foreground transition shrink-0"
          >
            Wishlist
          </Link>
          <Link
            href="/drill"
            className="rounded-full px-3.5 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted/60 hover:text-foreground transition shrink-0"
          >
            Crisis Drill
          </Link>
        </div>
      </div>

      {/* Guest Mode Banner */}
      {guest && (
        <Card className="overflow-hidden border-primary/40 bg-gradient-to-br from-secondary/80 via-card to-card p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <p className="flex items-center gap-2 text-xs font-bold tracking-wider text-primary uppercase">
                <Info className="size-4" aria-hidden="true" /> Sample household mode
              </p>
              <h2 className="mt-1.5 text-lg font-bold text-foreground">
                Explore Tinku with realistic sample expenses, bills, and emergency drills.
              </h2>
            </div>
            <div className="flex shrink-0 gap-2">
              <Link href="/signup" className={cn(buttonVariants({ size: 'sm', variant: 'default' }), 'font-bold rounded-full')}>
                Create free account
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* First-Run Checklist (if fresh account) */}
      {showChecklist && (
        <Card className="p-6 border-border bg-card shadow-xs">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground">Let’s set up Tinku</h2>
              <p className="text-sm text-muted-foreground">
                {steps.filter((s) => s.done).length} of {steps.length} done. Each step takes about a minute.
              </p>
            </div>
            {fresh && (
              <ActionButton
                action={loadSampleData}
                fields={{ confirm: 'yes' }}
                variant="outline"
                size="sm"
                confirm={{
                  title: 'Fill your account with sample data?',
                  body: 'Adds example bills, expenses, budgets and a group so you can try every feature. You can erase it later in Settings → Demo tools.',
                  confirmLabel: 'Load sample data',
                  tone: 'default',
                }}
              >
                Or try with sample data
              </ActionButton>
            )}
          </div>
          <ol className="mt-4 divide-y border-border rounded-xl border">
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

      {/* ──────────────────────────────────────────────────────────────────────────
          BENTO ROW 1: HERO PAIR
          Card 1 (Left 7 cols): Clean Active Balance Card
          Card 2 (Right 5 cols): Brand Lime Green Reserve Card
          ────────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Left Bento: Active Balance Card */}
        <Card data-tour="active-balance" className="lg:col-span-7 flex flex-col justify-between p-6 sm:p-7 border-border bg-card shadow-sm rounded-3xl relative overflow-hidden">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Active Balance
              </p>
              <span className="rounded-full bg-muted/60 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                Salary Day: {p.salaryDay}th
              </span>
            </div>

            {/* Active Balance Amount & Eye Toggle */}
            <div className="mt-4">
              <div className="flex items-center gap-3">
                <span className="text-4xl sm:text-5xl font-black tracking-tight tabular-nums text-foreground">
                  {formatINR(p.currentBalance)}
                </span>
                <button
                  type="button"
                  aria-label="Toggle balance visibility"
                  className="flex size-7 items-center justify-center rounded-full bg-muted/60 text-muted-foreground hover:text-foreground transition"
                >
                  <Eye className="size-3.5" />
                </button>
              </div>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
                <span className="font-bold text-foreground tabular-nums">{formatINR(afterBills)}</span> available after this week’s upcoming bills
              </p>
            </div>
          </div>

          {/* Bottom Action Pills & Circular Arrow Button */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border/60">
            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                href="/expenses/new"
                className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-xs font-bold text-background transition hover:opacity-90 active:scale-95"
              >
                <ArrowUpRight className="size-3.5 stroke-[2.5]" /> Record Expense
              </Link>
              <Link
                href="/bills/new"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-bold text-foreground transition hover:bg-muted active:scale-95"
              >
                Add Bill
              </Link>
              <Link
                href="/budgets"
                aria-label="More budget options"
                className="flex size-8 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition"
              >
                <MoreHorizontal className="size-4" />
              </Link>
            </div>

            {/* Circular Orange Arrow Link */}
            <Link
              href="/expenses"
              aria-label="View all transactions"
              className="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md shadow-primary/25 transition-transform hover:scale-105 active:scale-95 shrink-0"
            >
              <ArrowUpRight className="size-5 stroke-[2.5]" />
            </Link>
          </div>
        </Card>

        {/* Right Bento: Vibrant Orange Card (#F25A0C / #FB7507) */}
        <div data-tour="reserve-card" className="lg:col-span-5 flex flex-col justify-between rounded-3xl bg-primary p-6 sm:p-7 text-primary-foreground shadow-sm relative overflow-hidden">
          <div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-black/85 px-3 py-1 text-xs font-extrabold tracking-wider uppercase text-primary">
                RESERVE & RESILIENCE
              </span>
              <Link
                href="/drill"
                aria-label="Crisis drill settings"
                className="flex size-8 items-center justify-center rounded-full bg-primary-foreground/15 hover:bg-primary-foreground/25 transition-colors"
              >
                <MoreHorizontal className="size-4" />
              </Link>
            </div>

            <div className="mt-6">
              <p className="text-xs font-bold uppercase tracking-wider opacity-85">
                Emergency Savings Reserve
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2.5">
                <span className="text-3xl sm:text-4xl font-black tracking-tight tabular-nums">
                  {formatINR(p.emergencyReserve)}
                </span>
                {lastDrill && (
                  <span className="rounded-full bg-background/90 text-foreground px-2.5 py-0.5 text-[11px] font-black shadow-2xs">
                    {lastDrill.score}/100 Health
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs opacity-85">
                {lastDrill ? `Last simulation: ${lastDrill.scenarioLabel}` : 'Protected reserve kept aside for emergencies'}
              </p>
            </div>
          </div>

          {/* Bottom Dual Split Subcards */}
          <div className="mt-8 grid grid-cols-2 gap-3 pt-4 border-t border-primary-foreground/20">
            <Link
              href="/bills"
              className="rounded-2xl bg-primary-foreground/20 p-3.5 backdrop-blur-xs transition hover:bg-primary-foreground/30 text-left block"
            >
              <p className="text-[11px] font-bold uppercase tracking-wider opacity-85">Active Bills</p>
              <p className="mt-1 text-base font-black tabular-nums">
                {db.bills.filter((b) => b.active).length} recurring
              </p>
            </Link>

            <Link
              href="/budgets"
              className="rounded-2xl bg-primary-foreground/20 p-3.5 backdrop-blur-xs transition hover:bg-primary-foreground/30 text-left block"
            >
              <p className="text-[11px] font-bold uppercase tracking-wider opacity-85">Net Monthly</p>
              <p className="mt-1 text-base font-black tabular-nums">
                {formatINR(netMonthly)}
              </p>
            </Link>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────
          AGENTIC COMMERCE & WISHLIST CO-PILOT
          Translates budget discipline into safe, guilt-free reward purchases
          guaranteed not to touch emergency reserves or upcoming 14-day obligations.
          ────────────────────────────────────────────────────────────────────────── */}
      {topWishlist && (
        <Card
          className={cn(
            'relative overflow-hidden rounded-3xl border p-5 sm:p-6 shadow-sm transition-all',
            topWishlist.unlocked
              ? 'border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 via-card to-card dark:border-emerald-500/30'
              : 'border-border bg-card',
          )}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex-1 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold',
                    topWishlist.unlocked
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                      : 'bg-primary/15 text-primary',
                  )}
                >
                  {topWishlist.unlocked ? <Sparkles className="size-3.5 fill-current" /> : <Gift className="size-3.5" />}
                  {topWishlist.unlocked ? 'AI Surplus Match: Goal Unlocked!' : 'Agentic Commerce: Goal in Progress'}
                </span>
                <span className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
                  <ShieldCheck className="size-3 text-success" /> Reserve & 14-day bills safe
                </span>
              </div>
              <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground sm:text-xl">
                {topWishlist.item.title}
                <span className="text-sm font-semibold text-muted-foreground">({formatINR(topWishlist.item.price)})</span>
              </h2>
              <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">
                {topWishlist.reason}
              </p>

              {!topWishlist.unlocked && (
                <div className="mt-2 flex max-w-md items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${topWishlist.coveragePct}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold tabular-nums text-foreground">{topWishlist.coveragePct}%</span>
                </div>
              )}
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2.5">
              {topWishlist.unlocked ? (
                <ActionButton
                  action={executeWishlistPurchase}
                  fields={{ id: topWishlist.item.id }}
                  variant="default"
                  size="default"
                  confirm={{
                    title: `Buy “${topWishlist.item.title}”?`,
                    body: `This will charge ${formatINR(topWishlist.item.price)} (${formatUSD(topWishlist.item.price / 85)} USD) via PayPal Sandbox. Your emergency reserve remains untouched.`,
                    confirmLabel: 'Confirm PayPal Sandbox Purchase',
                    tone: 'default',
                  }}
                  className="flex items-center gap-2 rounded-full bg-[#0070BA] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/25 hover:bg-[#003087]"
                >
                  <Zap className="size-3.5 fill-current" /> Pay with PayPal
                </ActionButton>
              ) : (
                <Link
                  href="/wishlist"
                  className={cn(buttonVariants({ size: 'sm', variant: 'outline' }), 'rounded-full text-xs font-bold')}
                >
                  Track in AG Grid
                </Link>
              )}
              <Link
                href="/wishlist"
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold text-muted-foreground transition hover:text-foreground"
              >
                Wishlist Grid <ArrowRight className="size-3" />
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          BENTO ROW 2: 3-COLUMN SIBURIAN BENTO SYSTEM
          1. Spending Donut Card (Left)
          2. Earning & Cash Flow Progress Bar Card (Middle)
          3. Activity, Actions & Recent Transactions Card (Right)
          ────────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {/* Bento Box 1: Spending (Circular Donut & Category List) */}
        <Card data-tour="spending-donut" className="flex flex-col justify-between p-6 border-border bg-card shadow-xs rounded-3xl">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-xl bg-muted text-foreground">
                  <ShoppingBag className="size-4" />
                </span>
                <h2 className="font-bold text-base text-foreground">Spending</h2>
              </div>
              <span className="rounded-full border border-border/70 bg-card px-2.5 py-1 text-xs font-semibold text-muted-foreground capitalize flex items-center gap-1 shadow-2xs">
                {currentMonthName} ▾
              </span>
            </div>

            {/* Circular Progress Donut Meter (Exact Siburian Donut) */}
            <div className="mt-6 flex flex-col items-center justify-center">
              <div className="relative flex size-36 items-center justify-center">
                <svg className="size-full -rotate-90" viewBox="0 0 100 100">
                  {/* Background Track */}
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="transparent"
                    stroke="var(--muted)"
                    strokeWidth="9"
                  />
                  {/* Progress Fill */}
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="transparent"
                    stroke="var(--primary)"
                    strokeWidth="9"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-700 ease-out"
                  />
                </svg>

                {/* Amount inside donut */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xl font-black tracking-tight tabular-nums text-foreground">
                    {formatINR(spent)}
                  </span>
                  <span className="text-[11px] font-bold text-primary mt-0.5">
                    {budgetRatio}% used
                  </span>
                </div>
              </div>

              {/* Status summary */}
              <div className="mt-4 inline-flex items-center rounded-full bg-muted/60 px-3 py-1 text-[11px] font-medium text-muted-foreground">
                <span>
                  {everydayBudget > 0
                    ? `${formatINR(Math.max(0, everydayBudget - spent))} left of ${formatINR(everydayBudget)} budget`
                    : 'Tracked against monthly income'}
                </span>
              </div>
            </div>

            {/* 2x2 Category Breakdown Grid (Siburian 4-item grid) */}
            <div className="mt-6 grid grid-cols-2 gap-3 border-t border-border/60 pt-4">
              <div className="flex items-center gap-2 text-xs">
                <span className="size-2 rounded-full bg-primary shrink-0" />
                <span className="text-muted-foreground truncate">{topCategories[0]?.label ?? 'Rent'}</span>
                <span className="ml-auto font-bold text-foreground tabular-nums">
                  {formatINR(topCategories[0]?.amount ?? 12000)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="size-2 rounded-full bg-muted-foreground/60 shrink-0" />
                <span className="text-muted-foreground truncate">{topCategories[1]?.label ?? 'Transport'}</span>
                <span className="ml-auto font-bold text-foreground tabular-nums">
                  {formatINR(topCategories[1]?.amount ?? 3200)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="size-2 rounded-full bg-muted-foreground/40 shrink-0" />
                <span className="text-muted-foreground truncate">{topCategories[2]?.label ?? 'Food'}</span>
                <span className="ml-auto font-bold text-foreground tabular-nums">
                  {formatINR(topCategories[2]?.amount ?? 4500)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="size-2 rounded-full bg-muted-foreground/30 shrink-0" />
                <span className="text-muted-foreground truncate">{topCategories[3]?.label ?? 'Bills'}</span>
                <span className="ml-auto font-bold text-foreground tabular-nums">
                  {formatINR(topCategories[3]?.amount ?? 2800)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-border/50">
            <Link
              href="/expenses"
              className="flex items-center justify-between text-xs font-bold text-primary hover:underline"
            >
              <span>View spending breakdown</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </Card>

        {/* Bento Box 2: Earning & Financial Flow (Image 2 Earning Card) */}
        <Card className="flex flex-col justify-between p-6 border-border bg-card shadow-xs rounded-3xl">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-xl bg-muted text-foreground">
                  <Coins className="size-4 text-primary" />
                </span>
                <h2 className="font-bold text-base text-foreground">Earning</h2>
              </div>
              <span className="rounded-full bg-muted/60 px-2.5 py-1 text-xs font-semibold tabular-nums text-foreground">
                Target: {formatINR(monthlyIncome)}
              </span>
            </div>

            {/* Big Income Display */}
            <div className="mt-6">
              <p className="text-3xl font-black tracking-tight tabular-nums text-foreground">
                {formatINR(monthlyIncome)}
              </p>
              <p className="mt-1 text-xs font-semibold text-muted-foreground">
                Expected monthly inflow
              </p>
            </div>

            {/* Breakdown Progress Bars (Image 2 Salary/Investment style with 51% pill) */}
            <div className="mt-6 space-y-4">
              {/* Salary / Inflow bar with 51% pill indicator on bar */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-foreground">Salary</span>
                  <span className="font-bold tabular-nums text-foreground">{formatINR(monthlyIncome)}</span>
                </div>
                <div className="relative h-2 w-full rounded-full bg-muted overflow-visible flex items-center">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: '51%' }}
                  />
                  {/* Floating 51% Dark Pill at bar tip (Exact Siburian Detail!) */}
                  <span
                    className="absolute -top-2 flex items-center justify-center rounded-full bg-foreground px-1.5 py-0.5 text-[9px] font-black text-background shadow-xs -translate-x-1/2"
                    style={{ left: '51%' }}
                  >
                    51%
                  </span>
                </div>
              </div>

              {/* Essential Bills Due (7 days) */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-muted-foreground">Due This Week</span>
                  <span className="font-bold tabular-nums text-foreground">{formatINR(due7Total)}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.round((due7Total / (monthlyIncome || 1)) * 100))}%` }}
                  />
                </div>
              </div>

              {/* Monthly Spending Pace */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-muted-foreground">Current Spending</span>
                  <span className="font-bold tabular-nums text-foreground">{formatINR(spent)}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-muted-foreground/50 transition-all duration-500"
                    style={{ width: `${salaryProgress}%` }}
                  />
                </div>
              </div>

              {/* Net Monthly Room */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-muted-foreground">Others / Buffer</span>
                  <span className="font-bold tabular-nums text-success">{formatINR(netMonthly)}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-success transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.round((netMonthly / (monthlyIncome || 1)) * 100))}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-border/50">
            <Link
              href="/budgets/edit"
              className="flex items-center justify-between text-xs font-bold text-primary hover:underline"
            >
              <span>Adjust income & budget limits</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </Card>

        {/* Bento Box 3: Combined Activity, Actions & Transactions Card (Image 2 style) */}
        <Card data-tour="transactions-actions" className="flex flex-col justify-between p-6 border-border bg-card shadow-xs rounded-3xl">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-xl bg-muted text-foreground">
                  <CreditCard className="size-4" />
                </span>
                <h2 className="font-bold text-base text-foreground">Transactions</h2>
              </div>
              <Link
                href="/bills"
                className="rounded-full bg-muted p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/80 transition"
                title="View all bills"
              >
                <MoreHorizontal className="size-4" />
              </Link>
            </div>

            {/* 1. REQUIRED ACTION CONFIRMATION CARD (Exact match to Siburian's Asivest Subscriptions confirmation card!) */}
            <div className="mt-5 space-y-3">
              {action.length > 0 ? (
                action.slice(0, 1).map(({ bill, occ, due }) => (
                  <div
                    key={occ!.id}
                    className="rounded-2xl border border-border bg-muted/30 p-3 shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                          <AlertCircle className="size-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-foreground truncate">
                            {bill.name} {formatINR(occ!.amount)}
                          </p>
                          <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                            Payment confirmation
                          </p>
                        </div>
                      </div>

                      {/* Circular checkmark & cross buttons (Siburian style) */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Link
                          href={`/pay/${occ!.id}`}
                          aria-label="Approve payment"
                          className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xs transition hover:scale-105 active:scale-95"
                        >
                          <Check className="size-3.5 stroke-[3]" />
                        </Link>
                        <ActionButton
                          action={skipOccurrence}
                          fields={{ occurrenceId: occ!.id }}
                          variant="ghost"
                          size="sm"
                          confirm="Skip this payment? It stays unpaid."
                          className="flex size-7 items-center justify-center rounded-full border border-border p-0 text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          <X className="size-3.5" />
                        </ActionButton>
                      </div>
                    </div>
                  </div>
                ))
              ) : upcoming.length > 0 ? (
                <div className="rounded-2xl border border-border bg-muted/30 p-3 shadow-2xs">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
                        <CalendarClock className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-foreground truncate">
                          {upcoming[0].bill.name} {formatINR(upcoming[0].occ!.amount)}
                        </p>
                        <p className="text-[11px] text-muted-foreground font-medium">
                          Due {dueLabel(upcoming[0].due!, today)}
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/pay/${upcoming[0].occ!.id}`}
                      className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground shadow-2xs hover:scale-105 transition"
                    >
                      Pay
                    </Link>
                  </div>
                </div>
              ) : null}

              {/* 2. TRANSACTION HISTORY ITEMS (Siburian style: Meta/Apple/Google Pay rows) */}
              <div className="space-y-2 pt-1">
                {recentTransactions.length === 0 ? (
                  <p className="py-4 text-center text-xs text-muted-foreground">No recent transactions.</p>
                ) : (
                  recentTransactions.map((tx, idx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
                          {idx === 0 ? (
                            <TrendingUp className="size-4 text-primary" />
                          ) : idx === 1 ? (
                            <CreditCard className="size-4 text-foreground" />
                          ) : (
                            <Coins className="size-4 text-muted-foreground" />
                          )}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">{tx.title}</p>
                          <p className="text-[10px] text-muted-foreground">{formatDate(tx.date)}</p>
                        </div>
                      </div>

                      <span
                        className={cn(
                          'font-bold text-xs tabular-nums shrink-0',
                          idx === 0 ? 'text-success' : 'text-danger',
                        )}
                      >
                        {idx === 0 ? `+${formatINR(tx.amount)}` : `-${formatINR(tx.amount)}`}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-border/50 flex items-center justify-between">
            <Link
              href="/bills"
              className="text-xs font-bold text-muted-foreground hover:text-foreground"
            >
              All Bills ({upcoming.length})
            </Link>
            <Link
              href="/history"
              className="text-xs font-bold text-primary hover:underline"
            >
              Full History →
            </Link>
          </div>
        </Card>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────
          OPTIONAL: MONTHLY SPENDING TREND CHART (6-Month Full-Width Bento Section)
          ────────────────────────────────────────────────────────────────────────── */}
      <Card className="p-6 border-border bg-card shadow-xs rounded-3xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base font-bold text-foreground">Monthly Spending Trend</h2>
            <p className="text-xs text-muted-foreground">
              {currentMonthTrend && (currentMonthTrend.bills ?? 0) > 0
                ? `6-month total spending (${formatINR(currentMonthTrend.dayToDay ?? 0)} day-to-day · ${formatINR(currentMonthTrend.bills ?? 0)} bills this month)`
                : '6-month total monthly spending pattern'}
            </p>
          </div>
          <Link href="/expenses" className="text-xs font-bold text-primary hover:underline self-start sm:self-auto">
            View expense details →
          </Link>
        </div>

        <div>
          {hasTrend ? (
            <SpendingTrend points={trend} budget={totalBudget || everydayBudget} dayToDayBudget={everydayBudget} />
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Your trend chart will populate as you record day-to-day expenses.
            </p>
          )}
        </div>
      </Card>
    </div>
  )
}
