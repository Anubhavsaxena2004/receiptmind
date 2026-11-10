import Link from 'next/link'
import { CalendarClock } from 'lucide-react'
import { StatusBadge } from './status-badge'
import type { Bill, Occurrence } from '@/lib/types'
import { dueLabel, formatINR } from '@/lib/format'
import { todayISO } from '@/lib/dates'
import { cn } from '@/lib/utils'

export interface BillCardProps {
  bill: Bill
  occurrence?: Occurrence
  due?: string
  daysLeft?: number
  variant?: 'compact' | 'full'
  actions?: React.ReactNode
  className?: string
}

export function BillCard({
  bill,
  occurrence,
  due,
  variant = 'compact',
  actions,
  className,
}: BillCardProps) {
  const today = todayISO()
  const displayDue = due ?? occurrence?.dueDate
  const dueText = displayDue ? dueLabel(displayDue, today) : bill.frequency
  const amount = occurrence?.amount ?? bill.amount
  const status = occurrence?.status ?? (bill.active ? 'active' : 'paused')

  if (variant === 'compact') {
    return (
      <Link
        href={`/bills/${bill.id}`}
        className={cn(
          'group flex items-center justify-between rounded-xl border border-border bg-card p-3.5 transition-all hover:bg-muted/40 hover:border-primary/40 shadow-2xs',
          className,
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
            <CalendarClock className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
              {bill.name}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {dueText} · {bill.frequency}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 ml-3">
          <span className="font-bold text-sm tabular-nums text-foreground">{formatINR(amount)}</span>
          <StatusBadge status={bill.mode} showIcon={false} />
        </div>
      </Link>
    )
  }

  // Full Variant
  return (
    <div
      className={cn(
        'flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-xs transition-all hover:shadow-sm',
        className,
      )}
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={`/bills/${bill.id}`}
              className="text-base font-bold text-foreground hover:text-primary transition-colors truncate block"
            >
              {bill.name}
            </Link>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{bill.payee}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <StatusBadge status={status} />
            <StatusBadge status={bill.mode} showIcon={false} />
          </div>
        </div>

        <div className="mt-4 flex items-baseline justify-between border-t border-border/50 pt-3">
          <div>
            <p className="text-xs text-muted-foreground">Due Date</p>
            <p className="text-sm font-semibold text-foreground">{dueText}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Amount</p>
            <p className="text-xl font-bold tracking-tight text-foreground tabular-nums">
              {formatINR(amount)}
            </p>
          </div>
        </div>
      </div>

      {actions && <div className="mt-4 pt-3 border-t border-border/50 flex justify-end gap-2">{actions}</div>}
    </div>
  )
}

