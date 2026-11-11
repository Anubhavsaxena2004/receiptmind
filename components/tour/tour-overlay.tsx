'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { usePathname } from 'next/navigation'
import { ArrowLeft, ArrowRight, Check, Compass, X } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { TOURS, type TourPlacement } from '@/lib/tours'
import { cn } from '@/lib/utils'
import { useTour } from './tour-provider'

interface TargetRect {
  top: number
  left: number
  width: number
  height: number
  fixed: boolean
}

const PAD = 6
const GAP = 12
const VIEW_MARGIN = 12

function isElementVisible(el: Element | null): el is HTMLElement {
  if (!(el instanceof HTMLElement)) return false
  const style = window.getComputedStyle(el)
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false
  const rect = el.getBoundingClientRect()
  return rect.width > 0 && rect.height > 0
}

function isFixedDescendant(el: HTMLElement): boolean {
  let cur: HTMLElement | null = el
  while (cur) {
    if (window.getComputedStyle(cur).position === 'fixed') return true
    cur = cur.parentElement
  }
  return false
}

function findStepTarget(selector?: string, mobileSelector?: string): HTMLElement | null {
  if (typeof document === 'undefined') return null
  if (selector) {
    const primary = document.querySelector(selector)
    if (isElementVisible(primary)) return primary
  }
  if (mobileSelector) {
    const fallback = document.querySelector(mobileSelector)
    if (isElementVisible(fallback)) return fallback
  }
  return null
}

function computeTooltipCoords(
  rect: TargetRect | null,
  tooltipWidth: number,
  tooltipHeight: number,
  preferred: TourPlacement = 'bottom',
): { top: number; left: number; isMobileDock: boolean } {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const isMobile = vw < 640

  // Mobile (<640px): Always dock cleanly to top or bottom edge so the tooltip NEVER sits on top of the highlighted feature
  if (isMobile) {
    const horizontalLeft = Math.max(VIEW_MARGIN, Math.round((vw - tooltipWidth) / 2))
    if (!rect) {
      return {
        top: Math.max(VIEW_MARGIN, vh - tooltipHeight - VIEW_MARGIN),
        left: horizontalLeft,
        isMobileDock: true,
      }
    }

    const bottomDockTop = Math.max(VIEW_MARGIN, vh - tooltipHeight - VIEW_MARGIN)
    const topDockTop = VIEW_MARGIN

    // If element is fixed near the bottom (e.g. mobile nav / FAB) OR bottom dock would cover most of the target even after scroll -> dock at TOP
    const targetBottom = rect.top + rect.height
    const bottomOverlap = Math.max(0, Math.min(targetBottom, vh) - Math.max(rect.top, bottomDockTop))
    const topOverlap = Math.max(0, Math.min(targetBottom, topDockTop + tooltipHeight) - Math.max(rect.top, topDockTop))

    if (rect.fixed && rect.top > vh * 0.5) {
      return { top: topDockTop, left: horizontalLeft, isMobileDock: true }
    }
    if (bottomOverlap > topOverlap + 24 && topOverlap === 0) {
      return { top: topDockTop, left: horizontalLeft, isMobileDock: true }
    }
    return { top: bottomDockTop, left: horizontalLeft, isMobileDock: true }
  }

  // Desktop / Tablet (>=640px): Smart placement around target without overlapping it
  const centerCoords = {
    top: Math.max(VIEW_MARGIN, Math.round((vh - tooltipHeight) / 2)),
    left: Math.max(VIEW_MARGIN, Math.round((vw - tooltipWidth) / 2)),
    isMobileDock: false,
  }

  if (!rect || preferred === 'center') return centerCoords

  const candidates: TourPlacement[] = [
    preferred,
    preferred === 'bottom' ? 'top' : preferred === 'top' ? 'bottom' : preferred === 'right' ? 'left' : 'right',
    'bottom',
    'top',
    'right',
    'left',
  ]

  const spotTop = rect.top - PAD
  const spotLeft = rect.left - PAD
  const spotRight = rect.left + rect.width + PAD
  const spotBottom = rect.top + rect.height + PAD

  for (const side of candidates) {
    if (side === 'bottom') {
      const top = spotBottom + GAP
      if (top + tooltipHeight + VIEW_MARGIN <= vh) {
        const rawLeft = rect.left + rect.width / 2 - tooltipWidth / 2
        const left = Math.max(VIEW_MARGIN, Math.min(rawLeft, vw - tooltipWidth - VIEW_MARGIN))
        return { top, left, isMobileDock: false }
      }
    } else if (side === 'top') {
      const top = spotTop - GAP - tooltipHeight
      if (top >= VIEW_MARGIN) {
        const rawLeft = rect.left + rect.width / 2 - tooltipWidth / 2
        const left = Math.max(VIEW_MARGIN, Math.min(rawLeft, vw - tooltipWidth - VIEW_MARGIN))
        return { top, left, isMobileDock: false }
      }
    } else if (side === 'right') {
      const left = spotRight + GAP
      if (left + tooltipWidth + VIEW_MARGIN <= vw) {
        const rawTop = rect.top + rect.height / 2 - tooltipHeight / 2
        const top = Math.max(VIEW_MARGIN, Math.min(rawTop, vh - tooltipHeight - VIEW_MARGIN))
        return { top, left, isMobileDock: false }
      }
    } else if (side === 'left') {
      const left = spotLeft - GAP - tooltipWidth
      if (left >= VIEW_MARGIN) {
        const rawTop = rect.top + rect.height / 2 - tooltipHeight / 2
        const top = Math.max(VIEW_MARGIN, Math.min(rawTop, vh - tooltipHeight - VIEW_MARGIN))
        return { top, left, isMobileDock: false }
      }
    }
  }

  // Fallback for very tall sections: pin to bottom-right or top-right corner away from center
  return {
    top: spotTop > vh * 0.45 ? VIEW_MARGIN : Math.max(VIEW_MARGIN, vh - tooltipHeight - VIEW_MARGIN),
    left: Math.max(VIEW_MARGIN, vw - tooltipWidth - VIEW_MARGIN),
    isMobileDock: false,
  }
}

export function TourOverlay() {
  const pathname = usePathname()
  const {
    activeTour,
    activeTrack,
    currentStep,
    stepIndex,
    totalSteps,
    autoTourPages,
    nextStep,
    prevStep,
    goToStep,
    skipTour,
    finishTour,
    startNextFeatureTour,
  } = useTour()

  const tooltipRef = useRef<HTMLDivElement>(null)
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null)
  const [tooltipSize, setTooltipSize] = useState({ width: 340, height: 210 })
  const [coords, setCoords] = useState({ top: 120, left: 16, isMobileDock: false })

  const isRouteReady = Boolean(currentStep && currentStep.route === pathname)

  // Locate target, smartly position viewport on mobile/desktop, and track bounding box
  useEffect(() => {
    if (!activeTour || !currentStep || !isRouteReady) {
      setTargetRect(null)
      return
    }

    let cancelled = false
    let scrolledStepId: string | null = null

    const measure = (allowScroll: boolean) => {
      if (cancelled) return
      const el = findStepTarget(currentStep.selector, currentStep.mobileSelector)
      if (!el) {
        setTargetRect(null)
        return
      }

      const fixed = isFixedDescendant(el)
      const r = el.getBoundingClientRect()

      if (allowScroll && scrolledStepId !== currentStep.id && !fixed) {
        scrolledStepId = currentStep.id
        const isMobile = window.innerWidth < 640
        if (isMobile) {
          // Bring element top cleanly below sticky 64px header so bottom-docked guide never obscures its headline/data
          const targetScrollY = Math.max(0, window.scrollY + r.top - 76)
          window.scrollTo({ top: targetScrollY, behavior: 'smooth' })
        } else {
          el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
        }
      }

      const fresh = el.getBoundingClientRect()
      setTargetRect({
        top: fresh.top,
        left: fresh.left,
        width: fresh.width,
        height: fresh.height,
        fixed,
      })
    }

    measure(true)
    const retryIntervals = [60, 180, 380, 700]
    const timers = retryIntervals.map((ms) => window.setTimeout(() => measure(false), ms))

    const onUpdate = () => measure(false)
    window.addEventListener('resize', onUpdate)
    window.addEventListener('scroll', onUpdate, true)

    const observer = new MutationObserver(() => measure(false))
    observer.observe(document.body, { childList: true, subtree: true, attributes: false })

    return () => {
      cancelled = true
      timers.forEach((t) => window.clearTimeout(t))
      window.removeEventListener('resize', onUpdate)
      window.removeEventListener('scroll', onUpdate, true)
      observer.disconnect()
    }
  }, [activeTour, currentStep, isRouteReady])

  useLayoutEffect(() => {
    if (!activeTour || !tooltipRef.current) return
    const rect = tooltipRef.current.getBoundingClientRect()
    const w = rect.width || 340
    const h = rect.height || 210
    setTooltipSize((prev) => (prev.width === w && prev.height === h ? prev : { width: w, height: h }))
  }, [activeTour, stepIndex, currentStep?.description, currentStep?.tip])

  useLayoutEffect(() => {
    if (!activeTour) return
    const next = computeTooltipCoords(
      targetRect,
      tooltipSize.width,
      tooltipSize.height,
      currentStep?.placement ?? 'bottom',
    )
    setCoords(next)
  }, [activeTour, targetRect, tooltipSize, currentStep?.placement])

  useEffect(() => {
    if (!activeTour || !tooltipRef.current) return
    tooltipRef.current.focus({ preventScroll: true })
  }, [activeTour, stepIndex])

  if (!activeTour || !activeTrack || !currentStep || typeof document === 'undefined') {
    return null
  }

  const isLast = stepIndex + 1 >= totalSteps
  const progressPct = Math.round(((stepIndex + 1) / totalSteps) * 100)
  const nextTrack = activeTrack.nextTourId ? TOURS[activeTrack.nextTourId] : null

  const spotTop = targetRect ? Math.max(4, targetRect.top - PAD) : 0
  const spotLeft = targetRect ? Math.max(4, targetRect.left - PAD) : 0
  const spotWidth = targetRect ? Math.min(window.innerWidth - 8, targetRect.width + PAD * 2) : 0
  const spotHeight = targetRect ? targetRect.height + PAD * 2 : 0

  return createPortal(
    <div className="fixed inset-0 z-50 pointer-events-none" aria-live="polite">
      {/* Subtle Spotlight Backdrop */}
      <svg
        className="fixed inset-0 h-full w-full pointer-events-auto transition-opacity duration-200"
        aria-hidden="true"
        onClick={(e) => {
          if (e.target === e.currentTarget) skipTour(false)
        }}
      >
        <defs>
          <mask id="tinku-tour-spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={spotLeft}
                y={spotTop}
                width={spotWidth}
                height={spotHeight}
                rx="16"
                ry="16"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(14, 13, 13, 0.56)"
          mask="url(#tinku-tour-spotlight-mask)"
        />
      </svg>

      {/* Highlight Frame Ring */}
      {targetRect && (
        <div
          aria-hidden="true"
          className="fixed rounded-[16px] ring-2 ring-primary shadow-[0_0_0_4px_rgba(242,90,12,0.18)] transition-all duration-200 pointer-events-none"
          style={{
            top: spotTop,
            left: spotLeft,
            width: spotWidth,
            height: spotHeight,
          }}
        />
      )}

      {/* Contextual Tooltip Card (Edge-docked & compact on small screens) */}
      <div
        ref={tooltipRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tinku-tour-title"
        aria-describedby="tinku-tour-desc"
        tabIndex={-1}
        style={{
          top: coords.top,
          left: coords.left,
        }}
        className={cn(
          'fixed z-50 pointer-events-auto rounded-2xl border border-border bg-card text-card-foreground shadow-2xl outline-none transition-all duration-200',
          coords.isMobileDock
            ? 'w-[calc(100vw-1.5rem)] max-w-md p-3.5 max-h-[42dvh] overflow-y-auto'
            : 'w-[min(22.5rem,calc(100vw-2rem))] p-5',
        )}
      >
        {/* Top Meta & Close */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex size-5 sm:size-6 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Compass className="size-3 sm:size-3.5" aria-hidden="true" />
            </span>
            <span className="truncate text-[10px] sm:text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
              {activeTrack.title}
            </span>
          </div>
          <button
            type="button"
            onClick={() => skipTour(false)}
            aria-label="Skip tour"
            className="rounded-lg p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Progress Bar + Step Counter */}
        <div className="mt-2 sm:mt-3 flex items-center gap-2.5">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted" aria-hidden="true">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="shrink-0 text-[11px] font-bold tabular-nums text-muted-foreground">
            {stepIndex + 1} of {totalSteps}
          </span>
        </div>

        {/* Step Content */}
        <div className="mt-2.5 sm:mt-3.5">
          <h2 id="tinku-tour-title" className="text-sm sm:text-base font-extrabold tracking-tight text-foreground">
            {currentStep.title}
          </h2>
          <p id="tinku-tour-desc" className="mt-1 text-xs sm:text-sm leading-relaxed text-muted-foreground">
            {currentStep.description}
          </p>
          {currentStep.tip && (
            <p className="mt-2 rounded-xl border border-border/80 bg-muted/40 px-2.5 py-1.5 text-[11px] sm:text-xs text-foreground">
              <span className="font-bold text-primary">Tip: </span>
              {currentStep.tip}
            </p>
          )}
          {!isRouteReady && (
            <p className="mt-1.5 text-xs font-medium text-muted-foreground">Opening section…</p>
          )}
        </div>

        {/* Clickable Step Dots */}
        {totalSteps > 1 && (
          <div className="mt-3 sm:mt-4 flex items-center justify-center gap-1.5" role="tablist" aria-label="Tour steps">
            {activeTrack.steps.map((s, idx) => {
              const active = idx === stepIndex
              return (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-label={`Go to step ${idx + 1}: ${s.title}`}
                  onClick={() => goToStep(idx)}
                  className={cn(
                    'h-1.5 rounded-full transition-all',
                    active ? 'w-5 bg-primary' : 'w-1.5 bg-border hover:bg-muted-foreground',
                  )}
                />
              )
            })}
          </div>
        )}

        {/* Controls */}
        <div className="mt-3 sm:mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-2.5 sm:pt-3.5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => skipTour(false)}
              className="text-xs font-semibold text-muted-foreground hover:text-foreground transition"
            >
              Skip
            </button>
            {autoTourPages && (
              <button
                type="button"
                onClick={() => skipTour(true)}
                className="text-[11px] font-medium text-muted-foreground/80 hover:text-foreground underline underline-offset-2 transition"
              >
                Stop auto-guides
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {stepIndex > 0 && (
              <button
                type="button"
                onClick={prevStep}
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'h-8 rounded-full px-2.5 sm:px-3 text-xs font-semibold gap-1')}
              >
                <ArrowLeft className="size-3.5" /> Back
              </button>
            )}

            {isLast ? (
              <>
                <button
                  type="button"
                  onClick={finishTour}
                  className={cn(
                    buttonVariants({ variant: nextTrack ? 'outline' : 'default', size: 'sm' }),
                    'h-8 rounded-full px-3 text-xs font-bold gap-1',
                  )}
                >
                  <Check className="size-3.5 stroke-[2.5]" /> Done
                </button>
                {nextTrack && (
                  <button
                    type="button"
                    onClick={startNextFeatureTour}
                    className={cn(buttonVariants({ variant: 'default', size: 'sm' }), 'h-8 rounded-full px-3.5 text-xs font-bold gap-1')}
                  >
                    {activeTrack.nextLabel ?? `Next: ${nextTrack.title}`} <ArrowRight className="size-3.5" />
                  </button>
                )}
              </>
            ) : (
              <button
                type="button"
                onClick={nextStep}
                className={cn(buttonVariants({ variant: 'default', size: 'sm' }), 'h-8 rounded-full px-3.5 text-xs font-bold gap-1')}
              >
                Next <ArrowRight className="size-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
