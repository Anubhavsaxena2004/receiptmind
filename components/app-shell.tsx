'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { startTransition, useEffect, useState } from 'react'
import { Menu as MenuPrimitive } from '@base-ui/react/menu'
import {
  ArrowRight,
  Bell,
  CalendarClock,
  ChevronDown,
  FlaskConical,
  History,
  House,
  Info,
  LogOut,
  MailWarning,
  Menu,
  PiggyBank,
  Plus,
  ReceiptText,
  Repeat,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react'
import type { ClientViewer } from '@/components/auth/auth-context'
import { buttonVariants } from '@/components/ui/button'
import { logoutAction } from '@/lib/actions/auth'
import { ThemeToggle } from '@/components/theme-toggle'
import { cn } from '@/lib/utils'

type Icon = React.ComponentType<{ className?: string }>

const NAV: { section?: string; items: { href: string; label: string; icon: Icon; hint: string }[] }[] = [
  { items: [{ href: '/', label: 'Home', icon: House, hint: 'Dashboard overview' }] },
  {
    section: 'Track',
    items: [
      { href: '/expenses', label: 'Expenses', icon: ReceiptText, hint: 'Add or scan spent' },
      { href: '/budgets', label: 'Budgets', icon: PiggyBank, hint: 'Category limits' },
    ],
  },
  {
    section: 'Pay',
    items: [
      { href: '/bills', label: 'Bills', icon: CalendarClock, hint: 'Due dates & schedule' },
      { href: '/autopay', label: 'AutoPay', icon: Repeat, hint: 'Automated rules' },
      { href: '/history', label: 'Payment history', icon: History, hint: 'Transaction ledger' },
    ],
  },
  {
    section: 'Plan ahead',
    items: [{ href: '/drill', label: 'Crisis drill', icon: ShieldAlert, hint: 'Simulate emergency' }],
  },
  {
    section: 'Together',
    items: [{ href: '/groups', label: 'Groups', icon: Users, hint: 'Split with members' }],
  },
]

const BOTTOM: { href: string; label: string; icon: Icon }[] = [
  { href: '/', label: 'Home', icon: House },
  { href: '/expenses', label: 'Expenses', icon: ReceiptText },
  { href: '/bills', label: 'Bills', icon: CalendarClock },
  { href: '/budgets', label: 'Budgets', icon: PiggyBank },
]

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

function NavList({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav aria-label="Main" className="space-y-5 px-1">
      {NAV.map((group, i) => (
        <div key={group.section ?? i}>
          {group.section && (
            <p className="mb-2 px-3 text-[10px] font-bold tracking-[0.16em] text-muted-foreground/80 uppercase">
              {group.section}
            </p>
          )}
          <ul className="space-y-1">
            {group.items.map(({ href, label, icon: Icon, hint }) => {
              const active = isActive(pathname, href)
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'group flex items-center gap-3 rounded-2xl px-3.5 py-2.5 transition-all duration-150',
                      active
                        ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                        : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground font-medium',
                    )}
                  >
                    <Icon
                      className={cn(
                        'size-[18px] shrink-0 transition-transform group-hover:scale-105',
                        active ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground',
                      )}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm leading-tight">{label}</span>
                      <span
                        className={cn(
                          'block truncate text-[11px] leading-tight mt-0.5',
                          active ? 'text-primary-foreground/80' : 'text-muted-foreground/80',
                        )}
                      >
                        {hint}
                      </span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}

export function Brand() {
  return (
    <Link href="/" className="flex items-center gap-3 group">
      <span className="flex size-10 items-center justify-center rounded-2xl bg-primary text-xl font-black text-primary-foreground shadow-sm shadow-primary/25 transition-transform group-hover:scale-105">
        T
      </span>
      <div>
        <span className="block text-[17px] leading-tight font-extrabold tracking-tight text-foreground">Tinku</span>
        <span className="block text-[11px] leading-tight text-muted-foreground font-medium">Smart Finance</span>
      </div>
    </Link>
  )
}

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join('') || 'T'
  )
}

function AccountMenu({ viewer }: { viewer: Extract<ClientViewer, { kind: 'user' }> }) {
  const item =
    'flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-semibold outline-none data-[highlighted]:bg-muted text-foreground'

  return (
    <MenuPrimitive.Root>
      <MenuPrimitive.Trigger
        aria-label={`Account: ${viewer.name}`}
        className="flex items-center gap-2.5 rounded-full border border-border/80 bg-card py-1.5 pr-3 pl-1.5 text-xs font-semibold transition hover:bg-muted/60 shadow-2xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-black text-primary-foreground shadow-2xs">
          {initials(viewer.name)}
        </span>
        <div className="hidden text-left md:block min-w-0 max-w-32">
          <p className="truncate text-xs font-bold leading-tight text-foreground">{viewer.name}</p>
          <p className="truncate text-[10px] text-muted-foreground leading-tight">
            {viewer.verified ? 'Verified' : 'Unverified'}
          </p>
        </div>
        <ChevronDown className="size-3 text-muted-foreground ml-0.5" aria-hidden="true" />
      </MenuPrimitive.Trigger>

      <MenuPrimitive.Portal>
        <MenuPrimitive.Positioner sideOffset={8} align="end" className="z-50">
          <MenuPrimitive.Popup className="w-64 rounded-2xl border border-border bg-popover p-1.5 text-popover-foreground shadow-xl outline-none">
            <div className="px-3 py-2.5">
              <p className="truncate text-sm font-bold text-foreground">{viewer.name}</p>
              <p className="truncate text-xs text-muted-foreground">{viewer.email}</p>
              <p className={cn('mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold', viewer.verified ? 'text-success' : 'text-warning')}>
                {viewer.verified ? <ShieldCheck className="size-3.5" aria-hidden="true" /> : <MailWarning className="size-3.5" aria-hidden="true" />}
                {viewer.verified ? 'Email verified' : 'Email not verified'}
              </p>
            </div>
            <div className="my-1 h-px bg-border/60" />
            <MenuPrimitive.LinkItem render={<Link href="/settings" />} className={item}>
              <Settings className="size-4 text-muted-foreground" aria-hidden="true" /> Settings
            </MenuPrimitive.LinkItem>
            <MenuPrimitive.LinkItem render={<Link href="/settings?tab=security" />} className={item}>
              <ShieldCheck className="size-4 text-muted-foreground" aria-hidden="true" /> Security
            </MenuPrimitive.LinkItem>
            <div className="my-1 h-px bg-border/60" />
            <MenuPrimitive.Item className={cn(item, 'text-danger hover:bg-danger-soft')} onClick={() => startTransition(() => logoutAction())}>
              <LogOut className="size-4 text-danger" aria-hidden="true" /> Log out
            </MenuPrimitive.Item>
          </MenuPrimitive.Popup>
        </MenuPrimitive.Positioner>
      </MenuPrimitive.Portal>
    </MenuPrimitive.Root>
  )
}

function FloatingBanner({ tone, icon: Icon, children }: { tone: 'brand' | 'warning'; icon: Icon; children: React.ReactNode }) {
  return (
    <div
      role="status"
      className={cn(
        'mb-6 flex items-center justify-between gap-3 rounded-2xl border px-4 py-2.5 text-xs font-medium sm:px-5 sm:text-sm shadow-2xs transition-all',
        tone === 'brand'
          ? 'border-primary/30 bg-secondary/80 text-foreground dark:border-primary/30 dark:bg-secondary/40'
          : 'border-amber-200/60 bg-amber-50/70 text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-200',
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span
          className={cn(
            'flex size-7 shrink-0 items-center justify-center rounded-lg',
            tone === 'brand'
              ? 'bg-primary/15 text-primary'
              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <span className="truncate">{children}</span>
      </div>
    </div>
  )
}

export function AppShell({
  children,
  unread,
  demoLabel,
  viewer,
  sample = false,
  storageWarning = false,
}: {
  children: React.ReactNode
  unread: number
  demoLabel: string
  viewer: ClientViewer
  sample?: boolean
  storageWarning?: boolean
}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const guest = viewer.kind === 'guest'

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const settingsLink = (onNavigate?: () => void) => (
    <Link
      href="/settings"
      onClick={onNavigate}
      aria-current={isActive(pathname, '/settings') ? 'page' : undefined}
      className={cn(
        'flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition-all',
        isActive(pathname, '/settings')
          ? 'bg-primary text-primary-foreground font-bold shadow-xs'
          : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
      )}
    >
      <Settings className={cn('size-[18px]', isActive(pathname, '/settings') ? 'text-primary-foreground' : 'text-muted-foreground')} /> Settings
    </Link>
  )

  const next = encodeURIComponent(pathname)

  return (
    <div className="min-h-dvh bg-background">
      {/* ──────────────────────────────────────────────────────────────────────────
          DESKTOP SIDEBAR: Unified seamless sidebar with Axiom/FinBank aesthetic
          ────────────────────────────────────────────────────────────────────────── */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border/40 bg-sidebar px-4 py-6 lg:flex">
        {/* Brand */}
        <div className="px-2">
          <Brand />
        </div>

        {/* Quick Add CTA */}
        <div className="px-1 pt-5">
          <Link
            href="/expenses/new"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-2.5 text-sm font-bold text-primary-foreground shadow-sm shadow-primary/25 transition-all hover:bg-primary/95 active:scale-[0.99]"
          >
            <Plus className="size-4 stroke-[2.5]" /> Quick Add
          </Link>
        </div>

        {/* Nav List */}
        <div className="mt-6 flex-1 overflow-y-auto">
          <NavList pathname={pathname} />
        </div>

        {/* Axiom-Style Sidebar Bottom Mini Card: Emergency Drill */}
        <div className="mx-1 mb-3 rounded-2xl border border-border/70 bg-muted/30 p-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="flex size-7 items-center justify-center rounded-xl bg-secondary text-primary">
              <ShieldAlert className="size-3.5" />
            </span>
            <Link href="/drill" className="text-[10px] font-bold text-primary hover:underline">
              Run Drill →
            </Link>
          </div>
          <p className="mt-2 text-xs font-bold text-foreground">Crisis Drill</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Test financial resilience</p>
        </div>

        {/* Settings Footer */}
        <div className="border-t border-border/50 pt-3">{settingsLink()}</div>
      </aside>

      {/* ──────────────────────────────────────────────────────────────────────────
          MOBILE DRAWER ("More")
          ────────────────────────────────────────────────────────────────────────── */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button aria-label="Close menu" className="absolute inset-0 bg-foreground/30 backdrop-blur-xs" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[min(20rem,85vw)] flex-col bg-sidebar px-4 py-5 shadow-2xl border-r border-border">
            <div className="flex items-center justify-between px-2">
              <Brand />
              <button aria-label="Close menu" onClick={() => setOpen(false)} className="rounded-xl p-2 hover:bg-muted text-muted-foreground hover:text-foreground">
                <X className="size-5" />
              </button>
            </div>
            <div className="mt-6 flex-1 overflow-y-auto">
              <NavList pathname={pathname} onNavigate={() => setOpen(false)} />
            </div>
            <div className="border-t border-border/50 pt-3">{settingsLink(() => setOpen(false))}</div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          MAIN AREA & SEAMLESS FLOATING HEADER (No harsh horizontal dividing border!)
          ────────────────────────────────────────────────────────────────────────── */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 bg-background/80 backdrop-blur-md px-4 sm:px-8 transition-colors">
          {/* Mobile Brand */}
          <div className="lg:hidden">
            <Brand />
          </div>

          {/* Desktop Search / Quick Jump Placeholder (Axiom style) */}
          <Link
            href="/expenses"
            className="hidden items-center gap-2 rounded-full border border-border/70 bg-card px-3.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors md:flex shadow-2xs"
          >
            <Search className="size-3.5" />
            <span>Search expenses or bills...</span>
            <kbd className="ml-2 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground border border-border/80">
              ⌘K
            </kbd>
          </Link>

          {/* Right Header Controls: Floating Seamless Group */}
          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/settings?tab=connections"
              className="hidden items-center gap-1.5 rounded-full border border-border/70 bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition md:inline-flex shadow-2xs"
              title="Payments run in demo mode. See Settings → Connections."
            >
              <FlaskConical className="size-3.5 text-primary" aria-hidden="true" /> {demoLabel}
            </Link>

            <ThemeToggle className="hidden md:flex" />

            <Link
              href="/notifications"
              aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
              className="relative flex size-10 items-center justify-center rounded-full border border-border/80 bg-card text-muted-foreground hover:text-foreground hover:bg-muted/50 transition shadow-2xs"
            >
              <Bell className="size-[18px]" />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex min-w-4 h-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-black text-primary-foreground ring-2 ring-background">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </Link>

            {guest ? (
              <>
                <Link href={`/login?next=${next}`} className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'hidden sm:inline-flex rounded-full')}>
                  Log in
                </Link>
                <Link href={`/signup?next=${next}`} className={cn(buttonVariants({ size: 'sm', variant: 'default' }), 'rounded-full font-bold px-4')}>
                  Sign up
                </Link>
              </>
            ) : (
              <AccountMenu viewer={viewer} />
            )}
          </div>
        </header>

        {/* Main Content Area */}
        <main className="mx-auto max-w-5xl px-4 pt-4 pb-28 sm:px-8 sm:pt-6 lg:pb-10">
          {/* Floating Banners (Seamlessly integrated inside main, not cutting screen width) */}
          {guest && (
            <FloatingBanner tone="brand" icon={Info}>
              You’re exploring a sample household. Nothing here is real or saved.{' '}
              <Link href={`/signup?next=${next}`} className="font-bold underline underline-offset-2">
                Create a free account
              </Link>{' '}
              to track your own money.
            </FloatingBanner>
          )}

          {viewer.kind === 'user' && !viewer.verified && (
            <FloatingBanner tone="warning" icon={MailWarning}>
              Verify your email to turn on payments and AutoPay.{' '}
              <Link href={`/verify?next=${next}`} className="font-bold underline underline-offset-2">
                Verify now
              </Link>
            </FloatingBanner>
          )}

          {viewer.kind === 'user' && sample && (
            <FloatingBanner tone="brand" icon={Info}>
              Your account is showing sample data so you can try everything.{' '}
              <Link href="/settings?tab=demo" className="font-bold underline underline-offset-2">
                Clear it when you’re ready
              </Link>
            </FloatingBanner>
          )}

          {storageWarning && (
            <FloatingBanner tone="warning" icon={FlaskConical}>
              Data on this deployment is temporary and may reset.{' '}
              <Link href="/settings?tab=connections" className="underline underline-offset-2">
                How to keep it
              </Link>
            </FloatingBanner>
          )}

          {children}
        </main>
      </div>

      {/* Floating Action Button on mobile */}
      <Link
        href="/expenses/new"
        aria-label="Add expense"
        className="fixed right-4 bottom-20 z-40 flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/35 transition-transform active:scale-95 lg:hidden"
      >
        <Plus className="size-6 stroke-[2.5]" />
      </Link>

      {/* Mobile bottom navigation */}
      <nav
        aria-label="Quick"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border/80 bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg lg:hidden"
      >
        {BOTTOM.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href)
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold transition-colors',
                active ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              <Icon className="size-5" />
              {label}
            </Link>
          )
        })}
        <button
          onClick={() => setOpen(true)}
          className="flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
        >
          <Menu className="size-5" />
          More
        </button>
      </nav>
    </div>
  )
}
