'use client'

import Link from 'next/link'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { ArrowRight, Compass, Layers, ShieldAlert, Wallet, X } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useTour } from './tour-provider'

export function WelcomeModal() {
  const { welcomeOpen, dismissWelcome, startTour } = useTour()

  return (
    <DialogPrimitive.Root open={welcomeOpen} onOpenChange={(open) => !open && dismissWelcome()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-foreground/45 backdrop-blur-[2px] transition-opacity" />
        <DialogPrimitive.Popup
          aria-describedby="tinku-welcome-desc"
          className="fixed top-1/2 left-1/2 z-50 max-h-[90dvh] w-[min(34rem,calc(100vw-1.5rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border border-border bg-card p-5 sm:p-7 text-card-foreground shadow-2xl outline-none"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex size-10 sm:size-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-lg sm:text-xl font-black text-primary-foreground shadow-sm shadow-primary/25">
                T
              </span>
              <div>
                <p className="text-[11px] font-bold tracking-[0.14em] text-primary uppercase">Welcome to Tinku</p>
                <DialogPrimitive.Title className="text-lg sm:text-xl font-extrabold tracking-tight text-foreground">
                  Clarity for every rupee & bill
                </DialogPrimitive.Title>
              </div>
            </div>
            <DialogPrimitive.Close
              aria-label="Close welcome dialog"
              className="rounded-xl p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </DialogPrimitive.Close>
          </div>

          <DialogPrimitive.Description id="tinku-welcome-desc" className="mt-3.5 text-sm leading-relaxed text-muted-foreground">
            Tinku guides you feature by feature as you explore—starting right here on Home, and introducing Expenses, Budgets, Bills, AutoPay, Wishlist, Crisis Drill, and Groups on your first visit to each page.
          </DialogPrimitive.Description>

          <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-muted/35 p-3">
              <Wallet className="size-4 text-primary" aria-hidden="true" />
              <p className="mt-1.5 text-xs font-bold text-foreground">Daily Cash Flow</p>
              <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                Know what stays free after upcoming bills.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-muted/35 p-3">
              <Layers className="size-4 text-primary" aria-hidden="true" />
              <p className="mt-1.5 text-xs font-bold text-foreground">12 Real Categories</p>
              <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                Essentials separated clearly from flexible spending.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-muted/35 p-3">
              <ShieldAlert className="size-4 text-primary" aria-hidden="true" />
              <p className="mt-1.5 text-xs font-bold text-foreground">Crisis Drill</p>
              <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                Test emergencies before unexpected costs hit.
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => startTour('home', 0, { enableAutoPages: true })}
                className={cn(buttonVariants({ variant: 'default', size: 'lg' }), 'rounded-full px-5 font-bold gap-2')}
              >
                Start Guided Flow <ArrowRight className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => startTour('category-discovery', 0, { enableAutoPages: false })}
                className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'rounded-full px-4 font-semibold gap-1.5')}
              >
                <Compass className="size-4 text-primary" /> Categories
              </button>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 pt-1 sm:pt-0">
              <Link
                href="/help"
                onClick={dismissWelcome}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
              >
                Help Center
              </Link>
              <button
                type="button"
                onClick={dismissWelcome}
                className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'rounded-full text-xs font-semibold text-muted-foreground')}
              >
                Skip for now
              </button>
            </div>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
