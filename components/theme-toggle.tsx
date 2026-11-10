'use client'

import * as React from 'react'
import { useTheme } from 'next-themes'
import { Menu as MenuPrimitive } from '@base-ui/react/menu'
import { Check, Monitor, Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <button
        aria-label="Toggle theme"
        className={cn(
          'relative flex size-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition hover:text-foreground',
          className,
        )}
      >
        <Sun className="size-[18px]" />
      </button>
    )
  }

  const itemClass =
    'flex w-full cursor-pointer items-center justify-between rounded-lg px-2.5 py-2 text-xs font-semibold outline-none data-[highlighted]:bg-muted text-foreground'

  return (
    <MenuPrimitive.Root>
      <MenuPrimitive.Trigger
        aria-label="Toggle theme"
        className={cn(
          'relative flex size-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition hover:text-foreground hover:bg-muted/50',
          className,
        )}
      >
        <Sun className="size-[18px] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute size-[18px] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      </MenuPrimitive.Trigger>

      <MenuPrimitive.Portal>
        <MenuPrimitive.Positioner sideOffset={8} align="end" className="z-50">
          <MenuPrimitive.Popup className="w-36 rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-xl outline-none">
            <MenuPrimitive.Item className={itemClass} onClick={() => setTheme('light')}>
              <span className="flex items-center gap-2">
                <Sun className="size-3.5 text-muted-foreground" />
                Light
              </span>
              {theme === 'light' && <Check className="size-3.5 text-primary" />}
            </MenuPrimitive.Item>
            <MenuPrimitive.Item className={itemClass} onClick={() => setTheme('dark')}>
              <span className="flex items-center gap-2">
                <Moon className="size-3.5 text-muted-foreground" />
                Dark
              </span>
              {theme === 'dark' && <Check className="size-3.5 text-primary" />}
            </MenuPrimitive.Item>
            <MenuPrimitive.Item className={itemClass} onClick={() => setTheme('system')}>
              <span className="flex items-center gap-2">
                <Monitor className="size-3.5 text-muted-foreground" />
                System
              </span>
              {theme === 'system' && <Check className="size-3.5 text-primary" />}
            </MenuPrimitive.Item>
          </MenuPrimitive.Popup>
        </MenuPrimitive.Positioner>
      </MenuPrimitive.Portal>
    </MenuPrimitive.Root>
  )
}

