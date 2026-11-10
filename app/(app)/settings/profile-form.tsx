'use client'

import { useActionState } from 'react'
import { LoaderCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, Input, MoneyInput } from '@/components/ui/input'
import { saveProfile } from '@/lib/actions/misc'
import { useGuardedSubmit } from '@/components/auth/auth-context'
import type { Profile } from '@/lib/types'

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, formAction, pending] = useActionState(saveProfile, {})
  const onSubmit = useGuardedSubmit(formAction, { mode: 'resume', reason: 'Create a free account (or log in) to save your own money basics.' })
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name" htmlFor="name">
          <Input id="name" name="name" defaultValue={profile.name} required maxLength={40} />
        </Field>
        <Field label="Money available now" htmlFor="currentBalance" hint="What you can spend today across your accounts.">
          <MoneyInput id="currentBalance" name="currentBalance" defaultValue={profile.currentBalance} min={undefined} required />
        </Field>
        <Field label="Monthly income" htmlFor="monthlyIncome">
          <MoneyInput id="monthlyIncome" name="monthlyIncome" defaultValue={profile.monthlyIncome} required />
        </Field>
        <Field label="Salary usually arrives on day" htmlFor="salaryDay" hint="Day of the month, 1–31.">
          <Input id="salaryDay" name="salaryDay" type="number" min={1} max={31} defaultValue={profile.salaryDay} required />
        </Field>
        <Field label="Emergency reserve" htmlFor="emergencyReserve" hint="Savings kept aside. Only used if a recovery plan needs it.">
          <MoneyInput id="emergencyReserve" name="emergencyReserve" defaultValue={profile.emergencyReserve} required />
        </Field>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" size="lg" disabled={pending}>
          {pending && <LoaderCircle className="animate-spin" />} Save
        </Button>
        {state.message && <span className="text-sm font-medium text-success">{state.message}</span>}
        {state.error && (
          <span role="alert" className="text-sm font-medium text-danger">
            {state.error}
          </span>
        )}
      </div>
    </form>
  )
}
