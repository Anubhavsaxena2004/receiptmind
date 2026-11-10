'use client'

import Link from 'next/link'
import { useActionState, useId, useRef, useState } from 'react'
import { LoaderCircle, MailCheck } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/input'
import { forgotPasswordAction, resendCodeAction, resetPasswordAction, verifyEmailAction } from '@/lib/actions/auth'
import { submitWithoutReset } from '@/lib/submit'
import { FormError, PasswordInput, SubmitButton } from './forms'

/** Mail icon with a status dot, as on the reference screens. */
export function MailBadge() {
  return (
    <div className="relative mx-auto flex size-16 items-center justify-center rounded-2xl border bg-card shadow-sm">
      <MailCheck className="size-8 text-primary" aria-hidden />
      <span className="absolute -top-1.5 -right-1.5 size-4 rounded-full border-2 border-card bg-primary" aria-hidden />
    </div>
  )
}

/** Six single-digit boxes: auto-advance, backspace to go back, paste a whole code. */
function CodeInput({ length = 6 }: { length?: number }) {
  const [digits, setDigits] = useState<string[]>(() => Array(length).fill(''))
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const fill = (start: number, text: string) => {
    const chars = text.replace(/\D/g, '').slice(0, length - start).split('')
    if (!chars.length) return
    setDigits((d) => {
      const next = [...d]
      chars.forEach((c, i) => (next[start + i] = c))
      return next
    })
    refs.current[Math.min(start + chars.length, length - 1)]?.focus()
  }
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium">Confirmation code</legend>
      <input type="hidden" name="code" value={digits.join('')} />
      <div className="flex justify-between gap-2">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el
            }}
            value={d}
            inputMode="numeric"
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            maxLength={length}
            aria-label={`Digit ${i + 1} of ${length}`}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, '')
              if (v.length > 1) return fill(i, v)
              setDigits((prev) => prev.map((x, j) => (j === i ? v : x)))
              if (v) refs.current[i + 1]?.focus()
            }}
            onKeyDown={(e) => {
              if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus()
              if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus()
              if (e.key === 'ArrowRight' && i < length - 1) refs.current[i + 1]?.focus()
            }}
            onPaste={(e) => {
              e.preventDefault()
              fill(i, e.clipboardData.getData('text'))
            }}
            onFocus={(e) => e.target.select()}
            className="h-14 w-full min-w-0 rounded-xl border border-input bg-card text-center text-2xl font-bold tabular-nums outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25"
          />
        ))}
      </div>
    </fieldset>
  )
}

export function VerifyForm({ next }: { next: string }) {
  const [state, dispatch, pending] = useActionState(verifyEmailAction, {})
  return (
    <form onSubmit={submitWithoutReset(dispatch)} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <CodeInput />
      <FormError state={state} />
      <SubmitButton pending={pending}>Verify</SubmitButton>
    </form>
  )
}

export function ResendButton() {
  const [state, dispatch, pending] = useActionState(resendCodeAction, {})
  return (
    <form onSubmit={submitWithoutReset(dispatch)} className="inline">
      <button type="submit" disabled={pending} className="font-semibold text-primary underline-offset-2 hover:underline disabled:opacity-60">
        {pending ? 'Sending…' : 'Send a new code'}
      </button>
      {state.error && <span role="alert" className="mt-2 block text-xs font-medium text-danger">{state.error}</span>}
      {state.message && <span role="status" className="mt-2 block text-xs font-medium text-success">{state.message}</span>}
    </form>
  )
}

export function ForgotForm() {
  const [state, dispatch, pending] = useActionState(forgotPasswordAction, {})
  const id = useId()
  if (state.ok) {
    return (
      <div className="text-center">
        <MailBadge />
        <h1 className="mt-5 text-2xl font-bold tracking-tight">Email sent</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          If an account exists for that email, a link to reset your password is on its way. It can take a few minutes, and the link expires in 30 minutes.
        </p>
        <Link href="/login" className={buttonVariants({ size: 'lg', className: 'mt-6 w-full' })}>
          Continue
        </Link>
      </div>
    )
  }
  return (
    <form onSubmit={submitWithoutReset(dispatch)} className="space-y-4">
      <Field label="Email" htmlFor={`${id}-email`}>
        <Input id={`${id}-email`} name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
      </Field>
      <FormError state={state} />
      <SubmitButton pending={pending}>Send reset link</SubmitButton>
    </form>
  )
}

export function ResetForm({ token }: { token: string }) {
  const [state, dispatch, pending] = useActionState(resetPasswordAction, {})
  const id = useId()
  return (
    <form onSubmit={submitWithoutReset(dispatch)} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <Field label="New password" htmlFor={`${id}-password`} hint="At least 8 characters, with a number.">
        <PasswordInput id={`${id}-password`} name="password" autoComplete="new-password" />
      </Field>
      <Field label="Confirm new password" htmlFor={`${id}-confirm`}>
        <PasswordInput id={`${id}-confirm`} name="confirmPassword" autoComplete="new-password" />
      </Field>
      <FormError state={state} />
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending && <LoaderCircle className="animate-spin" aria-hidden />}
        Set new password
      </Button>
    </form>
  )
}
