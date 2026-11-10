import type { LucideIcon } from 'lucide-react'
import { formatINR } from '@/lib/format'
import { cn } from '@/lib/utils'

export interface BudgetProgressProps {
  category: string
  limit: number
  spent: number
  icon?: LucideIcon
  className?: string
}

export function BudgetProgress({ category, limit, spent, icon: Icon, className }: BudgetProgressProps) {
  const percentage = limit > 0 ? Math.min(Math.round((spent / limit) * 100), 100) : 0
  const isOver = spent > limit
  const remaining = Math.max(0, limit - spent)
  const overAmount = spent - limit

  // Color tiering
  let barColor = 'bg-primary'
  let statusTextClass = 'text-muted-foreground'

  if (isOver) {
    barColor = 'bg-danger'
    statusTextClass = 'text-danger font-semibold'
  } else if (percentage >= 85) {
    barColor = 'bg-warning'
    statusTextClass = 'text-warning font-semibold'
  }

  return (
    <div className={cn('rounded-xl border border-border bg-card p-4 transition-all', className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {Icon && (
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
              <Icon className="size-4" aria-hidden="true" />
            </span>
          )}
          <span className="font-semibold text-sm text-foreground truncate">{category}</span>
        </div>

        <div className="text-right shrink-0">
          <span className="font-bold text-sm text-foreground tabular-nums">{formatINR(spent)}</span>
          <span className="text-xs text-muted-foreground"> / {formatINR(limit)}</span>
        </div>
      </div>

      {/* Progress Track */}
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full transition-all duration-300 rounded-full', barColor)}
          style={{ width: `${Math.min(100, Math.max(2, (spent / (limit || 1)) * 100))}%` }}
        />
      </div>

      {/* Status Footer */}
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className={statusTextClass}>
          {isOver ? `Over budget by ${formatINR(overAmount)}` : `${formatINR(remaining)} left`}
        </span>
        <span className="text-muted-foreground tabular-nums font-medium">{percentage}%</span>
      </div>
    </div>
  )
}

