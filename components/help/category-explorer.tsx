'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Car,
  ChevronDown,
  Coins,
  Compass,
  CreditCard,
  GraduationCap,
  HeartPulse,
  Home,
  Music,
  PiggyBank,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  Utensils,
  X,
  Zap,
} from 'lucide-react'
import { useTour } from '@/components/tour/tour-provider'
import { buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { CATEGORIES, type CategoryInfo } from '@/lib/categories'
import type { CategoryId } from '@/lib/types'
import { cn } from '@/lib/utils'

interface CategoryGuidance {
  summary: string
  examples: string
}

const CATEGORY_GUIDANCE: Record<CategoryId, CategoryGuidance> = {
  groceries: {
    summary: 'Daily kitchen essentials, fresh produce, dairy, and pantry staples.',
    examples: 'Supermarkets, kirana stores, milk delivery, vegetables',
  },
  food: {
    summary: 'Eating out, coffee, office lunches, and food delivery orders.',
    examples: 'Restaurants, cafes, takeaway, tiffin add-ons',
  },
  transport: {
    summary: 'Everyday commuting, fuel, metro passes, cabs, and vehicle upkeep.',
    examples: 'Fuel, metro card top-ups, auto/cab rides, parking',
  },
  health: {
    summary: 'Doctor visits, prescriptions, diagnostic tests, and routine medical care.',
    examples: 'Pharmacy bills, clinic fees, lab tests, dental checkups',
  },
  shopping: {
    summary: 'Clothing, household goods, gadgets, and personal purchases.',
    examples: 'Apparel, electronics, home accessories, gifts',
  },
  entertainment: {
    summary: 'Movies, outings, concerts, hobbies, and weekend leisure.',
    examples: 'Cinema tickets, gaming, events, weekend trips',
  },
  rent: {
    summary: 'Monthly house or apartment rent and society maintenance dues.',
    examples: 'Monthly lease rent, maintenance charges, hostel rent',
  },
  utilities: {
    summary: 'Core household services billed every month or cycle.',
    examples: 'Electricity, piped gas, water, broadband, mobile recharge',
  },
  education: {
    summary: 'Tuition fees, books, courses, and ongoing learning costs.',
    examples: 'School/college fees, books, exam fees, online classes',
  },
  insurance: {
    summary: 'Health, term life, motor, or household insurance premiums.',
    examples: 'Health policy renewal, term cover, vehicle insurance',
  },
  subscriptions: {
    summary: 'Recurring digital memberships and software plans.',
    examples: 'Streaming apps, cloud storage, news, music memberships',
  },
  other: {
    summary: 'One-off or miscellaneous expenses that do not fit another bucket.',
    examples: 'Postage, repairs, bank fees, miscellaneous errands',
  },
}

function categoryIcon(id: CategoryId) {
  switch (id) {
    case 'groceries':
      return ShoppingBag
    case 'food':
      return Utensils
    case 'transport':
      return Car
    case 'health':
      return HeartPulse
    case 'shopping':
      return ShoppingBag
    case 'entertainment':
      return Music
    case 'rent':
      return Home
    case 'utilities':
      return Zap
    case 'education':
      return GraduationCap
    case 'insurance':
      return ShieldCheck
    case 'subscriptions':
      return CreditCard
    default:
      return Coins
  }
}

type KindFilter = 'all' | 'spending' | 'bill'
type EssentialFilter = 'all' | 'essential' | 'flexible'

export function CategoryExplorer() {
  const { startTour } = useTour()
  const [query, setQuery] = useState('')
  const [kindFilter, setKindFilter] = useState<KindFilter>('all')
  const [essentialFilter, setEssentialFilter] = useState<EssentialFilter>('all')
  const [selectedId, setSelectedId] = useState<CategoryId | null>('groceries')

  const spendingTotal = useMemo(() => CATEGORIES.filter((c) => c.kind === 'spending').length, [])
  const billTotal = useMemo(() => CATEGORIES.filter((c) => c.kind === 'bill').length, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return CATEGORIES.filter((cat) => {
      if (kindFilter !== 'all' && cat.kind !== kindFilter) return false
      if (essentialFilter === 'essential' && !cat.essential) return false
      if (essentialFilter === 'flexible' && cat.essential) return false
      if (!q) return true
      const guide = CATEGORY_GUIDANCE[cat.id]
      const hay = `${cat.label} ${cat.id} ${cat.kind} ${cat.essential ? 'essential' : 'flexible'} ${guide.summary} ${guide.examples}`.toLowerCase()
      return hay.includes(q)
    })
  }, [query, kindFilter, essentialFilter])

  const resetFilters = () => {
    setQuery('')
    setKindFilter('all')
    setEssentialFilter('all')
  }

  const hasFilters = query.trim().length > 0 || kindFilter !== 'all' || essentialFilter !== 'all'

  return (
    <Card data-tour="category-explorer" className="rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-xs">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-border/70 pb-5">
        <div>
          <p className="text-[11px] font-bold tracking-wider text-primary uppercase">Category Discovery</p>
          <h2 className="mt-1 text-lg sm:text-xl font-extrabold tracking-tight text-foreground">
            Explore All {CATEGORIES.length} Household Categories
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse daily spending ({spendingTotal}) and recurring bill ({billTotal}) categories, filter by protection level, and jump straight into filtered views.
          </p>
        </div>
        <button
          type="button"
          onClick={() => startTour('category-discovery')}
          className={cn(buttonVariants({ variant: 'default', size: 'sm' }), 'rounded-full px-4 font-bold gap-1.5 shrink-0 self-start md:self-auto')}
        >
          <Compass className="size-4" /> Start Category Walkthrough
        </button>
      </div>

      {/* Search & Filters */}
      <div className="mt-5 space-y-3">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <label className="relative flex-1">
            <span className="sr-only">Search categories</span>
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search categories (e.g., rent, utilities, groceries, streaming)…"
              className="h-10 pl-10 pr-9"
            />
            {query && (
              <button
                type="button"
                aria-label="Clear category search"
                onClick={() => setQuery('')}
                className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </label>

          {hasFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'rounded-full text-xs font-semibold shrink-0')}
            >
              Reset filters
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter by category type">
            {(
              [
                { id: 'all', label: `All (${CATEGORIES.length})` },
                { id: 'spending', label: `Daily Spending (${spendingTotal})` },
                { id: 'bill', label: `Recurring Bills (${billTotal})` },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                aria-pressed={kindFilter === opt.id}
                onClick={() => setKindFilter(opt.id)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-semibold transition',
                  kindFilter === opt.id
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/40',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter by budget priority">
            {(
              [
                { id: 'all', label: 'Any priority' },
                { id: 'essential', label: 'Essential only' },
                { id: 'flexible', label: 'Flexible only' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                aria-pressed={essentialFilter === opt.id}
                onClick={() => setEssentialFilter(opt.id)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-semibold transition',
                  essentialFilter === opt.id
                    ? 'border-primary bg-secondary text-secondary-foreground'
                    : 'border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/40',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Category Grid */}
      {filtered.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center">
          <p className="text-sm font-bold text-foreground">No categories match your filters</p>
          <p className="mt-1 text-xs text-muted-foreground">Try clearing your search or switching back to all category types.</p>
          <button
            type="button"
            onClick={resetFilters}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'mt-4 rounded-full font-semibold')}
          >
            Show all {CATEGORIES.length} categories
          </button>
        </div>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((cat: CategoryInfo) => {
            const Icon = categoryIcon(cat.id)
            const guide = CATEGORY_GUIDANCE[cat.id]
            const expanded = selectedId === cat.id

            return (
              <div
                key={cat.id}
                className={cn(
                  'rounded-2xl border transition-all',
                  expanded ? 'border-primary bg-muted/30 shadow-xs' : 'border-border bg-card hover:border-primary/40',
                )}
              >
                <button
                  type="button"
                  aria-expanded={expanded}
                  onClick={() => setSelectedId(expanded ? null : cat.id)}
                  className="flex w-full items-start justify-between gap-3 p-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-2xl"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-muted text-foreground">
                      <Icon className="size-5 text-primary" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-foreground">{cat.label}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                          {cat.kind === 'bill' ? 'Bill' : 'Spending'}
                        </span>
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                            cat.essential ? 'bg-success-soft text-success' : 'bg-secondary text-secondary-foreground',
                          )}
                        >
                          {cat.essential ? 'Essential' : 'Flexible'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <ChevronDown
                    className={cn('size-4 shrink-0 text-muted-foreground transition-transform mt-1', expanded && 'rotate-180 text-primary')}
                    aria-hidden="true"
                  />
                </button>

                {expanded && (
                  <div className="border-t border-border/70 px-4 pb-4 pt-3 space-y-3 text-xs">
                    <p className="text-foreground leading-relaxed">{guide.summary}</p>
                    <div>
                      <p className="font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Common items</p>
                      <p className="mt-0.5 text-muted-foreground">{guide.examples}</p>
                    </div>
                    <div className="rounded-xl border border-border/80 bg-card px-3 py-2">
                      <p className="font-semibold text-foreground">
                        {cat.essential ? 'Protected in Crisis Drill' : 'Flexible during Crisis Drill'}
                      </p>
                      <p className="mt-0.5 text-muted-foreground">
                        {cat.essential
                          ? 'Emergency plans keep this category funded first so core household needs stay covered.'
                          : 'Simulations can trim this category temporarily to extend your cash runway.'}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <Link
                        href={`/expenses?cat=${cat.id}`}
                        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'h-8 rounded-full px-3 text-xs font-semibold gap-1')}
                      >
                        View expenses <ArrowRight className="size-3" />
                      </Link>
                      <Link
                        href="/budgets"
                        className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'h-8 rounded-full px-2.5 text-xs font-semibold gap-1')}
                      >
                        <PiggyBank className="size-3.5 text-primary" /> Budgets
                      </Link>
                      <Link
                        href={cat.kind === 'bill' ? '/bills/new' : '/expenses/new'}
                        className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'h-8 rounded-full px-2.5 text-xs font-semibold gap-1 text-primary')}
                      >
                        <Plus className="size-3.5" /> {cat.kind === 'bill' ? 'Add bill' : 'Log expense'}
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}

