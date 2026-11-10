# Tinku Design System — Overview

> The Tinku design system translates our brand identity and UX principles into a concrete, reusable visual language. This document describes the design philosophy, visual direction, and how the components, tokens, and themes work together.

---

## Design Philosophy

Tinku is not a generic admin dashboard. It is a **personal financial management product** for Indian households. The design language must communicate:

- **Trust** — financial data demands confidence and clarity
- **Control** — users should feel in command of their money
- **Warmth** — money is personal; the product should feel human, not cold
- **Intelligence** — the app does smart things (AutoPay, Crisis Drill, AI receipt scanning), and the UI should reflect that

The design draws from four reference touchpoints:

| Reference | What we borrow |
|---|---|
| AeuxGlobal Banking Dashboard | Clean composition, strong visual hierarchy, spacious cards, organized financial data |
| Siburian Finance Web App | White cards, green accent, clean typography, balance + transaction layout |
| Black & Green Color Palette | Exact brand colors — `#0F0F0F`, `#202020`, `#5DD62C`, `#337418`, `#F8F8F8` |
| Paytin Finance Mobile App | Mobile-first patterns, bottom nav, quick-send actions, card-based layouts |

---

## Visual Direction

### Modern Fintech — Not Admin Dashboard

The wrong direction: data tables everywhere, blue-grey color scheme, dense sidebars, too many options visible simultaneously.

The right direction:
- **Card-first layout** — information organized in readable, scannable cards
- **Purposeful white space** — breathing room between elements is as important as the elements themselves
- **Green as accent, not wallpaper** — `#5DD62C` appears on primary actions, positive states, and brand moments. It does not appear on decorative elements or backgrounds.
- **Typography-led hierarchy** — size and weight (not color) carry the visual hierarchy
- **Subtle surfaces** — backgrounds are off-white (light) or deep charcoal (dark); cards lift slightly from the surface

### Light Theme Character

Clean, professional, airy. Like a premium banking app designed in 2025.

- Background: `#F8F8F8` (off-white — not blinding white)
- Cards: `#FFFFFF` on the off-white background — subtle lift
- Primary actions: `#5DD62C` lime green — distinctive, visible, trustworthy
- Text: near-black `#0F0F0F` on white surfaces — maximum readability
- Positive amounts: forest green `#337418` or the semantic success token
- Danger amounts: semantic danger token (soft red)
- Supporting text: muted gray, clearly subordinate

### Dark Theme Character

Premium, calm, sophisticated. Like CRED or Zerodha's dark mode.

- Background: `#0F0F0F` (deep black)
- Surfaces: `#202020` (charcoal) — cards float subtly above the background
- Primary actions: `#5DD62C` (lime green stands out brilliantly against dark)
- Text: `#F8F8F8` (off-white) — readable without being harsh
- Borders: very subtle, low-contrast — just enough to define edges

---

## Design Tokens Architecture

The design system is implemented via CSS custom properties in `app/globals.css`.

```
Brand Colors (fixed)
    ↓
Semantic Tokens (light/dark variants)
    ↓
Tailwind Classes (via @theme inline)
    ↓
Components (use Tailwind classes, never raw hex)
```

**Layer 1 — Brand Colors:** The five brand colors (`#0F0F0F`, `#202020`, `#5DD62C`, `#337418`, `#F8F8F8`) plus semantic status colors (success, warning, danger).

**Layer 2 — Semantic Tokens:** Abstract names like `--background`, `--primary`, `--card`, `--muted-foreground`. These tokens have different values in light vs dark mode. See `COLOR_TOKENS.md` for the full mapping.

**Layer 3 — Tailwind Classes:** `bg-background`, `text-primary`, `bg-card`, etc. — wired to semantic tokens via `@theme inline` block.

**Layer 4 — Components:** Always use Tailwind semantic classes. Never use `bg-[#5DD62C]` directly in a component file.

---

## Component System

Tinku uses **Shadcn UI** (`style: base-nova`) as the component foundation.

Shadcn components are:
- Installed as source files in `components/ui/`
- Fully customizable through the token system
- Augmented by Tinku-specific compound components (`BillCard`, `BudgetProgress`, `StatCard`, etc.)

The component hierarchy:

```
Shadcn Primitives (Button, Card, Input, Badge, Dialog, etc.)
    ↓
Tinku Design Tokens (applied via globals.css)
    ↓
Tinku Compound Components (built from Shadcn primitives)
    ↓
Page-Level Compositions (screens assembled from compound components)
```

See `COMPONENT_GUIDELINES.md` for the full component spec.

---

## Icon System

**Primary icon library:** Lucide React (already installed as `lucide-react`).

**Usage rules:**
- Icon size: `size-4` (16px) for inline icons, `size-5` (20px) for nav items, `size-6` (24px) for feature icons, `size-8+` for decorative/empty state icons
- Color: icons inherit `text-current` or use `text-muted-foreground` for secondary icons
- Never use icons without an accessible label (either visible text, `aria-label`, or `title`)
- Stroke weight: Lucide's default `strokeWidth={2}` is standard; use `stroke-[2.5]` only for emphasis (FAB, primary action icons)

---

## Motion and Animation

Tinku uses motion purposefully — not as decoration.

**Rules:**
- Transitions on interactive elements: `transition` class (150ms ease) for hover/focus states
- Page transitions: none (avoid jarring full-page animations)
- Loading states: skeleton shimmer (`animate-pulse` or dedicated skeleton component)
- Toast/notifications: slide in from bottom-right (Sonner default)
- Modal/dialog: fade + scale (Shadcn default)
- Respect `prefers-reduced-motion` — wrap all non-essential animations in a media query check

**What not to animate:**
- Financial numbers changing value (avoid confusion about whether the value changed)
- Navigation highlights (instant state change feels snappier)
- Form validation errors (should appear immediately)

---

## Content and Copy Guidelines

**Voice:** Direct, clear, helpful. Like a knowledgeable friend who helps you with money, not a bank's legal department.

**Tone:**
- Dashboard heading: "Welcome back" (warm, personal)
- Error state: "Couldn't load your bills. Try refreshing." (not "Error 500: Internal Server Error")
- Empty state: "No expenses yet this month. Tap + to add your first one." (action-oriented)
- Success: "₹1,200 paid. Nice work." (brief positive reinforcement)
- Warning: "Electricity bill due in 3 days" (specific, urgent but not alarming)

**Number formatting:**
- Indian number system: ₹1,23,456.78 (not ₹123,456.78)
- Always show the rupee symbol: ₹ (not INR, not Rs.)
- Large amounts: show full value, not abbreviations (₹1,23,456 not ₹1.23L — users need precision)
- Zero amounts: ₹0.00 (not empty, not dash)

**Date formatting:**
- Relative for recent: "Today", "Yesterday", "2 days ago"
- Absolute for future: "12 Nov 2026" (day month year — Indian convention)
- Never MM/DD format (US convention, confusing for Indian users)

---

## Relationship Between Design Documents

```
UX_PRINCIPLES.md         ← Why we make design decisions
DESIGN_SYSTEM.md         ← What the overall system is (this document)
COLOR_TOKENS.md          ← Exact token definitions
TYPOGRAPHY.md            ← Font and type scale
SPACING_AND_LAYOUT.md    ← Spacing, layout, radius, shadow
COMPONENT_GUIDELINES.md  ← How to build with the system
THEME_GUIDELINES.md      ← How themes are implemented
NAVIGATION_AND_IA.md     ← How screens connect
RESPONSIVE_DESIGN.md     ← How layouts adapt
ACCESSIBILITY.md         ← Compliance and inclusive design
SCREEN_UX_GUIDELINES.md  ← Per-screen specs
IMPLEMENTATION_PLAN.md   ← Build order and phasing
```

