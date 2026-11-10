import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  iconColorClass?: string
  iconBgClass?: string
  href?: string
  trend?: {
    value: string
    positive?: boolean
  }
  sublabel?: string
  className?: string
}

export function StatCard({
  label,
  value,
  icon: Icon,
  iconColorClass = 'text-primary',
  iconBgClass = 'bg-secondary',
  href,
  trend,
  sublabel,
  className,
}: StatCardProps) {
  const content = (
    <div
      className={cn(
        'group flex flex-col justify-between rounded-2xl border border-border bg-card p-4 transition-all duration-200',
        href && 'hover:border-primary/40 hover:shadow-md cursor-pointer active:scale-[0.99]',
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-xl border border-border/60 transition-transform group-hover:scale-105',
            iconBgClass,
            iconColorClass,
          )}
        >
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground truncate">{label}</p>
          <p className="text-xl font-bold tracking-tight text-foreground sm:text-2xl tabular-nums truncate">
            {value}
          </p>
        </div>
      </div>

      {(trend || sublabel) && (
        <div className="mt-2.5 flex items-center justify-between text-xs pt-2 border-t border-border/50">
          {sublabel && <span className="text-muted-foreground truncate">{sublabel}</span>}
          {trend && (
            <span
              className={cn(
                'font-semibold tabular-nums ml-auto',
                trend.positive ? 'text-success' : 'text-danger',
              )}
            >
              {trend.value}
            </span>
          )}
        </div>
      )}
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="block outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-2xl">
        {content}
      </Link>
    )
  }

  return content
}

