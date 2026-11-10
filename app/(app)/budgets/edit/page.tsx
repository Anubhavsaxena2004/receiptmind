import type { Metadata } from 'next'
import { BudgetForm } from './budget-form'
import { PageHeader } from '@/components/page-header'
import { CATEGORIES } from '@/lib/categories'
import { getData } from '@/lib/data'

export const metadata: Metadata = { title: 'Edit budgets' }

export default async function EditBudgetsPage() {
  const db = await getData()
  const limits = Object.fromEntries(CATEGORIES.map((c) => [c.id, db.budgets.find((b) => b.category === c.id)?.limit ?? 0]))
  return (
    <>
      <PageHeader
        title="Edit monthly limits"
        description="Set how much you want to spend on each category per month. Leave 0 for no limit."
        back={{ href: '/budgets', label: 'Budgets' }}
      />
      <BudgetForm limits={limits} />
    </>
  )
}
