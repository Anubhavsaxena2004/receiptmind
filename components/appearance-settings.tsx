'use client'

import * as React from 'react'
import { useTheme } from 'next-themes'
import { Check, Monitor, Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const options = [
    {
      id: 'light',
      label: 'Light Mode',
      description: 'Clean warm off-white (#FEFEFD) with crisp typography and vibrant orange (#FB7507) accents.',
      icon: Sun,
    },
    {
      id: 'dark',
      label: 'Dark Mode',
      description: 'Deep charcoal background (#181817) with layered cards (#343333) and vibrant orange (#F25A0C) highlights.',
      icon: Moon,
    },
    {
      id: 'system',
      label: 'System Preference',
      description: 'Automatically switches based on your operating system’s current theme.',
      icon: Monitor,
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {options.map(({ id, label, description, icon: Icon }) => {
        const active = mounted && theme === id
        return (
          <button
            key={id}
            type="button"
            onClick={() => setTheme(id)}
            className={cn(
              'group flex flex-col text-left p-4 rounded-2xl border transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring',
              active
                ? 'border-primary bg-secondary/30 text-foreground ring-1 ring-primary/40 shadow-xs'
                : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-muted/30',
            )}
          >
            <div className="flex items-center justify-between w-full">
              <span
                className={cn(
                  'flex size-10 items-center justify-center rounded-xl border transition-colors',
                  active
                    ? 'border-primary/30 bg-primary text-primary-foreground'
                    : 'border-border bg-muted text-foreground group-hover:border-primary/20',
                )}
              >
                <Icon className="size-5" aria-hidden="true" />
              </span>
              {active && <Check className="size-4 text-primary" aria-hidden="true" />}
            </div>
            <p className="mt-3.5 font-bold text-sm text-foreground">{label}</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
          </button>
        )
      })}
    </div>
  )
}

