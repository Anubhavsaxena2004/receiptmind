import type { Metadata } from 'next'
import Link from 'next/link'
import { PencilLine } from 'lucide-react'
import { Meter, Notice } from '@/components/bits'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CATEGORIES } from '@/lib/categories'
import { getData } from '@/lib/data'
import { daysInMonth, monthKey, parseISODate, todayISO } from '@/lib/dates'
import { formatINR, formatMonth } from '@/lib/format'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Budgets' }

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

  return (
    <>
      <PageHeader
        title="Budgets"
        description="A monthly limit for each kind of spending. Bars turn amber at 80% and red when you go over."
        action={
          <Link href="/budgets/edit" className={buttonVariants({ size: 'lg', variant: 'outline' })}>
            <PencilLine /> Edit limits
          </Link>
        }
      />
      {sp.saved && <Notice tone="success" className="mb-5">Budgets saved.</Notice>}

      <Card className="mb-6 p-5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{formatMonth(month)}</p>
            <p className="text-2xl font-bold tracking-tight">
              {formatINR(totalSpent)} <span className="text-base font-medium text-muted-foreground">of {formatINR(totalLimit)}</span>
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            {totalSpent <= totalLimit
              ? `${formatINR(totalLimit - totalSpent)} left · ${daysLeft} days to go`
              : `${formatINR(totalSpent - totalLimit)} over budget`}
          </p>
        </div>
        <div className="mt-4">
          <Meter value={totalSpent} max={totalLimit} label="Total spending against total budget" />
        </div>
      </Card>

      {over.length > 0 && (
        <Notice tone="warning" className="mb-6" title={`Over budget in ${over.length} ${over.length === 1 ? 'category' : 'categories'}`}>
          {over.map((r) => r.label).join(', ')}. Try the Crisis drill to see how this affects the coming weeks.
        </Notice>
      )}

      <Card className="divide-y">
        {rows.map((r) => {
          const pct = r.limit > 0 ? r.spent / r.limit : 1
          const left = r.limit - r.spent
          return (
            <div key={r.id} className="p-5">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{r.label}</span>
                  <Badge tone={r.essential ? 'primary' : 'neutral'}>{r.essential ? 'Essential' : 'Flexible'}</Badge>
                </div>
                <span className="text-sm">
                  <span className="font-semibold">{formatINR(r.spent)}</span>
                  <span className="text-muted-foreground"> / {r.limit > 0 ? formatINR(r.limit) : 'no limit'}</span>
                </span>
              </div>
              <Meter value={r.spent} max={r.limit} label={`${r.label} spending`} />
              <p className={cn('mt-1.5 text-xs font-medium', left < 0 ? 'text-danger' : pct >= 0.8 ? 'text-warning' : 'text-muted-foreground')}>
                {r.limit === 0 ? 'No limit set' : left >= 0 ? `${formatINR(left)} left` : `${formatINR(-left)} over`}
              </p>
            </div>
          )
        })}
      </Card>
      <p className="mt-4 text-sm text-muted-foreground">
        Essential spending is protected in recovery plans. Flexible spending is what Tinku suggests trimming first in an emergency.
      </p>
    </>
  )
}
