import { CircleCheck, Info, TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'

type Icon = React.ComponentType<{ className?: string }>

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: Icon
  title: string
  body: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed bg-card px-6 py-10 text-center">
      <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
        <Icon className="size-6" />
      </div>
      <p className="font-semibold">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

/** Stat tile: label · value · optional helper line. */
export function StatTile({
  label,
  value,
  helper,
  icon: Icon,
  children,
}: {
  label: string
  value: React.ReactNode
  helper?: React.ReactNode
  icon?: Icon
  children?: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {Icon && (
          <span className="flex size-9 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
            <Icon className="size-[18px]" />
          </span>
        )}
      </div>
      <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
      {helper && <p className="mt-1 text-sm text-muted-foreground">{helper}</p>}
      {children}
    </div>
  )
}

/**
 * Meter: the fill carries severity (blue → amber at 80% → red when over);
 * the track is a lighter step of the same hue. Always paired with text.
 */
export function Meter({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max > 0 ? value / max : value > 0 ? 1.01 : 0
  const fill = pct > 1 ? 'bg-danger' : pct >= 0.8 ? 'bg-warning-fill' : 'bg-primary'
  const track = pct > 1 ? 'bg-danger-soft' : pct >= 0.8 ? 'bg-warning-soft' : 'bg-secondary'
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.round(value)}
      className={cn('h-2 w-full overflow-hidden rounded-full', track)}
    >
      <div className={cn('h-full rounded-full transition-all', fill)} style={{ width: `${Math.min(100, pct * 100)}%` }} />
    </div>
  )
}

export function Notice({
  tone = 'info',
  title,
  children,
  className,
}: {
  tone?: 'info' | 'warning' | 'success'
  title?: string
  children: React.ReactNode
  className?: string
}) {
  const styles = {
    info: { box: 'border-secondary bg-secondary/60', icon: Info, iconColor: 'text-secondary-foreground' },
    warning: { box: 'border-warning-soft bg-warning-soft/70', icon: TriangleAlert, iconColor: 'text-warning' },
    success: { box: 'border-success-soft bg-success-soft/70', icon: CircleCheck, iconColor: 'text-success' },
  }[tone]
  const Icon = styles.icon
  return (
    <div className={cn('flex gap-3 rounded-2xl border p-4 text-sm', styles.box, className)}>
      <Icon className={cn('mt-0.5 size-4 shrink-0', styles.iconColor)} aria-hidden />
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        <div className={cn(title && 'mt-0.5', 'text-foreground/85')}>{children}</div>
      </div>
    </div>
  )
}

export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-base font-semibold">{children}</h2>
      {action}
    </div>
  )
}
