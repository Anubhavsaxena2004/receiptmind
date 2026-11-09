import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const fieldBase =
  'w-full rounded-xl border border-input bg-card px-3 text-[0.95rem] outline-none transition placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-destructive'

export function Input({ className, ...props }: React.ComponentProps<'input'>) {
  return <input className={cn(fieldBase, 'h-11', className)} {...props} />
}

export function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return <textarea className={cn(fieldBase, 'min-h-20 py-2.5', className)} {...props} />
}

export function Select({ className, children, ...props }: React.ComponentProps<'select'>) {
  return (
    <div className="relative">
      <select className={cn(fieldBase, 'h-11 appearance-none pr-9', className)} {...props}>
        {children}
      </select>
      <ChevronDown aria-hidden className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
}

export function Field({
  label,
  hint,
  htmlFor,
  children,
  className,
}: {
  label: string
  hint?: React.ReactNode
  htmlFor?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={htmlFor} className="block text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

/** ₹-prefixed number input. */
export function MoneyInput({ className, ...props }: React.ComponentProps<'input'>) {
  return (
    <div className="relative">
      <span aria-hidden className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground">
        ₹
      </span>
      <Input type="number" inputMode="decimal" min={0} step="any" className={cn('pl-7', className)} {...props} />
    </div>
  )
}
