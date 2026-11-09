'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  Bell,
  CalendarClock,
  FlaskConical,
  History,
  House,
  Menu,
  PiggyBank,
  ReceiptText,
  Repeat,
  Settings,
  ShieldAlert,
  Users,
  X,
} from 'lucide-react'
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

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-lg font-black text-primary-foreground">T</span>
      <span>
        <span className="block text-[17px] leading-tight font-bold tracking-tight">Tinku</span>
        <span className="block text-[11px] leading-tight text-muted-foreground">Expenses & bill payments</span>
      </span>
    </Link>
  )
}

export function AppShell({
  children,
  unread,
  demoLabel,
}: {
  children: React.ReactNode
  unread: number
  demoLabel: string
}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

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

  return (
    <div className="min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-sidebar px-4 py-6 lg:flex">
        <div className="px-2">
          <Brand />
        </div>
        <div className="mt-7 flex-1 overflow-y-auto">
          <NavList pathname={pathname} />
        </div>
        <div className="border-t pt-3">{settingsLink()}</div>
      </aside>

      {/* Mobile drawer */}
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
          <button aria-label="Open menu" onClick={() => setOpen(true)} className="-ml-1 rounded-lg p-2 hover:bg-muted lg:hidden">
            <Menu className="size-5" />
          </button>
          <div className="lg:hidden">
            <Brand />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/settings"
              className="hidden items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground sm:inline-flex"
              title="Payments run in demo mode. See Settings."
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
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6 sm:px-8 sm:py-8">{children}</main>
      </div>
    </div>
  )
}
