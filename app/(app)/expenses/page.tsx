import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Plus, ReceiptText, ScanLine, Search, Trash2, X } from 'lucide-react'
import { ActionButton } from '@/components/action-button'
import { EmptyState, Notice } from '@/components/bits'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input, Select } from '@/components/ui/input'
import { deleteExpense } from '@/lib/actions/expenses'
import { CATEGORIES, category, isCategoryId } from '@/lib/categories'
import { getData } from '@/lib/data'
import { monthKey, shiftMonthKey, todayISO } from '@/lib/dates'
import { formatDateLong, formatINR, formatMonth } from '@/lib/format'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Expenses' }

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; added?: string; q?: string; cat?: string }>
}) {
  const sp = await searchParams
  const db = await getData()
  const today = todayISO()
  const current = monthKey(today)
  const month = sp.month && /^\d{4}-\d{2}$/.test(sp.month) && sp.month <= current ? sp.month : current

  const q = (sp.q ?? '').trim().slice(0, 60)
  const cat = isCategoryId(sp.cat) ? sp.cat : ''
  const filtered = Boolean(q || cat)
  const inMonth = db.expenses.filter((e) => monthKey(e.date) === month)
  const list = inMonth
    .filter((e) => (!cat || e.category === cat) && (!q || `${e.title} ${e.note ?? ''}`.toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => b.date.localeCompare(a.date))
  const total = list.reduce((s, e) => s + e.amount, 0)
  const byCat = new Map<string, number>()
  for (const e of inMonth) byCat.set(e.category, (byCat.get(e.category) ?? 0) + e.amount)
  const keep = (extra: Record<string, string>) => {
    const u = new URLSearchParams({ ...(q && { q }), ...(cat && { cat }), ...extra })
    return `/expenses?${u}`
  }
  const top = [...byCat.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)
  const days = [...new Set(list.map((e) => e.date))]

  return (
    <>
      <PageHeader
        title="Expenses"
        description="Everything you’ve spent. Add one by hand or scan a receipt — Tinku files it under the right budget."
        action={
          <Link href="/expenses/new" className={buttonVariants({ size: 'lg' })}>
            <Plus /> Add expense
          </Link>
        }
      />

      {sp.added && <Notice tone="success" className="mb-5">Expense saved.</Notice>}

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <Link
            href={keep({ month: shiftMonthKey(month, -1) })}
            aria-label="Previous month"
            className={buttonVariants({ variant: 'outline', size: 'icon-lg' })}
          >
            <ChevronLeft />
          </Link>
          <span className="min-w-36 text-center font-semibold">{formatMonth(month)}</span>
          {month < current ? (
            <Link href={keep({ month: shiftMonthKey(month, 1) })} aria-label="Next month" className={buttonVariants({ variant: 'outline', size: 'icon-lg' })}>
              <ChevronRight />
            </Link>
          ) : (
            <span className="size-9" />
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {filtered ? 'Matching' : 'Total'} <span className="text-lg font-bold text-foreground">{formatINR(total)}</span> · {list.length} expense
          {list.length === 1 ? '' : 's'}
        </p>
      </div>

      <form method="get" action="/expenses" role="search" className="mb-5 flex flex-col gap-2 sm:flex-row">
        <input type="hidden" name="month" value={month} />
        <label className="relative flex-1">
          <span className="sr-only">Search expenses</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input name="q" defaultValue={q} placeholder="Search by name or note" className="pl-9" />
        </label>
        <label className="sm:w-52">
          <span className="sr-only">Category</span>
          <Select name="cat" defaultValue={cat}>
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </Select>
        </label>
        <div className="flex gap-2">
          <button type="submit" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
            Filter
          </button>
          {filtered && (
            <Link href={`/expenses?month=${month}`} className={buttonVariants({ variant: 'ghost', size: 'lg' })}>
              <X /> Clear
            </Link>
          )}
        </div>
      </form>

      {top.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {top.map(([c, amt]) => (
            <Link
              key={c}
              href={keep({ month, cat: c === cat ? '' : c })}
              aria-current={c === cat ? 'true' : undefined}
              className={cn('rounded-full border px-3 py-1.5 text-sm transition hover:border-primary/40', c === cat ? 'border-primary bg-secondary' : 'bg-card')}
            >
              {category(c as never).label} <span className="font-semibold">{formatINR(amt)}</span>
            </Link>
          ))}
        </div>
      )}

      {list.length === 0 ? (
        <EmptyState
          icon={filtered ? Search : ReceiptText}
          title={filtered ? 'No expenses match' : 'No expenses this month'}
          body={filtered ? 'Try another search or category, or clear the filters.' : 'Add your first one — it takes ten seconds, or snap a receipt and let Tinku read it.'}
          action={
            <Link href="/expenses/new" className={buttonVariants()}>
              <Plus /> Add expense
            </Link>
          }
        />
      ) : (
        <div className="space-y-5">
          {days.map((day) => {
            const items = list.filter((e) => e.date === day)
            return (
              <section key={day}>
                <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
                  {day === today ? 'Today' : formatDateLong(day)}
                </h2>
                <Card className="divide-y">
                  {items.map((e) => (
                    <div key={e.id} className="flex items-center gap-3 p-4">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{e.title}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                          <span>{category(e.category).label}</span>
                          {e.source === 'receipt' && (
                            <Badge icon={ScanLine} tone="primary">
                              Scanned receipt
                            </Badge>
                          )}
                          {e.source === 'bill' && <Badge tone="neutral">Bill payment</Badge>}
                        </div>
                      </div>
                      <span className={cn('font-semibold whitespace-nowrap')}>{formatINR(e.amount)}</span>
                      {e.source !== 'bill' ? (
                        <ActionButton
                          action={deleteExpense}
                          fields={{ id: e.id }}
                          variant="ghost"
                          size="sm"
                          confirm={{ title: `Delete “${e.title}”?`, body: `${formatINR(e.amount)} goes back to your money available.`, confirmLabel: 'Delete' }}
                          className="text-muted-foreground"
                        >
                          <Trash2 />
                          <span className="sr-only">Delete {e.title}</span>
                        </ActionButton>
                      ) : (
                        <span className="w-8" />
                      )}
                    </div>
                  ))}
                </Card>
              </section>
            )
          })}
        </div>
      )}
    </>
  )
}
