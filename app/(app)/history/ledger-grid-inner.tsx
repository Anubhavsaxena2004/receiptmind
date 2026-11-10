'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AgGridReact } from 'ag-grid-react'
import {
  AllCommunityModule,
  ModuleRegistry,
  themeQuartz,
  type ColDef,
  type ICellRendererParams,
} from 'ag-grid-community'
import { Search } from 'lucide-react'
import type { LedgerRow } from './ledger-grid'
import { PAYMENT_STATUS_INFO, PaymentBadge } from '@/components/status'
import { formatDateTime, formatINR } from '@/lib/format'
import type { PaymentStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

ModuleRegistry.registerModules([AllCommunityModule])

const theme = themeQuartz.withParams({
  accentColor: 'var(--primary)',
  backgroundColor: 'var(--card)',
  foregroundColor: 'var(--foreground)',
  borderColor: 'var(--border)',
  headerBackgroundColor: 'var(--muted)',
  headerTextColor: 'var(--muted-foreground)',
  rowHoverColor: 'var(--accent)',
  fontFamily: 'inherit',
  fontSize: 14,
  headerFontWeight: 600,
  wrapperBorderRadius: 16,
  rowVerticalPaddingScale: 1.3,
})

const FILTERS: { key: 'all' | PaymentStatus; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'captured', label: PAYMENT_STATUS_INFO.captured.label },
  { key: 'pending', label: PAYMENT_STATUS_INFO.pending.label },
  { key: 'failed', label: PAYMENT_STATUS_INFO.failed.label },
  { key: 'cancelled', label: PAYMENT_STATUS_INFO.cancelled.label },
]

const RANGES = [
  { key: 'all', label: 'All time', days: 0 },
  { key: '7', label: 'Last 7 days', days: 7 },
  { key: '30', label: 'Last 30 days', days: 30 },
  { key: '90', label: 'Last 90 days', days: 90 },
] as const
type RangeKey = (typeof RANGES)[number]['key']

function BillCell({ data }: ICellRendererParams<LedgerRow>) {
  if (!data) return null
  return (
    <div className="flex h-full flex-col justify-center leading-tight">
      <span className="font-medium">{data.label}</span>
      <span className="text-xs text-muted-foreground">{data.payee}</span>
    </div>
  )
}

function StatusCell({ value }: ICellRendererParams<LedgerRow, PaymentStatus>) {
  return value ? (
    <div className="flex h-full items-center">
      <PaymentBadge status={value} />
    </div>
  ) : null
}

export default function LedgerGridInner({ rows }: { rows: LedgerRow[] }) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'all' | PaymentStatus>('all')
  const [range, setRange] = useState<RangeKey>('all')

  const visible = useMemo(() => {
    const days = RANGES.find((r) => r.key === range)?.days ?? 0
    const from = days ? Date.now() - days * 86_400_000 : 0
    return rows.filter((r) => (status === 'all' || r.status === status) && Date.parse(r.createdAt) >= from)
  }, [rows, status, range])

  const columns = useMemo<ColDef<LedgerRow>[]>(
    () => [
      {
        field: 'createdAt',
        headerName: 'Date',
        sort: 'desc',
        width: 140,
        minWidth: 120,
        valueFormatter: (p) => (p.value ? formatDateTime(p.value) : ''),
      },
      { field: 'label', headerName: 'Bill', flex: 1, minWidth: 180, cellRenderer: BillCell },
      { field: 'status', headerName: 'Status', width: 130, minWidth: 120, cellRenderer: StatusCell },
      {
        field: 'amountInr',
        headerName: 'Amount',
        type: 'rightAligned',
        width: 110,
        valueFormatter: (p) => formatINR(p.value ?? 0),
        cellClass: ['ag-right-aligned-cell', 'tabular-nums', 'font-semibold'],
      },
      { field: 'mode', headerName: 'How', width: 125 },
      { field: 'charge', headerName: 'Charged', type: 'rightAligned', width: 105, cellClass: ['ag-right-aligned-cell', 'tabular-nums'] },
      { field: 'provider', headerName: 'Provider', width: 140 },
    ],
    [],
  )

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div role="radiogroup" aria-label="Filter by status" className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              role="radio"
              aria-checked={status === f.key}
              onClick={() => setStatus(f.key)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-sm font-medium transition',
                status === f.key ? 'border-primary bg-secondary text-secondary-foreground' : 'bg-card hover:border-primary/40',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
        <label className="block">
          <span className="sr-only">Date range</span>
          <select
            value={range}
            onChange={(e) => setRange(e.target.value as RangeKey)}
            className="h-10 rounded-xl border border-input bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25"
          >
            {RANGES.map((r) => (
              <option key={r.key} value={r.key}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
        <label className="relative block flex-1 sm:w-64">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search payments"
            aria-label="Search payments"
            className="h-10 w-full rounded-xl border border-input bg-card pr-3 pl-9 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25"
          />
        </label>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Click a row (or press Enter on it) to open the payment’s verified timeline.</p>
      <AgGridReact<LedgerRow>
        theme={theme}
        rowData={visible}
        columnDefs={columns}
        defaultColDef={{ sortable: true, resizable: true, suppressMovable: true }}
        quickFilterText={query}
        domLayout="autoHeight"
        rowHeight={60}
        pagination
        paginationPageSize={10}
        paginationPageSizeSelector={[10, 25, 50]}
        getRowId={(p) => p.data.id}
        onRowClicked={(e) => e.data && router.push(`/payments/${e.data.id}`)}
        onCellKeyDown={(e) => {
          const key = (e.event as KeyboardEvent | null)?.key
          if (key === 'Enter' && e.data) router.push(`/payments/${e.data.id}`)
        }}
        rowClass="cursor-pointer"
        overlayNoRowsTemplate="No payments match."
      />
    </div>
  )
}
