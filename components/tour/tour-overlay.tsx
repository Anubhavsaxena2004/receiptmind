'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { usePathname } from 'next/navigation'
import { ArrowLeft, ArrowRight, Check, Compass, X } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import type { TourPlacement } from '@/lib/tours'
import { cn } from '@/lib/utils'
import { useTour } from './tour-provider'

interface TargetRect {
  top: number
  left: number
  width: number
  height: number
}

const PAD = 8
const GAP = 14
const VIEW_MARGIN = 16

function isElementVisible(el: Element | null): el is HTMLElement {
  if (!(el instanceof HTMLElement)) return false
  const style = window.getComputedStyle(el)
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false
  const rect = el.getBoundingClientRect()
  return rect.width > 0 && rect.height > 0
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
): { top: number; left: number; centered: boolean } {
  const vw = window.innerWidth
  const vh = window.innerHeight

  const centerCoords = {
    top: Math.max(VIEW_MARGIN, Math.round((vh - tooltipHeight) / 2)),
    left: Math.max(VIEW_MARGIN, Math.round((vw - tooltipWidth) / 2)),
    centered: true,
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
        return { top, left, centered: false }
      }
    } else if (side === 'top') {
      const top = spotTop - GAP - tooltipHeight
      if (top >= VIEW_MARGIN) {
        const rawLeft = rect.left + rect.width / 2 - tooltipWidth / 2
        const left = Math.max(VIEW_MARGIN, Math.min(rawLeft, vw - tooltipWidth - VIEW_MARGIN))
        return { top, left, centered: false }
      }
    } else if (side === 'right') {
      const left = spotRight + GAP
      if (left + tooltipWidth + VIEW_MARGIN <= vw) {
        const rawTop = rect.top + rect.height / 2 - tooltipHeight / 2
        const top = Math.max(VIEW_MARGIN, Math.min(rawTop, vh - tooltipHeight - VIEW_MARGIN))
        return { top, left, centered: false }
      }
    } else if (side === 'left') {
      const left = spotLeft - GAP - tooltipWidth
      if (left >= VIEW_MARGIN) {
        const rawTop = rect.top + rect.height / 2 - tooltipHeight / 2
        const top = Math.max(VIEW_MARGIN, Math.min(rawTop, vh - tooltipHeight - VIEW_MARGIN))
        return { top, left, centered: false }
      }
    }
  }

  return centerCoords
}

export function TourOverlay() {
  const pathname = usePathname()
  const { activeTour, activeTrack, currentStep, stepIndex, totalSteps, nextStep, prevStep, goToStep, skipTour, finishTour } = useTour()

  const tooltipRef = useRef<HTMLDivElement>(null)
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null)
  const [tooltipSize, setTooltipSize] = useState({ width: 340, height: 240 })
  const [coords, setCoords] = useState({ top: 120, left: 24, centered: true })

  const isRouteReady = Boolean(currentStep && currentStep.route === pathname)

  // Locate target element and keep spotlight synchronized on scroll/resize/DOM mutations
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
      if (allowScroll && scrolledStepId !== currentStep.id) {
        scrolledStepId = currentStep.id
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
      }
      const r = el.getBoundingClientRect()
      setTargetRect({
        top: r.top,
        left: r.left,
        width: r.width,
        height: r.height,
      })
    }

    // Immediate measure plus brief retry polling while Next.js page transitions settle
    measure(true)
    const retryIntervals = [60, 180, 380, 700]
    const timers = retryIntervals.map((ms) => window.setTimeout(() => measure(true), ms))

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

  // Measure tooltip box and compute safe viewport placement
  useLayoutEffect(() => {
    if (!activeTour || !tooltipRef.current) return
    const rect = tooltipRef.current.getBoundingClientRect()
    const w = rect.width || 340
    const h = rect.height || 240
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

  // Move keyboard focus into dialog on step transitions for screen reader & keyboard accessibility
  useEffect(() => {
    if (!activeTour || !tooltipRef.current) return
    tooltipRef.current.focus({ preventScroll: true })
  }, [activeTour, stepIndex])

  if (!activeTour || !activeTrack || !currentStep || typeof document === 'undefined') {
    return null
  }

  const isLast = stepIndex + 1 >= totalSteps
  const progressPct = Math.round(((stepIndex + 1) / totalSteps) * 100)

  const spotTop = targetRect ? Math.max(4, targetRect.top - PAD) : 0
  const spotLeft = targetRect ? Math.max(4, targetRect.left - PAD) : 0
  const spotWidth = targetRect ? targetRect.width + PAD * 2 : 0
  const spotHeight = targetRect ? targetRect.height + PAD * 2 : 0

  return createPortal(
    <div className="fixed inset-0 z-50 pointer-events-none" aria-live="polite">
      {/* Subtle Spotlight Backdrop using SVG evenodd cutout */}
      <svg
        className="fixed inset-0 h-full w-full pointer-events-auto transition-opacity duration-200"
        aria-hidden="true"
        onClick={(e) => {
          if (e.target === e.currentTarget) skipTour()
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
                rx="18"
                ry="18"
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
          className="fixed rounded-[18px] ring-2 ring-primary shadow-[0_0_0_4px_rgba(242,90,12,0.18)] transition-all duration-200 pointer-events-none"
          style={{
            top: spotTop,
            left: spotLeft,
            width: spotWidth,
            height: spotHeight,
          }}
        />
      )}

      {/* Contextual Tooltip Card */}
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
        className="fixed z-50 w-[min(22.5rem,calc(100vw-2rem))] pointer-events-auto rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-2xl outline-none transition-all duration-200"
      >
        {/* Top Meta & Close */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Compass className="size-3.5" aria-hidden="true" />
            </span>
            <span className="truncate text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
              {activeTrack.title}
            </span>
          </div>
          <button
            type="button"
            onClick={skipTour}
            aria-label="Skip tour"
            className="rounded-lg p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Progress Bar + Step Counter */}
        <div className="mt-3 flex items-center gap-2.5">
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
        <div className="mt-3.5">
          <h2 id="tinku-tour-title" className="text-base font-extrabold tracking-tight text-foreground">
            {currentStep.title}
          </h2>
          <p id="tinku-tour-desc" className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {currentStep.description}
          </p>
          {currentStep.tip && (
            <p className="mt-2.5 rounded-xl border border-border/80 bg-muted/40 px-3 py-2 text-xs text-foreground">
              <span className="font-bold text-primary">Tip: </span>
              {currentStep.tip}
            </p>
          )}
          {!isRouteReady && (
            <p className="mt-2 text-xs font-medium text-muted-foreground">Opening section…</p>
          )}
        </div>

        {/* Clickable Step Indicators for Free Navigation */}
        <div className="mt-4 flex items-center justify-center gap-1.5" role="tablist" aria-label="Tour steps">
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

        {/* Controls */}
        <div className="mt-4 flex items-center justify-between gap-2 border-t border-border/70 pt-3.5">
          <button
            type="button"
            onClick={skipTour}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground transition"
          >
            Skip Tour
          </button>

          <div className="flex items-center gap-2">
            {stepIndex > 0 && (
              <button
                type="button"
                onClick={prevStep}
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'rounded-full px-3 text-xs font-semibold gap-1')}
              >
                <ArrowLeft className="size-3.5" /> Previous
              </button>
            )}

            {isLast ? (
              <button
                type="button"
                onClick={finishTour}
                className={cn(buttonVariants({ variant: 'default', size: 'sm' }), 'rounded-full px-4 text-xs font-bold gap-1.5')}
              >
                <Check className="size-3.5 stroke-[2.5]" /> Finish Tour
              </button>
            ) : (
              <button
                type="button"
                onClick={nextStep}
                className={cn(buttonVariants({ variant: 'default', size: 'sm' }), 'rounded-full px-4 text-xs font-bold gap-1')}
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

