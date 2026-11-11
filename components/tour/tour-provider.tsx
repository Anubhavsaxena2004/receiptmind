'use client'

import { createContext, Suspense, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { PAGE_TOUR_BY_ROUTE, TOURS, type TourId, type TourStep, type TourTrack } from '@/lib/tours'
import { TourOverlay } from './tour-overlay'
import { WelcomeModal } from './welcome-modal'

const STORAGE_KEY = 'tinku:tour:v2'

interface StoredTourState {
  welcomeSeen: boolean
  autoTourPages: boolean
  seenRoutes: string[]
  completedTours: TourId[]
}

const DEFAULT_STORAGE: StoredTourState = {
  welcomeSeen: false,
  autoTourPages: false,
  seenRoutes: [],
  completedTours: [],
}

interface TourContextValue {
  activeTour: TourId | null
  activeTrack: TourTrack | null
  currentStep: TourStep | null
  stepIndex: number
  totalSteps: number
  welcomeOpen: boolean
  welcomeSeen: boolean
  autoTourPages: boolean
  completedTours: TourId[]
  startTour: (id: TourId, startAt?: number, options?: { enableAutoPages?: boolean }) => void
  startNextFeatureTour: () => void
  nextStep: () => void
  prevStep: () => void
  goToStep: (index: number) => void
  skipTour: (disableAutoPages?: boolean) => void
  finishTour: () => void
  dismissWelcome: () => void
  openWelcome: () => void
  setAutoTourPages: (enabled: boolean) => void
  resetTours: () => void
}

const TourContext = createContext<TourContextValue | null>(null)

function normalizeTourId(value: string | null): TourId | null {
  if (!value) return null
  if (value === 'welcome' || value === 'navigation') return 'home'
  if (value in TOURS) return value as TourId
  return null
}

function readStoredState(): StoredTourState {
  if (typeof window === 'undefined') return DEFAULT_STORAGE
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_STORAGE
    const parsed = JSON.parse(raw) as Partial<StoredTourState>
    const completed = Array.isArray(parsed.completedTours)
      ? parsed.completedTours.map((x) => normalizeTourId(String(x))).filter((x): x is TourId => x !== null)
      : []
    const seenRoutes = Array.isArray(parsed.seenRoutes)
      ? parsed.seenRoutes.filter((r): r is string => typeof r === 'string')
      : []
    return {
      welcomeSeen: Boolean(parsed.welcomeSeen),
      autoTourPages: Boolean(parsed.autoTourPages),
      seenRoutes,
      completedTours: [...new Set(completed)],
    }
  } catch {
    return DEFAULT_STORAGE
  }
}

function writeStoredState(next: StoredTourState) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Ignore storage quota or private mode issues
  }
}

function TourQueryListener({ onRequestTour }: { onRequestTour: (id: TourId) => void }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const handledRef = useRef<string | null>(null)

  useEffect(() => {
    const tourParam = normalizeTourId(searchParams.get('tour'))
    if (!tourParam) {
      handledRef.current = null
      return
    }
    const key = `${pathname}:${tourParam}`
    if (handledRef.current === key) return
    handledRef.current = key

    onRequestTour(tourParam)

    const nextParams = new URLSearchParams(searchParams.toString())
    nextParams.delete('tour')
    const query = nextParams.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }, [searchParams, pathname, router, onRequestTour])

  return null
}

export function TourProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  const [mounted, setMounted] = useState(false)
  const [stored, setStored] = useState<StoredTourState>(DEFAULT_STORAGE)
  const [welcomeOpen, setWelcomeOpen] = useState(false)
  const [activeTour, setActiveTour] = useState<TourId | null>(null)
  const [stepIndex, setStepIndex] = useState(0)

  const updateStorage = useCallback((updater: (prev: StoredTourState) => StoredTourState) => {
    setStored((prev) => {
      const next = updater(prev)
      writeStoredState(next)
      return next
    })
  }, [])

  // Initial hydration & first-visit welcome dialog
  useEffect(() => {
    const initial = readStoredState()
    setStored(initial)
    setMounted(true)

    if (!initial.welcomeSeen && typeof window !== 'undefined') {
      const hasUrlTour = new URLSearchParams(window.location.search).has('tour')
      if (!hasUrlTour) {
        const timer = window.setTimeout(() => {
          setWelcomeOpen(true)
        }, 450)
        return () => window.clearTimeout(timer)
      }
    }
  }, [])

  // Progressive contextual trigger when visiting a page for the first time with autoTourPages enabled
  useEffect(() => {
    if (!mounted || welcomeOpen || activeTour) return
    if (!stored.autoTourPages) return
    const routeTour = PAGE_TOUR_BY_ROUTE[pathname]
    if (!routeTour) return
    if (stored.seenRoutes.includes(pathname) || stored.completedTours.includes(routeTour)) return

    const timer = window.setTimeout(() => {
      setActiveTour(routeTour)
      setStepIndex(0)
    }, 380)
    return () => window.clearTimeout(timer)
  }, [mounted, pathname, welcomeOpen, activeTour, stored.autoTourPages, stored.seenRoutes, stored.completedTours])

  const markRouteAndTourSeen = useCallback(
    (tourId: TourId, markCompleted: boolean, extraPatch?: Partial<StoredTourState>) => {
      const route = TOURS[tourId]?.route
      updateStorage((prev) => ({
        ...prev,
        welcomeSeen: true,
        seenRoutes: route && !prev.seenRoutes.includes(route) ? [...prev.seenRoutes, route] : prev.seenRoutes,
        completedTours:
          markCompleted && !prev.completedTours.includes(tourId)
            ? [...prev.completedTours, tourId]
            : prev.completedTours,
        ...extraPatch,
      }))
    },
    [updateStorage],
  )

  const startTour = useCallback(
    (id: TourId, startAt = 0, options?: { enableAutoPages?: boolean }) => {
      const track = TOURS[id]
      if (!track || track.steps.length === 0) return
      const clampedIndex = Math.max(0, Math.min(startAt, track.steps.length - 1))
      const step = track.steps[clampedIndex]

      setWelcomeOpen(false)
      updateStorage((prev) => ({
        ...prev,
        welcomeSeen: true,
        autoTourPages: options?.enableAutoPages ?? prev.autoTourPages,
      }))
      setActiveTour(id)
      setStepIndex(clampedIndex)

      if (step && step.route !== pathname) {
        router.push(step.route)
      }
    },
    [pathname, router, updateStorage],
  )

  const activeTrack = activeTour ? TOURS[activeTour] : null
  const totalSteps = activeTrack ? activeTrack.steps.length : 0
  const currentStep = activeTrack ? activeTrack.steps[stepIndex] ?? null : null

  useEffect(() => {
    if (!activeTour || !currentStep) return
    if (currentStep.route !== pathname) {
      router.push(currentStep.route)
    }
  }, [activeTour, currentStep, pathname, router])

  const finishTour = useCallback(() => {
    if (activeTour) {
      markRouteAndTourSeen(activeTour, true)
    }
    setActiveTour(null)
    setStepIndex(0)
  }, [activeTour, markRouteAndTourSeen])

  const startNextFeatureTour = useCallback(() => {
    if (!activeTour) return
    const current = activeTour
    const nextId = TOURS[current]?.nextTourId
    markRouteAndTourSeen(current, true)
    if (!nextId) {
      setActiveTour(null)
      setStepIndex(0)
      return
    }
    const nextTrack = TOURS[nextId]
    setActiveTour(nextId)
    setStepIndex(0)
    if (nextTrack && nextTrack.route !== pathname) {
      router.push(nextTrack.route)
    }
  }, [activeTour, markRouteAndTourSeen, pathname, router])

  const skipTour = useCallback(
    (disableAutoPages = false) => {
      if (activeTour) {
        markRouteAndTourSeen(activeTour, false, disableAutoPages ? { autoTourPages: false } : undefined)
      }
      setActiveTour(null)
      setStepIndex(0)
    },
    [activeTour, markRouteAndTourSeen],
  )

  const nextStep = useCallback(() => {
    if (!activeTrack) return
    if (stepIndex + 1 >= activeTrack.steps.length) {
      finishTour()
    } else {
      setStepIndex((i) => i + 1)
    }
  }, [activeTrack, stepIndex, finishTour])

  const prevStep = useCallback(() => {
    setStepIndex((i) => Math.max(0, i - 1))
  }, [])

  const goToStep = useCallback(
    (index: number) => {
      if (!activeTrack) return
      const clamped = Math.max(0, Math.min(index, activeTrack.steps.length - 1))
      setStepIndex(clamped)
    },
    [activeTrack],
  )

  const dismissWelcome = useCallback(() => {
    updateStorage((prev) => ({
      ...prev,
      welcomeSeen: true,
      autoTourPages: false,
    }))
    setWelcomeOpen(false)
  }, [updateStorage])

  const openWelcome = useCallback(() => {
    setActiveTour(null)
    setWelcomeOpen(true)
  }, [])

  const setAutoTourPages = useCallback(
    (enabled: boolean) => {
      updateStorage((prev) => ({ ...prev, autoTourPages: enabled }))
    },
    [updateStorage],
  )

  const resetTours = useCallback(() => {
    const resetState: StoredTourState = {
      welcomeSeen: false,
      autoTourPages: true,
      seenRoutes: [],
      completedTours: [],
    }
    setStored(resetState)
    writeStoredState(resetState)
    setActiveTour(null)
    setStepIndex(0)
    setWelcomeOpen(true)
  }, [])

  useEffect(() => {
    if (!activeTour) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        skipTour(false)
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        nextStep()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        prevStep()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeTour, nextStep, prevStep, skipTour])

  const value = useMemo<TourContextValue>(
    () => ({
      activeTour,
      activeTrack,
      currentStep,
      stepIndex,
      totalSteps,
      welcomeOpen,
      welcomeSeen: stored.welcomeSeen,
      autoTourPages: stored.autoTourPages,
      completedTours: stored.completedTours,
      startTour,
      startNextFeatureTour,
      nextStep,
      prevStep,
      goToStep,
      skipTour,
      finishTour,
      dismissWelcome,
      openWelcome,
      setAutoTourPages,
      resetTours,
    }),
    [
      activeTour,
      activeTrack,
      currentStep,
      stepIndex,
      totalSteps,
      welcomeOpen,
      stored.welcomeSeen,
      stored.autoTourPages,
      stored.completedTours,
      startTour,
      startNextFeatureTour,
      nextStep,
      prevStep,
      goToStep,
      skipTour,
      finishTour,
      dismissWelcome,
      openWelcome,
      setAutoTourPages,
      resetTours,
    ],
  )

  return (
    <TourContext.Provider value={value}>
      <Suspense fallback={null}>
        <TourQueryListener onRequestTour={(id) => startTour(id, 0)} />
      </Suspense>
      {children}
      {mounted && (
        <>
          <WelcomeModal />
          <TourOverlay />
        </>
      )}
    </TourContext.Provider>
  )
}

export function useTour(): TourContextValue {
  const ctx = useContext(TourContext)
  if (!ctx) {
    throw new Error('useTour must be used inside TourProvider')
  }
  return ctx
}
