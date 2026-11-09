import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Plus, ReceiptText, ScanLine, Trash2 } from 'lucide-react'
import { ActionButton } from '@/components/action-button'
import { EmptyState, Notice } from '@/components/bits'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { deleteExpense } from '@/lib/actions/expenses'
import { category } from '@/lib/categories'
import { getData } from '@/lib/data'
import { monthKey, shiftMonthKey, todayISO } from '@/lib/dates'
import { formatDateLong, formatINR, formatMonth } from '@/lib/format'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Expenses' }

export default async function ExpensesPage({ searchParams }: { searchParams: Promise<{ month?: string; added?: string }> }) {
  const sp = await searchParams
  const db = await getData()
  const today = todayISO()
  const current = monthKey(today)
  const month = sp.month && /^\d{4}-\d{2}$/.test(sp.month) && sp.month <= current ? sp.month : current

  const list = db.expenses.filter((e) => monthKey(e.date) === month).sort((a, b) => b.date.localeCompare(a.date))
  const total = list.reduce((s, e) => s + e.amount, 0)
  const byCat = new Map<string, number>()
  for (const e of list) byCat.set(e.category, (byCat.get(e.category) ?? 0) + e.amount)
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
            href={`/expenses?month=${shiftMonthKey(month, -1)}`}
            aria-label="Previous month"
            className={buttonVariants({ variant: 'outline', size: 'icon-lg' })}
          >
            <ChevronLeft />
          </Link>
          <span className="min-w-36 text-center font-semibold">{formatMonth(month)}</span>
          {month < current ? (
            <Link href={`/expenses?month=${shiftMonthKey(month, 1)}`} aria-label="Next month" className={buttonVariants({ variant: 'outline', size: 'icon-lg' })}>
              <ChevronRight />
            </Link>
          ) : (
            <span className="size-9" />
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Total <span className="text-lg font-bold text-foreground">{formatINR(total)}</span> · {list.length} expenses
        </p>
      </div>

      {top.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {top.map(([cat, amt]) => (
            <span key={cat} className="rounded-full border bg-card px-3 py-1.5 text-sm">
              {category(cat as never).label} <span className="font-semibold">{formatINR(amt)}</span>
            </span>
          ))}
        </div>
      )}

      {list.length === 0 ? (
        <EmptyState
          icon={ReceiptText}
          title="No expenses this month"
          body="Add your first one — it takes ten seconds, or snap a receipt and let Tinku read it."
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
                              Receipt
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
                          confirm={`Delete “${e.title}”?`}
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
