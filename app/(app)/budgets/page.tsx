import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Car,
  Coins,
  CreditCard,
  GraduationCap,
  HeartPulse,
  Home,
  Music,
  PencilLine,
  PiggyBank,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Utensils,
  Zap,
} from 'lucide-react'
import { Meter, Notice } from '@/components/bits'
import { PageHeader } from '@/components/page-header'
import { buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/tinku'
import { CATEGORIES } from '@/lib/categories'
import { getData } from '@/lib/data'
import { daysInMonth, monthKey, parseISODate, todayISO } from '@/lib/dates'
import { formatINR, formatMonth } from '@/lib/format'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Budgets' }

function getCategoryIcon(id: string) {
  switch (id) {
    case 'groceries':
      return { icon: ShoppingBag, bg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900' }
    case 'food':
      return { icon: Utensils, bg: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 border-amber-100 dark:border-amber-900' }
    case 'transport':
      return { icon: Car, bg: 'bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400 border-sky-100 dark:border-sky-900' }
    case 'health':
      return { icon: HeartPulse, bg: 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 border-rose-100 dark:border-rose-900' }
    case 'shopping':
      return { icon: ShoppingBag, bg: 'bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400 border-purple-100 dark:border-purple-900' }
    case 'entertainment':
      return { icon: Music, bg: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900' }
    case 'rent':
      return { icon: Home, bg: 'bg-teal-50 text-teal-600 dark:bg-teal-950/50 dark:text-teal-400 border-teal-100 dark:border-teal-900' }
    case 'utilities':
      return { icon: Zap, bg: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-950/50 dark:text-yellow-400 border-yellow-100 dark:border-yellow-900' }
    case 'education':
      return { icon: GraduationCap, bg: 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 border-blue-100 dark:border-blue-900' }
    case 'insurance':
      return { icon: ShieldCheck, bg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900' }
    case 'subscriptions':
      return { icon: CreditCard, bg: 'bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-950/50 dark:text-fuchsia-400 border-fuchsia-100 dark:border-fuchsia-900' }
    default:
      return { icon: Coins, bg: 'bg-muted text-muted-foreground border-border' }
  }
}

export default async function BudgetsPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const sp = await searchParams
  const db = await getData()
  const today = todayISO()
  const month = monthKey(today)
  const t = parseISODate(today)
  const daysLeft = daysInMonth(t.getFullYear(), t.getMonth()) - t.getDate() + 1

  const spentBy = new Map<string, number>()
  for (const e of db.expenses) if (monthKey(e.date) === month) spentBy.set(e.category, (spentBy.get(e.category) ?? 0) + e.amount)
  const limitBy = new Map(db.budgets.map((b) => [b.category, b.limit]))

  const rows = CATEGORIES.map((c) => ({ ...c, limit: limitBy.get(c.id) ?? 0, spent: spentBy.get(c.id) ?? 0 })).filter(
    (r) => r.limit > 0 || r.spent > 0,
  )
  const totalLimit = rows.reduce((s, r) => s + r.limit, 0)
  const totalSpent = rows.reduce((s, r) => s + r.spent, 0)
  const over = rows.filter((r) => r.limit > 0 && r.spent > r.limit)

  const essentialRows = rows.filter((r) => r.essential)
  const flexibleRows = rows.filter((r) => !r.essential)

  const essentialLimit = essentialRows.reduce((s, r) => s + r.limit, 0)
  const essentialSpent = essentialRows.reduce((s, r) => s + r.spent, 0)

  const flexibleLimit = flexibleRows.reduce((s, r) => s + r.limit, 0)
  const flexibleSpent = flexibleRows.reduce((s, r) => s + r.spent, 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Budgets"
        description="A monthly limit for each kind of spending. Bars turn amber at 80% and red when you exceed the limit."
        action={
          <div className="flex items-center gap-2">
            <Link href="/expenses/new" className={cn(buttonVariants({ size: 'lg', variant: 'default' }), 'gap-1.5 font-semibold shadow-sm')}>
              <Plus className="size-4 stroke-[2.5]" /> Add expense
            </Link>
            <Link href="/budgets/edit" className={cn(buttonVariants({ size: 'lg', variant: 'outline' }), 'gap-1.5 font-semibold')}>
              <PencilLine className="size-4" /> Edit limits
            </Link>
          </div>
        }
      />

      {sp.saved && <Notice tone="success">Budgets updated successfully.</Notice>}

      {rows.length === 0 ? (
        <EmptyState
          icon={PiggyBank}
          title="No budgets set yet"
          description="Define monthly spending limits for groceries, dining, utilities, and transport. Tinku tracks your pace and alerts you when you approach limits."
          action={{
            label: 'Set budgets',
            href: '/budgets/edit',
          }}
        />
      ) : (
        <>
          {/* Hero Overview Card */}
          <Card className="p-6 shadow-sm border-border bg-card">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{formatMonth(month)} Overview</p>
                <p className="mt-1 text-3xl font-extrabold tracking-tight text-foreground tabular-nums sm:text-4xl">
                  {formatINR(totalSpent)}{' '}
                  <span className="text-lg font-medium text-muted-foreground">of {formatINR(totalLimit)}</span>
                </p>
              </div>
              <div className="rounded-xl border border-border bg-muted/40 px-4 py-2 text-right">
                <p className="text-sm font-bold text-foreground">
                  {totalSpent <= totalLimit ? (
                    <span className="text-success">{formatINR(totalLimit - totalSpent)} left</span>
                  ) : (
                    <span className="text-danger">{formatINR(totalSpent - totalLimit)} over budget</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">{daysLeft} days remaining</p>
              </div>
            </div>
            <div className="mt-4">
              <Meter value={totalSpent} max={totalLimit} label="Total spending against total budget" />
            </div>
          </Card>

          {over.length > 0 && (
            <Notice tone="warning" title={`Over budget in ${over.length} ${over.length === 1 ? 'category' : 'categories'}`}>
              {over.map((r) => r.label).join(', ')}. Run the Crisis Drill to see how adjusting flexible spending restores your emergency balance.
            </Notice>
          )}

          {/* Dual Category Columns: Essential & Flexible */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Essential Card */}
            <Card className="p-5 shadow-sm border-border bg-card">
              <div className="border-b border-border pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-foreground">Essential Budgets</h2>
                    <p className="text-xs text-muted-foreground">Protected necessities (rent, health, groceries)</p>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-bold text-success tabular-nums">
                      {formatINR(essentialSpent)}
                    </p>
                    <p className="text-xs text-muted-foreground">of {formatINR(essentialLimit)}</p>
                  </div>
                </div>
                <div className="mt-3 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${Math.min(100, essentialLimit > 0 ? (essentialSpent / essentialLimit) * 100 : 0)}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 divide-y divide-border">
                {essentialRows.length === 0 ? (
                  <p className="py-4 text-center text-xs text-muted-foreground">No essential categories configured.</p>
                ) : (
                  essentialRows.map((r) => {
                    const { icon: Icon, bg } = getCategoryIcon(r.id)
                    const left = r.limit - r.spent
                    const pct = r.limit > 0 ? r.spent / r.limit : 1
                    return (
                      <div key={r.id} className="py-3.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl border', bg)}>
                            <Icon className="size-5" />
                          </span>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-foreground truncate">{r.label}</p>
                            <p className="text-xs text-muted-foreground">
                              {r.limit > 0 ? `Limit ${formatINR(r.limit)}` : 'No limit set'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-sm tabular-nums text-foreground">{formatINR(r.spent)}</p>
                          <p
                            className={cn(
                              'text-xs font-semibold tabular-nums',
                              left < 0 ? 'text-danger' : pct >= 0.8 ? 'text-warning' : 'text-success',
                            )}
                          >
                            {r.limit === 0 ? 'Recorded' : left >= 0 ? `${formatINR(left)} left` : `${formatINR(-left)} over`}
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </Card>

            {/* Flexible Card */}
            <Card className="p-5 shadow-sm border-border bg-card">
              <div className="border-b border-border pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-foreground">Flexible Spending</h2>
                    <p className="text-xs text-muted-foreground">Discretionary (dining, shopping, leisure)</p>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                      {formatINR(flexibleSpent)}
                    </p>
                    <p className="text-xs text-muted-foreground">of {formatINR(flexibleLimit)}</p>
                  </div>
                </div>
                <div className="mt-3 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-rose-500 transition-all duration-300"
                    style={{ width: `${Math.min(100, flexibleLimit > 0 ? (flexibleSpent / flexibleLimit) * 100 : 0)}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 divide-y divide-border">
                {flexibleRows.length === 0 ? (
                  <p className="py-4 text-center text-xs text-muted-foreground">No flexible categories configured.</p>
                ) : (
                  flexibleRows.map((r) => {
                    const { icon: Icon, bg } = getCategoryIcon(r.id)
                    const left = r.limit - r.spent
                    const pct = r.limit > 0 ? r.spent / r.limit : 1
                    return (
                      <div key={r.id} className="py-3.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl border', bg)}>
                            <Icon className="size-5" />
                          </span>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-foreground truncate">{r.label}</p>
                            <p className="text-xs text-muted-foreground">
                              {r.limit > 0 ? `Limit ${formatINR(r.limit)}` : 'No limit set'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-sm tabular-nums text-foreground">{formatINR(r.spent)}</p>
                          <p
                            className={cn(
                              'text-xs font-semibold tabular-nums',
                              left < 0 ? 'text-danger' : pct >= 0.8 ? 'text-warning' : 'text-muted-foreground',
                            )}
                          >
                            {r.limit === 0 ? 'Recorded' : left >= 0 ? `${formatINR(left)} left` : `${formatINR(-left)} over`}
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
