# Tinku Spacing & Layout

> All spacing decisions must use the 4px base scale. Arbitrary values (e.g., `mt-[13px]`, `p-[22px]`) are not permitted. This ensures visual consistency across all screens.

---

## Spacing Scale (4px Base)

| Token | px | Tailwind | Use |
|---|---|---|---|
| `space-1` | 4px | `p-1`, `m-1`, `gap-1` | Minimum gap, icon-to-label |
| `space-2` | 8px | `p-2`, `gap-2` | Tight component spacing, badge padding |
| `space-3` | 12px | `p-3`, `gap-3` | List item gaps, button padding (sm) |
| `space-4` | 16px | `p-4`, `gap-4` | Standard component padding, card padding (mobile) |
| `space-5` | 20px | `p-5`, `gap-5` | Card padding (standard) |
| `space-6` | 24px | `p-6`, `gap-6` | Card padding (spacious), section gaps |
| `space-8` | 32px | `p-8`, `gap-8` | Large section padding, wide cards |
| `space-10` | 40px | `p-10`, `gap-10` | Page-level sections |
| `space-12` | 48px | `p-12`, `gap-12` | Major section breaks |
| `space-16` | 64px | `p-16`, `gap-16` | Between page-level sections |
| `space-20` | 80px | `p-20` | Full-screen centered content |
| `space-24` | 96px | `p-24` | Large page padding |
| `space-28` | 112px | `pb-28` | Mobile bottom nav clearance |

### Spacing Decision Guide

| Situation | Spacing |
|---|---|
| Icon to its label | `gap-2` (8px) |
| Items in a nav list | `space-y-0.5` (2px) |
| Items in a card body | `space-y-2.5` or `space-y-3` |
| Between cards in a section | `gap-3` or `gap-4` |
| Between page sections | `gap-6` or `mb-8` |
| Card internal padding | `p-4` (mobile) → `p-5` or `p-6` (desktop) |
| Page top padding | `pt-6 sm:pt-8` |
| Page bottom padding | `pb-28 lg:pb-10` (bottom nav clearance on mobile) |
| Page horizontal padding | `px-4 sm:px-8` |

---

## Border Radius Scale

The radius base is `--radius: 0.75rem` (12px). All radii derive from this:

| Variable | Value | Tailwind | Use |
|---|---|---|---|
| `--radius-sm` | `calc(var(--radius) * 0.6)` ≈ 7px | `rounded-sm` | Badges, tags, small chips |
| `--radius-md` | `calc(var(--radius) * 0.8)` ≈ 10px | `rounded-md` | Buttons (sm), input fields |
| `--radius-lg` | `var(--radius)` = 12px | `rounded-lg` | Standard buttons, dropdowns |
| `--radius-xl` | `calc(var(--radius) * 1.4)` ≈ 17px | `rounded-xl` | Cards, nav items, quick action tiles |
| `--radius-2xl` | `calc(var(--radius) * 1.8)` ≈ 22px | `rounded-2xl` | Large cards, stat cards, feature cards |
| `--radius-3xl` | `calc(var(--radius) * 2.2)` ≈ 26px | `rounded-3xl` | Hero cards, mobile FAB |
| Full | 9999px | `rounded-full` | Badges with count, avatar circles, pill tags |

### Radius Usage by Component

| Component | Radius |
|---|---|
| Input field | `rounded-lg` (12px) |
| Button (default) | `rounded-lg` or `rounded-xl` |
| Button (sm) | `rounded-md` |
| Dropdown / Popover | `rounded-xl` |
| Card | `rounded-2xl` |
| Stat card | `rounded-2xl` |
| Nav item (active) | `rounded-xl` |
| FAB (Floating Action Button) | `rounded-2xl` |
| Avatar | `rounded-full` |
| Badge (status) | `rounded-full` |
| Alert / Banner | `rounded-xl` |
| Dialog | `rounded-2xl` |

---

## Shadow System

Tinku uses minimal shadows — just enough to create depth without feeling heavy.

| Token | CSS | Tailwind | Use |
|---|---|---|---|
| None | — | (no shadow) | Flat elements, inline components |
| `shadow-xs` | `0 1px 2px rgba(0,0,0,0.05)` | `shadow-xs` | Subtle lift, chip/badge |
| `shadow-sm` | `0 1px 3px rgba(0,0,0,0.08)` | `shadow-sm` | Cards (standard) |
| `shadow-md` | `0 4px 12px rgba(0,0,0,0.10)` | `shadow-md` | Cards on hover, dropdowns |
| `shadow-card` | `shadow-sm` in light, `shadow-none` in dark | custom | Standard card shadow |
| `shadow-primary` | `0 4px 16px rgba(93,214,44,0.25)` | `shadow-primary/25` | Primary action buttons |

**Rules:**
- Cards use `shadow-sm` in light mode; in dark mode, use border definition instead of shadow
- Do not use `shadow-lg` or `shadow-xl` on cards — too heavy for financial UI
- Hover states may increase shadow: `hover:shadow-md`
- FAB uses `shadow-lg shadow-primary/35`

---

## Layout System

### Application Container

```
┌─────────────────────────────────────────────────────────────────┐
│  Sidebar (w-64 / 256px)  │  Main Content Area                   │
│  fixed, inset-y-0 left-0 │  ml-64 (lg:pl-64)                   │
│  lg:flex, hidden on mobile│  max-w-5xl mx-auto px-4 sm:px-8     │
└─────────────────────────────────────────────────────────────────┘
```

### Core Layout Containers

| Container | Class | Max Width | Use |
|---|---|---|---|
| Main content wrapper | `mx-auto max-w-5xl px-4 sm:px-8` | 1024px (5xl) | All page content |
| Narrow form page | `mx-auto max-w-xl` | 576px | Settings, Auth forms |
| Wide data page | `mx-auto max-w-6xl` | 1152px | History table (AG Grid) |
| Full-width banner | (no max-width) | 100% | System banners |
| Sidebar | `w-64` | 256px | Left sidebar |

### Sidebar Dimensions

| Property | Value |
|---|---|
| Width | 256px (`w-64`) |
| Padding | `px-4 py-6` |
| Nav item padding | `px-3 py-2.5` |
| Brand area | `px-2` |
| Quick Add button padding | `px-1 pt-5` |
| Settings link padding | `border-t pt-3` |

### Header Dimensions

| Property | Value |
|---|---|
| Height | `h-16` (64px) |
| Sticky | `sticky top-0 z-20` |
| Padding | `px-4 sm:px-8` |
| Background | `bg-background/85 backdrop-blur` |
| Border | `border-b` |

### Mobile Bottom Navigation

| Property | Value |
|---|---|
| Height | Auto (`py-2.5`) + safe area inset |
| Grid | `grid-cols-5` (4 items + More) |
| Z-index | `z-30` |
| Background | `bg-background/95 backdrop-blur` |
| Border | `border-t` |
| FAB clearance | `bottom-20 pb-28` on content |

---

## Responsive Breakpoints

| Breakpoint | Min Width | Tailwind Prefix | Description |
|---|---|---|---|
| Mobile (default) | 0px | (none) | Full-width stack layout, bottom nav |
| sm | 640px | `sm:` | Small tablet, wider phone (landscape) |
| md | 768px | `md:` | Tablet portrait, some 2-col layouts |
| lg | 1024px | `lg:` | Desktop — sidebar appears, 2-col content |
| xl | 1280px | `xl:` | Wide desktop — spacious content area |
| 2xl | 1536px | `2xl:` | Extra wide — not targeted specifically |

### Layout Behavior by Breakpoint

| Feature | Mobile (< lg) | Desktop (≥ lg) |
|---|---|---|
| Sidebar | Hidden, accessed via "More" drawer | Fixed left, always visible |
| Bottom nav | Visible, 5 items | Hidden |
| FAB | Visible, bottom-right | Hidden (use sidebar Quick Add) |
| Main content left padding | 0 | `pl-64` (256px for sidebar) |
| Content padding horizontal | `px-4` | `px-8` |
| Content max width | 100% | `max-w-5xl` centered |
| Cards per row | 1–2 (depends on card) | 2–4 (depends on card) |

---

## Grid Layouts

### Dashboard 4-Stat Grid

```
Mobile (2 cols):        Desktop (4 cols):
┌──────┬──────┐         ┌──────┬──────┬──────┬──────┐
│ Stat │ Stat │         │ Stat │ Stat │ Stat │ Stat │
├──────┼──────┤         └──────┴──────┴──────┴──────┘
│ Stat │ Stat │
└──────┴──────┘
```
Tailwind: `grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4`

### Dashboard 2-Column Content

```
Mobile (1 col):         Desktop (2 cols):
┌────────────┐          ┌────────────┬────────────┐
│ Left Col   │          │ Left Col   │ Right Col  │
│            │          │            │            │
│ Right Col  │          │            │            │
└────────────┘          └────────────┴────────────┘
```
Tailwind: `grid gap-6 lg:grid-cols-2`

### Standard Card Grid (Budgets, Bills list)

```
Mobile (1 col):         Tablet (2 cols):        Desktop (3+ cols):
┌────────────┐          ┌──────┬──────┐          ┌──────┬──────┬──────┐
│ Card       │          │ Card │ Card │          │ Card │ Card │ Card │
├────────────┤          ├──────┼──────┤          └──────┴──────┴──────┘
│ Card       │          │ Card │ Card │
└────────────┘          └──────┴──────┘
```
Tailwind: `grid gap-4 sm:grid-cols-2 lg:grid-cols-3`

---

## Page Layout Template

Every page inside `app/(app)/` follows this structure:

```tsx
// Standard page layout
<>
  {/* Page Header */}
  <div className="mb-6">
    <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
      Page Title
    </h1>
    <p className="mt-1 text-sm text-muted-foreground">
      Supporting description or last-updated context
    </p>
  </div>

  {/* Optional: Alerts / Notices */}
  {/* ... */}

  {/* Primary Content */}
  <div className="space-y-6">
    {/* Cards and sections */}
  </div>
</>
```

The wrapping `<main>` with `max-w-5xl` is handled by `AppShell` — pages only need to output their content, not the outer container.

---

## Form Layout

| Property | Value |
|---|---|
| Max width | `max-w-xl` (576px) for standalone forms |
| Field gap | `space-y-5` or `space-y-6` |
| Label to input gap | `mt-1.5` |
| Button area | `mt-6 flex gap-3` (actions side by side) |
| Section gap within form | `pt-6 border-t` |

---

## Z-Index Scale

| Layer | Z-Index | Use |
|---|---|---|
| Base content | 0 | Normal page elements |
| FAB | 40 | Floating action button |
| Bottom nav | 30 | Mobile bottom bar |
| Sticky header | 20 | App top bar |
| Mobile drawer | 50 | "More" slide-in nav |
| Modals / Dialogs | 50+ | Shadcn Dialog |
| Tooltips / Popovers | 50+ | Floating elements |
| Toast / Sonner | 9999 | Always on top |

