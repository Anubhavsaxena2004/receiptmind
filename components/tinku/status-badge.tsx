import { AlertCircle, CheckCircle2, Clock, RotateCw, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export type StatusType =
  | 'upcoming'
  | 'due_soon'
  | 'overdue'
  | 'paid'
  | 'processing'
  | 'failed'
  | 'manual'
  | 'autopay'
  | 'active'
  | 'paused'

export interface StatusBadgeProps {
  status: StatusType | string
  label?: string
  showIcon?: boolean
  className?: string
}

export function StatusBadge({ status, label, showIcon = true, className }: StatusBadgeProps) {
  let badgeStyle = 'bg-muted text-muted-foreground border-border'
  let Icon = Clock
  let defaultLabel = status

  switch (status) {
    case 'paid':
    case 'active':
      badgeStyle = 'bg-success-soft text-success border-success/30'
      Icon = CheckCircle2
      defaultLabel = status === 'paid' ? 'Paid' : 'Active'
      break

    case 'upcoming':
      badgeStyle = 'bg-warning-soft text-warning border-warning/30'
      Icon = Clock
      defaultLabel = 'Upcoming'
      break

    case 'due_soon':
      badgeStyle = 'bg-warning-soft text-warning font-bold border-warning/40 ring-1 ring-warning/30'
      Icon = AlertCircle
      defaultLabel = 'Due Soon'
      break

    case 'overdue':
    case 'failed':
      badgeStyle = 'bg-danger-soft text-danger font-bold border-danger/40'
      Icon = XCircle
      defaultLabel = status === 'overdue' ? 'Overdue' : 'Failed'
      break

    case 'processing':
      badgeStyle = 'bg-info-soft text-info border-info/30'
      Icon = RotateCw
      defaultLabel = 'Processing'
      break

    case 'autopay':
      badgeStyle = 'bg-primary/10 text-primary border-primary/30 font-semibold'
      Icon = CheckCircle2
      defaultLabel = 'AutoPay'
      break

    case 'manual':
      badgeStyle = 'bg-muted text-muted-foreground border-border'
      Icon = Clock
      defaultLabel = 'Manual'
      break

    case 'paused':
      badgeStyle = 'bg-muted text-muted-foreground border-border'
      Icon = Clock
      defaultLabel = 'Paused'
      break
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide capitalize',
        badgeStyle,
        className,
      )}
    >
      {showIcon && <Icon className={cn('size-3 shrink-0', status === 'processing' && 'animate-spin')} aria-hidden="true" />}
      <span>{label ?? defaultLabel}</span>
    </span>
  )
}

