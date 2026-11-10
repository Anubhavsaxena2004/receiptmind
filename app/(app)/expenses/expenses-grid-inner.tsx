'use client'

import { useMemo, useState } from 'react'
import { AgGridReact } from 'ag-grid-react'
import {
  AllCommunityModule,
  ModuleRegistry,
  themeQuartz,
  type ColDef,
  type ICellRendererParams,
} from 'ag-grid-community'
import { ScanLine } from 'lucide-react'
import type { ExpenseRow } from './expenses-grid'
import { formatDateLong, formatINR } from '@/lib/format'
import type { CategoryId } from '@/lib/types'
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

const SOURCE_LABELS: Record<ExpenseRow['source'], string> = {
  manual: 'Manual',
  receipt: 'Scanned receipt',
  bill: 'Bill payment',
}

function TitleCell({ data }: ICellRendererParams<ExpenseRow>) {
  if (!data) return null
  return (
    <div className="flex h-full flex-col justify-center leading-tight">
      <span className="font-medium">{data.title}</span>
      {data.note && <span className="text-xs text-muted-foreground">{data.note}</span>}
    </div>
  )
}

function SourceCell({ data }: ICellRendererParams<ExpenseRow>) {
  if (!data) return null
  const src = data.source
  return (
    <div className="flex h-full items-center">
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
          src === 'receipt' ? 'bg-primary/10 text-primary' : src === 'bill' ? 'bg-muted text-muted-foreground' : 'bg-muted text-muted-foreground',
        )}
      >
        {src === 'receipt' && <ScanLine className="size-3" aria-hidden />}
        {SOURCE_LABELS[src]}
      </span>
    </div>
  )
}

export default function ExpensesGridInner({ rows }: { rows: ExpenseRow[] }) {
  const [quickFilter, setQuickFilter] = useState('')
  const [catFilter, setCatFilter] = useState<CategoryId | 'all'>('all')

  const visible = useMemo(
    () => (catFilter === 'all' ? rows : rows.filter((r) => r.category === catFilter)),
    [rows, catFilter],
  )

  // Build unique category list from rows
  const cats = useMemo(() => {
    const seen = new Map<CategoryId, string>()
    for (const r of rows) seen.set(r.category, r.categoryLabel)
    return [...seen.entries()].sort((a, b) => a[1].localeCompare(b[1]))
  }, [rows])

  const totalVisible = useMemo(() => visible.reduce((s, r) => s + r.amount, 0), [visible])

  const columns = useMemo<ColDef<ExpenseRow>[]>(
    () => [
      {
        field: 'date',
        headerName: 'Date',
        sort: 'desc',
        width: 130,
        minWidth: 110,
        valueFormatter: (p) => (p.value ? formatDateLong(p.value) : ''),
      },
      { field: 'title', headerName: 'Expense', flex: 1, minWidth: 180, cellRenderer: TitleCell },
      { field: 'categoryLabel', headerName: 'Category', width: 140, minWidth: 110 },
      { field: 'source', headerName: 'Source', width: 160, minWidth: 130, cellRenderer: SourceCell },
      {
        field: 'amount',
        headerName: 'Amount',
        type: 'rightAligned',
        width: 115,
        valueFormatter: (p) => formatINR(p.value ?? 0),
        cellClass: ['ag-right-aligned-cell', 'tabular-nums', 'font-semibold'],
      },
    ],
    [],
  )

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Category pills */}
        <div role="radiogroup" aria-label="Filter by category" className="flex flex-wrap gap-2">
          <button
            type="button"
            role="radio"
            aria-checked={catFilter === 'all'}
            onClick={() => setCatFilter('all')}
            className={cn(
              'rounded-full border px-3 py-1.5 text-sm font-medium transition',
              catFilter === 'all' ? 'border-primary bg-secondary text-secondary-foreground' : 'bg-card hover:border-primary/40',
            )}
          >
            All
          </button>
          {cats.map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={catFilter === id}
              onClick={() => setCatFilter(catFilter === id ? 'all' : id)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-sm font-medium transition',
                catFilter === id ? 'border-primary bg-secondary text-secondary-foreground' : 'bg-card hover:border-primary/40',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Search + total */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            Total: <span className="font-semibold text-foreground">{formatINR(totalVisible)}</span>
          </span>
          <input
            value={quickFilter}
            onChange={(e) => setQuickFilter(e.target.value)}
            placeholder="Search expenses…"
            aria-label="Search expenses"
            className="h-10 w-52 rounded-xl border border-input bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25"
          />
        </div>
      </div>

      <AgGridReact<ExpenseRow>
        theme={theme}
        rowData={visible}
        columnDefs={columns}
        defaultColDef={{ sortable: true, resizable: true, suppressMovable: true }}
        quickFilterText={quickFilter}
        domLayout="autoHeight"
        rowHeight={56}
        pagination
        paginationPageSize={20}
        paginationPageSizeSelector={[10, 20, 50]}
        getRowId={(p) => p.data.id}
        overlayNoRowsTemplate="No expenses match."
      />
    </div>
  )
}

