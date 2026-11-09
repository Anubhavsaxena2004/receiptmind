import type { Metadata } from 'next'
import { connection } from 'next/server'
import { ExpenseForm } from './expense-form'
import { PageHeader } from '@/components/page-header'
import { todayISO } from '@/lib/dates'

export const metadata: Metadata = { title: 'Add expense' }

export default async function NewExpensePage() {
  await connection()
  return (
    <>
      <PageHeader
        title="Add an expense"
        description="Snap a receipt to fill this in automatically, or type it yourself."
        back={{ href: '/expenses', label: 'Expenses' }}
      />
      <ExpenseForm today={todayISO()} />
    </>
  )
}
