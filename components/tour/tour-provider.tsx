'use client'

import { createContext, Suspense, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { TOURS, type TourId, type TourStep, type TourTrack } from '@/lib/tours'
import { TourOverlay } from './tour-overlay'
import { WelcomeModal } from './welcome-modal'

const STORAGE_KEY = 'tinku:tour:v1'

interface StoredTourState {
  welcomeSeen: boolean
  completedTours: TourId[]
}

const DEFAULT_STORAGE: StoredTourState = {
  welcomeSeen: false,
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
  completedTours: TourId[]
  startTour: (id: TourId, startAt?: number) => void
  nextStep: () => void
  prevStep: () => void
  goToStep: (index: number) => void
  skipTour: () => void
  finishTour: () => void
  dismissWelcome: () => void
  openWelcome: () => void
  resetTours: () => void
}

const TourContext = createContext<TourContextValue | null>(null)

function isTourId(value: string | null): value is TourId {
  return value === 'welcome' || value === 'navigation' || value === 'category-discovery'
}

function readStoredState(): StoredTourState {
  if (typeof window === 'undefined') return DEFAULT_STORAGE
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_STORAGE
    const parsed = JSON.parse(raw) as Partial<StoredTourState>
    const completed = Array.isArray(parsed.completedTours) ? parsed.completedTours.filter((x): x is TourId => isTourId(x)) : []
    return {
      welcomeSeen: Boolean(parsed.welcomeSeen),
      completedTours: completed,
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
    // Ignore storage quota / privacy mode errors
  }
}

function TourQueryListener({ onRequestTour }: { onRequestTour: (id: TourId) => void }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const handledRef = useRef<string | null>(null)

  useEffect(() => {
    const tourParam = searchParams.get('tour')
    if (!isTourId(tourParam)) {
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

  const updateStorage = useCallback((updater: (prev: StoredTourState) => StoredTourState) => {
    setStored((prev) => {
      const next = updater(prev)
      writeStoredState(next)
      return next
    })
  }, [])

  const markWelcomeSeen = useCallback(() => {
    updateStorage((prev) => (prev.welcomeSeen ? prev : { ...prev, welcomeSeen: true }))
  }, [updateStorage])

  const startTour = useCallback(
    (id: TourId, startAt = 0) => {
      const track = TOURS[id]
      if (!track || track.steps.length === 0) return
      const clampedIndex = Math.max(0, Math.min(startAt, track.steps.length - 1))
      const step = track.steps[clampedIndex]

      setWelcomeOpen(false)
      markWelcomeSeen()
      setActiveTour(id)
      setStepIndex(clampedIndex)

      if (step && step.route !== pathname) {
        router.push(step.route)
      }
    },
    [markWelcomeSeen, pathname, router],
  )

  const activeTrack = activeTour ? TOURS[activeTour] : null
  const totalSteps = activeTrack ? activeTrack.steps.length : 0
  const currentStep = activeTrack ? activeTrack.steps[stepIndex] ?? null : null

  // Sync route whenever step changes
  useEffect(() => {
    if (!activeTour || !currentStep) return
    if (currentStep.route !== pathname) {
      router.push(currentStep.route)
    }
  }, [activeTour, currentStep, pathname, router])

  const finishTour = useCallback(() => {
    if (activeTour) {
      updateStorage((prev) => ({
        welcomeSeen: true,
        completedTours: prev.completedTours.includes(activeTour)
          ? prev.completedTours
          : [...prev.completedTours, activeTour],
      }))
    }
    setActiveTour(null)
    setStepIndex(0)
  }, [activeTour, updateStorage])

  const skipTour = useCallback(() => {
    markWelcomeSeen()
    setActiveTour(null)
    setStepIndex(0)
  }, [markWelcomeSeen])

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
    markWelcomeSeen()
    setWelcomeOpen(false)
  }, [markWelcomeSeen])

  const openWelcome = useCallback(() => {
    setActiveTour(null)
    setWelcomeOpen(true)
  }, [])

  const resetTours = useCallback(() => {
    const resetState: StoredTourState = { welcomeSeen: false, completedTours: [] }
    setStored(resetState)
    writeStoredState(resetState)
    setActiveTour(null)
    setStepIndex(0)
    setWelcomeOpen(true)
  }, [])

  // Keyboard navigation while tour overlay is active
  useEffect(() => {
    if (!activeTour) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        skipTour()
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
      completedTours: stored.completedTours,
      startTour,
      nextStep,
      prevStep,
      goToStep,
      skipTour,
      finishTour,
      dismissWelcome,
      openWelcome,
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
      stored.completedTours,
      startTour,
      nextStep,
      prevStep,
      goToStep,
      skipTour,
      finishTour,
      dismissWelcome,
      openWelcome,
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

