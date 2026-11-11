'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Bell,
  CalendarClock,
  CheckCircle2,
  Compass,
  Gift,
  HelpCircle,
  History,
  House,
  Info,
  PiggyBank,
  Play,
  ReceiptText,
  Repeat,
  RotateCcw,
  Search,
  Settings,
  ShieldAlert,
  Users,
} from 'lucide-react'
import { useTour } from '@/components/tour/tour-provider'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { TOUR_ORDER, TOURS } from '@/lib/tours'
import { cn } from '@/lib/utils'
import { CategoryExplorer } from './category-explorer'

const GETTING_STARTED_STEPS = [
  {
    step: '01',
    title: 'Set your income, balance & salary day',
    description: 'Tell Tinku how much cash you currently have and your expected monthly inflow so Home calculates your true available room.',
    href: '/settings',
    cta: 'Open Settings',
  },
  {
    step: '02',
    title: 'Record expenses or scan a receipt',
    description: 'Add everyday purchases manually or scan a receipt photo. Every entry files cleanly under one of 12 household categories.',
    href: '/expenses/new',
    cta: 'Add Expense',
  },
  {
    step: '03',
    title: 'Set monthly category limits',
    description: 'Configure spending caps for Essential and Flexible categories. Progress bars warn at 80% and alert when crossed.',
    href: '/budgets/edit',
    cta: 'Edit Budgets',
  },
  {
    step: '04',
    title: 'Add recurring bills & choose how to pay',
    description: 'Track rent, utilities, subscriptions, and insurance with reminders, one-click approval, or consented AutoPay.',
    href: '/bills/new',
    cta: 'Add Bill',
  },
]

const NAV_SECTIONS = [
  {
    group: 'Overview',
    icon: House,
    label: 'Home Dashboard',
    href: '/',
    summary: 'Shows Active Balance, Emergency Reserve & Health Score, Monthly Spending donut, Earning progress, Approvals & Recent Activity, and 6-month trend.',
  },
  {
    group: 'Track',
    icon: ReceiptText,
    label: 'Expenses',
    href: '/expenses',
    summary: 'Browse expenses month by month, filter by keyword or category, switch between daily List and spreadsheet Grid view, or scan new receipts.',
  },
  {
    group: 'Track',
    icon: PiggyBank,
    label: 'Budgets',
    href: '/budgets',
    summary: 'Monitors category caps split into Essential Budgets (protected necessities) and Flexible Spending (discretionary room).',
  },
  {
    group: 'Pay',
    icon: CalendarClock,
    label: 'Bills',
    href: '/bills',
    summary: 'Schedules upcoming recurring bills in reminder, manual approval, or AutoPay mode so due dates never catch you off guard.',
  },
  {
    group: 'Pay',
    icon: Repeat,
    label: 'AutoPay & Payment History',
    href: '/autopay',
    summary: 'Manage explicit AutoPay rules (with per-payment caps) and inspect every completed or skipped charge in Payment History.',
  },
  {
    group: 'Plan ahead',
    icon: ShieldAlert,
    label: 'Crisis Drill',
    href: '/drill',
    summary: 'Simulates an unexpected shock (like a job pause or medical expense) to show how long your reserve and essential budgets last.',
  },
  {
    group: 'Plan ahead',
    icon: Gift,
    label: 'Wishlist & Goals',
    href: '/wishlist',
    summary: 'Tracks desired purchases against real monthly surplus while guaranteeing emergency reserves and 14-day bills stay untouched.',
  },
  {
    group: 'Together',
    icon: Users,
    label: 'Groups',
    href: '/groups',
    summary: 'Split shared household rent, trips, or groceries with roommates and family members with clear balance tracking.',
  },
]

const HEADER_CONTROLS = [
  { icon: Search, title: 'Search bar', detail: 'Available in the top header on desktop — jumps straight to Expenses search & filters.' },
  { icon: Bell, title: 'Notifications bell', detail: 'Displays unread due-date reminders, AutoPay runs, and budget warnings.' },
  { icon: Settings, title: 'Account menu & Settings', detail: 'Access Profile, Appearance (Light/Dark/System), Security, Connections, and Demo tools.' },
  { icon: History, title: 'Mobile bottom bar & More drawer', detail: 'On phones, Home, Expenses, Bills, and Budgets stay one tap away, with all other tools inside More.' },
]

const FEATURE_TUTORIALS = [
  {
    id: 'expenses',
    title: 'Expenses & Grid',
    href: '/expenses',
    steps: [
      'Open Expenses from the Track menu or press Quick Add to log a transaction.',
      'Upload a receipt photo on Add Expense if receipt scanning is configured, or enter title, category, amount, and date directly.',
      'Use the Search box and Category dropdown together, or click one of the top category chips to isolate that category.',
      'Switch to Grid view anytime to sort columns and filter rows in a spreadsheet layout.',
    ],
  },
  {
    id: 'budgets',
    title: 'Monthly Budgets',
    href: '/budgets',
    steps: [
      'Visit Budgets to view your overall monthly spending meter and days left in the month.',
      'Click Edit limits to assign monthly rupees to the categories your household actually uses.',
      'Essential categories are grouped separately from Flexible categories so priorities stay obvious.',
      'Progress bars turn amber at 80% utilization and red past 100%, surfacing a notice on top.',
    ],
  },
  {
    id: 'bills',
    title: 'Bills & AutoPay',
    href: '/bills',
    steps: [
      'Add a bill with due day, frequency, category, and payment mode (Reminder, Manual, or AutoPay).',
      'Bills due for confirmation appear inside Transactions & Actions on Home as well as on Bills.',
      'Approve a payment in one click, postpone by 3 days, skip, or mark as paid elsewhere.',
      'Enable AutoPay only with an explicit mandate cap; you stay in control and can pause anytime.',
    ],
  },
  {
    id: 'drill',
    title: 'Crisis Drill',
    href: '/drill',
    steps: [
      'Open Crisis Drill under Plan ahead to stress-test your current balance and reserve.',
      'Pick a scenario (such as income pause or unexpected emergency cost) to compute your resilience score out of 100.',
      'Review which Flexible categories Tinku trims while keeping Essential budgets funded.',
    ],
  },
  {
    id: 'wishlist',
    title: 'Wishlist & Groups',
    href: '/wishlist',
    steps: [
      'Add personal or household goals on Wishlist & Goals to check when true surplus unlocks them without touching reserves.',
      'Use Groups under Together to create a shared household or trip ledger and split expenses fairly.',
    ],
  },
] as const

const FAQS = [
  {
    q: 'What is the difference between Sample Household mode and my account?',
    a: 'When browsing without signing in (or after loading sample data in Settings → Demo tools), Tinku displays a realistic Indian household dataset so every dashboard card, chart, and drill works immediately. Signing up gives you your own private workspace.',
  },
  {
    q: 'Why does Tinku split categories into Essential and Flexible?',
    a: 'Rent, groceries, utilities, health, education, transport, and insurance are tagged Essential so Crisis Drills and recovery plans protect them first. Food & dining, shopping, entertainment, subscriptions, and other are Flexible so you know where trimming is safest.',
  },
  {
    q: 'Does Tinku move real money when I test a bill payment?',
    a: 'No real bank money is moved. Payments run either in the labelled payment simulator or in PayPal Sandbox mode (see Settings → Connections for current configuration).',
  },
  {
    q: 'How do I restart or replay the guided tours later?',
    a: 'You can launch any tour from the top of this Help Center, from Settings → Appearance → Guided Tours & Tutorials, or by visiting /?tour=welcome.',
  },
]

export function HelpCenter() {
  const { completedTours, startTour, openWelcome, resetTours } = useTour()
  const [activeFeature, setActiveFeature] = useState<(typeof FEATURE_TUTORIALS)[number]['id']>('expenses')

  const selectedFeature = FEATURE_TUTORIALS.find((f) => f.id === activeFeature) ?? FEATURE_TUTORIALS[0]

  return (
    <div className="space-y-8">
      {/* Interactive Guided Tours Launchpad */}
      <Card className="rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-border/70 pb-5">
          <div>
            <p className="text-[11px] font-bold tracking-wider text-primary uppercase">Interactive Guided Tours</p>
            <h2 className="mt-1 text-lg sm:text-xl font-extrabold tracking-tight text-foreground">
              Learn Tinku Step by Step
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Launch an interactive spotlight walkthrough across real screens. Navigate freely with Next, Previous, or arrow keys.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={openWelcome}
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'rounded-full px-3.5 font-semibold gap-1.5')}
            >
              <Compass className="size-4 text-primary" /> Welcome Modal
            </button>
            <button
              type="button"
              onClick={resetTours}
              className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'rounded-full px-3 text-xs font-semibold gap-1.5 text-muted-foreground hover:text-foreground')}
            >
              <RotateCcw className="size-3.5" /> Restart Tour
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {TOUR_ORDER.map((id) => {
            const track = TOURS[id]
            const done = completedTours.includes(id)
            return (
              <div
                key={id}
                className="flex flex-col justify-between rounded-2xl border border-border bg-muted/25 p-4 transition hover:border-primary/40"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-bold text-secondary-foreground">
                      {track.steps.length} steps · {track.estimatedTime}
                    </span>
                    {done && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-success">
                        <CheckCircle2 className="size-3.5" aria-hidden="true" /> Completed
                      </span>
                    )}
                  </div>
                  <h3 className="mt-3 text-base font-bold text-foreground">{track.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{track.subtitle}</p>
                </div>

                <button
                  type="button"
                  onClick={() => startTour(id)}
                  className={cn(
                    buttonVariants({ variant: id === 'welcome' ? 'default' : 'outline', size: 'sm' }),
                    'mt-4 w-full rounded-full font-bold gap-1.5',
                  )}
                >
                  <Play className="size-3.5" /> {done ? 'Replay Walkthrough' : 'Start Walkthrough'}
                </button>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Getting Started Guide */}
      <section aria-labelledby="getting-started-heading" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="getting-started-heading" className="text-lg font-extrabold tracking-tight text-foreground">
              Getting Started Guide
            </h2>
            <p className="text-sm text-muted-foreground">Four quick steps to turn Tinku into your daily money workspace.</p>
          </div>
          <Link href="/about" className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline">
            <Info className="size-3.5" /> Read About Tinku
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {GETTING_STARTED_STEPS.map((item) => (
            <Card key={item.step} className="flex flex-col justify-between rounded-2xl border border-border bg-card p-4 shadow-xs">
              <div>
                <span className="text-xs font-black tracking-widest text-primary">{item.step}</span>
                <h3 className="mt-2 text-sm font-bold text-foreground">{item.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{item.description}</p>
              </div>
              <Link
                href={item.href}
                className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
              >
                {item.cta} <ArrowRight className="size-3.5" />
              </Link>
            </Card>
          ))}
        </div>
      </section>

      {/* Interactive Category Discovery Explorer */}
      <CategoryExplorer />

      {/* Application Navigation Tutorial */}
      <Card className="rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/70 pb-5">
          <div>
            <p className="text-[11px] font-bold tracking-wider text-primary uppercase">Navigation Map</p>
            <h2 className="mt-1 text-lg sm:text-xl font-extrabold tracking-tight text-foreground">
              Application Navigation Tutorial
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Every section in the sidebar, header, and mobile bar explained clearly.
            </p>
          </div>
          <button
            type="button"
            onClick={() => startTour('navigation')}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'rounded-full px-4 font-bold gap-1.5 shrink-0 self-start sm:self-auto')}
          >
            <Play className="size-3.5 text-primary" /> Run Navigation Tour
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {NAV_SECTIONS.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-start gap-3 rounded-2xl border border-border bg-muted/20 p-4 transition hover:border-primary/40 hover:bg-muted/40"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-primary">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{item.label}</p>
                    <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">{item.group}</span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.summary}</p>
                </div>
              </Link>
            )
          })}
        </div>

        <div className="mt-5 grid gap-3 border-t border-border/70 pt-5 sm:grid-cols-2 lg:grid-cols-4">
          {HEADER_CONTROLS.map((ctrl) => {
            const Icon = ctrl.icon
            return (
              <div key={ctrl.title} className="rounded-2xl border border-border/80 bg-card p-3.5">
                <div className="flex items-center gap-2">
                  <Icon className="size-4 text-primary shrink-0" aria-hidden="true" />
                  <p className="text-xs font-bold text-foreground">{ctrl.title}</p>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{ctrl.detail}</p>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Feature-Specific Tutorials */}
      <Card className="rounded-3xl border border-border bg-card shadow-xs">
        <CardHeader
          title="Feature-Specific Tutorials"
          description="Step-by-step instructions for each core Tinku workflow."
        />
        <CardBody className="space-y-4">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Feature tutorials">
            {FEATURE_TUTORIALS.map((feat) => {
              const active = feat.id === selectedFeature.id
              return (
                <button
                  key={feat.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveFeature(feat.id)}
                  className={cn(
                    'rounded-full border px-3.5 py-1.5 text-xs font-semibold transition',
                    active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/40',
                  )}
                >
                  {feat.title}
                </button>
              )
            })}
          </div>

          <div role="tabpanel" className="rounded-2xl border border-border bg-muted/20 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-bold text-foreground">{selectedFeature.title}</h3>
              <Link
                href={selectedFeature.href}
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'rounded-full text-xs font-semibold gap-1')}
              >
                Open {selectedFeature.title} <ArrowRight className="size-3.5" />
              </Link>
            </div>
            <ol className="mt-4 space-y-2.5">
              {selectedFeature.steps.map((text, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm text-foreground">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-extrabold text-primary tabular-nums">
                    {idx + 1}
                  </span>
                  <span className="pt-0.5 text-sm leading-relaxed text-muted-foreground">{text}</span>
                </li>
              ))}
            </ol>
          </div>
        </CardBody>
      </Card>

      {/* Frequently Asked Questions */}
      <Card className="rounded-3xl border border-border bg-card shadow-xs">
        <CardHeader
          title="Frequently Asked Questions"
          description="Quick answers about sample mode, categories, payments, and restarting guides."
        />
        <CardBody className="divide-y divide-border/70">
          {FAQS.map((item) => (
            <details key={item.q} className="group py-3.5 first:pt-0 last:pb-0">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-bold text-foreground marker:content-none">
                <span className="flex items-center gap-2">
                  <HelpCircle className="size-4 shrink-0 text-primary" aria-hidden="true" />
                  {item.q}
                </span>
                <span className="text-xs font-semibold text-muted-foreground group-open:hidden">Show</span>
                <span className="hidden text-xs font-semibold text-primary group-open:inline">Hide</span>
              </summary>
              <p className="mt-2 pl-6 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </CardBody>
      </Card>
    </div>
  )
}

