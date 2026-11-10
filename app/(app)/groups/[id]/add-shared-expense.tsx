'use client'

import { useActionState, useEffect, useState } from 'react'
import { LoaderCircle, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Field, Input, MoneyInput, Select } from '@/components/ui/input'
import { addGroupExpense } from '@/lib/actions/misc'
import { formatINR } from '@/lib/format'
import { useGuardedSubmit } from '@/components/auth/auth-context'

export function AddSharedExpense({ groupId, members }: { groupId: string; members: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState(addGroupExpense, {})
  const onSubmit = useGuardedSubmit(formAction, { mode: 'sample', reason: 'This is the sample flat-share. Sign up to create your own group and split real costs.' })
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [paidBy, setPaidBy] = useState(members[0]?.id ?? '')
  const [split, setSplit] = useState<string[]>(members.map((m) => m.id))
  const share = split.length && Number(amount) > 0 ? Number(amount) / split.length : 0

  // Clear the form after a successful save, ready for the next one.
  useEffect(() => {
    if (state.message) {
      setTitle('')
      setAmount('')
    }
  }, [state])

  return (
    <Card className="p-5">
      <form onSubmit={onSubmit} className="space-y-4">
        <input type="hidden" name="groupId" value={groupId} />
        <Field label="What for?" htmlFor="g-title">
          <Input id="g-title" name="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Electricity, groceries" required />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Amount" htmlFor="g-amount">
            <MoneyInput id="g-amount" name="amount" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </Field>
          <Field label="Paid by" htmlFor="g-paid">
            <Select id="g-paid" name="paidBy" value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <fieldset>
          <legend className="mb-1.5 text-sm font-medium">Split equally between</legend>
          <div className="flex flex-wrap gap-2">
            {members.map((m) => {
              const on = split.includes(m.id)
              return (
                <label key={m.id} className={`cursor-pointer rounded-xl border-2 px-3 py-1.5 text-sm font-medium ${on ? 'border-primary bg-secondary/50' : 'border-border'}`}>
                  <input
                    type="checkbox"
                    name="splitAmong"
                    value={m.id}
                    checked={on}
                    onChange={() => setSplit((s) => (on ? s.filter((x) => x !== m.id) : [...s, m.id]))}
                    className="sr-only"
                  />
                  {m.name}
                </label>
              )
            })}
          </div>
          {share > 0 && <p className="mt-2 text-xs text-muted-foreground">{formatINR(share)} each</p>}
        </fieldset>
        {state.error && (
          <p role="alert" className="text-sm font-medium text-danger">
            {state.error}
          </p>
        )}
        {state.message && <p className="text-sm font-medium text-success">{state.message}</p>}
        <Button type="submit" disabled={pending}>
          {pending ? <LoaderCircle className="animate-spin" /> : <Plus />} Add expense
        </Button>
      </form>
    </Card>
  )
}
