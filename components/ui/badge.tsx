import { cn } from '@/lib/utils'

export type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger'

const TONES: Record<Tone, string> = {
  neutral: 'bg-muted text-muted-foreground',
  primary: 'bg-secondary text-secondary-foreground',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
}

export function Badge({
  tone = 'neutral',
  icon: Icon,
  children,
  className,
}: {
  tone?: Tone
  icon?: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
  children: React.ReactNode
  className?: string
}) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap', TONES[tone], className)}>
      {Icon && <Icon aria-hidden className="size-3.5" />}
      {children}
    </span>
  )
}
