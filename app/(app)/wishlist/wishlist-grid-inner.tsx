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
import { CheckCircle2, Lock, ShoppingBag, Sparkles, Trash2, Zap } from 'lucide-react'
import { ActionButton } from '@/components/action-button'
import { Badge } from '@/components/ui/badge'
import { deleteWishlistItem, executeWishlistPurchase } from '@/lib/actions/wishlist'
import type { WishlistProgressItem } from '@/lib/agentic-commerce'
import { formatINR, formatUSD } from '@/lib/format'
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

function TitleCell({ data }: ICellRendererParams<WishlistProgressItem>) {
  if (!data) return null
  return (
    <div className="flex h-full flex-col justify-center leading-tight">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-foreground truncate">{data.item.title}</span>
        {data.item.url && (
          <a
            href={data.item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-primary hover:underline font-normal"
          >
            Link ↗
          </a>
        )}
      </div>
      {data.item.note && <span className="text-xs text-muted-foreground truncate">{data.item.note}</span>}
    </div>
  )
}

function PriorityCell({ value }: ICellRendererParams<WishlistProgressItem, string>) {
  if (value === 'high') return <Badge tone="danger">High Priority</Badge>
  if (value === 'medium') return <Badge tone="warning">Medium</Badge>
  return <Badge tone="neutral">Low</Badge>
}

function ProgressCell({ data }: ICellRendererParams<WishlistProgressItem>) {
  if (!data) return null
  if (data.item.purchased) {
    return (
      <div className="flex h-full items-center gap-1.5 text-xs font-semibold text-success">
        <CheckCircle2 className="size-4" /> Fulfilled
      </div>
    )
  }
  return (
    <div className="flex h-full flex-col justify-center gap-1 min-w-28">
      <div className="flex justify-between text-xs">
        <span className="font-bold text-foreground">{data.coveragePct}%</span>
        <span className="text-muted-foreground">{data.unlocked ? 'Funded' : `₹${data.remainingToSave} left`}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            data.unlocked ? 'bg-success' : 'bg-primary',
          )}
          style={{ width: `${data.coveragePct}%` }}
        />
      </div>
    </div>
  )
}

function ActionCell({ data }: ICellRendererParams<WishlistProgressItem>) {
  if (!data) return null
  if (data.item.purchased) {
    return (
      <div className="flex h-full items-center">
        <span className="text-xs text-muted-foreground">Paid with PayPal</span>
      </div>
    )
  }
  return (
    <div className="flex h-full items-center gap-2">
      {data.unlocked ? (
        <ActionButton
          action={executeWishlistPurchase}
          fields={{ id: data.item.id }}
          variant="default"
          size="sm"
          confirm={{
            title: `Buy “${data.item.title}”?`,
            body: `This will charge ${formatINR(data.item.price)} (${formatUSD(data.item.price / 85)} USD) via PayPal Sandbox. Your emergency reserve remains untouched.`,
            confirmLabel: 'Pay with PayPal Sandbox',
            tone: 'default',
          }}
          className="h-8 gap-1 rounded-xl bg-[#0070BA] hover:bg-[#003087] text-white text-xs font-bold shadow-xs"
        >
          <Zap className="size-3.5 fill-current" /> Pay with PayPal
        </ActionButton>
      ) : (
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Lock className="size-3.5" /> Save more to unlock
        </span>
      )}
      <ActionButton
        action={deleteWishlistItem}
        fields={{ id: data.item.id }}
        variant="ghost"
        size="sm"
        confirm={{ title: `Remove “${data.item.title}”?`, body: 'This item will be deleted from your wishlist.', confirmLabel: 'Remove' }}
        className="size-8 p-0 text-muted-foreground hover:text-danger"
      >
        <Trash2 className="size-3.5" />
      </ActionButton>
    </div>
  )
}

export default function WishlistGridInner({ rows }: { rows: WishlistProgressItem[] }) {
  const columns = useMemo<ColDef<WishlistProgressItem>[]>(
    () => [
      {
        field: 'item.title',
        headerName: 'Goal / Wishlist Item',
        flex: 1.5,
        minWidth: 200,
        cellRenderer: TitleCell,
      },
      {
        field: 'item.priority',
        headerName: 'Priority',
        width: 130,
        minWidth: 110,
        cellRenderer: PriorityCell,
      },
      {
        field: 'item.price',
        headerName: 'Target Price',
        type: 'rightAligned',
        width: 130,
        minWidth: 110,
        valueFormatter: (p) => formatINR(p.value ?? 0),
        cellClass: 'font-bold tabular-nums text-foreground',
      },
      {
        headerName: 'Budget Savings Funded',
        width: 180,
        minWidth: 150,
        cellRenderer: ProgressCell,
      },
      {
        headerName: 'Agentic Action',
        flex: 1,
        minWidth: 200,
        sortable: false,
        filter: false,
        cellRenderer: ActionCell,
      },
    ],
    [],
  )

  return (
    <div className="h-[440px] w-full overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-card shadow-sm">
      <AgGridReact
        theme={theme}
        rowData={rows}
        columnDefs={columns}
        animateRows
        pagination
        paginationPageSize={10}
        domLayout="normal"
      />
    </div>
  )
}
