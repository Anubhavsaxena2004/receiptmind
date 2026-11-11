import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Compass,
  HelpCircle,
  House,
  Layers,
  PiggyBank,
  ReceiptText,
  Repeat,
  ShieldAlert,
  ShieldCheck,
  Users,
  Wallet,
} from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CATEGORIES } from '@/lib/categories'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'About Tinku',
  description: 'Purpose, target users, core idea, and end-to-end money management workflow inside Tinku.',
}

const TARGET_USERS = [
  {
    icon: Wallet,
    title: 'Everyday Indian Households',
    description:
      'People managing monthly salary cycles, rent, groceries, utilities, school fees, and family expenses in INR from one shared view.',
  },
  {
    icon: CalendarClock,
    title: 'Variable-Income & Freelance Earners',
    description:
      'Anyone balancing irregular inflows against fixed due dates who needs to see how much cash stays free after upcoming bills.',
  },
  {
    icon: Users,
    title: 'Flatmates & Shared Groups',
    description:
      'Roommates, couples, and travel groups who want transparent bill splits and clear settlement balances without spreadsheet overhead.',
  },
]

const FLOW_STEPS = [
  {
    step: '1',
    title: 'Define Your Baseline',
    detail: 'Set expected monthly income, salary day, current balance, and emergency reserve in Settings, then assign monthly caps across real household categories.',
    href: '/settings',
    routeLabel: 'Settings & Budgets',
  },
  {
    step: '2',
    title: 'Track Daily Spending & Bills',
    detail: 'Record everyday purchases manually or via receipt scan in Expenses, and schedule recurring obligations on Bills in reminder, manual, or AutoPay mode.',
    href: '/expenses',
    routeLabel: 'Expenses & Bills',
  },
  {
    step: '3',
    title: 'Approve & Stay Ahead',
    detail: 'Review what needs confirmation right on the Home dashboard, settle group splits in Groups, and audit past charges in Payment History.',
    href: '/',
    routeLabel: 'Home Overview',
  },
  {
    step: '4',
    title: 'Test Emergencies & Plan Purchases',
    detail: 'Run a Crisis Drill to verify how long your reserve protects essential categories, and track safe purchases in Wishlist & Goals.',
    href: '/drill',
    routeLabel: 'Crisis Drill & Wishlist',
  },
]

const PRINCIPLES = [
  {
    title: 'Less Thinking, Less Clicking',
    body: 'Most visits take seconds: see what is free after upcoming bills, confirm or postpone a due item, or log an expense.',
  },
  {
    title: 'Essentials Protected First',
    body: `All ${CATEGORIES.length} categories clearly separate essential living costs from flexible spending so emergency plans never compromise necessities.`,
  },
  {
    title: 'Explicit Consent on Payments',
    body: 'Bills wait for your approval unless you turn on AutoPay with a clear per-payment cap. Failed payments stop instead of silently retrying.',
  },
  {
    title: 'Honest Mode Clarity',
    body: 'Sample household exploration, temporary storage notices, and demo/sandbox payment paths are always clearly labelled.',
  },
]

export default function AboutPage() {
  const essentialCount = CATEGORIES.filter((c) => c.essential).length
  const flexibleCount = CATEGORIES.filter((c) => !c.essential).length

  return (
    <div className="space-y-8">
      <PageHeader
        title="About Tinku"
        description="A calm, India-first household money workspace designed for clarity over spreadsheets."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/?tour=welcome" className={cn(buttonVariants({ variant: 'default', size: 'sm' }), 'rounded-full font-bold gap-1.5')}>
              <Compass className="size-4" /> Take Guided Tour
            </Link>
            <Link href="/help" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'rounded-full font-semibold gap-1.5')}>
              <HelpCircle className="size-4 text-primary" /> Help Center
            </Link>
          </div>
        }
      />

      {/* Purpose & Core Idea + Clean App Architecture Showcase */}
      <Card className="overflow-hidden rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-6 space-y-4">
            <p className="text-[11px] font-bold tracking-[0.16em] text-primary uppercase">Purpose & Core Idea</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground leading-tight">
              Turn scattered expenses, bills, and surprises into one clear daily picture.
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Most finance tools either bury households in complex accounting charts or track spending without connecting recurring due dates and emergency reserves. Tinku connects your <span className="font-semibold text-foreground">current balance</span>, <span className="font-semibold text-foreground">upcoming 7-to-14 day bills</span>, <span className="font-semibold text-foreground">category budgets</span>, and <span className="font-semibold text-foreground">resilience reserve</span> into one straightforward workflow.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="rounded-2xl border border-border bg-muted/30 p-3.5">
                <p className="text-xs font-bold text-foreground">{essentialCount} Essential Categories</p>
                <p className="mt-1 text-xs text-muted-foreground">Groceries, Rent, Utilities, Health, Transport, Education & Insurance</p>
              </div>
              <div className="rounded-2xl border border-border bg-muted/30 p-3.5">
                <p className="text-xs font-bold text-foreground">{flexibleCount} Flexible Categories</p>
                <p className="mt-1 text-xs text-muted-foreground">Dining, Shopping, Entertainment, Subscriptions & Other</p>
              </div>
            </div>
          </div>

          {/* Crisp UI Layout Illustration using real Tinku tokens */}
          <div className="lg:col-span-6 min-w-0">
            <div
              aria-label="Preview of Tinku workspace layout"
              className="rounded-2xl border border-border bg-background p-3 sm:p-4 shadow-sm overflow-hidden"
            >
              {/* Mock Header Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-primary text-xs font-black text-primary-foreground">
                    T
                  </span>
                  <span className="text-xs font-extrabold text-foreground">Tinku Workspace</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="rounded-full border border-border bg-card px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground whitespace-nowrap">
                    Light / Dark
                  </span>
                  <span className="rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold text-primary-foreground whitespace-nowrap">
                    + Quick Add
                  </span>
                </div>
              </div>

              {/* Mock Shell Body: Horizontal nav pills on mobile, Sidebar + Bento on >=sm */}
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-12 gap-3">
                {/* Mini Sidebar */}
                <div className="sm:col-span-4 flex flex-wrap gap-1.5 sm:block sm:space-y-1.5 rounded-xl border border-border/70 bg-sidebar p-2">
                  {[
                    { icon: House, label: 'Home', active: true },
                    { icon: ReceiptText, label: 'Expenses', active: false },
                    { icon: PiggyBank, label: 'Budgets', active: false },
                    { icon: CalendarClock, label: 'Bills', active: false },
                    { icon: Repeat, label: 'AutoPay', active: false },
                    { icon: ShieldAlert, label: 'Crisis Drill', active: false },
                  ].map((nav) => {
                    const Icon = nav.icon
                    return (
                      <div
                        key={nav.label}
                        className={cn(
                          'flex items-center gap-1.5 sm:gap-2 rounded-lg px-2 py-1 sm:py-1.5 text-[11px] font-semibold',
                          nav.active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground',
                        )}
                      >
                        <Icon className="size-3 shrink-0" aria-hidden="true" />
                        <span className="whitespace-nowrap sm:truncate">{nav.label}</span>
                      </div>
                    )
                  })}
                </div>

                {/* Mini Bento Cards */}
                <div className="sm:col-span-8 space-y-2.5 min-w-0">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                    <div className="sm:col-span-7 rounded-xl border border-border bg-card p-3 min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Active Balance</p>
                      <p className="mt-1 text-sm sm:text-base font-black text-foreground">Cash + Free Room</p>
                      <p className="mt-1 text-[10px] text-muted-foreground">Updates after every expense & bill</p>
                    </div>
                    <div className="sm:col-span-5 rounded-xl bg-primary p-3 text-primary-foreground min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider opacity-90">Reserve</p>
                      <p className="mt-1 text-sm font-black">Protected</p>
                      <p className="mt-1 text-[10px] opacity-85">Drill verified</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="rounded-xl border border-border bg-card p-2.5 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Layers className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
                        <p className="text-[11px] font-bold text-foreground">Category Budgets</p>
                      </div>
                      <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div className="h-full w-2/3 rounded-full bg-primary" />
                      </div>
                      <p className="mt-1.5 text-[10px] text-muted-foreground">Essential & flexible pace</p>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-2.5 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="size-3.5 shrink-0 text-success" aria-hidden="true" />
                        <p className="text-[11px] font-bold text-foreground">Bill Approvals</p>
                      </div>
                      <p className="mt-2 text-[10px] text-muted-foreground">Approve, postpone, or run consented AutoPay</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Target Users */}
      <section aria-labelledby="target-users-heading" className="space-y-4">
        <div>
          <h2 id="target-users-heading" className="text-lg font-extrabold tracking-tight text-foreground">
            Who Tinku Is Designed For
          </h2>
          <p className="text-sm text-muted-foreground">Built around real Indian household cash-flow patterns and shared living expenses.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {TARGET_USERS.map((item) => {
            const Icon = item.icon
            return (
              <Card key={item.title} className="rounded-2xl border border-border bg-card p-5 shadow-xs">
                <span className="flex size-10 items-center justify-center rounded-xl border border-border bg-muted text-primary">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-3.5 text-base font-bold text-foreground">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
              </Card>
            )
          })}
        </div>
      </section>

      {/* Application Flow */}
      <section aria-labelledby="app-flow-heading" className="space-y-4">
        <div>
          <h2 id="app-flow-heading" className="text-lg font-extrabold tracking-tight text-foreground">
            How the Application Flows
          </h2>
          <p className="text-sm text-muted-foreground">A four-stage loop linking daily spending, scheduled bills, and long-term resilience.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FLOW_STEPS.map((item) => (
            <Card key={item.step} className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-xs">
              <div>
                <span className="inline-flex size-7 items-center justify-center rounded-full bg-primary text-xs font-black text-primary-foreground">
                  {item.step}
                </span>
                <h3 className="mt-3 text-base font-bold text-foreground">{item.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{item.detail}</p>
              </div>
              <Link href={item.href} className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline">
                {item.routeLabel} <ArrowRight className="size-3.5" />
              </Link>
            </Card>
          ))}
        </div>
      </section>

      {/* Core UX Principles */}
      <Card className="rounded-3xl border border-border bg-card p-6 shadow-xs">
        <h2 className="text-lg font-extrabold tracking-tight text-foreground">Core Design & Safety Principles</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {PRINCIPLES.map((p) => (
            <div key={p.title} className="flex items-start gap-3 rounded-2xl border border-border/80 bg-muted/20 p-4">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <h3 className="text-sm font-bold text-foreground">{p.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{p.body}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Bottom CTA Strip */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border bg-surface p-5 sm:p-6">
        <div>
          <h2 className="text-base font-extrabold text-foreground">Ready to explore Tinku hands-on?</h2>
          <p className="text-sm text-muted-foreground">Browse all {CATEGORIES.length} categories in the Help Center or start an interactive walkthrough.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/help" className={cn(buttonVariants({ variant: 'default', size: 'sm' }), 'rounded-full px-4 font-bold gap-1.5')}>
            Open Help & Category Explorer <ArrowRight className="size-3.5" />
          </Link>
          <Link href="/" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'rounded-full px-4 font-semibold')}>
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}

