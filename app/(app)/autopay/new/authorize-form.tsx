'use client'

import { useActionState, useState } from 'react'
import { LoaderCircle, ShieldCheck } from 'lucide-react'
import { AuthHint } from '@/components/action-button'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Field, MoneyInput } from '@/components/ui/input'
import { authorizeAutopay } from '@/lib/actions/autopay'
import { formatINR } from '@/lib/format'
import { useGuardedSubmit } from '@/components/auth/auth-context'
import { cn } from '@/lib/utils'

export function AuthorizeForm({
  billId,
  billName,
  payee,
  billAmount,
  suggested,
}: {
  billId: string
  billName: string
  payee: string
  billAmount: number
  suggested: number
}) {
  const [state, formAction, pending] = useActionState(authorizeAutopay, {})
  const onSubmit = useGuardedSubmit(formAction, { mode: 'sample', reason: 'AutoPay needs your own account and a verified email. Sign up to set it up for your own bills.' })
  const [max, setMax] = useState(String(suggested))
  const [months, setMonths] = useState(12)
  const [consent, setConsent] = useState(false)
  const maxNum = Number(max) || 0

  return (
    <form onSubmit={onSubmit}>
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
            I authorize Tinku to charge up to <strong>{formatINR(maxNum)}</strong> for <strong>{billName}</strong> ({payee}) on each due
            date for <strong>{months} months</strong>. Anything above this limit will wait for my approval. I can pause or cancel anytime,
            and failed charges are not retried automatically.
          </span>
        </label>

        {state.error && (
          <div>
            <p role="alert" className="text-sm font-medium text-danger">
              {state.error}
            </p>
            <AuthHint state={state} />
          </div>
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
