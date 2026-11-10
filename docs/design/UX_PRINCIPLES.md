# Tinku UX Principles

> These ten principles are the decision-making framework for every design choice in Tinku. When two design options conflict, these principles break the tie. Read this document before designing or implementing any screen.

---

## Principle A — Simplicity First

**Definition:** Every screen has one primary purpose. Users should understand what the page does and what action they can take within three seconds of arriving.

**In practice:**
- Dashboard → understand your money position, then act
- Expenses → see what you've spent, then add more
- Bills → see what's due, then pay or manage it
- Crisis Drill → run a scenario, see your result

**Anti-patterns to avoid:**
- Putting six equal-weight CTAs on one screen
- Combining unrelated tasks on a single page (e.g. editing budgets and viewing history on the same route)
- Writing page titles that describe the feature ("Bill Management System") instead of the user's goal ("Bills — what's due and how to pay")

**Checklist:** Can a new user identify the page's primary action within 3 seconds? If not, simplify.

---

## Principle B — Minimal Cognitive Load

**Definition:** Never overwhelm users with information they don't need right now. Financial data is inherently complex; Tinku's job is to make it feel manageable.

**In practice:**
- Dashboard shows only the balance, key upcoming bills, and 4–6 stat cards — not every transaction
- Budget page shows category bars in priority order (most over-budget first)
- Bill detail page shows the essential action clearly; calculation breakdowns are collapsed by default

**Anti-patterns to avoid:**
- Showing all 30 expenses on the dashboard
- Displaying raw API data or internal IDs to the user
- Using technical labels ("occurrence", "schedule", "mode") in user-visible text
- Nesting critical information in tabs the user is unlikely to find

**Checklist:** How many things does the user need to process to complete their primary task? Can that number be reduced?

---

## Principle C — Familiar Interaction Patterns

**Definition:** Use interaction patterns that Indian users already know from Google Pay, PhonePe, and CRED. Do not reinvent interactions for no reason.

**Familiar patterns to adopt:**
- Bottom navigation bar on mobile (like GPay, PhonePe)
- Card-based list items with a right chevron or action button
- Amount displayed prominently, label above it in smaller text (like GPay transaction cards)
- Pull-to-refresh mental model on activity feeds
- "Pay Now" / "Mark as paid" primary action on bill cards (like how GPay shows due bills)
- FAB (Floating Action Button) for the most frequent action on a screen (like PhonePe's "New" button)
- Green = success / positive, Red = danger / negative (universal financial convention)

**Patterns to avoid:**
- Unusual gestures without discoverability hints
- Multi-step modals for simple confirmations
- Requiring users to navigate to a separate page just to pay one bill

**Checklist:** Has the user likely seen this interaction pattern in a popular Indian financial app? If not, consider a more familiar approach.

---

## Principle D — Recognition Over Recall

**Definition:** Users should not have to remember context from a previous screen to complete a task on the current screen.

**In practice:**
- When confirming a bill payment, show the bill name, amount, and due date — do not make users remember it
- When editing a budget, pre-populate the current limit
- When adding an expense to a bill, show the bill name and amount on the expense form
- Breadcrumbs or back navigation must clearly indicate where the user came from

**Anti-patterns to avoid:**
- "Edit Item #847" (what is 847?)
- Showing only an ID in a toast notification ("Payment #293 processed")
- Requiring users to look up a date in one screen and enter it in another

**Checklist:** If a user loses their short-term memory between two screens, can they still complete their task?

---

## Principle E — Clear Visual Hierarchy

**Definition:** Important information must look important. The user's eye should land on the right thing first, without confusion.

**Hierarchy rules for Tinku:**
1. **Primary amounts** (balance, bill total, budget limit) — largest, boldest, tabular-nums
2. **Page/section headings** — prominent but not competing with amounts
3. **Status labels** (Paid, Upcoming, Overdue) — colored badges, immediately recognizable
4. **Supporting info** (dates, frequencies, notes) — muted text, smaller size
5. **Actions** (Pay Now, Add Expense) — clearly styled as buttons, not ambiguous text links

**Anti-patterns to avoid:**
- Three equally-sized blocks of information with no dominant element
- Making destructive actions (Delete, Cancel AutoPay) the same color as normal actions
- Using muted text for information the user needs to act on immediately

**Checklist:** Cover the page with your hand. What do you remember seeing? Is it the most important information?

---

## Principle F — Consistency

**Definition:** Every screen in Tinku should feel like it comes from the same product. Same spacing, same card pattern, same button styles, same typography, same color meanings.

**What must be consistent:**
- Card structure (border, radius, padding, shadow — always the same)
- Badge colors (green = paid/success, amber = upcoming/warning, red = overdue/danger)
- Primary action placement (always top-right on desktop, bottom of content on mobile)
- Empty states (same illustration style, same message tone)
- Loading skeletons (same shimmer animation, matching the layout they represent)
- Financial number formatting (always INR format: ₹1,23,456.00)
- Section heading structure (h2, `text-base font-bold`, with an optional "View all" link on the right)

**Anti-patterns to avoid:**
- Different card padding on different screens
- Different date formats ("12 Nov", "Nov 12", "12/11/2026") used on the same app
- Primary action is a button on one screen, a link on another

**Checklist:** Would a user recognize this screen as part of Tinku, or does it look like it came from a different product?

---

## Principle G — Trust and Transparency

**Definition:** Financial information and payment actions must be clear, honest, and verifiable. Users should never wonder "wait, what just happened?"

**In practice:**
- Before any payment action, show: bill name, amount, payment method, what will happen
- After any payment, immediately show a success/failure state with the amount and reference
- Never silently fail — if a payment fails, say why (in plain language)
- Balance calculations must be explainable — the dashboard's "how is this calculated?" expandable section is correct UX
- AutoPay rules must be shown in plain language: "Paid automatically on the 5th of every month using UPI"

**Anti-patterns to avoid:**
- "Processing..." spinner with no feedback for 20 seconds
- Deducting from balance without showing what was deducted
- Using vague labels like "charge applied" instead of "₹1,200 paid for Electricity Bill"
- Making AutoPay status unclear (is it active? when does it next run?)

**Checklist:** If a user's parent uses this screen, will they trust what they see?

---

## Principle H — Minimal User Effort

**Definition:** Common tasks should be completable with the fewest possible steps. If a task is performed frequently, it must be fast.

**Most frequent tasks in Tinku:**
1. Add an expense (must be ≤ 3 taps from anywhere)
2. Pay an upcoming bill (must be ≤ 2 taps from the dashboard)
3. Check remaining budget (must be visible on dashboard)
4. See what's due this week (must be on dashboard, above the fold)

**Effort-reducing patterns:**
- FAB (Floating Action Button) for "Add expense" is always visible on mobile
- "Quick Add" button in the sidebar is always visible on desktop
- Bill cards on the dashboard include inline pay/mark-as-paid actions (no navigation required)
- Scan receipt → auto-populate expense form (reduce manual entry)

**Anti-patterns to avoid:**
- Making the user navigate to Expenses → then click Add → then fill in 8 fields to log a coffee purchase
- Requiring separate confirmation steps for low-risk actions (marking a small bill as paid)
- Hiding the balance behind a Settings page

**Checklist:** Count the taps/clicks to complete the most common task. Is it ≤ 3?

---

## Principle I — Progressive Disclosure

**Definition:** Show essential information first. Surface advanced details only when the user asks for them.

**In practice:**
- Dashboard shows summary cards; clicking a card reveals the detail screen
- Bill card shows name, amount, and due date; clicking it reveals payment history, recurrence settings, and notes
- Budget bar shows category and % used; clicking reveals individual expense breakdown
- Crisis Drill shows score and pass/fail; expanding shows the detailed scenario analysis
- Payment confirmation shows amount and status; "View details" reveals the full transaction log

**Advanced features to progressively disclose:**
- Webhook status (Settings → Connections → Advanced)
- AutoPay scheduling rules (AutoPay → Edit → Advanced)
- Balance calculation breakdown (Dashboard → "How is this calculated?" expandable)
- Expense categorization metadata (Expenses → item → Edit)

**Anti-patterns to avoid:**
- Showing every setting on the main view (Settings should have a clear hierarchy)
- Displaying 15 columns in the payment history table by default
- Putting technical details (webhook IDs, event types) in the main UI

**Checklist:** Is there anything on this screen that only 20% of users will ever need? Consider collapsing it.

---

## Principle J — Accessibility

**Definition:** Tinku must be usable by people with visual impairments, motor limitations, and cognitive differences. Accessibility is a requirement, not a bonus.

**Requirements:**
- **Color contrast:** All text must meet WCAG AA (4.5:1 for normal text, 3:1 for large text)
- **Keyboard navigation:** Every interactive element reachable via Tab; logical focus order
- **Touch targets:** Minimum 44×44px for all tappable elements on mobile
- **Screen reader support:** All icons have aria-labels; status badges have text alternatives
- **Financial amounts:** Read as "rupees 1 lakh 23 thousand 456" not just "₹1,23,456"
- **Error messages:** Announced to screen readers via `role="alert"` or `aria-live`
- **Focus rings:** Clearly visible in both light and dark mode (defined in theme)
- **Motion:** Respect `prefers-reduced-motion` for animations and transitions

**Indian-specific considerations:**
- Support for large text scaling (many Indian users use phone accessibility size settings)
- Clear enough layouts to work in bright outdoor sunlight (high contrast mode consideration)

**Checklist:** Can this screen be used with keyboard only? Does it make sense read aloud by a screen reader?

---

## Anti-Pattern Reference

The following patterns must be avoided across all Tinku screens:

| Anti-Pattern | Correct Alternative |
|---|---|
| Blue as the brand color | Lime Green `#5DD62C` is the brand accent |
| Arbitrary padding values | Use 4px-based spacing scale (p-4, p-6, gap-3, etc.) |
| Hardcoded colors in JSX | Use CSS token classes (text-primary, bg-card, etc.) |
| Generic "Admin Dashboard" aesthetic | Financial product aesthetic — clean, trustworthy |
| Info-dense tables as the primary view | Card-based lists with progressive disclosure |
| Cluttered mobile navigation | Bottom nav (5 items max) + "More" drawer |
| Modal for every action | Inline actions where possible; modal only for destructive or complex actions |
| "Error: 500" as error messages | "Something went wrong. Try again." with actionable recovery |
| Unlabeled icon-only buttons | Icon + label (or icon + tooltip + aria-label) |
| Light theme only | Full dark mode support, parity with light theme |

