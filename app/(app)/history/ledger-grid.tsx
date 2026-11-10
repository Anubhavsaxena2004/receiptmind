'use client'

import dynamic from 'next/dynamic'
import type { PaymentStatus } from '@/lib/types'

export interface LedgerRow {
  id: string
  createdAt: string
  label: string
  payee: string
  amountInr: number
  charge: string
  provider: string
  mode: string
  status: PaymentStatus
}

/** AG Grid runs only in the browser. */
const Grid = dynamic(() => import('./ledger-grid-inner'), {
  ssr: false,
  loading: () => <div className="h-96 animate-pulse rounded-2xl border bg-card" />,
})

export function LedgerGrid({ rows }: { rows: LedgerRow[] }) {
  return <Grid rows={rows} />
}
