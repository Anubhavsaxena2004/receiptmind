import type { Metadata } from 'next'
import { connection } from 'next/server'
import { BillForm } from '../bill-form'
import { PageHeader } from '@/components/page-header'
import { addDays, todayISO } from '@/lib/dates'

export const metadata: Metadata = { title: 'Add a bill' }

export default async function NewBillPage() {
  await connection()
  return (
    <>
      <PageHeader
        title="Add a bill"
        description="Tell Tinku about a regular payment and choose how you want it handled."
        back={{ href: '/bills', label: 'Bills' }}
      />
      <BillForm
        cancelHref="/bills"
        initial={{
          name: '',
          payee: '',
          amount: '',
          category: 'utilities',
          essential: true,
          frequency: 'monthly',
          mode: 'manual',
          dueDate: addDays(todayISO(), 7),
        }}
      />
    </>
  )
}
