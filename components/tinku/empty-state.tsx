import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 px-6 py-12 text-center',
        className,
      )}
    >
      <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground ring-8 ring-muted/20">
        <Icon className="size-7" aria-hidden="true" />
      </div>

      <h3 className="mt-4 text-base font-bold text-foreground">{title}</h3>
      <p className="mt-1 max-w-sm text-xs text-muted-foreground leading-relaxed">{description}</p>

      {action && (
        <div className="mt-5">
          {action.href ? (
            <Link href={action.href} className={buttonVariants({ size: 'sm', variant: 'default' })}>
              {action.label}
            </Link>
          ) : action.onClick ? (
            <button onClick={action.onClick} className={buttonVariants({ size: 'sm', variant: 'default' })}>
              {action.label}
            </button>
          ) : null}
        </div>
      )}
    </div>
  )
}

