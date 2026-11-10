# Tinku Theme Guidelines

> Tinku must work beautifully in both Light and Dark modes, as well as automatically respecting the user's system preference. This document defines the complete theme implementation strategy.

---

## Theme Modes

Tinku supports three theme modes:

| Mode | Behavior |
|---|---|
| **Light** | Explicitly set to light — overrides system preference |
| **Dark** | Explicitly set to dark — overrides system preference |
| **System** | Follows OS preference via `prefers-color-scheme` |

---

## Current Architecture (Existing)

The current `globals.css` uses:

1. **`:root`** — Light theme tokens (applies to all by default)
2. **`.dark`** — Dark theme tokens (applied when `.dark` class is on `<html>`)
3. **`@media (prefers-color-scheme: dark)`** — Fallback for system preference (`:root:not(.light)`)

This architecture is correct and must be preserved. The token values need updating to the Tinku brand palette (see `COLOR_TOKENS.md`).

---

## Tailwind v4 Integration

In Tailwind v4, the `dark:` variant is configured via:

```css
/* globals.css — already present */
@custom-variant dark (&:is(.dark *));
```

This means:
- `dark:bg-primary` applies when any ancestor has the `.dark` class
- The `<html>` element should receive the `.dark` or `.light` class based on user preference

---

## Theme Toggle Implementation

### Recommended: `next-themes` library

Add `next-themes` to handle class-based theme switching with SSR support.

```bash
pnpm add next-themes
```

### ThemeProvider Setup

```tsx
// app/providers.tsx (new file)
'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"        // adds .light / .dark to <html>
      defaultTheme="system"    // respect OS preference by default
      enableSystem             // allow "system" as a valid theme
      disableTransitionOnChange // prevent color flash during switch
    >
      {children}
    </NextThemesProvider>
  )
}
```

```tsx
// app/layout.tsx — wrap body content
import { Providers } from './providers'

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>  {/* suppressHydrationWarning prevents mismatch */}
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

### Theme Toggle Component

```tsx
// components/theme-toggle.tsx
'use client'

import { useTheme } from 'next-themes'
import { Moon, Sun, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Toggle theme">
          <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')}>
          <Sun className="mr-2 size-4" /> Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          <Moon className="mr-2 size-4" /> Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          <Monitor className="mr-2 size-4" /> System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

### Placement

The theme toggle should live in the **app header** (`AppShell`), in the right-side controls area alongside notifications and the account menu. On desktop it's always visible. On mobile it can be accessible from the "More" drawer or from Settings.

---

## Flash Prevention

The biggest theme UX issue is a **flash of wrong theme** during initial page load — the page appears briefly in the wrong theme before JavaScript hydrates.

`next-themes` handles this automatically via an inline `<script>` injected in `<head>` that reads `localStorage` and sets the class before the page renders. This is why `suppressHydrationWarning` is needed on `<html>`.

**Rules:**
- Do NOT manually manage theme state with `useState` and `useEffect`
- Do NOT use CSS classes as the source of truth (use `next-themes`)
- Do NOT persist theme in a cookie (localStorage is correct here)
- Ensure `suppressHydrationWarning` is on the `<html>` element only

---

## Token Mapping Reference

Complete token mapping across all three modes:

| Token | Light | Dark | System Dark |
|---|---|---|---|
| `--background` | `#FEFEFD` | `#181817` | `#181817` |
| `--surface` | `#F7F7F5` | `#272727` | `#272727` |
| `--card` | `#FFFFFF` | `#343333` | `#343333` |
| `--card-foreground` | `#0E0D0D` | `#FBFBFB` | `#FBFBFB` |
| `--primary` | `#FB7507` | `#F25A0C` | `#F25A0C` |
| `--primary-foreground` | `#FFFFFF` | `#FFFFFF` | `#FFFFFF` |
| `--secondary` | `#FFF5ED` | `#30241E` | `#30241E` |
| `--secondary-foreground` | `#D97C2F` | `#F7854A` | `#F7854A` |
| `--muted` | `#F7F7F5` | `#272727` | `#272727` |
| `--muted-foreground` | `#615A56` | `#999A9A` | `#999A9A` |
| `--border` | `#DCD7D3` | `#52514F` | `#52514F` |
| `--ring` | `#FB7507` | `#F25A0C` | `#F25A0C` |
| `--success` | `#16A34A` | `#4ADE80` | `#4ADE80` |
| `--warning` | `#D97706` | `#FBBF24` | `#FBBF24` |
| `--danger` | `#DC2626` | `#F87171` | `#F87171` |
| `--sidebar` | `#F7F7F5` | `#1F1F1E` | `#1F1F1E` |

---

## Component Dark Mode Checklist

When implementing any component, verify these in dark mode:

| Check | How to verify |
|---|---|
| Background visible from parent | Card `#343333` on `#181817` background — distinct separation |
| Text readable | Minimum 4.5:1 contrast ratio |
| Borders visible | `border-border` (`#52514F`) visible against `#343333` card |
| Primary accent visible | `#F25A0C` on `#181817` — high contrast |
| Status colors correct | Success=green, Warning=amber, Danger=red in dark |
| Shadows | In dark mode, reduce or remove shadows; rely on borders instead |
| Images/icons | Ensure icons are `text-current` or `text-muted-foreground` |
| Input fields | `bg-background border-input` — input bg slightly different from card |
| Focus rings | `ring-ring` (`#F25A0C`) visible on dark bg |

---

## Settings Integration

The user's theme preference should be accessible from **Settings → Appearance**:

```
Settings
└── Appearance
    ├── Theme: [Light] [Dark] [System]  ← ThemeToggle component
    └── (Future: Accent color, font size)
```

The theme toggle also appears in the app header for quick access without navigating to settings.

---

## Testing Themes

Before marking any screen as done:

1. Toggle to **Light mode** — verify visual design
2. Toggle to **Dark mode** — verify dark theme tokens
3. Set to **System mode** and use OS dark mode toggle — verify system preference works
4. Reload page in dark mode — verify no flash of light theme
5. Navigate between routes — verify theme persists

---

## Migration from Current Tokens

The current `globals.css` uses `#059669` (emerald) as `--primary`. This must be replaced with `#5DD62C` (Tinku lime green). This is a **breaking change** to the visual design — all UI that currently shows green will shift from emerald to lime green.

**Files to update (Phase 2):**
1. `app/globals.css` — Replace all `:root` and `.dark` token values
2. `app/layout.tsx` — Add `next-themes` Provider, font import
3. `components/app-shell.tsx` — Add `ThemeToggle` to header
4. Test all screens for visual regressions

