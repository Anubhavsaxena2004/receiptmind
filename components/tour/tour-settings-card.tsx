'use client'

import Link from 'next/link'
import { CheckCircle2, Compass, HelpCircle, Play, RotateCcw } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { TOUR_ORDER, TOURS } from '@/lib/tours'
import { cn } from '@/lib/utils'
import { useTour } from './tour-provider'

export function TourSettingsCard() {
  const { completedTours, autoTourPages, setAutoTourPages, startTour, openWelcome, resetTours } = useTour()

  return (
    <Card>
      <CardHeader
        title="Guided Tours & Progressive Walkthroughs"
        description="Replay any feature tour, enable automatic guides on first visits, or reset your onboarding progress."
      />
      <CardBody className="space-y-4">
        <label className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl border border-border bg-muted/25 p-4">
          <div>
            <p className="text-sm font-bold text-foreground">Auto-guide features on first visit</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Automatically show each page’s short tour the first time you open Expenses, Budgets, Bills, AutoPay, Wishlist, Crisis Drill, or Groups.
            </p>
          </div>
          <input
            type="checkbox"
            checked={autoTourPages}
            onChange={(e) => setAutoTourPages(e.target.checked)}
            className="mt-1 size-4 accent-[var(--primary)] cursor-pointer shrink-0"
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TOUR_ORDER.map((id) => {
            const track = TOURS[id]
            const done = completedTours.includes(id)
            return (
              <div
                key={id}
                className="flex flex-col justify-between rounded-2xl border border-border bg-muted/25 p-3.5"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold tracking-wider text-primary uppercase">
                      {track.steps.length} steps · {track.estimatedTime}
                    </span>
                    {done && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-success">
                        <CheckCircle2 className="size-3.5" aria-hidden="true" /> Done
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-sm font-bold text-foreground">{track.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{track.subtitle}</p>
                </div>

                <button
                  type="button"
                  onClick={() => startTour(id)}
                  className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'mt-3.5 w-full rounded-full font-semibold gap-1.5')}
                >
                  <Play className="size-3.5 text-primary" /> {done ? 'Replay' : 'Start Tour'}
                </button>
              </div>
            )
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={openWelcome}
              className={cn(buttonVariants({ variant: 'default', size: 'sm' }), 'rounded-full font-bold gap-1.5')}
            >
              <Compass className="size-3.5" /> Open Welcome Dialog
            </button>
            <button
              type="button"
              onClick={resetTours}
              className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'rounded-full text-xs font-semibold gap-1.5 text-muted-foreground hover:text-foreground')}
            >
              <RotateCcw className="size-3.5" /> Reset & Restart Flow
            </button>
          </div>

          <Link
            href="/help"
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'rounded-full text-xs font-semibold gap-1.5')}
          >
            <HelpCircle className="size-3.5 text-primary" /> Open Help & Tutorial Center
          </Link>
        </div>
      </CardBody>
    </Card>
  )
}
