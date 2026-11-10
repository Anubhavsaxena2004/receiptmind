'use client'

import { useActionState } from 'react'
import { LoaderCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Field, Input, Textarea } from '@/components/ui/input'
import { createGroup } from '@/lib/actions/misc'
import { useGuardedSubmit } from '@/components/auth/auth-context'

export function NewGroupForm() {
  const [state, formAction, pending] = useActionState(createGroup, {})
  const onSubmit = useGuardedSubmit(formAction, { mode: 'resume', reason: 'Create a free account (or log in) to save this group.' })
  return (
    <form onSubmit={onSubmit}>
      <Card className="space-y-4 p-5">
        <Field label="Group name" htmlFor="name">
          <Input id="name" name="name" placeholder="e.g. Flat 302, Family, Goa trip" required maxLength={40} />
        </Field>
        <Field label="Other people" htmlFor="members" hint="Separate names with commas or new lines.">
          <Textarea id="members" name="members" placeholder="Kabir, Meera" required />
        </Field>
        {state.error && (
          <p role="alert" className="text-sm font-medium text-danger">
            {state.error}
          </p>
        )}
        <Button type="submit" size="lg" disabled={pending}>
          {pending && <LoaderCircle className="animate-spin" />} Create group
        </Button>
      </Card>
    </form>
  )
}
