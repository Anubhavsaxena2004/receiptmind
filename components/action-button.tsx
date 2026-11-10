'use client'

import Link from 'next/link'
import { startTransition, useActionState, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { LoaderCircle } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-context'
import { ConfirmDialog, type ConfirmCopy } from '@/components/confirm-dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ActionState } from '@/lib/types'

type Variant = 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive' | 'link'
type Size = 'default' | 'sm' | 'lg' | 'xs'

/** Shows why an action needs an account / verified email, with the next step. */
export function AuthHint({ state }: { state: ActionState }) {
  const pathname = usePathname()
  if (state.needsAuth === 'verify') {
    return (
      <Link href={`/verify?next=${encodeURIComponent(pathname)}`} className="mt-1 inline-block text-xs font-semibold text-primary underline-offset-2 hover:underline">
        Verify your email →
      </Link>
    )
  }
  if (state.needsAuth === 'login') {
    return (
      <Link href={`/login?next=${encodeURIComponent(pathname)}`} className="mt-1 inline-block text-xs font-semibold text-primary underline-offset-2 hover:underline">
        Log in →
      </Link>
    )
  }
  return null
}

/**
 * A one-click server action with pending state, an optional confirm dialog and an
 * inline result. Guests see the login popup instead (the server checks again).
 */
export function ActionButton({
  action,
  fields,
  children,
  variant = 'default',
  size = 'default',
  confirm,
  guest = 'sample',
  guestReason,
  className,
  formClassName,
}: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>
  fields?: Record<string, string | number>
  children: React.ReactNode
  variant?: Variant
  size?: Size
  confirm?: string | ConfirmCopy
  /** What a guest's click means: change the sample (sign up instead) or their own new data (save after login). */
  guest?: 'sample' | 'resume'
  guestReason?: string
  className?: string
  formClassName?: string
}) {
  const [state, dispatch, pending] = useActionState(action, {})
  const [asking, setAsking] = useState(false)
  const form = useRef<HTMLFormElement>(null)
  const { requireAccount } = useAuth()
  const copy: ConfirmCopy | null = typeof confirm === 'string' ? { title: confirm } : (confirm ?? null)

  const run = () => {
    if (!form.current) return
    const fd = new FormData(form.current)
    startTransition(() => dispatch(fd))
  }

  return (
    <form
      ref={form}
      className={cn('inline-flex flex-col', formClassName)}
      onSubmit={(e) => {
        e.preventDefault()
        if (!requireAccount({ mode: guest, reason: guestReason, resume: run })) return
        if (copy) setAsking(true)
        else run()
      }}
    >
      {fields && Object.entries(fields).map(([k, v]) => <input key={k} type="hidden" name={k} value={String(v)} />)}
      <Button type="submit" variant={variant} size={size} disabled={pending} className={className}>
        {pending && <LoaderCircle className="animate-spin" aria-hidden />}
        {children}
      </Button>
      {state.error && (
        <p role="alert" className="mt-1.5 max-w-xs text-xs font-medium text-danger">
          {state.error}
        </p>
      )}
      <AuthHint state={state} />
      {state.message && (
        <p role="status" className="mt-1.5 max-w-xs text-xs font-medium text-success">
          {state.message}
        </p>
      )}
      {copy && <ConfirmDialog open={asking} onOpenChange={setAsking} copy={copy} onConfirm={run} />}
    </form>
  )
}
