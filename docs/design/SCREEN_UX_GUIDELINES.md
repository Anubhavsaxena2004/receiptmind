# Tinku Screen UX Guidelines

> This document provides detailed UX and layout specifications for every screen in Tinku. When implementing a screen redesign, consult its specific section here.

---

## Screen Inventory

1. [Dashboard / Overview (`/`)](#1-dashboard--overview-)
2. [Expenses (`/expenses`)](#2-expenses-expenses)
3. [Add Expense + Receipt Scanner (`/expenses/new`)](#3-add-expense--receipt-scanner-expensesnew)
4. [Budgets (`/budgets`)](#4-budgets-budgets)
5. [Edit Budgets (`/budgets/edit`)](#5-edit-budgets-budgetsedit)
6. [Bills List (`/bills`)](#6-bills-list-bills)
7. [Bill Detail (`/bills/[id]`)](#7-bill-detail-billsid)
8. [New Bill (`/bills/new`)](#8-new-bill-billsnew)
9. [AutoPay (`/autopay`)](#9-autopay-autopay)
10. [Crisis Drill (`/drill`)](#10-crisis-drill-drill)
11. [Groups (`/groups`)](#11-groups-groups)
12. [Payment History (`/history`)](#12-payment-history-history)
13. [Settings (`/settings`)](#13-settings-settings)
14. [Payment Review / Simulated (`/pay/...`)](#14-payment-review--simulated-pay)
15. [Auth Screens (`/login`, `/signup`, `/verify`)](#15-auth-screens-login-signup-verify)

---

## 1. Dashboard / Overview (`/`)

### Purpose
The user's daily control center. In 3 seconds, they should understand:
- How much money is available
- What needs attention today (upcoming/overdue bills)
- Their spending pace for the month
- Quick access to the most common actions

### Priority Information Hierarchy
1. **Available Balance** (Hero card) — total money available, after this week's bills
2. **Needs Attention** — alerts for bills due soon or overdue
3. **4-Stat Summary** — Active bills, Monthly income, Monthly expenses, Net monthly
4. **Upcoming Bills** (next 14 days)
5. **Quick Actions** — Record expense, Add bill, Check budgets, Run drill, Split group
6. **Monthly Spending Trend** — visual chart of spending pace
7. **Recent Activity** — notification feed

### Layout Structure
- **Mobile:** Single column stack (Hero → 4 Stats [2x2] → Needs Attention → Upcoming → Quick Actions → Trend → Activity)
- **Desktop:**
  - Row 1: Page Header ("Dashboard · Welcome!")
  - Row 2: Hero Balance Card (full width)
  - Row 3: 4 Stat Cards (4 columns)
  - Row 4: 2-Column Grid:
    - Left column: Quick Actions (pill buttons) + Spending Trend chart
    - Right column: Needs Attention (if any) + Upcoming Bills + Crisis Drill teaser + Recent Activity

### Primary Actions
- `Quick Add` (sidebar button on desktop, FAB on mobile)
- Inline `Pay Now` / `Mark as Paid` on bills in "Needs Attention"

### States
- **Loading:** Skeletons for Hero card, 4 stat cards, 3 upcoming bills
- **Empty (brand new user):** First-run onboarding checklist (5 steps, 1 min each) + "Load sample data" CTA
- **Guest / Demo:** Banner indicating sample household mode + "Create free account" CTA

---

## 2. Expenses (`/expenses`)

### Purpose
View, filter, and review day-to-day spending. Quickly add new expenses.

### Priority Information Hierarchy
1. **Total Spent This Month** — big number at the top
2. **Category Breakdown** — small chips or summary bar
3. **Chronological Expense List** — grouped by date (Today, Yesterday, earlier dates)
4. **Per-item:** category icon, title, note (if any), amount (red/negative)

### Layout Structure
- Page Header: "Expenses" + "Add Expense" button (top right)
- Monthly total card: Total spent + comparison to budget
- Filter bar: Category filter, month selector, search
- List: Grouped by date, card items with dividers
- Desktop: `max-w-4xl mx-auto`
- Mobile: Full width, FAB visible

### Primary Action
- "Add Expense" button (prominent green button in header, plus FAB on mobile)

### States
- **Empty:** "No expenses recorded this month yet." + "Add your first expense" CTA
- **Filtered empty:** "No expenses matching this filter." + "Clear filter" button

---

## 3. Add Expense + Receipt Scanner (`/expenses/new`)

### Purpose
Record an expense manually OR scan a physical receipt with AI to extract the data.

### Interaction Pattern
- Two-tab layout at the top:
  - Tab 1: **"Manual Entry"** (default)
  - Tab 2: **"Scan Receipt (AI)"** with camera/upload icon

### Manual Entry Form Fields
1. **Amount** — largest input, prominent rupee prefix (`pl-7`)
2. **Title / Description** — "What did you spend on?"
3. **Category** — Select dropdown (Food, Travel, Utilities, Entertainment, etc.)
4. **Date** — Date picker (defaults to today)
5. **Notes** — Optional textarea
6. **Split with Group** — Optional toggle to link to an existing group

### AI Receipt Scanner Flow
1. Drag & drop or file upload area (camera capture on mobile)
2. "Analyze Receipt" button (calls Anthropic Claude Vision API)
3. Loading state: scanning animation with "Extracting items, total, and merchant…"
4. Result: pre-fills the manual entry form with extracted:
   - Merchant name → Title
   - Total amount → Amount
   - Date → Date
   - Line items → Notes
5. User reviews, edits if needed, and clicks "Save Expense"

---

## 4. Budgets (`/budgets`)

### Purpose
Monitor spending limits by category. See what's safe to spend and what's at risk.

### Priority Information Hierarchy
1. **Total Monthly Budget vs Total Spent** — overall progress bar
2. **Budget Status Alert** — any category > 90% or over budget
3. **Category Budget Cards** — sorted by highest % used first

### Category Card Anatomy
- Category name + icon
- Progress bar:
  - Green (0–70%): on track
  - Amber (70–90%): approaching limit
  - Red (90–100%+): near/over budget
- Amounts: "₹X spent of ₹Y"
- Remaining: "₹Z left" or "₹Z over budget" (bold red)

### Layout Structure
- Summary card at top (total budget, total spent, % remaining)
- Grid of category cards: `grid gap-4 sm:grid-cols-2 lg:grid-cols-3`
- Edit button in header: "Edit Budgets" → `/budgets/edit`

---

## 5. Edit Budgets (`/budgets/edit`)

### Purpose
Set or adjust monthly spending limits per category.

### Layout Structure
- Narrow container: `max-w-xl mx-auto`
- List of all spending categories with an amount input for each
- Quick presets: "Copy from last month", "Suggest from spending"
- Sticky save bar at bottom: "Cancel" (outline) and "Save Budgets" (primary)

---

## 6. Bills List (`/bills`)

### Purpose
All recurring bills in one place. Understand due dates, amounts, and payment modes.

### Priority Information Hierarchy
1. **Bills Due Soon (Next 7 Days)** — top section, amber alert if any
2. **All Active Bills** — categorized by frequency (Monthly, Annual, etc.)
3. **Per-bill card:**
   - Bill name
   - Next due date + days remaining ("in 4 days", "tomorrow", "overdue")
   - Amount
   - Payment mode badge (Manual, AutoPay, UPI)
   - Inline action: "Pay Now" or "Mark as Paid"
4. **Inactive / Paused Bills** — collapsed at the bottom

### Layout Structure
- Page Header: "Bills" + "Add Bill" button
- Segment tabs: "Upcoming", "All Bills", "AutoPay Only"
- Desktop: 2-column grid of bill cards (`sm:grid-cols-2`)
- Mobile: Single-column stack

---

## 7. Bill Detail (`/bills/[id]`)

### Purpose
Complete view of a single bill — history, settings, payment method, recurrence rules.

### Content Sections
1. **Bill Header Card:** Name, next due date, amount, mode, active toggle
2. **Quick Pay Action:** If an occurrence is due, big "Pay ₹X Now" CTA
3. **AutoPay Status:** Is AutoPay configured for this bill? (link to configure)
4. **Payment History for this bill:** Last 6 occurrences with status and date
5. **Bill Settings:** Recurrence rule, category, reminder preferences, edit/delete actions

---

## 8. New Bill (`/bills/new`)

### Purpose
Add a new recurring bill.

### Form Fields
1. **Bill Name** (required) — "Bescom Electricity", "Netflix", "Rent"
2. **Amount** (required) — with ₹ prefix
3. **Category** (required) — Utilities, Housing, Entertainment, etc.
4. **Frequency** (required) — Monthly, Bi-monthly, Quarterly, Annual
5. **First Due Date** (required) — Calendar date picker
6. **Payment Mode** (required) — Manual, UPI, AutoPay, Card
7. **AutoPay Toggle** — if selected, opens AutoPay configuration fields inline
8. **Notes / Account Number** (optional)

---

## 9. AutoPay (`/autopay`)

### Purpose
Configure and monitor automatic bill payments powered by the scheduler.

### Information Hierarchy
1. **AutoPay Health Summary** — "3 bills on AutoPay · Next payment: Netflix on 15 Nov"
2. **Active AutoPay Rules** — card for each configured rule
3. **Per-rule card:**
   - Bill name
   - Payment method (PayPal Sandbox / Simulated)
   - Next run date
   - Status (Active / Paused / Needs Attention)
   - "Pause" or "Edit" buttons
4. **Recent AutoPay Executions** — log of automated runs

---

## 10. Crisis Drill (`/drill`)

### Purpose
Simulate financial emergencies (job loss, sudden medical expense, rent increase) to test financial resilience.

### Information Hierarchy
1. **Drill Score Card** — "Financial Resilience: 78/100" (big radial or score meter)
2. **Run New Drill** — Scenario selector:
   - "Job loss (3 months zero income)"
   - "Major medical expense (₹1,00,000)"
   - "Rent hike (+20%)"
   - "Custom scenario"
3. **Scenario Parameters** — income drop %, unexpected expense amount, duration
4. **Simulation Results:**
   - How long will emergency reserve last? ("4.2 months")
   - Which bills are at risk? (list of bills that would bounce)
   - Recommended actions: "Pause Netflix, reduce dining budget by ₹3,000"
5. **Drill History** — past simulation runs and scores

---

## 11. Groups (`/groups`)

### Purpose
Split shared expenses (flatmates, trips, household) and track who owes what.

### Information Hierarchy
1. **Your Net Position** — "You are owed ₹1,400" or "You owe ₹800" (big stat card)
2. **Active Groups** — cards for each group:
   - Group name (e.g. "Apartment 304", "Goa Trip")
   - Member count + member initials avatars
   - Your balance in this group
3. **Group Detail (`/groups/[id]`):**
   - Settlement summary: "A owes B ₹500" (minimal transaction settlement)
   - Shared expense feed
   - "Add Shared Expense" CTA
   - "Settle Up" action

---

## 12. Payment History (`/history`)

### Purpose
Complete, searchable record of all payments made through Tinku.

### Layout Structure
- Page Header: "Payment History" + Export button (CSV)
- Filter Bar: Date range, status (Paid, Failed, Processing), search by bill name
- **Table / Grid View (AG Grid):**
  - Date
  - Bill / Expense name
  - Amount (INR)
  - Method (PayPal, UPI, Manual)
  - Status Badge (Paid = green, Failed = red, Processing = blue)
  - Reference / Transaction ID
  - Actions (View receipt / detail)
- Mobile: Card-based list instead of full AG Grid table

---

## 13. Settings (`/settings`)

### Purpose
Account management, household profile, integrations, and preferences.

### Tab Navigation
1. **Profile** — Name, email, currency (INR), household members
2. **Finances** — Current balance, salary day, monthly income, emergency reserve
3. **Appearance** — Theme toggle (Light / Dark / System), future visual settings
4. **Connections** — PayPal Sandbox credentials, Webhook status, Upstash Redis status
5. **Security** — Change password, email verification status, session management
6. **Demo Tools** — Load sample data, erase sample data, reset account

### Layout
- Desktop: Left vertical tabs or horizontal tabs at top
- Container: `max-w-xl` for form content

---

## 14. Payment Review / Simulated (`/pay/...`)

### Purpose
The confirmation screen before executing a payment. Trust and clarity are paramount here.

### Information Hierarchy
1. **Payment Amount** — largest element on screen
2. **Bill Being Paid** — name, due date, category
3. **Payment Method** — PayPal Sandbox / Demo mode indicator
4. **Deduction Notice** — "This will deduct ₹X from your available balance"
5. **Actions:**
   - "Confirm & Pay ₹X" (large green button)
   - "Cancel" (text link / outline button)

---

## 15. Auth Screens (`/login`, `/signup`, `/verify`)

### Purpose
Fast, trustworthy onboarding and authentication.

### Layout Structure
- Centered card: `max-w-md mx-auto py-12`
- Tinku brand at top (Logo + "Smart Finance")
- Card with subtle border, `p-8`
- Clear title: "Welcome back" (login) or "Create your account" (signup)
- Inputs with labels, placeholders, and error messages
- Primary CTA: full-width green button
- Switch link at bottom: "Already have an account? Log in"
