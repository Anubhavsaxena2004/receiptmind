# Tinku Responsive Design

> Tinku is a mobile-first application. All layouts are designed for mobile viewports first, then enhanced for larger screens. This document defines exact behavior at each breakpoint.

---

## Breakpoint System

| Breakpoint | Min Width | Tailwind Prefix | Primary Device |
|---|---|---|---|
| **xs** (default) | 0px | (none) | Mobile phones (360–639px) |
| **sm** | 640px | `sm:` | Large phones (landscape), small tablets |
| **md** | 768px | `md:` | Tablets (portrait), iPad mini |
| **lg** | 1024px | `lg:` | Tablets (landscape), small laptops |
| **xl** | 1280px | `xl:` | Laptops, desktop monitors |
| **2xl** | 1536px | `2xl:` | Wide desktop monitors |

**Primary targets:**
- **Mobile**: 375px–767px (most Indian users)
- **Desktop**: 1024px+ (sidebar layout kicks in)
- Tablet is a "nice to have" — ensure it doesn't break, but don't over-optimize

---

## Layout Behavior by Breakpoint

### Mobile (< 1024px / `lg`)

```
┌──────────────────────────┐
│ [Header: Brand + bells]  │  h-16
├──────────────────────────┤
│                          │
│  Page Content            │  px-4, full width
│  (max-w-5xl mx-auto)     │
│                          │
│                          │
│                          │
│  [FAB: + Add Expense]    │  fixed bottom-20 right-4
├──────────────────────────┤
│ Home │Exp │Bills│Bud│More│  Bottom nav, h-auto pb-safe
└──────────────────────────┘
```

**Key rules:**
- Sidebar hidden (`hidden lg:flex`)
- Bottom nav visible (`lg:hidden`)
- FAB visible (`lg:hidden`)
- Content: `px-4` horizontal padding
- Bottom padding: `pb-28` (clears bottom nav)
- Main content left margin: `0` (no sidebar offset)

### Desktop (≥ 1024px / `lg`)

```
┌──────────┬────────────────────────────────────────┐
│          │ [Header: Demo + Theme + Bell + Avatar]  │
│ Sidebar  ├────────────────────────────────────────┤
│ 256px    │                                        │
│ fixed    │  Page Content                          │
│ left     │  max-w-5xl mx-auto px-8               │
│          │                                        │
│          │                                        │
└──────────┴────────────────────────────────────────┘
```

**Key rules:**
- Sidebar visible (`lg:flex`)
- Bottom nav hidden (`lg:hidden`)
- FAB hidden (`lg:hidden`)
- Content: `lg:pl-64` (sidebar offset) + `px-8` horizontal padding
- Main content bottom padding: `lg:pb-10` (no bottom nav)

---

## Component Responsive Behavior

### Dashboard

| Component | Mobile | Desktop |
|---|---|---|
| Hero balance card | Full width, stacked | Full width, side-by-side |
| Stat row | 2 cols (`grid-cols-2`) | 4 cols (`lg:grid-cols-4`) |
| Main content | Single column | 2 columns (`lg:grid-cols-2`) |
| Quick Actions | Full width | Left column of 2-col |
| Upcoming Bills | Full width | Right column of 2-col |
| Spending Trend | Full width | Left column, below Quick Actions |
| Recent Activity | Full width | Right column, below Upcoming |

### Expenses

| Component | Mobile | Desktop |
|---|---|---|
| Page header + Add button | Stack (button full-width below header) | Side-by-side (header left, button right) |
| Expense list | Full width cards | Full width (no need for grid here) |
| Filters/search | Full width, below header | Inline with header actions |

### Bills

| Component | Mobile | Desktop |
|---|---|---|
| Bill cards | Full width, stacked | 2-col grid (`sm:grid-cols-2`) |
| Bill detail | Full width | Max `max-w-2xl` centered |
| Actions (Pay/Edit) | Full width buttons | Inline row of buttons |

### Budgets

| Component | Mobile | Desktop |
|---|---|---|
| Budget cards | Full width | 2-col or 3-col grid |
| Budget progress bar | Full width | Full width within card |
| Edit form | Full width | `max-w-xl` centered |

### Settings

| Component | Mobile | Desktop |
|---|---|---|
| Tab navigation | Horizontal scroll tabs | Vertical sidebar tabs or standard tabs |
| Form sections | Full width stacked | `max-w-xl` |
| Dangerous zone | Full width | `max-w-xl` |

---

## Mobile-First CSS Pattern

Always write styles mobile-first:

```tsx
// ✅ Correct — mobile first
<div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">

// ❌ Wrong — desktop first (requires un-setting)
<div className="grid grid-cols-4 gap-4 max-lg:grid-cols-2 max-lg:gap-3">
```

---

## Typography Responsive Scaling

| Element | Mobile | Tablet+ (sm:) | Desktop (lg:) |
|---|---|---|---|
| Page H1 | `text-2xl` (24px) | `sm:text-3xl` (30px) | — |
| Hero balance | `text-3xl` (30px) | `sm:text-4xl` (36px) | — |
| Stat card value | `text-xl` (20px) | `sm:text-2xl` (24px) | — |
| Card heading | `text-base` (16px) | — | — |
| Body | `text-sm` (14px) | — | — |
| Caption | `text-xs` (12px) | — | — |

---

## Touch Targets

All interactive elements must meet minimum touch target sizes on mobile:

| Element | Minimum Size | Implementation |
|---|---|---|
| Nav items (bottom bar) | 44×44px | `py-2.5` + full-width + `size-5` icon |
| Buttons (default) | 40px height | `h-10 px-4` |
| Buttons (sm) | 36px height | `h-9 px-3` (not smaller on mobile) |
| Links in lists | 44px height | `py-3` minimum on list links |
| Close/X buttons | 44×44px | `size-11 p-3` wrapper |
| FAB | 48×48px | `size-12` |
| Checkboxes/Switches | 44×44px touch area | Wrap in a larger `<label>` |

---

## Safe Area Insets (Mobile)

Modern iOS and Android phones have rounded corners and home indicators that require safe area insets:

```css
/* Applied in globals.css bottom nav */
pb-[env(safe-area-inset-bottom)]

/* For fixed bottom elements */
bottom: calc(env(safe-area-inset-bottom) + 0px)
```

The existing bottom nav already handles this. The FAB's `bottom-20` already clears the bottom nav including safe areas.

---

## Responsive Images and Icons

| Use | Rule |
|---|---|
| Lucide icons | Use `size-{n}` class (not separate `w-` and `h-`) |
| Stat card icons | `size-5` icon in `size-10` container (mobile) → same (desktop) |
| Feature icons | `size-6` icon in `size-11` container |
| Empty state illustration | `size-12` or `size-16` |
| Avatar initials | `size-8` mobile → `size-9` sidebar |

---

## Responsive Patterns to Avoid

| Anti-Pattern | Correct Approach |
|---|---|
| `max-lg:` prefix everywhere (desktop-first) | Write mobile-first, add `lg:` for desktop |
| Hidden content on mobile with no alternative access | Progressively disclose — show less, not hide |
| `overflow-x: scroll` on main content | Reflow layout for small screens; don't scroll horizontally |
| Fixed pixel widths on cards | Use `w-full` with max-width on the container |
| Font size < 12px on mobile | Minimum 12px (11px only for very minor labels) |
| Touch targets < 44px on mobile | Increase padding or wrap in larger click area |
| Side-by-side 3-column layout on mobile | Stack on mobile, 2-col sm:, 3-col lg: |
| Modals that exceed screen height | Use Sheet (bottom drawer) on mobile instead |

