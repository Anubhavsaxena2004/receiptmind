import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SectionHeaderProps {
  title: string
  subtitle?: string
  count?: number
  viewAllHref?: string
  viewAllLabel?: string
  action?: React.ReactNode
  className?: string
}

export function SectionHeader({
  title,
  subtitle,
  count,
  viewAllHref,
  viewAllLabel = 'View all',
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-3', className)}>
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
          <span>{title}</span>
          {typeof count === 'number' && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
              {count}
            </span>
          )}
        </h2>
        {subtitle && <p className="mt-0.5 text-xs text-muted-foreground truncate">{subtitle}</p>}
      </div>

      {action ? (
        <div className="shrink-0">{action}</div>
      ) : viewAllHref ? (
        <Link
          href={viewAllHref}
          className="group inline-flex items-center gap-0.5 text-xs font-semibold text-primary hover:underline shrink-0 pt-0.5"
        >
          <span>{viewAllLabel}</span>
          <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      ) : null}
    </div>
  )
}

