import Link from 'next/link'
import { CircleCheck, CreditCard, Hourglass } from 'lucide-react'
import { ActionButton } from '@/components/action-button'
import { buttonVariants } from '@/components/ui/button'
import { markPaidOutside, postponeOccurrence, skipOccurrence } from '@/lib/actions/bills'
import type { Bill, Occurrence } from '@/lib/types'

/** The right buttons for a bill's current payment, based on its status and payment mode. */
export function OccurrenceActions({ occ, bill }: { occ: Occurrence; bill: Bill }) {
  if (occ.status === 'processing') {
    return (
      <Link href={`/payments/${occ.paymentId}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
        <Hourglass /> Check payment status
      </Link>
    )
  }

  const id = { occurrenceId: occ.id }
  const needsYou = occ.status === 'due' || occ.status === 'failed'

  const markPaid = (style: 'primary' | 'outline' | 'quiet') => (
    <ActionButton
      action={markPaidOutside}
      fields={id}
      variant={style === 'primary' ? 'default' : style === 'outline' ? 'outline' : 'ghost'}
      size="sm"
    >
      <CircleCheck /> {style === 'quiet' ? 'I paid elsewhere' : 'Mark as paid'}
    </ActionButton>
  )
  const pay = (primary: boolean) => (
    <Link href={`/pay/${occ.id}`} className={buttonVariants({ size: 'sm', variant: primary ? 'default' : 'outline' })}>
      <CreditCard /> {occ.status === 'failed' ? 'Try again' : 'Pay now'}
    </Link>
  )
  const postpone = (
    <ActionButton action={postponeOccurrence} fields={{ ...id, days: 3 }} variant="outline" size="sm">
      Postpone 3 days
    </ActionButton>
  )
  const skip = (
    <ActionButton
      action={skipOccurrence}
      fields={id}
      variant="ghost"
      size="sm"
      confirm="Skip this payment? It stays unpaid. The next one is not affected."
    >
      Skip
    </ActionButton>
  )

  if (!needsYou) {
    return (
      <div className="flex flex-wrap items-start gap-2">
        {bill.mode === 'manual' && pay(false)}
        {markPaid(bill.mode === 'reminder' ? 'outline' : 'quiet')}
      </div>
    )
  }

  if (bill.mode === 'reminder') {
    return (
      <div className="flex flex-wrap items-start gap-2">
        {markPaid('primary')}
        {postpone}
        {skip}
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-start gap-2">
      {pay(true)}
      {postpone}
      {skip}
      {markPaid('quiet')}
    </div>
  )
}
