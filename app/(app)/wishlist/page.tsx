import type { Metadata } from 'next'
import Link from 'next/link'
import {
  CheckCircle2,
  Gift,
  Lock,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react'
import { ActionButton } from '@/components/action-button'
import { EmptyState, Notice } from '@/components/bits'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { executeWishlistPurchase } from '@/lib/actions/wishlist'
import { evaluateAgenticCommerce } from '@/lib/agentic-commerce'
import { getData } from '@/lib/data'
import { todayISO } from '@/lib/dates'
import { formatINR, formatUSD } from '@/lib/format'
import { cn } from '@/lib/utils'
import { WishlistForm } from './wishlist-form'
import { WishlistGrid } from './wishlist-grid'

export const metadata: Metadata = {
  title: 'Wishlist & Agentic Commerce',
  description: 'AI-driven goal fulfillment powered by budget surplus and PayPal.',
}

export default async function WishlistPage() {
  const db = await getData()
  const today = todayISO()
  const commerce = evaluateAgenticCommerce(db, today)
  const topRec = commerce.topRecommendation

  return (
    <>
      <PageHeader
        title="Wishlist & Agentic Commerce"
        description="Turn budget savings into guilt-free rewards. Tinku AI unlocks your goals only when emergency reserves and upcoming bills are completely safe."
        action={<WishlistForm />}
      />

      {/* Channel3 AI Product Discovery Sponsor Integration Banner */}
      <Card className="mb-6 overflow-hidden border-primary/30 bg-gradient-to-r from-primary/10 via-card to-card p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Sparkles className="size-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-foreground flex items-center gap-2">
                AI Product Discovery <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] text-primary font-extrabold uppercase">Channel3 Partner</span>
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Need goal ideas? The AI co-pilot matches trending lifestyle, tech, and productivity products to your exact budget savings surplus.
              </p>
            </div>
          </div>
          <Link
            href="/expenses/new"
            className={cn(buttonVariants({ size: 'sm', variant: 'outline' }), 'shrink-0 text-xs font-semibold')}
          >
            Log Expense & Recompute
          </Link>
        </div>
      </Card>

      {/* 3 Metrics: Liquidity Breakdown */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {/* Metric 1: Safe Guilt-Free Surplus */}
        <Card className="p-4 shadow-sm border-slate-200/80 dark:border-slate-800">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Available Guilt-Free Surplus</p>
          <p className="mt-1 text-2xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
            {formatINR(commerce.safeSurplus)}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {commerce.safeSurplus > 0 ? 'Ready to fulfill unlocked goals' : 'Save more in everyday budgets'}
          </p>
        </Card>

        {/* Metric 2: Emergency Reserve Protected */}
        <Card className="p-4 shadow-sm border-slate-200/80 dark:border-slate-800">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Protected Emergency Fund</p>
          <p className="mt-1 text-2xl font-extrabold tracking-tight text-foreground tabular-nums">
            {formatINR(commerce.emergencyReserve)}
          </p>
          <p className="mt-1 text-[11px] text-success font-medium flex items-center gap-1">
            <ShieldCheck className="size-3.5" /> Untouched & 100% safe
          </p>
        </Card>

        {/* Metric 3: 14-Day Bills Reserved */}
        <Card className="p-4 shadow-sm border-slate-200/80 dark:border-slate-800">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Upcoming Bills (Next 14 Days)</p>
          <p className="mt-1 text-2xl font-extrabold tracking-tight text-foreground tabular-nums">
            {formatINR(commerce.due14DaysTotal)}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">Kept aside for AutoPay & obligations</p>
        </Card>
      </div>

      {/* Top Unlocked Goal Hero (if available) */}
      {topRec && topRec.unlocked && (
        <Card className="mb-6 overflow-hidden border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-50/60 via-card to-card p-5 shadow-sm dark:border-emerald-500/30 dark:from-emerald-950/20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="size-3.5" /> 100% Unlocked by Budget Surplus
              </span>
              <h2 className="text-xl font-bold tracking-tight text-foreground">{topRec.item.title}</h2>
              <p className="max-w-2xl text-xs text-muted-foreground leading-relaxed">{topRec.reason}</p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <div className="text-right">
                <p className="text-xl font-black text-foreground tabular-nums">{formatINR(topRec.item.price)}</p>
                <p className="text-xs text-muted-foreground">≈ {formatUSD(topRec.item.price / 85)} USD</p>
              </div>
              <ActionButton
                action={executeWishlistPurchase}
                fields={{ id: topRec.item.id }}
                variant="default"
                size="lg"
                confirm={{
                  title: `Buy “${topRec.item.title}”?`,
                  body: `This will charge ${formatINR(topRec.item.price)} (${formatUSD(topRec.item.price / 85)} USD) via PayPal Sandbox. Your emergency fund remains intact.`,
                  confirmLabel: 'Confirm PayPal Purchase',
                  tone: 'default',
                }}
                className="gap-2 rounded-2xl bg-[#0070BA] hover:bg-[#003087] text-white font-bold shadow-md shadow-blue-500/25"
              >
                <Zap className="size-4 fill-current" /> Buy with PayPal
              </ActionButton>
            </div>
          </div>
        </Card>
      )}

      {/* AG Grid Wishlist Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">Interactive Wishlist Grid (AG Grid)</h2>
          <span className="text-xs text-muted-foreground">{commerce.itemsWithProgress.length} active goals</span>
        </div>

        {commerce.itemsWithProgress.length === 0 ? (
          <EmptyState
            icon={Gift}
            title="Your wishlist is empty"
            body="Add products, gadgets, or personal goals you want to reward yourself with. Tinku AI will notify you the moment your budget savings can pay for them."
            action={<WishlistForm />}
          />
        ) : (
          <WishlistGrid rows={commerce.itemsWithProgress} />
        )}
      </div>
    </>
  )
}

