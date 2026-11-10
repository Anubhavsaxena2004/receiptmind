# Tinku Navigation & Information Architecture

> This document defines how Tinku's features are organized, how screens connect to each other, and how navigation works across desktop and mobile. All navigation implementations must follow this spec.

---

## Information Architecture

### Primary Modules

```
Tinku
├── Home (Dashboard)
│   └── Overview of financial health
│
├── Track
│   ├── Expenses
│   │   ├── Expense List (/)
│   │   └── Add Expense (/new)
│   │       └── AI Receipt Scanner (tab within new expense)
│   └── Budgets
│       ├── Budget Overview (/)
│       └── Edit Budgets (/edit)
│
├── Pay
│   ├── Bills
│   │   ├── Bills List (/)
│   │   ├── Bill Detail (/[id])
│   │   │   └── Bill Edit (/[id]/edit)
│   │   └── New Bill (/new)
│   ├── AutoPay
│   │   ├── AutoPay Rules List (/)
│   │   └── New AutoPay Rule (/new)
│   └── Payment History
│       └── All Payments + Status (/history)
│
├── Plan Ahead
│   └── Crisis Drill (/)
│
├── Together
│   └── Groups
│       ├── Groups List (/)
│       ├── Group Detail (/[id])
│       └── New Group (/new)
│
└── Account
    ├── Settings (/)
    │   ├── Profile
    │   ├── Connections
    │   ├── Security
    │   ├── Appearance (← new, for theme toggle)
    │   └── Demo Tools
    └── Notifications (/notifications)
```

---

## Desktop Sidebar Navigation

### Structure

```
┌─────────────────────────────────────┐
│  T.  Tinku                          │
│       Smart Finance                 │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  + Quick Add                │    │  ← Primary CTA button
│  └─────────────────────────────┘    │
│                                     │
│  ● Home                             │  ← No section label
│                                     │
│  TRACK                              │
│    📋 Expenses                      │
│    🐷 Budgets                       │
│                                     │
│  PAY                                │
│    📅 Bills                         │
│    🔄 AutoPay                       │
│    📜 Payment History               │
│                                     │
│  PLAN AHEAD                         │
│    🛡️ Crisis Drill                  │
│                                     │
│  TOGETHER                           │
│    👥 Groups                        │
│                                     │
│  ─────────────────────────────────  │
│  ⚙️ Settings                        │  ← Always at bottom
└─────────────────────────────────────┘
```

### Desktop Nav Specifications

| Element | Spec |
|---|---|
| Sidebar width | 256px (`w-64`) |
| Brand area | Logo + wordmark, `px-2 pb-5` |
| Quick Add button | Full-width, `bg-primary`, rounded-2xl, py-2.5 |
| Section labels | 11px uppercase, `tracking-[0.14em]`, `text-muted-foreground` |
| Nav items | Icon (18px) + label + hint text |
| Active state | `bg-sidebar-accent text-sidebar-accent-foreground` |
| Hover state | `hover:bg-muted` |
| Item radius | `rounded-xl` |
| Settings link | Separated by `border-t pt-3` at bottom |

### Nav Item Anatomy

Each nav item shows:
1. **Icon** — 18×18px, `text-muted-foreground` (inactive) or accent color (active)
2. **Label** — `text-sm font-semibold` — the screen name
3. **Hint text** — `text-xs text-muted-foreground` — one-line context ("Due dates & how to pay")

---

## Mobile Bottom Navigation

### Current (4 items) → Revised (5 items)

**Current BOTTOM array:**
```
Home | Expenses | Bills | Drill
+ "More" button (5th slot)
```

**Recommended revision** — keep existing structure but update the 5th slot content:

```
Home | Expenses | Bills | Budgets | More ▾
```

Rationale: Budgets is more frequently used than Drill (which is a one-time/occasional action). Drill is accessible via the "More" drawer and the dashboard Quick Actions card.

### Mobile Nav Specifications

| Element | Spec |
|---|---|
| Grid | `grid-cols-5` (4 items + More) |
| Item padding | `py-2.5` |
| Icon | `size-5` (20px) |
| Label | `text-[11px] font-semibold` |
| Active color | `text-primary` |
| Inactive color | `text-muted-foreground` |
| Background | `bg-background/95 backdrop-blur` |
| Border | `border-t border-border` |
| Safe area | `pb-[env(safe-area-inset-bottom)]` |

### "More" Drawer (Mobile)

The "More" button opens a full side drawer with the complete navigation:
- All NAV sections from the sidebar
- Settings link at the bottom
- Same structure as desktop sidebar nav

---

## Header (Top Bar)

### Desktop Header

```
┌──────────────────────────────────────────────────────────────────┐
│ [sidebar — not in header]  │  [spacer]  Demo Mode  🔔  [Avatar▾] │
└──────────────────────────────────────────────────────────────────┘
```

| Element | Position | Use |
|---|---|---|
| Brand (mobile only) | Left | Shows on mobile only (`lg:hidden`) |
| Demo label | Right (hidden on mobile) | "Sandbox" or "PayPal Demo" pill |
| Theme toggle | Right | Light/Dark/System toggle |
| Notifications bell | Right | With unread count badge |
| Account menu | Right | Avatar + name → settings/logout |

### Mobile Header

```
┌──────────────────────────────────┐
│  T. Tinku         🔔  [Avatar▾]  │
└──────────────────────────────────┘
```

On mobile, the sidebar is hidden, so the Brand appears in the header.

---

## Page Hierarchy and Breadcrumbs

### Pages with Back Navigation

| Page | Back Destination | Method |
|---|---|---|
| `/expenses/new` | `/expenses` | Back button in page header |
| `/bills/new` | `/bills` | Back button in page header |
| `/bills/[id]` | `/bills` | Back link at top |
| `/bills/[id]/edit` | `/bills/[id]` | Back link at top |
| `/autopay/new` | `/autopay` | Back button |
| `/groups/new` | `/groups` | Back button |
| `/groups/[id]` | `/groups` | Back link at top |
| `/pay/[occurrenceId]` | `/bills` or referring page | Cancel button |
| `/payments/[id]` | `/history` | Back link |
| `/budgets/edit` | `/budgets` | Cancel/Back |

### Back Navigation Pattern

```tsx
// Standard back link (not a full breadcrumb — keep simple)
<Link
  href="/bills"
  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
>
  <ChevronLeft className="size-4" />
  Bills
</Link>
```

Do not build a multi-level breadcrumb system — the app hierarchy is shallow enough that a single back link is sufficient and cleaner.

---

## Routing Reference

### Protected Routes (require auth)

| Path | Component | Module |
|---|---|---|
| `/` | `Dashboard` | Home |
| `/expenses` | `ExpenseList` | Track |
| `/expenses/new` | `NewExpense` | Track |
| `/budgets` | `BudgetOverview` | Track |
| `/budgets/edit` | `BudgetEditor` | Track |
| `/bills` | `BillList` | Pay |
| `/bills/new` | `NewBill` | Pay |
| `/bills/[id]` | `BillDetail` | Pay |
| `/bills/[id]/edit` | `BillEditor` | Pay |
| `/autopay` | `AutoPayList` | Pay |
| `/autopay/new` | `NewAutoPay` | Pay |
| `/history` | `PaymentHistory` | Pay |
| `/drill` | `CrisisDrill` | Plan Ahead |
| `/groups` | `GroupList` | Together |
| `/groups/new` | `NewGroup` | Together |
| `/groups/[id]` | `GroupDetail` | Together |
| `/notifications` | `Notifications` | Account |
| `/pay/[occurrenceId]` | `PaymentCheckout` | Pay flow |
| `/pay/simulated` | `SimulatedPayment` | Pay flow |
| `/payments/[id]` | `PaymentDetail` | Pay |
| `/settings` | `Settings` | Account |

### Auth Routes (public)

| Path | Component |
|---|---|
| `/login` | `Login` |
| `/signup` | `Signup` |
| `/verify` | `EmailVerify` |
| `/forgot-password` | `ForgotPassword` |
| `/reset-password` | `ResetPassword` |

---

## Navigation UX Rules

1. **Active state must be clear** — the current page's nav item is always visually distinct
2. **Never use full-page navigation for simple filter changes** — use tabs or segment controls within the page
3. **Deep links must work** — `/bills/[id]` should render correctly when navigated to directly
4. **No broken back navigation** — every detail page has a way back to its list
5. **Mobile nav only 5 items** — additional items go in "More" drawer (don't add to bottom bar)
6. **Quick Add always accessible** — the FAB (mobile) and Quick Add button (desktop sidebar) always visible
7. **Settings is not buried** — accessible via sidebar bottom link on desktop AND the account dropdown header

---

## Notification System

The bell icon in the header leads to `/notifications`. The notification system shows:
- Bill payment events (confirmed, failed, upcoming)
- AutoPay triggers
- Webhook events (payment status changes)

Unread count badge appears on the bell icon when `unread > 0`.

**Navigation shortcut:** Notifications from the bell always navigate to `/notifications` (full page), never to an inline panel/drawer (this would add complexity and is not standard Indian app behavior).

