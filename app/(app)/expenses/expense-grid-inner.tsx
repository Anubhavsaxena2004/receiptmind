'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { AgGridReact } from 'ag-grid-react'
import {
  AllCommunityModule,
  ModuleRegistry,
  themeQuartz,
  type ColDef,
  type GridApi,
  type ICellRendererParams,
} from 'ag-grid-community'
import { Download, ReceiptText, ScanLine, Search, Trash2 } from 'lucide-react'
import { ActionButton } from '@/components/action-button'
import { Badge } from '@/components/ui/badge'
import { deleteExpense } from '@/lib/actions/expenses'
import { category } from '@/lib/categories'
import { formatDate, formatINR } from '@/lib/format'
import type { Expense } from '@/lib/types'
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

function TitleCell({ data }: ICellRendererParams<Expense>) {
  if (!data) return null
  return (
    <div className="flex h-full flex-col justify-center leading-tight">
      <span className="font-semibold text-foreground truncate">{data.title}</span>
      {data.note && <span className="text-xs text-muted-foreground truncate">{data.note}</span>}
    </div>
  )
}

function CategoryCell({ value }: ICellRendererParams<Expense, string>) {
  if (!value) return null
  const cat = category(value as never)
  return (
    <div className="flex h-full items-center">
      <Badge tone={cat.essential ? 'primary' : 'neutral'}>{cat.label}</Badge>
    </div>
  )
}

function SourceCell({ value }: ICellRendererParams<Expense, string>) {
  if (value === 'receipt') {
    return (
      <div className="flex h-full items-center">
        <Badge icon={ScanLine} tone="primary">
          Receipt
        </Badge>
      </div>
    )
  }
  if (value === 'bill') {
    return (
      <div className="flex h-full items-center">
        <Badge tone="neutral">Bill payment</Badge>
      </div>
    )
  }
  return (
    <div className="flex h-full items-center">
      <span className="text-xs text-muted-foreground">Manual</span>
    </div>
  )
}

function ActionsCell({ data }: ICellRendererParams<Expense>) {
  if (!data || data.source === 'bill') return null
  return (
    <div className="flex h-full items-center justify-center">
      <ActionButton
        action={deleteExpense}
        fields={{ id: data.id }}
        variant="ghost"
        size="sm"
        confirm={{
          title: `Delete “${data.title}”?`,
          body: `${formatINR(data.amount)} goes back to your money available.`,
          confirmLabel: 'Delete',
        }}
        className="size-8 p-0 text-muted-foreground hover:text-danger"
      >
        <Trash2 className="size-4" />
        <span className="sr-only">Delete {data.title}</span>
      </ActionButton>
    </div>
  )
}

export default function ExpenseGridInner({ rows }: { rows: Expense[] }) {
  const gridRef = useRef<AgGridReact<Expense>>(null)
  const [quickFilter, setQuickFilter] = useState('')

  const onExport = useCallback(() => {
    gridRef.current?.api?.exportDataAsCsv({
      fileName: `tinku-expenses-${new Date().toISOString().slice(0, 10)}.csv`,
    })
  }, [])

  const columns = useMemo<ColDef<Expense>[]>(
    () => [
      {
        field: 'date',
        headerName: 'Date',
        sort: 'desc',
        width: 120,
        minWidth: 100,
        valueFormatter: (p) => (p.value ? formatDate(p.value) : ''),
      },
      {
        field: 'title',
        headerName: 'Expense',
        flex: 1.5,
        minWidth: 180,
        cellRenderer: TitleCell,
      },
      {
        field: 'category',
        headerName: 'Category',
        width: 140,
        minWidth: 120,
        cellRenderer: CategoryCell,
      },
      {
        field: 'source',
        headerName: 'Source',
        width: 130,
        minWidth: 110,
        cellRenderer: SourceCell,
      },
      {
        field: 'amount',
        headerName: 'Amount',
        type: 'rightAligned',
        width: 120,
        minWidth: 100,
        valueFormatter: (p) => formatINR(p.value ?? 0),
        cellClass: 'font-bold tabular-nums text-foreground',
      },
      {
        headerName: '',
        width: 60,
        sortable: false,
        filter: false,
        cellRenderer: ActionsCell,
      },
    ],
    [],
  )

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={quickFilter}
            onChange={(e) => setQuickFilter(e.target.value)}
            placeholder="Search spreadsheet rows…"
            className="h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-card pr-3 pl-9 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <button
          type="button"
          onClick={onExport}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-card px-4 text-xs font-semibold text-foreground transition hover:bg-muted shadow-2xs"
        >
          <Download className="size-3.5" /> Export to CSV
        </button>
      </div>

      <div className="h-[480px] w-full overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-card shadow-sm">
        <AgGridReact
          ref={gridRef}
          theme={theme}
          rowData={rows}
          columnDefs={columns}
          quickFilterText={quickFilter}
          animateRows
          pagination
          paginationPageSize={10}
          paginationPageSizeSelector={[10, 25, 50, 100]}
          domLayout="normal"
        />
      </div>
    </div>
  )
}
