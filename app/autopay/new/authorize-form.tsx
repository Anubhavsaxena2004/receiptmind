'use client'

import { useActionState, useState } from 'react'
import { LoaderCircle, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Field, MoneyInput } from '@/components/ui/input'
import { authorizeAutopay } from '@/lib/actions/autopay'
import { formatINR } from '@/lib/format'
import { submitWithoutReset } from '@/lib/submit'
import { cn } from '@/lib/utils'

export function AuthorizeForm({
  billId,
  billName,
  billAmount,
  suggested,
}: {
  billId: string
  billName: string
  billAmount: number
  suggested: number
}) {
  const [state, formAction, pending] = useActionState(authorizeAutopay, {})
  const [max, setMax] = useState(String(suggested))
  const [months, setMonths] = useState(12)
  const [consent, setConsent] = useState(false)
  const maxNum = Number(max) || 0

  return (
    <form onSubmit={submitWithoutReset(formAction)}>
      <input type="hidden" name="billId" value={billId} />
      <input type="hidden" name="months" value={months} />
      <Card className="space-y-5 p-5">
        <Field
          label="Most Tinku may charge each time"
          htmlFor="maxAmount"
          hint={`If a bill is ever higher than this, Tinku will ask you instead of paying. The bill is ${formatINR(billAmount)} today.`}
        >
          <MoneyInput id="maxAmount" name="maxAmount" value={max} onChange={(e) => setMax(e.target.value)} min={billAmount} required />
        </Field>

        <fieldset>
          <legend className="mb-1.5 text-sm font-medium">Valid for</legend>
          <div className="grid grid-cols-3 gap-2">
            {[3, 6, 12].map((m) => (
              <label
                key={m}
                className={cn(
                  'cursor-pointer rounded-xl border-2 py-2.5 text-center text-sm font-semibold transition',
                  months === m ? 'border-primary bg-secondary/50' : 'border-border hover:border-primary/40',
                )}
              >
                <input type="radio" name="monthsChoice" className="sr-only" checked={months === m} onChange={() => setMonths(m)} />
                {m} months
              </label>
            ))}
          </div>
        </fieldset>

        <label className="flex items-start gap-3 rounded-xl border bg-muted/40 p-4">
          <input
            type="checkbox"
            name="consent"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1 size-4 accent-[var(--primary)]"
          />
          <span className="text-sm">
            I authorize Tinku to pay <strong>{billName}</strong> on each due date for the next {months} months, up to{' '}
            <strong>{formatINR(maxNum)}</strong> per payment. I can pause or cancel anytime.
          </span>
        </label>

        {state.error && (
          <p role="alert" className="text-sm font-medium text-danger">
            {state.error}
          </p>
        )}
        <Button type="submit" size="lg" disabled={pending || !consent} className="w-full">
          {pending ? <LoaderCircle className="animate-spin" /> : <ShieldCheck />} Authorize AutoPay
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Demo: this authorization is simulated. In production, PayPal Vault would save your payment method here.
        </p>
      </Card>
    </form>
  )
}
