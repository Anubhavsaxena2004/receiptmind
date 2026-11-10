'use client'

import Link from 'next/link'
import { useActionState, useEffect, useId, useState } from 'react'
import { Eye, EyeOff, LoaderCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/input'
import { loginAction, signupAction } from '@/lib/actions/auth'
import { submitWithoutReset } from '@/lib/submit'
import type { ActionState } from '@/lib/types'
import { cn } from '@/lib/utils'

export function PasswordInput({ id, name, autoComplete, placeholder }: { id: string; name: string; autoComplete: string; placeholder?: string }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <Input
        id={id}
        name={name}
        type={show ? 'text' : 'password'}
        autoComplete={autoComplete}
        placeholder={placeholder ?? '••••••••'}
        required
        minLength={autoComplete === 'new-password' ? 8 : undefined}
        className="pr-11"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? 'Hide password' : 'Show password'}
        aria-pressed={show}
        className="absolute top-1/2 right-1.5 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  )
}

export function FormError({ state }: { state: ActionState }) {
  if (!state.error) return null
  return (
    <p role="alert" className="rounded-xl bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
      {state.error}
    </p>
  )
}

export function SubmitButton({ pending, children, className }: { pending: boolean; children: React.ReactNode; className?: string }) {
  return (
    <Button type="submit" size="lg" disabled={pending} className={cn('w-full', className)}>
      {pending && <LoaderCircle className="animate-spin" aria-hidden />}
      {children}
    </Button>
  )
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-[18px]" aria-hidden>
      <path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h6a5.1 5.1 0 0 1-2.2 3.4v2.8h3.6c2.1-1.9 3.2-4.8 3.2-8.2Z" />
      <path fill="#34A853" d="M12 23c3 0 5.5-1 7.4-2.7l-3.6-2.8c-1 .7-2.3 1.1-3.8 1.1-2.9 0-5.4-2-6.3-4.6H2v2.9A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.7 14c-.2-.7-.4-1.4-.4-2s.1-1.4.4-2V7.1H2a11 11 0 0 0 0 9.8L5.7 14Z" />
      <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2 7.1L5.7 10c.9-2.7 3.4-4.6 6.3-4.6Z" />
    </svg>
  )
}

/** Shown only when Google sign-in is configured on the server. */
export function GoogleButton({ next, label = 'Continue with Google' }: { next: string; label?: string }) {
  return (
    <>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
      </div>
      <a
        href={`/api/auth/google?next=${encodeURIComponent(next)}`}
        className="flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border bg-card text-sm font-semibold transition hover:bg-muted"
      >
        <GoogleMark /> {label}
      </a>
    </>
  )
}

interface FormProps {
  next: string
  google: boolean
  /** Inside the login popup: report success instead of navigating, so the page can finish its save. */
  onSuccess?: () => void
  /** Switch between log in / sign up without leaving the popup. */
  onSwitch?: () => void
}

function useSuccess(state: ActionState, onSuccess?: () => void) {
  useEffect(() => {
    if (state.ok) onSuccess?.()
  }, [state, onSuccess])
}

export function LoginForm({ next, google, onSuccess, onSwitch }: FormProps) {
  const [state, dispatch, pending] = useActionState(loginAction, {})
  useSuccess(state, onSuccess)
  const id = useId()
  return (
    <div className="space-y-4">
      <form onSubmit={submitWithoutReset(dispatch)} className="space-y-4" noValidate={false}>
        {onSuccess && <input type="hidden" name="inline" value="1" />}
        <input type="hidden" name="next" value={next} />
        <Field label="Email" htmlFor={`${id}-email`}>
          <Input id={`${id}-email`} name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
        </Field>
        <Field label="Password" htmlFor={`${id}-password`}>
          <PasswordInput id={`${id}-password`} name="password" autoComplete="current-password" />
        </Field>
        <div className="-mt-1 text-right">
          <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
            Forgot password?
          </Link>
        </div>
        <FormError state={state} />
        <SubmitButton pending={pending}>Log in</SubmitButton>
      </form>
      {google && <GoogleButton next={next} />}
      <p className="text-center text-sm text-muted-foreground">
        New to Tinku?{' '}
        {onSwitch ? (
          <button type="button" onClick={onSwitch} className="font-semibold text-primary hover:underline">
            Create a free account
          </button>
        ) : (
          <Link href={`/signup?next=${encodeURIComponent(next)}`} className="font-semibold text-primary hover:underline">
            Create a free account
          </Link>
        )}
      </p>
    </div>
  )
}

export function SignupForm({ next, google, onSuccess, onSwitch }: FormProps) {
  const [state, dispatch, pending] = useActionState(signupAction, {})
  useSuccess(state, onSuccess)
  const id = useId()
  return (
    <div className="space-y-4">
      <form onSubmit={submitWithoutReset(dispatch)} className="space-y-4">
        {onSuccess && <input type="hidden" name="inline" value="1" />}
        <input type="hidden" name="next" value={next} />
        <Field label="Full name" htmlFor={`${id}-name`}>
          <Input id={`${id}-name`} name="name" autoComplete="name" placeholder="Your name" required maxLength={40} />
        </Field>
        <Field label="Email" htmlFor={`${id}-email`}>
          <Input id={`${id}-email`} name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
        </Field>
        <Field label="Password" htmlFor={`${id}-password`} hint="At least 8 characters, with a number.">
          <PasswordInput id={`${id}-password`} name="password" autoComplete="new-password" />
        </Field>
        {!onSuccess && (
          <Field label="Confirm password" htmlFor={`${id}-confirm`}>
            <PasswordInput id={`${id}-confirm`} name="confirmPassword" autoComplete="new-password" />
          </Field>
        )}
        <FormError state={state} />
        <SubmitButton pending={pending}>Create account</SubmitButton>
      </form>
      {google && <GoogleButton next={next} label="Sign up with Google" />}
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        {onSwitch ? (
          <button type="button" onClick={onSwitch} className="font-semibold text-primary hover:underline">
            Log in
          </button>
        ) : (
          <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-semibold text-primary hover:underline">
            Log in
          </Link>
        )}
      </p>
    </div>
  )
}
