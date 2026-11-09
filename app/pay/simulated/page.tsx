import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { FlaskConical } from 'lucide-react'
import { ActionButton } from '@/components/action-button'
import { Card } from '@/components/ui/card'
import { approveSimulatedPayment, cancelSimulatedPayment } from '@/lib/actions/bills'
import { getData } from '@/lib/data'
import { formatINR, formatUSD } from '@/lib/format'

export const metadata: Metadata = { title: 'Simulated checkout' }

/** Stand-in for the PayPal approval screen when no PayPal Sandbox keys are configured. */
export default async function SimulatedCheckoutPage({ searchParams }: { searchParams: Promise<{ payment?: string }> }) {
  const { payment: id } = await searchParams
  const db = await getData()
  const p = db.payments.find((x) => x.id === id)
  if (!p || p.provider !== 'simulated') notFound()
  if (p.status !== 'created') redirect(`/payments/${p.id}`)

  return (
    <div className="mx-auto max-w-md py-4">
      <div className="mb-4 flex items-center justify-center gap-2 rounded-full border border-dashed bg-card px-4 py-2 text-sm font-semibold text-muted-foreground">
        <FlaskConical className="size-4" aria-hidden /> Simulated checkout — test mode, no real money
      </div>
      <Card className="p-6 text-center">
        <p className="text-sm text-muted-foreground">You’re approving a payment to</p>
        <p className="mt-1 text-lg font-semibold">{p.payee}</p>
        <p className="mt-5 text-4xl font-bold tracking-tight">{formatUSD(p.chargeAmount)}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          USD · for {p.label} ({formatINR(p.amountInr)})
        </p>
        <div className="mt-7 flex flex-col gap-2">
          <ActionButton action={approveSimulatedPayment} fields={{ paymentId: p.id }} size="lg" formClassName="w-full" className="w-full">
            Approve & pay
          </ActionButton>
          <ActionButton action={cancelSimulatedPayment} fields={{ paymentId: p.id }} variant="ghost" size="lg" formClassName="w-full" className="w-full">
            Cancel and go back
          </ActionButton>
        </div>
      </Card>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        Add PayPal Sandbox keys in your environment to use the real PayPal Sandbox checkout instead.
      </p>
    </div>
  )
}
