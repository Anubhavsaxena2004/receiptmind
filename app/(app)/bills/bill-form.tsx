'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import { useGuardedSubmit } from '@/components/auth/auth-context'
import { MODE_INFO } from '@/components/status'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Field, Input, MoneyInput, Select } from '@/components/ui/input'
import { saveBill } from '@/lib/actions/bills'
import { CATEGORIES, category } from '@/lib/categories'
import { FREQUENCY_LABEL } from '@/lib/format'
import type { CategoryId, Frequency, PaymentMode } from '@/lib/types'
import { cn } from '@/lib/utils'

export interface BillFormValues {
  id?: string
  name: string
  payee: string
  amount: string
  category: CategoryId
  essential: boolean
  frequency: Frequency
  mode: PaymentMode
  dueDate: string
}

export function BillForm({ initial, cancelHref }: { initial: BillFormValues; cancelHref: string }) {
  const [state, formAction, pending] = useActionState(saveBill, {})
  // A new bill is the guest's own data (saved after login); editing a sample bill is not.
  const onSubmit = useGuardedSubmit(
    formAction,
    initial.id
      ? { mode: 'sample', reason: 'This is a sample bill. Sign up to add and edit your own bills.' }
      : { mode: 'resume', reason: 'Create a free account (or log in) to save this bill to your own account.' },
  )
  const [v, setV] = useState(initial)
  const set = <K extends keyof BillFormValues>(k: K, value: BillFormValues[K]) => setV((prev) => ({ ...prev, [k]: value }))

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {v.id && <input type="hidden" name="id" value={v.id} />}
      <Card className="space-y-4 p-5">
        <p className="text-sm font-semibold">
          <span className="mr-2 inline-flex size-6 items-center justify-center rounded-full bg-secondary text-xs text-secondary-foreground">1</span>
          What’s the bill?
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Bill name" htmlFor="name">
            <Input id="name" name="name" value={v.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Electricity" required maxLength={60} />
          </Field>
          <Field label="Paid to" htmlFor="payee" hint="Who receives the money.">
            <Input id="payee" name="payee" value={v.payee} onChange={(e) => set('payee', e.target.value)} placeholder="e.g. State electricity board" maxLength={60} />
          </Field>
          <Field label="Amount" htmlFor="amount">
            <MoneyInput id="amount" name="amount" value={v.amount} onChange={(e) => set('amount', e.target.value)} required />
          </Field>
          <Field label="Next due date" htmlFor="dueDate">
            <Input id="dueDate" name="dueDate" type="date" value={v.dueDate} onChange={(e) => set('dueDate', e.target.value)} required />
          </Field>
          <Field label="Repeats" htmlFor="frequency">
            <Select id="frequency" name="frequency" value={v.frequency} onChange={(e) => set('frequency', e.target.value as Frequency)}>
              {(Object.keys(FREQUENCY_LABEL) as Frequency[]).map((f) => (
                <option key={f} value={f}>
                  {FREQUENCY_LABEL[f]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Category" htmlFor="category">
            <Select
              id="category"
              name="category"
              value={v.category}
              onChange={(e) => {
                const c = e.target.value as CategoryId
                setV((prev) => ({ ...prev, category: c, essential: category(c).essential }))
              }}
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <label className="flex items-start gap-3 rounded-xl border p-3">
          <input
            type="checkbox"
            name="essential"
            checked={v.essential}
            onChange={(e) => set('essential', e.target.checked)}
            className="mt-1 size-4 accent-[var(--primary)]"
          />
          <span>
            <span className="block text-sm font-semibold">This is an essential bill</span>
            <span className="block text-sm text-muted-foreground">Essential bills are protected first in an emergency (rent, electricity, fees).</span>
          </span>
        </label>
      </Card>

      <Card className="p-5">
        <p className="text-sm font-semibold">
          <span className="mr-2 inline-flex size-6 items-center justify-center rounded-full bg-secondary text-xs text-secondary-foreground">2</span>
          How should Tinku handle it?
        </p>
        <div role="radiogroup" aria-label="Payment mode" className="mt-4 grid gap-3 sm:grid-cols-3">
          {(Object.keys(MODE_INFO) as PaymentMode[]).map((m) => {
            const info = MODE_INFO[m]
            const Icon = info.icon
            const checked = v.mode === m
            return (
              <label
                key={m}
                className={cn(
                  'flex cursor-pointer flex-col gap-2 rounded-2xl border-2 p-4 transition',
                  checked ? 'border-primary bg-secondary/50' : 'border-border hover:border-primary/40',
                )}
              >
                <input type="radio" name="mode" value={m} checked={checked} onChange={() => set('mode', m)} className="sr-only" />
                <span className="flex items-center gap-2">
                  <span className={cn('flex size-8 items-center justify-center rounded-lg', checked ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
                    <Icon className="size-4" />
                  </span>
                  <span className="font-semibold">{info.label}</span>
                </span>
                <span className="text-sm text-muted-foreground">{info.description}</span>
              </label>
            )
          })}
        </div>
        {v.mode === 'autopay' && (
          <p className="mt-3 text-sm text-muted-foreground">Next, you’ll approve a maximum amount for AutoPay. Nothing is charged until then.</p>
        )}
      </Card>

      {state.error && (
        <p role="alert" className="text-sm font-medium text-danger">
          {state.error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="lg" disabled={pending}>
          {pending && <LoaderCircle className="animate-spin" />}
          {v.id ? 'Save changes' : v.mode === 'autopay' ? 'Save & set up AutoPay' : 'Save bill'}
        </Button>
        <Link href={cancelHref} className={buttonVariants({ variant: 'ghost', size: 'lg' })}>
          Cancel
        </Link>
      </div>
    </form>
  )
}
