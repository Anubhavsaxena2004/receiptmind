'use client'

import { useActionState } from 'react'
import { LoaderCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ActionState } from '@/lib/types'

type Variant = 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive' | 'link'
type Size = 'default' | 'sm' | 'lg' | 'xs'

/** A one-click server action with pending state and inline result message. */
export function ActionButton({
  action,
  fields,
  children,
  variant = 'default',
  size = 'default',
  confirm,
  className,
  formClassName,
}: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>
  fields?: Record<string, string | number>
  children: React.ReactNode
  variant?: Variant
  size?: Size
  confirm?: string
  className?: string
  formClassName?: string
}) {
  const [state, formAction, pending] = useActionState(action, {})
  return (
    <form
      action={formAction}
      className={cn('inline-flex flex-col', formClassName)}
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault()
      }}
    >
      {fields &&
        Object.entries(fields).map(([k, v]) => <input key={k} type="hidden" name={k} value={String(v)} />)}
      <Button type="submit" variant={variant} size={size} disabled={pending} className={className}>
        {pending && <LoaderCircle className="animate-spin" aria-hidden />}
        {children}
      </Button>
      {state.error && (
        <p role="alert" className="mt-1.5 max-w-xs text-xs font-medium text-danger">
          {state.error}
        </p>
      )}
      {state.message && (
        <p role="status" className="mt-1.5 max-w-xs text-xs font-medium text-success">
          {state.message}
        </p>
      )}
    </form>
  )
}
