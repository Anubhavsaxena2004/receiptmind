'use client'

import { startTransition, useActionState, useId, useState } from 'react'
import { LoaderCircle, Send, Unplug } from 'lucide-react'
import { ActionButton } from '@/components/action-button'
import { FormError, PasswordInput } from '@/components/auth/forms'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/input'
import { changePasswordAction, deleteAccountAction } from '@/lib/actions/auth'
import { connectZapier, disconnectZapier, testZapier } from '@/lib/actions/misc'
import { submitWithoutReset } from '@/lib/submit'

export function ChangePasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [state, dispatch, pending] = useActionState(changePasswordAction, {})
  const id = useId()
  return (
    <form onSubmit={submitWithoutReset(dispatch)} className="grid gap-4 sm:max-w-md">
      {hasPassword && (
        <Field label="Current password" htmlFor={`${id}-current`}>
          <PasswordInput id={`${id}-current`} name="currentPassword" autoComplete="current-password" />
        </Field>
      )}
      <Field label={hasPassword ? 'New password' : 'Password'} htmlFor={`${id}-new`} hint="At least 8 characters, with a number.">
        <PasswordInput id={`${id}-new`} name="newPassword" autoComplete="new-password" />
      </Field>
      <Field label="Confirm" htmlFor={`${id}-confirm`}>
        <PasswordInput id={`${id}-confirm`} name="confirmPassword" autoComplete="new-password" />
      </Field>
      <FormError state={state} />
      {state.message && (
        <p role="status" className="text-sm font-medium text-success">
          {state.message}
        </p>
      )}
      <div>
        <Button type="submit" disabled={pending}>
          {pending && <LoaderCircle className="animate-spin" aria-hidden />}
          {hasPassword ? 'Change password' : 'Add password'}
        </Button>
      </div>
    </form>
  )
}

export function DeleteAccountForm({ email }: { email: string }) {
  const [state, dispatch, pending] = useActionState(deleteAccountAction, {})
  const [asking, setAsking] = useState(false)
  const [typed, setTyped] = useState('')
  const id = useId()
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        setAsking(true)
      }}
      className="grid gap-3 sm:max-w-md"
    >
      <Field label={`Type ${email} to confirm`} htmlFor={`${id}-email`}>
        <Input id={`${id}-email`} value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
      </Field>
      <FormError state={state} />
      <div>
        <Button type="submit" variant="destructive" disabled={pending || typed.trim().toLowerCase() !== email}>
          {pending && <LoaderCircle className="animate-spin" aria-hidden />}
          Delete my account
        </Button>
      </div>
      <ConfirmDialog
        open={asking}
        onOpenChange={setAsking}
        copy={{
          title: 'Delete your account for good?',
          body: 'Your login, bills, expenses, budgets, groups and payment history are erased. This can’t be undone.',
          confirmLabel: 'Delete everything',
        }}
        onConfirm={() => {
          const fd = new FormData()
          fd.set('confirmEmail', typed)
          startTransition(() => dispatch(fd))
        }}
      />
    </form>
  )
}

export function ZapierConnect({ example }: { example: string }) {
  const [state, dispatch, pending] = useActionState(connectZapier, {})
  const [consent, setConsent] = useState(false)
  const id = useId()
  return (
    <form onSubmit={submitWithoutReset(dispatch)} className="space-y-4">
      <Field label="Your Zapier Catch Hook URL" htmlFor={`${id}-url`} hint="In Zapier: Create Zap → Webhooks by Zapier → Catch Hook → copy the URL.">
        <Input id={`${id}-url`} name="url" type="url" placeholder="https://hooks.zapier.com/hooks/catch/…" required />
      </Field>
      <div className="rounded-xl border bg-muted/40 p-4 text-sm">
        <p className="font-semibold">Exactly what Tinku sends for each notification</p>
        <pre className="mt-2 overflow-x-auto rounded-lg bg-card p-3 text-xs leading-relaxed">{example}</pre>
        <p className="mt-2 text-muted-foreground">
          Only the notification itself. Never your password, balance history, payment details or other people’s data. Zapier only delivers
          messages; it can’t approve or change a payment.
        </p>
      </div>
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="consent" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 size-4 accent-[var(--primary)]" />
        <span>I agree to send my Tinku notifications to this Zapier hook. I can disconnect anytime.</span>
      </label>
      <FormError state={state} />
      <Button type="submit" disabled={pending || !consent}>
        {pending && <LoaderCircle className="animate-spin" aria-hidden />}
        Connect Zapier
      </Button>
    </form>
  )
}

export function ZapierConnected() {
  return (
    <div className="flex flex-wrap gap-2">
      <ActionButton action={testZapier} variant="outline">
        <Send /> Send a test
      </ActionButton>
      <ActionButton
        action={disconnectZapier}
        variant="ghost"
        confirm={{ title: 'Disconnect Zapier?', body: 'New notifications will stay in Tinku only.', confirmLabel: 'Disconnect', tone: 'default' }}
      >
        <Unplug /> Disconnect
      </ActionButton>
    </div>
  )
}
