'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { runDailyCheckIfNeeded } from '@/lib/actions/autopay'

/**
 * Runs the daily bill check once a day while the app is open, so the demo works
 * without a cron job. In production, also call POST /api/scheduler/run from a cron.
 */
export function AutoScheduler({ lastRun, today }: { lastRun?: string; today: string }) {
  const router = useRouter()
  const started = useRef(false)
  useEffect(() => {
    if (started.current || lastRun === today) return
    started.current = true
    runDailyCheckIfNeeded()
      .then((ran) => {
        if (ran) router.refresh()
      })
      .catch(() => undefined)
  }, [lastRun, today, router])
  return null
}
