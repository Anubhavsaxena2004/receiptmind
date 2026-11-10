# Tinku Implementation Plan & Roadmap

> This document outlines the systematic implementation strategy for rolling out Tinku's redesigned design system across the application. It details current audit findings, an 8-phase roadmap, migration strategies, risk management, and testing criteria.

---

## 1. Project Audit Findings

A comprehensive inspection of the existing codebase revealed several structural, stylistic, and architectural gaps that must be addressed during implementation:

### 1.1 Color Palette Inconsistencies
- **Mismatch with Specified Brand Identity:** The existing `globals.css` uses generic emerald (`#059669` / `#10b981`) and dark slate/teal backgrounds (`#091311`), conflicting with the mandated brand palette:
  - Deep Black: `#0F0F0F`
  - Charcoal: `#202020`
  - Lime Green: `#5DD62C`
  - Forest Green: `#337418`
  - Off-White: `#F8F8F8`
- **Ad-Hoc Tailwind Colors:** Screens frequently mix raw utility colors (e.g., `bg-sky-50`, `text-emerald-600`, `text-rose-600`, `border-amber-200`) instead of relying on tokenized semantic variables (`--primary`, `--success`, `--warning`, `--danger`).

### 1.2 Theme System Deficiencies
- **No Active Theme Toggle:** Although `.dark` classes and `@media (prefers-color-scheme: dark)` are defined in `globals.css`, there is no runtime toggle mechanism in the UI allowing users to switch between Light, Dark, and System modes.
- **Potential Hydration & Theme Flash:** Without a tool like `next-themes` and a client-side theme initialization script, users may experience flashing between dark and light themes during page loads.

### 1.3 Typography & Number Formatting
- **Missing Explicit Font Integration:** The application lacks an optimized, self-hosted font configuration via `next/font/google`. **Plus Jakarta Sans** needs to be formally configured in `app/layout.tsx`.
- **Inconsistent Amount Scannability:** While `formatINR` exists, several components omit `tabular-nums` (monospaced numeric figures), degrading vertical comparison across tables, stat cards, and lists.

### 1.4 Component Architecture Gaps
- **Lack of Standardized Tinku Compound Components:** Compound structures like `StatCard`, `BillCard`, `BudgetProgress`, and `EmptyState` are repeatedly built inline across different routes with differing paddings, borders, and hover states.
- **Dependency Mixing:** Some primitives are imported from `@base-ui/react` (e.g., `Menu`), while others originate from `shadcn` (`components/ui`). A unified, consistent approach is needed.

### 1.5 Layout & Spacing Divergence
- **Inconsistent Page Max-Widths:** Several routes use varying container widths (`max-w-xl`, `max-w-2xl`, `max-w-5xl`) arbitrarily.
- **Mobile Navigation Gaps:** The mobile bottom navigation currently contains 4 items (`Home`, `Expenses`, `Bills`, `Drill`), omitting frequently used modules such as `Budgets` from instant reach.

---

## 2. Redesign Implementation Phasing

To guarantee stability, preserve API integrations, and avoid regressions, the rollout is split into 8 sequential phases.

```
Phase 1: Foundation & Specs (Completed)
   ↓
Phase 2: Theme, Tokens & Core Primitives
   ↓
Phase 3: Dashboard & Layout Shell
   ↓
Phase 4: Expenses & Budgets Modules
   ↓
Phase 5: Bills, AutoPay & Payment History
   ↓
Phase 6: Crisis Drill & Groups
   ↓
Phase 7: Settings & Authentication
   ↓
Phase 8: End-to-End QA, A11y & Performance Polish
```

---

### Phase 1: UX Foundation & Documentation (CURRENT PHASE)
- **Status:** Complete ✅
- **Deliverables:** 13 design documentation files in `docs/design/` defining UX principles, colors, typography, layout, themes, component specs, accessibility, and individual screen requirements.
- **Code Changes:** None. Documentation and planning only.

---

### Phase 2: Theme System, Token Setup & Core Primitives
- **Objective:** Establish the CSS token system, brand palette, font import, and runtime theme switcher before rewriting pages.
- **Files Affected:**
  - `app/globals.css` (Update `:root`, `.dark`, chart, and sidebar tokens to brand specs)
  - `app/layout.tsx` (Add `Plus_Jakarta_Sans` via `next/font/google` and wrap with `next-themes`)
  - `components/providers.tsx` (Introduce `ThemeProvider` client wrapper)
  - `components/theme-toggle.tsx` (Create theme switcher dropdown/button)
  - `components/ui/` (Verify & add necessary Shadcn UI components: `Dialog`, `DropdownMenu`, `Tabs`, `Progress`, `Skeleton`, `Badge`, `Alert`)
  - `components/tinku/` (Create standardized shared compound components: `StatCard`, `SectionHeader`, `EmptyState`, `StatusBadge`)
- **Dependencies:** Install `next-themes` (outside sandbox if needed).
- **Verification:** Both light and dark modes toggle instantly without visual flash; all base tokens render cleanly.

---

### Phase 3: AppShell & Dashboard Redesign
- **Objective:** Redesign the primary frame (`AppShell`) and the core landing page (`Dashboard`).
- **Files Affected:**
  - `components/app-shell.tsx` (Update desktop sidebar styling, add theme toggle, refine mobile 5-item bottom bar, brand logo styling)
  - `app/(app)/page.tsx` (Redesign Dashboard according to Siburian / AeuxGlobal / DailyDime reference layout)
  - `components/spending-trend.tsx` (Update chart colors to match `--chart-1` and `--chart-2`)
  - `components/occurrence-actions.tsx` (Adopt consistent button tokens and action styles)
- **Verification:** Responsive transitions between mobile bottom bar and desktop sidebar; stat cards, upcoming bills, and quick action pills display properly in both light and dark modes.

---

### Phase 4: Track Module (Expenses & Budgets)
- **Objective:** Modernize spending tracking, AI receipt scanner UI, and budget progress visualizers.
- **Files Affected:**
  - `app/(app)/expenses/page.tsx` (Expense list grouping, filtering, date headers)
  - `app/(app)/expenses/new/page.tsx` (Tabs for manual entry vs AI Receipt scanner, drag-and-drop receipt UI)
  - `app/(app)/budgets/page.tsx` (Category budget cards with color-coded progress bars: green/amber/red)
  - `app/(app)/budgets/edit/page.tsx` (Budget limit editor with clear form controls)
- **Verification:** Adding manual expense works, receipt upload and Claude AI parsing remains functional, budget calculation bars react correctly to spending percentages.

---

### Phase 5: Pay Module (Bills, AutoPay & Payment History)
- **Objective:** Redesign bill tracking, scheduler setup, PayPal checkout review, and transaction history.
- **Files Affected:**
  - `app/(app)/bills/page.tsx` (Bills list with status badges: upcoming, due soon, overdue, paid)
  - `app/(app)/bills/[id]/page.tsx` & `[id]/edit/page.tsx` (Bill detail and editing views)
  - `app/(app)/bills/new/page.tsx` (New bill creation form)
  - `app/(app)/autopay/page.tsx` & `/autopay/new/page.tsx` (AutoPay rule manager and setup)
  - `app/(app)/pay/[occurrenceId]/page.tsx` & `/pay/simulated/page.tsx` (Payment review and checkout UI)
  - `app/(app)/history/page.tsx` (AG Grid / card list styling for transactions)
- **Verification:** PayPal sandbox checkout flows execute smoothly; AutoPay rules display schedule statuses; payment occurrences can be marked as paid or triggered via sandbox.

---

### Phase 6: Plan Ahead & Together (Crisis Drill & Groups)
- **Objective:** Redesign emergency scenario simulation and household group expense splitting.
- **Files Affected:**
  - `app/(app)/drill/page.tsx` (Interactive resilience score, scenario sliders, emergency reserve breakdown)
  - `app/(app)/groups/page.tsx` (Group list and debt/credit balance overview)
  - `app/(app)/groups/[id]/page.tsx` & `/groups/new/page.tsx` (Group expense feed, settle up modal, member management)
- **Verification:** Scenario calculations run cleanly; group splits calculate minimal transactions accurately.

---

### Phase 7: Account, Settings & Authentication
- **Objective:** Unify settings tabs, connection status indicators, demo tools, and public authentication flows.
- **Files Affected:**
  - `app/(app)/settings/page.tsx` (Tabbed interface: Profile, Finances, Appearance, Connections, Security, Demo Tools)
  - `app/(app)/notifications/page.tsx` (Activity log and notification cards)
  - `app/(auth)/login/page.tsx`
  - `app/(auth)/signup/page.tsx`
  - `app/(auth)/verify/page.tsx`
  - `app/(auth)/forgot-password/page.tsx`
  - `app/(auth)/reset-password/page.tsx`
- **Verification:** User profile and financial inputs save properly; connection test buttons reflect Upstash and PayPal status; authentication redirects function seamlessly.

---

### Phase 8: Accessibility, Polish & Verification
- **Objective:** Ensure complete accessibility compliance, keyboard navigability, zero layout shifts, and cross-browser responsiveness.
- **Tasks:**
  - Full keyboard audit (Tab order, focus rings using `--ring: #5DD62C`, escape key modal handling)
  - Contrast audit with axe / Lighthouse (verifying WCAG 2.2 AA)
  - Screen reader validation on currency and badge values
  - Touch target audit (ensuring min 44x44px across all mobile controls)
  - Run regression tests on all 26 backend API routes

---

## 3. Risk Mitigation & Safety Constraints

| Risk | Impact | Mitigation Strategy |
|---|---|---|
| **Breaking Payment/PayPal Sandbox Flows** | High | Never touch payment action logic (`lib/actions/paypal.ts`, `/api/paypal/*`). Only update presentation and button classes. Test payment execution after every UI change. |
| **API Contract Mismatches** | High | Do not change form field names or validation schemas in `lib/validations/`. Keep all existing input names matching backend Zod schemas. |
| **Theme Flashing (FOUC)** | Medium | Use `next-themes` with `suppressHydrationWarning` on `<html>` and inline class script injection. |
| **AG Grid Theme Collision** | Medium | Apply customized AG Grid CSS variables matching `--background`, `--card`, and `--border` in both dark and light modes. |
| **Accessibility Regressions** | Medium | Adhere strictly to `docs/design/ACCESSIBILITY.md`; never remove `aria-label`, `aria-hidden`, or label-input associations. |

---

## 4. Phase 1 Completion Sign-off

Phase 1 documentation is now complete. The architecture, tokens, typography, component guidelines, screen specs, and rollout roadmap are comprehensively established.

**Next Action:** Await user review and confirmation before initiating **Phase 2 (Theme, Tokens & Core Primitives)**.

