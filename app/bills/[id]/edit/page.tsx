import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { BillForm } from '../../bill-form'
import { PageHeader } from '@/components/page-header'
import { openOccurrence } from '@/lib/bills'
import { getData } from '@/lib/data'
import { todayISO } from '@/lib/dates'

export const metadata: Metadata = { title: 'Edit bill' }

export default async function EditBillPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = await getData()
  const bill = db.bills.find((b) => b.id === id && b.active)
  if (!bill) notFound()
  const occ = openOccurrence(db, bill.id)
  return (
    <>
      <PageHeader title={`Edit ${bill.name}`} back={{ href: `/bills/${bill.id}`, label: bill.name }} />
      <BillForm
        cancelHref={`/bills/${bill.id}`}
        initial={{
          id: bill.id,
          name: bill.name,
          payee: bill.payee,
          amount: String(bill.amount),
          category: bill.category,
          essential: bill.essential,
          frequency: bill.frequency,
          mode: bill.mode,
          dueDate: occ?.dueDate ?? todayISO(),
        }}
      />
    </>
  )
}
