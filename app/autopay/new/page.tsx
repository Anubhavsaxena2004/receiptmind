import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthorizeForm } from './authorize-form'
import { EmptyState } from '@/components/bits'
import { PageHeader } from '@/components/page-header'
import { buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { currentMandate } from '@/lib/bills'
import { getData } from '@/lib/data'
import { FREQUENCY_LABEL, formatINR } from '@/lib/format'
import { Repeat } from 'lucide-react'

export const metadata: Metadata = { title: 'Authorize AutoPay' }

export default async function AuthorizePage({ searchParams }: { searchParams: Promise<{ bill?: string }> }) {
  const { bill: billId } = await searchParams
  const db = await getData()
  const bill = db.bills.find((b) => b.id === billId && b.active)

  if (!bill) {
    const options = db.bills.filter((b) => b.active)
    return (
      <>
        <PageHeader title="Authorize AutoPay" description="Pick a bill to put on AutoPay." back={{ href: '/autopay', label: 'AutoPay' }} />
        {options.length === 0 ? (
          <EmptyState icon={Repeat} title="No bills yet" body="Add a bill first." />
        ) : (
          <Card className="divide-y">
            {options.map((b) => (
              <Link key={b.id} href={`/autopay/new?bill=${b.id}`} className="flex items-center justify-between p-4 hover:bg-muted/50">
                <span className="font-medium">{b.name}</span>
                <span className="text-sm text-muted-foreground">{formatINR(b.amount)}</span>
              </Link>
            ))}
          </Card>
        )}
      </>
    )
  }

  const existing = currentMandate(db, bill.id)
  const suggested = existing?.maxAmount ?? Math.ceil((bill.amount * 1.2) / 50) * 50

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        title={`AutoPay for ${bill.name}`}
        description="Approve once. Tinku pays on each due date, only within the limit you set here."
        back={{ href: `/bills/${bill.id}`, label: bill.name }}
      />
      <Card className="mb-5 flex items-center justify-between p-5">
        <div>
          <p className="font-semibold">{bill.name}</p>
          <p className="text-sm text-muted-foreground">
            {bill.payee} · {FREQUENCY_LABEL[bill.frequency]}
          </p>
        </div>
        <p className="text-xl font-bold">{formatINR(bill.amount)}</p>
      </Card>
      <AuthorizeForm billId={bill.id} billName={bill.name} billAmount={bill.amount} suggested={suggested} />
      <Link href="/autopay" className={buttonVariants({ variant: 'link' }) + ' mt-2 px-0'}>
        Not now
      </Link>
    </div>
  )
}
