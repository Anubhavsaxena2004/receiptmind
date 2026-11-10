'use client'

import dynamic from 'next/dynamic'
import type { CategoryId } from '@/lib/types'

export interface ExpenseRow {
  id: string
  date: string
  title: string
  category: CategoryId
  categoryLabel: string
  amount: number
  source: 'manual' | 'receipt' | 'bill'
  note?: string
}

/** AG Grid runs only in the browser. */
const Grid = dynamic(() => import('./expenses-grid-inner'), {
  ssr: false,
  loading: () => <div className="h-96 animate-pulse rounded-2xl border bg-card" />,
})

export function ExpensesGrid({ rows }: { rows: ExpenseRow[] }) {
  return <Grid rows={rows} />
}
