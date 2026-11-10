import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { ArrowRight, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

export type QuickActionTone = 'green' | 'orange' | 'blue' | 'purple' | 'amber' | 'rose' | 'default'

export interface QuickActionProps {
  href: string
  label: string
  icon: LucideIcon
  tone?: QuickActionTone
  actionType?: 'plus' | 'arrow'
  badge?: string
  className?: string
}

export function QuickAction({
  href,
  label,
  icon: Icon,
  tone = 'default',
  actionType = 'arrow',
  badge,
  className,
}: QuickActionProps) {
  let toneStyles =
    'border-border bg-card text-foreground hover:bg-muted/80 dark:hover:bg-muted/50'
  let iconStyles = 'text-primary'

  switch (tone) {
    case 'orange':
    case 'green':
      toneStyles =
        'border-primary/30 bg-secondary/80 text-foreground hover:bg-secondary dark:border-primary/30 dark:bg-secondary/40 dark:hover:bg-secondary/60'
      iconStyles = 'text-primary'
      break

    case 'blue':
      toneStyles =
        'border-sky-200/60 bg-sky-50/60 text-sky-950 hover:bg-sky-100/70 dark:border-sky-900/40 dark:bg-sky-950/30 dark:text-sky-200 dark:hover:bg-sky-950/50'
      iconStyles = 'text-sky-600 dark:text-sky-400'
      break

    case 'purple':
      toneStyles =
        'border-purple-200/60 bg-purple-50/60 text-purple-950 hover:bg-purple-100/70 dark:border-purple-900/40 dark:bg-purple-950/30 dark:text-purple-200 dark:hover:bg-purple-950/50'
      iconStyles = 'text-purple-600 dark:text-purple-400'
      break

    case 'amber':
      toneStyles =
        'border-amber-200/60 bg-amber-50/60 text-amber-950 hover:bg-amber-100/70 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200 dark:hover:bg-amber-950/50'
      iconStyles = 'text-amber-600 dark:text-amber-400'
      break

    case 'rose':
      toneStyles =
        'border-rose-200/60 bg-rose-50/60 text-rose-950 hover:bg-rose-100/70 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200 dark:hover:bg-rose-950/50'
      iconStyles = 'text-rose-600 dark:text-rose-400'
      break
  }

  const ActionIcon = actionType === 'plus' ? Plus : ArrowRight

  return (
    <Link
      href={href}
      className={cn(
        'group flex items-center justify-between rounded-xl border px-4 py-3.5 text-sm font-semibold transition-all duration-150 shadow-2xs hover:shadow-xs active:scale-[0.99]',
        toneStyles,
        className,
      )}
    >
      <span className="flex items-center gap-3 min-w-0">
        <Icon className={cn('size-5 shrink-0 transition-transform group-hover:scale-110', iconStyles)} aria-hidden="true" />
        <span className="truncate">{label}</span>
      </span>

      <span className="flex items-center gap-2 shrink-0">
        {badge && (
          <span className="rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {badge}
          </span>
        )}
        <ActionIcon
          className="size-4 opacity-70 transition-transform group-hover:translate-x-0.5 group-hover:opacity-100"
          aria-hidden="true"
        />
      </span>
    </Link>
  )
}

