# Tinku Component Guidelines

> This document defines the component architecture for Tinku. Use Shadcn UI as the foundation. Build Tinku-specific compound components on top of Shadcn primitives. Never introduce alternative UI libraries.

---

## Component Architecture

```
Shadcn Primitives        →  components/ui/
Tinku Compound Components → components/ (feature-specific)
Page Compositions        →  app/(app)/.../page.tsx
```

**Golden rule:** If Shadcn has a component for it, use Shadcn. If Tinku needs a compound widget (e.g., a BillCard), build it from Shadcn primitives. Never reach for a third-party component library for UI elements.

---

## Shadcn UI Component Inventory

Install and use the following Shadcn components. Only install what is needed.

### Layout & Structure
| Component | File | Use in Tinku |
|---|---|---|
| `Card` | `components/ui/card.tsx` | Every content block, stat widget |
| `Separator` | `components/ui/separator.tsx` | Dividers within cards |
| `ScrollArea` | `components/ui/scroll-area.tsx` | Long lists in constrained containers |
| `Skeleton` | `components/ui/skeleton.tsx` | Loading states for all data-dependent content |

### Forms & Inputs
| Component | File | Use in Tinku |
|---|---|---|
| `Button` | `components/ui/button.tsx` | All interactive buttons |
| `Input` | `components/ui/input.tsx` | Text fields (amount, name, notes) |
| `Label` | `components/ui/label.tsx` | All form field labels |
| `Select` | `components/ui/select.tsx` | Category, frequency, payment mode dropdowns |
| `Checkbox` | `components/ui/checkbox.tsx` | Multi-select, feature toggles |
| `Switch` | `components/ui/switch.tsx` | AutoPay on/off, bill active toggle |
| `Textarea` | `components/ui/textarea.tsx` | Notes, descriptions |
| `Calendar` | `components/ui/calendar.tsx` | Date pickers for bill due dates |
| `Popover` | `components/ui/popover.tsx` | Date picker container |
| `Form` | `components/ui/form.tsx` | React Hook Form + Zod integration |

### Feedback & Status
| Component | File | Use in Tinku |
|---|---|---|
| `Badge` | `components/ui/badge.tsx` | Bill status, payment mode, category tags |
| `Progress` | `components/ui/progress.tsx` | Budget usage bars |
| `Alert` | `components/ui/alert.tsx` | Inline warnings and notices |
| `Sonner` / Toast | (via sonner) | Success/error feedback after actions |

### Overlay & Navigation
| Component | File | Use in Tinku |
|---|---|---|
| `Dialog` | `components/ui/dialog.tsx` | Confirm destructive actions, payment review |
| `Sheet` | `components/ui/sheet.tsx` | Mobile filters, detail drawers |
| `Dropdown Menu` | `components/ui/dropdown-menu.tsx` | Action menus on cards |
| `Tooltip` | `components/ui/tooltip.tsx` | Icon button labels, helper hints |
| `Tabs` | `components/ui/tabs.tsx` | Settings sections, history filters |

### Data Display
| Component | File | Use in Tinku |
|---|---|---|
| `Table` | `components/ui/table.tsx` | Simple tabular data (less data than AG Grid) |
| `Avatar` | `components/ui/avatar.tsx` | Group member avatars |

---

## Button Variants

Based on existing `buttonVariants` from `components/ui/button.tsx`:

### Variant Specifications

| Variant | Use | Style |
|---|---|---|
| `default` | Primary CTA (Pay Now, Save, Add) | `bg-primary text-primary-foreground` — lime green |
| `secondary` | Secondary action (View All, Load More) | `bg-secondary text-secondary-foreground` |
| `outline` | Cancel, back, alternative action | `border border-border bg-transparent` |
| `ghost` | Subtle inline action (Edit, View) | `hover:bg-muted` — no border |
| `destructive` | Delete, Remove, Cancel AutoPay | `bg-destructive text-destructive-foreground` |
| `link` | In-text navigation | Underline, `text-primary` |

### Size Specifications

| Size | Height | Padding | Font | Use |
|---|---|---|---|---|
| `sm` | 32px | `px-3 py-1.5` | `text-xs font-semibold` | Inline card actions, secondary |
| `default` | 40px | `px-4 py-2` | `text-sm font-semibold` | Standard CTAs |
| `lg` | 48px | `px-6 py-3` | `text-base font-semibold` | Hero CTAs, auth forms |
| `icon` | 40×40px | `p-2` | — | Icon-only buttons |

### Button Rules

- **Primary action on each screen** → `variant="default"` (lime green)
- **Maximum 2 primary buttons** visible at once per screen
- **Destructive actions** → Always use `variant="destructive"` and require confirmation
- **Loading state** → Disable button + show spinner or "Saving…" text
- **Icon + Label** → Preferred over icon-only for clarity; always pair with `aria-label` for icon-only

---

## Badge / Status Component

Tinku uses colored badges extensively for payment status, bill mode, and categories.

### Status Badge Colors

| Status | Variant | Background | Text | Use |
|---|---|---|---|---|
| `upcoming` | custom | `bg-warning-soft` | `text-warning` | Bill due in future |
| `due_soon` | custom | `bg-warning-soft` | `text-warning font-bold` | Due in ≤7 days |
| `overdue` | custom | `bg-danger-soft` | `text-danger` | Past due date |
| `paid` | custom | `bg-success-soft` | `text-success` | Completed payment |
| `processing` | custom | `bg-info-soft` | `text-info` | In-progress payment |
| `failed` | destructive | `bg-danger-soft` | `text-danger` | Payment failed |

### Mode Badge Colors

| Mode | Label | Background | Text |
|---|---|---|---|
| `manual` | Manual | `bg-muted` | `text-muted-foreground` |
| `autopay` | AutoPay | `bg-primary/10` | `text-primary` |
| `upi` | UPI | `bg-info-soft` | `text-info` |
| `card` | Card | `bg-secondary` | `text-secondary-foreground` |

---

## Tinku-Specific Compound Components

### 1. StatCard

Used in the dashboard 4-stat row.

```tsx
// Props
interface StatCardProps {
  label: string           // "Active Bills"
  value: string           // "₹45,000" or "12"
  icon: LucideIcon        // Any Lucide icon
  iconColor: string       // Tailwind text color class
  iconBg: string          // Tailwind bg color class
  href?: string           // Optional link (makes card clickable)
  trend?: { value: string; positive: boolean }  // "+12% vs last month"
}

// Layout spec
// - rounded-2xl border bg-card p-4
// - Icon: size-10 container, size-5 icon
// - Label: text-xs font-medium text-muted-foreground
// - Value: text-xl sm:text-2xl font-bold tabular-nums
// - Hover: hover:shadow-md hover:border-primary/40 (when href provided)
```

### 2. BillCard

Used in the bills list and dashboard upcoming section.

```tsx
interface BillCardProps {
  bill: Bill
  occ?: Occurrence
  showActions?: boolean     // Show Pay/Mark as paid buttons
  variant?: 'compact' | 'full'
}

// Layout spec (compact — for dashboard):
// - rounded-xl border p-3.5 hover:bg-muted/30
// - Left: icon (size-9 container, size-4 icon) + name + due label
// - Right: amount + mode badge
// - Status: left border color (amber=upcoming, red=overdue, green=paid)

// Layout spec (full — for bills list):
// - rounded-2xl border p-5
// - Row 1: name + status badge + mode badge
// - Row 2: amount (prominent) + due date + frequency
// - Row 3 (if actions): Pay Now / Mark Paid / Edit buttons
```

### 3. BudgetProgress

Used in the budgets page and optionally dashboard.

```tsx
interface BudgetProgressProps {
  category: string
  limit: number       // ₹ limit
  spent: number       // ₹ spent so far
  icon?: LucideIcon
}

// Layout spec:
// - Row: icon + category name + right side: spent / limit
// - Progress bar: rounded-full h-2
//   - 0–70%: bg-primary (green)
//   - 70–90%: bg-warning (amber)
//   - 90–100%: bg-danger (red)
//   - 100%+: bg-danger, bar stays at 100% width
// - Under bar: "₹X left of ₹Y" or "Over budget by ₹Z"
```

### 4. ExpenseItem

Used in the expenses list.

```tsx
interface ExpenseItemProps {
  expense: Expense
  showDate?: boolean
}

// Layout spec:
// - Horizontal row with divider between items
// - Left: category icon (colored) + title + date (if showDate)
// - Right: amount (text-danger, tabular-nums) + optional note
// - Touch target: full row is tappable → edit
```

### 5. QuickAction

Used in the dashboard Quick Actions card.

```tsx
interface QuickActionProps {
  href: string
  icon: LucideIcon
  label: string
  colorScheme: 'green' | 'blue' | 'purple' | 'red' | 'amber'
}

// Layout spec:
// - Full-width pill: rounded-xl border px-4 py-3.5
// - Left: icon (size-5) + label (text-sm font-semibold)
// - Right: Plus or ArrowRight icon (size-4)
// - Each colorScheme maps to: border color + bg color + text color
//   green → emerald-200/70 bg + emerald-50/70 hover + emerald-950 text (light)
//           emerald-900/60 bg + emerald-950/40 hover + emerald-200 text (dark)
```

### 6. PaymentStatusBadge

Reusable status badge for payments, bill occurrences.

```tsx
// Extended from Shadcn Badge
// Props: status: 'upcoming' | 'due_soon' | 'overdue' | 'paid' | 'processing' | 'failed'
// Auto-applies correct colorScheme from status
// Includes appropriate icon prefix (Clock, Check, AlertTriangle, etc.)
```

### 7. EmptyState

Used when a module has no data.

```tsx
interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: { label: string; href: string }
}

// Layout spec:
// - Centered column, py-16 or py-20
// - Icon: size-12 text-muted-foreground/50 (large, faded)
// - Title: text-base font-semibold text-foreground mt-4
// - Description: text-sm text-muted-foreground mt-1 max-w-sm text-center
// - Action: Button variant="default" mt-6 (if provided)
```

### 8. LoadingSkeleton

Skeleton loading states that match the content they represent.

```tsx
// Variants:
// - StatCardSkeleton: matches StatCard dimensions
// - BillCardSkeleton: matches BillCard (compact) dimensions
// - ListItemSkeleton: generic list item row
// - BudgetProgressSkeleton: matches BudgetProgress dimensions

// All use: animate-pulse bg-muted rounded-{appropriate-radius}
// Never show more than 3 skeleton items (indicates loading, doesn't overwhelm)
```

### 9. SectionHeader

Consistent header used for every card/section.

```tsx
interface SectionHeaderProps {
  title: string
  viewAllHref?: string
  viewAllLabel?: string    // defaults to "View all"
  count?: number           // shown as "(12)"
  action?: React.ReactNode // custom right-side element
}

// Layout: flex justify-between items-center
// Title: text-base font-bold text-foreground
// View all: text-xs font-semibold text-primary hover:underline
```

---

## Card Design Standards

All cards in Tinku follow one of three card patterns:

### Pattern 1: Content Card (Standard)
```tsx
<Card className="p-5 shadow-sm">
  <SectionHeader title="Upcoming Bills" viewAllHref="/bills" />
  <div className="mt-4 space-y-2.5">
    {/* items */}
  </div>
</Card>
```

### Pattern 2: Stat Card (Dashboard)
```tsx
<div className="rounded-2xl border bg-card p-4 hover:shadow-md transition-all">
  {/* icon + label + value */}
</div>
```

### Pattern 3: Status Card (Bills with left border)
```tsx
<Card className="border-l-4 border-l-warning p-4 shadow-sm">
  {/* bill info + actions */}
</Card>
```

**Rules:**
- Always use `rounded-2xl` for cards (not `rounded-lg` or `rounded-xl`)
- Always `shadow-sm` in light mode; in dark mode the border provides definition
- Never use different card padding on different pages — `p-4` (mobile) or `p-5` (standard)
- Never put a card inside a card (max one level of nesting)

---

## Form Component Standards

### Field Anatomy
```tsx
<div className="space-y-1.5">
  <Label htmlFor="amount">Amount</Label>
  <div className="relative">
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
    <Input id="amount" type="number" className="pl-7" placeholder="0.00" />
  </div>
  <p className="text-xs text-muted-foreground">Enter the monthly bill amount</p>
</div>
```

### Form Layout
- Vertical stack with `space-y-5` or `space-y-6` between fields
- Group related fields with `space-y-4` inside a `border rounded-xl p-4`
- Submit button full-width on mobile (`w-full`), auto-width on desktop
- Cancel/back link to the left, submit button to the right on desktop

### Input States
| State | Style |
|---|---|
| Default | `border-input bg-background` |
| Focus | `ring-2 ring-ring ring-offset-0` (Tailwind v4 `outline-ring/50`) |
| Error | `border-destructive` + error text below |
| Disabled | `opacity-50 cursor-not-allowed` |
| Success | (no special style — show success message after submit) |

---

## Navigation Component Standards

See `NAVIGATION_AND_INFORMATION_ARCHITECTURE.md` for the full nav spec.

**Nav item active state:**
```
bg-sidebar-accent text-sidebar-accent-foreground
```

**Nav item hover state:**
```
hover:bg-muted text-foreground/80
```

**Nav icon state:**
- Inactive: `text-muted-foreground group-hover:text-foreground`
- Active: inherits `text-sidebar-accent-foreground` from parent

---

## Component Anti-Patterns

| Anti-Pattern | Correct |
|---|---|
| Hardcoded colors in component (`text-[#5DD62C]`) | Use `text-primary` |
| Different card padding per screen | Always `p-4` or `p-5` |
| Icon-only buttons without labels | Icon + text, or icon + `aria-label` |
| Nested cards (card inside card) | Flat structure with dividers |
| `onClick` on a `<div>` | Use `<button>` or `<Link>` |
| Inline `style` for spacing | Use Tailwind classes from the spacing scale |
| Custom modal built from scratch | Use Shadcn `Dialog` |
| `window.alert()` for confirmations | Use Shadcn `Dialog` or `AlertDialog` |

