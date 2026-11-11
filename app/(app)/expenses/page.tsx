import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Plus,
  ReceiptText,
  ScanLine,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { ActionButton } from '@/components/action-button'
import { Notice } from '@/components/bits'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input, Select } from '@/components/ui/input'
import { EmptyState } from '@/components/tinku'
import { deleteExpense } from '@/lib/actions/expenses'
import { CATEGORIES, category, isCategoryId } from '@/lib/categories'
import { getData } from '@/lib/data'
import { monthKey, shiftMonthKey, todayISO } from '@/lib/dates'
import { formatDateLong, formatINR, formatMonth } from '@/lib/format'
import { cn } from '@/lib/utils'
import { ExpensesGrid, type ExpenseRow } from './expenses-grid'

export const metadata: Metadata = { title: 'Expenses' }

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; added?: string; q?: string; cat?: string; view?: string }>
}) {
  const sp = await searchParams
  const db = await getData()
  const today = todayISO()
  const current = monthKey(today)
  const month = sp.month && /^\d{4}-\d{2}$/.test(sp.month) && sp.month <= current ? sp.month : current
  const viewMode = sp.view === 'grid' ? 'grid' : 'list'

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
    const u = new URLSearchParams({ ...(q && { q }), ...(cat && { cat }), view: viewMode, ...extra })
    return `/expenses?${u}`
  }
  const top = [...byCat.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)
  const days = [...new Set(list.map((e) => e.date))]

  // Rows for AG Grid — full month, grid handles its own filtering/search/sort
  const gridRows: ExpenseRow[] = inMonth.map((e) => ({
    id: e.id,
    date: e.date,
    title: e.title,
    category: e.category,
    categoryLabel: category(e.category).label,
    amount: e.amount,
    source: e.source,
    note: e.note,
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expenses"
        description="Everything you’ve spent. Add one by hand or scan a receipt — Tinku files it under the right budget."
        action={
          <Link href="/expenses/new" className={cn(buttonVariants({ size: 'lg', variant: 'default' }), 'font-semibold gap-1.5 shadow-sm')}>
            <Plus className="size-4 stroke-[2.5]" /> Add expense
          </Link>
        }
      />

      {sp.added && <Notice tone="success">Expense saved successfully.</Notice>}

      {/* Month Navigator, Total & View Mode Toggle */}
      <Card className="p-4 shadow-sm border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <Link
              href={keep({ month: shiftMonthKey(month, -1) })}
              aria-label="Previous month"
              className={buttonVariants({ variant: 'outline', size: 'icon' })}
            >
              <ChevronLeft className="size-4" />
            </Link>
            <span className="min-w-36 text-center text-sm font-bold text-foreground">{formatMonth(month)}</span>
            {month < current ? (
              <Link href={keep({ month: shiftMonthKey(month, 1) })} aria-label="Next month" className={buttonVariants({ variant: 'outline', size: 'icon' })}>
                <ChevronRight className="size-4" />
              </Link>
            ) : (
              <span className="size-10" />
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <p className="text-sm text-muted-foreground">
              {filtered ? 'Filtered total:' : 'Total spent:'}{' '}
              <span className="text-xl font-bold tracking-tight text-foreground tabular-nums">{formatINR(total)}</span> · {list.length} expense
              {list.length === 1 ? '' : 's'}
            </p>

            {/* View Mode Toggle: List vs AG Grid */}
            <div data-tour="expense-view-toggle" className="inline-flex items-center rounded-full border border-border bg-muted/60 p-1 shadow-2xs">
              <Link
                href={keep({ view: 'list' })}
                aria-label="List view"
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all',
                  viewMode === 'list'
                    ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <List className="size-3.5" /> List
              </Link>
              <Link
                href={keep({ view: 'grid' })}
                aria-label="Spreadsheet grid view"
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all',
                  viewMode === 'grid'
                    ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <LayoutGrid className="size-3.5" /> Grid
              </Link>
            </div>
          </div>
        </div>
      </Card>

      {/* When in Grid mode, render AG Grid directly */}
      {viewMode === 'grid' ? (
        <div className="space-y-4">
          <ExpensesGrid rows={gridRows} />
        </div>
      ) : (
        <>
          {/* Filter / Search Form */}
          <form method="get" action="/expenses" role="search" data-tour="expense-search-form" className="flex flex-col gap-2 sm:flex-row">
            <input type="hidden" name="month" value={month} />
            <input type="hidden" name="view" value={viewMode} />
            <label className="relative flex-1">
              <span className="sr-only">Search expenses</span>
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input name="q" defaultValue={q} placeholder="Search by description or note" className="pl-9 h-11" />
            </label>
            <label data-tour="expense-category-select" className="sm:w-56">
              <span className="sr-only">Category</span>
              <Select name="cat" defaultValue={cat} className="h-11">
                <option value="">All categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </label>
            <div className="flex gap-2">
              <button type="submit" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'h-11 font-semibold')}>
                Filter
              </button>
              {filtered && (
                <Link href={`/expenses?month=${month}&view=${viewMode}`} className={cn(buttonVariants({ variant: 'ghost', size: 'lg' }), 'h-11 font-semibold')}>
                  <X className="size-4" /> Clear
                </Link>
              )}
            </div>
          </form>

          {/* Category Quick Chips */}
          {top.length > 0 && (
            <div data-tour="expense-category-chips" className="flex flex-wrap gap-2">
              {top.map(([c, amt]) => (
                <Link
                  key={c}
                  href={keep({ month, cat: c === cat ? '' : c })}
                  aria-current={c === cat ? 'true' : undefined}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs font-semibold transition-all',
                    c === cat
                      ? 'border-primary bg-secondary text-secondary-foreground shadow-2xs'
                      : 'border-border bg-card text-foreground hover:border-primary/40',
                  )}
                >
                  {category(c as never).label} <span className="tabular-nums font-bold text-foreground ml-1">{formatINR(amt)}</span>
                </Link>
              ))}
            </div>
          )}

          {/* Expense List or Empty State */}
          {list.length === 0 ? (
            <EmptyState
              icon={filtered ? Search : ReceiptText}
              title={filtered ? 'No expenses match your filters' : 'No expenses recorded this month'}
              description={
                filtered
                  ? 'Try modifying your search keywords or clear the category filter.'
                  : 'Add your first expense or snap a photo of a receipt to automatically parse items.'
              }
              action={{
                label: 'Add expense',
                href: '/expenses/new',
              }}
            />
          ) : (
            <div className="space-y-6">
              {days.map((day) => {
                const items = list.filter((e) => e.date === day)
                const dayTotal = items.reduce((s, i) => s + i.amount, 0)
                return (
                  <section key={day} className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        {day === today ? 'Today' : formatDateLong(day)}
                      </h2>
                      <span className="text-xs font-semibold text-muted-foreground tabular-nums">
                        {formatINR(dayTotal)}
                      </span>
                    </div>
                    <Card className="divide-y divide-border border-border bg-card shadow-xs overflow-hidden">
                      {items.map((e) => (
                        <div key={e.id} className="flex items-center gap-3 p-4 transition-colors hover:bg-muted/30">
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold text-sm text-foreground">{e.title}</p>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                              <span>{category(e.category).label}</span>
                              {e.source === 'receipt' && (
                                <Badge icon={ScanLine} tone="primary">
                                  Scanned
                                </Badge>
                              )}
                              {e.source === 'bill' && <Badge tone="neutral">Bill</Badge>}
                              {e.note && <span className="truncate italic">· {e.note}</span>}
                            </div>
                          </div>
                          <span className="font-bold text-sm tabular-nums text-foreground whitespace-nowrap">
                            −{formatINR(e.amount)}
                          </span>
                          {e.source !== 'bill' ? (
                            <ActionButton
                              action={deleteExpense}
                              fields={{ id: e.id }}
                              variant="ghost"
                              size="sm"
                              confirm={{
                                title: `Delete “${e.title}”?`,
                                body: `${formatINR(e.amount)} will be restored to your available balance.`,
                                confirmLabel: 'Delete expense',
                              }}
                              className="text-muted-foreground hover:text-danger size-8 p-0"
                            >
                              <Trash2 className="size-4" />
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
      )}
    </div>
  )
}
