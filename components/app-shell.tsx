'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { startTransition, useEffect, useState } from 'react'
import { Menu as MenuPrimitive } from '@base-ui/react/menu'
import {
  Bell,
  CalendarClock,
  ChevronDown,
  FlaskConical,
  History,
  House,
  LogOut,
  MailWarning,
  Menu,
  PiggyBank,
  Plus,
  ReceiptText,
  Repeat,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from 'lucide-react'
import type { ClientViewer } from '@/components/auth/auth-context'
import { buttonVariants } from '@/components/ui/button'
import { logoutAction } from '@/lib/actions/auth'
import { cn } from '@/lib/utils'

type Icon = React.ComponentType<{ className?: string }>

const NAV: { section?: string; items: { href: string; label: string; icon: Icon; hint: string }[] }[] = [
  { items: [{ href: '/', label: 'Home', icon: House, hint: 'What needs you today' }] },
  {
    section: 'Track',
    items: [
      { href: '/expenses', label: 'Expenses', icon: ReceiptText, hint: 'Add or scan what you spent' },
      { href: '/budgets', label: 'Budgets', icon: PiggyBank, hint: 'Monthly limits' },
    ],
  },
  {
    section: 'Pay',
    items: [
      { href: '/bills', label: 'Bills', icon: CalendarClock, hint: 'Due dates & how to pay' },
      { href: '/autopay', label: 'AutoPay', icon: Repeat, hint: 'Bills paid for you' },
      { href: '/history', label: 'Payment history', icon: History, hint: 'Every payment & status' },
    ],
  },
  {
    section: 'Plan ahead',
    items: [{ href: '/drill', label: 'Crisis drill', icon: ShieldAlert, hint: 'Test an emergency' }],
  },
  {
    section: 'Together',
    items: [{ href: '/groups', label: 'Groups', icon: Users, hint: 'Split & track who paid' }],
  },
]

const BOTTOM: { href: string; label: string; icon: Icon }[] = [
  { href: '/', label: 'Home', icon: House },
  { href: '/expenses', label: 'Expenses', icon: ReceiptText },
  { href: '/bills', label: 'Bills', icon: CalendarClock },
  { href: '/drill', label: 'Drill', icon: ShieldAlert },
]

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

function NavList({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav aria-label="Main" className="space-y-5">
      {NAV.map((group, i) => (
        <div key={group.section ?? i}>
          {group.section && (
            <p className="mb-1.5 px-3 text-[11px] font-bold tracking-[0.14em] text-muted-foreground uppercase">{group.section}</p>
          )}
          <ul className="space-y-0.5">
            {group.items.map(({ href, label, icon: Icon, hint }) => {
              const active = isActive(pathname, href)
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'group flex items-center gap-3 rounded-xl px-3 py-2.5 transition',
                      active ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-foreground/80 hover:bg-muted',
                    )}
                  >
                    <Icon className={cn('size-[18px] shrink-0', active ? '' : 'text-muted-foreground group-hover:text-foreground')} />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">{label}</span>
                      <span className={cn('block truncate text-xs', active ? 'opacity-80' : 'text-muted-foreground')}>{hint}</span>
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
    <Link href="/" className="flex items-center gap-2.5 group">
      <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-lg font-black text-primary-foreground shadow-sm shadow-primary/30 transition-transform group-hover:scale-105">
        T.
      </span>
      <span>
        <span className="block text-[17px] leading-tight font-bold tracking-tight">Tinku</span>
        <span className="block text-[11px] leading-tight text-muted-foreground font-medium">Smart Finance</span>
      </span>
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
  const item = 'flex w-full cursor-default items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm outline-none data-[highlighted]:bg-muted'
  return (
    <MenuPrimitive.Root>
      <MenuPrimitive.Trigger
        aria-label={`Account: ${viewer.name}`}
        className="flex items-center gap-2 rounded-xl border bg-card py-1 pr-2 pl-1 text-sm font-semibold hover:bg-muted"
      >
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
          {initials(viewer.name)}
        </span>
        <span className="hidden max-w-32 truncate md:inline">{viewer.name}</span>
        <ChevronDown className="size-4 text-muted-foreground" aria-hidden />
      </MenuPrimitive.Trigger>
      <MenuPrimitive.Portal>
        <MenuPrimitive.Positioner sideOffset={8} align="end" className="z-50">
          <MenuPrimitive.Popup className="w-64 rounded-xl border bg-popover p-1.5 text-popover-foreground shadow-xl outline-none">
            <div className="px-2.5 py-2">
              <p className="truncate text-sm font-semibold">{viewer.name}</p>
              <p className="truncate text-xs text-muted-foreground">{viewer.email}</p>
              <p className={cn('mt-1.5 inline-flex items-center gap-1 text-xs font-medium', viewer.verified ? 'text-success' : 'text-warning')}>
                {viewer.verified ? <ShieldCheck className="size-3.5" aria-hidden /> : <MailWarning className="size-3.5" aria-hidden />}
                {viewer.verified ? 'Email verified' : 'Email not verified'}
              </p>
            </div>
            <div className="my-1 h-px bg-border" />
            <MenuPrimitive.LinkItem render={<Link href="/settings" />} className={item}>
              <Settings className="size-4 text-muted-foreground" aria-hidden /> Settings
            </MenuPrimitive.LinkItem>
            <MenuPrimitive.LinkItem render={<Link href="/settings?tab=security" />} className={item}>
              <ShieldCheck className="size-4 text-muted-foreground" aria-hidden /> Security
            </MenuPrimitive.LinkItem>
            <div className="my-1 h-px bg-border" />
            <MenuPrimitive.Item className={item} onClick={() => startTransition(() => logoutAction())}>
              <LogOut className="size-4 text-muted-foreground" aria-hidden /> Log out
            </MenuPrimitive.Item>
          </MenuPrimitive.Popup>
        </MenuPrimitive.Positioner>
      </MenuPrimitive.Portal>
    </MenuPrimitive.Root>
  )
}

function Banner({ tone, icon: Icon, children }: { tone: 'brand' | 'warning'; icon: Icon; children: React.ReactNode }) {
  return (
    <div
      role="status"
      className={cn(
        'flex items-center justify-center gap-2 border-b px-4 py-2 text-center text-xs font-medium sm:px-8 sm:text-[13px]',
        tone === 'brand' ? 'bg-secondary text-secondary-foreground' : 'bg-warning-soft text-warning',
      )}
    >
      <Icon className="hidden size-4 shrink-0 sm:block" aria-hidden />
      <span>{children}</span>
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
  /** The signed-in user loaded the sample data into their account. */
  sample?: boolean
  /** True when data can't be saved permanently on this host (e.g. Vercel without Redis). */
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
        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition',
        isActive(pathname, '/settings') ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-foreground/80 hover:bg-muted',
      )}
    >
      <Settings className="size-[18px] text-muted-foreground" /> Settings
    </Link>
  )

  const next = encodeURIComponent(pathname)

  return (
    <div className="min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-sidebar px-4 py-6 lg:flex">
        <div className="px-2">
          <Brand />
        </div>
        <div className="px-1 pt-5">
          <Link
            href="/expenses/new"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/25 transition hover:bg-primary/90 active:scale-[0.99]"
          >
            <Plus className="size-4 stroke-[2.5]" /> Quick Add
          </Link>
        </div>
        <div className="mt-5 flex-1 overflow-y-auto">
          <NavList pathname={pathname} />
        </div>
        <div className="border-t pt-3">{settingsLink()}</div>
      </aside>

      {/* Mobile drawer ("More") */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button aria-label="Close menu" className="absolute inset-0 bg-foreground/30" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[min(20rem,85vw)] flex-col bg-sidebar px-4 py-5 shadow-xl">
            <div className="flex items-center justify-between px-2">
              <Brand />
              <button aria-label="Close menu" onClick={() => setOpen(false)} className="rounded-lg p-2 hover:bg-muted">
                <X className="size-5" />
              </button>
            </div>
            <div className="mt-6 flex-1 overflow-y-auto">
              <NavList pathname={pathname} onNavigate={() => setOpen(false)} />
            </div>
            <div className="border-t pt-3">{settingsLink(() => setOpen(false))}</div>
          </div>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur sm:px-8">
          <div className="lg:hidden">
            <Brand />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/settings?tab=connections"
              className="hidden items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground md:inline-flex"
              title="Payments run in demo mode. See Settings → Connections."
            >
              <FlaskConical className="size-3.5" aria-hidden /> {demoLabel}
            </Link>
            <Link
              href="/notifications"
              aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
              className="relative flex size-10 items-center justify-center rounded-xl border bg-card text-muted-foreground hover:text-foreground"
            >
              <Bell className="size-[18px]" />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 flex min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </Link>
            {guest ? (
              <>
                <Link href={`/login?next=${next}`} className={cn(buttonVariants({ variant: 'ghost' }), 'hidden sm:inline-flex')}>
                  Log in
                </Link>
                <Link href={`/signup?next=${next}`} className={buttonVariants()}>
                  Sign up free
                </Link>
              </>
            ) : (
              <AccountMenu viewer={viewer} />
            )}
          </div>
        </header>

        {guest && (
          <Banner tone="brand" icon={Sparkles}>
            You’re exploring a sample household. Nothing here is real or saved.{' '}
            <Link href={`/signup?next=${next}`} className="font-bold underline underline-offset-2">
              Create a free account
            </Link>{' '}
            to track your own money.
          </Banner>
        )}
        {viewer.kind === 'user' && !viewer.verified && (
          <Banner tone="warning" icon={MailWarning}>
            Verify your email to turn on payments and AutoPay.{' '}
            <Link href={`/verify?next=${next}`} className="font-bold underline underline-offset-2">
              Verify now
            </Link>
          </Banner>
        )}
        {viewer.kind === 'user' && sample && (
          <Banner tone="brand" icon={Sparkles}>
            Your account is showing sample data so you can try everything.{' '}
            <Link href="/settings?tab=demo" className="font-bold underline underline-offset-2">
              Clear it when you’re ready
            </Link>
          </Banner>
        )}
        {storageWarning && (
          <Banner tone="warning" icon={FlaskConical}>
            Data on this deployment is temporary and may reset.{' '}
            <Link href="/settings?tab=connections" className="underline underline-offset-2">
              How to keep it
            </Link>
          </Banner>
        )}
        <main className="mx-auto max-w-5xl px-4 pt-6 pb-28 sm:px-8 sm:pt-8 lg:pb-10">{children}</main>
      </div>

      {/* Floating Action Button on mobile (Mint style) */}
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
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        {BOTTOM.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href)
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn('flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold', active ? 'text-primary' : 'text-muted-foreground')}
            >
              <Icon className="size-5" />
              {label}
            </Link>
          )
        })}
        <button onClick={() => setOpen(true)} className="flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold text-muted-foreground">
          <Menu className="size-5" />
          More
        </button>
      </nav>
    </div>
  )
}
