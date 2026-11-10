# TINKU — UX & UI DESIGN PRINCIPLES
### Product Design Guidelines | Indian Consumer Market

**Product:** Tinku – Smart Expenses & Bill Payments  
**Platform:** Responsive Web Application (Mobile-first)  
**Design Direction:** Minimal, intuitive, trustworthy and action-oriented  
**Primary Audience:** Indian individuals, students, working professionals, families and flatmates.

---

# 1. Product Design Vision

Tinku should feel like a personal financial assistant rather than a traditional banking or accounting application.

The primary objective is to help users understand their financial situation and perform common financial activities with minimal effort.

A user should not need to think too much to understand:
- Where their money is going.
- How much they can spend.
- Which bills are due.
- Whether a payment was successful.
- What they should do next.

### Core UX Philosophy

**Less thinking. Less clicking. More clarity.**

Every screen should answer three questions:

1. Where am I?
2. What information am I looking at?
3. What can I do next?

# 2. Target Audience & Indian User Context

The application should accommodate users with different levels of financial and technical knowledge.

### Primary user groups

| User | Primary needs |
|---|---|
| Students | Track daily expenses and control spending |
| Working professionals | Manage salary, budgets and recurring bills |
| Families | Manage household expenses and payments |
| Flatmates | Split rent, electricity and shared expenses |
| Beginners | Understand their financial situation without complex terminology |

### Indian-market UX considerations

1. **Familiar payment patterns:** Use interaction patterns familiar to users of Google Pay and PhonePe.
2. **INR-first presentation:** Display amounts using Indian currency formatting, such as ₹12,500 rather than ₹12,500.00.
3. **Simple language:** Prefer everyday words over financial jargon.
4. **Mobile-first design:** Most common activities should work comfortably on smaller screens.
5. **Trust and transparency:** Payment amounts, recipients, payment status and authorization must be clear.
6. **Multilingual readiness:** Keep the interface architecture ready for English and Indian-language localization.
7. **Low-friction interaction:** Reduce unnecessary steps, repeated information and complicated forms.

# 3. Core UX Principles

## Principle 1 — Clarity Over Complexity

Every screen should communicate its purpose immediately.

- Use descriptive headings.
- Keep supporting text short.
- Show important information first.
- Avoid unnecessary charts and decorative elements.
- Use clear labels instead of technical terminology.

**Example:**

Instead of:
"Monthly expenditure utilization."

Use:
"Your monthly spending."

Instead of:
"Pending financial obligations."

Use:
"Upcoming bills."

## Principle 2 — Recognition Over Recall

Users should not have to remember information from previous screens.

- Display relevant bill details while paying.
- Show category names and icons.
- Keep recent transactions accessible.
- Show existing budget limits when adding expenses.
- Provide visible payment statuses.

## Principle 3 — Familiarity and Consistency

Follow familiar interaction patterns from Indian digital payment applications.

- Consistent navigation.
- Familiar action icons.
- Standard button placement.
- Predictable form behavior.
- Consistent colors for payment states.

Do not copy another application's identity. Learn from its simplicity and usability.

## Principle 4 — Progressive Disclosure

Show essential information first and additional details when needed.

For example, a bill card should initially show:

- Electricity Bill
- ₹2,000
- Due November 15
- Payment status

Additional information such as authorization limits, payment references and transaction details can appear on opening the bill.

## Principle 5 — Reduce User Effort

Common tasks should require as few meaningful interactions as possible.

Examples:
- Add an expense quickly.
- Scan a receipt instead of manually entering every field.
- Pay a pending bill directly from its card.
- Postpone a bill without recreating it.
- Add a budget without navigating through multiple screens.

## Principle 6 — Trust Before Automation

Financial automation requires user confidence.

For AutoPay:
- Explain exactly what will happen.
- Show the authorized maximum amount.
- Display the payment date.
- Clearly explain the authorization.
- Provide pause and cancellation controls.
- Notify users about payment attempts and outcomes.

Never hide automatic payment behavior behind unclear toggles or ambiguous consent.

## Principle 7 — Immediate Feedback

Every important action must produce understandable feedback.

Examples:
- Expense added successfully.
- Bill postponed until November 20.
- Payment is processing.
- Payment successful.
- Payment failed. No automatic retry was made.

Never show a success state before the server confirms the actual result.

# 4. Recommended Application Navigation

Use a simple and predictable navigation structure.

### Desktop navigation

- Overview
- Expenses
- Budgets
- Bills
- Crisis Drill
- Groups
- History
- Settings

Keep the navigation in a compact sidebar.

### Mobile navigation

Use a bottom navigation bar for the most frequently accessed sections:

1. Home
2. Expenses
3. Bills
4. Budgets
5. More

Place Crisis Drill, Groups, History and Settings inside More.

Keep important actions such as Add Expense accessible without navigating through multiple screens.

# 5. Screen-by-Screen UX Guidelines

## 5.1 Home Dashboard

**Purpose:** Give users an immediate understanding of their financial situation.

Recommended content:

- Greeting and current month.
- Total monthly spending.
- Remaining budget.
- Upcoming bills.
- Recent transactions.
- Budget alerts.
- Quick actions.

Suggested layout:

**Header**
"Good evening!"
"Here's your financial overview."

**Financial overview**
- Total spent: ₹12,500
- Monthly budget: ₹20,000
- Remaining: ₹7,500

**Quick actions**
- Add Expense
- Scan Receipt
- Pay Bill
- View Budgets

**Upcoming bills**
- Electricity — ₹2,000
- Internet — ₹799
- Rent — ₹8,000

**Recent activity**
Display the latest 3–5 transactions with a View All option.

Avoid filling the dashboard with too many charts. One simple spending visualization is sufficient.

## 5.2 Expenses

**Purpose:** Make expense recording quick and effortless.

Provide two primary actions:

- Add Manually
- Scan Receipt

The manual form should contain only essential fields:

- Amount
- Category
- Merchant
- Date
- Optional note

Use sensible defaults and preselected dates.

For AI receipt scanning:
1. Upload or capture a receipt.
2. Show extracted information.
3. Allow the user to review and edit it.
4. Ask for confirmation before saving.

Never silently save incorrect AI-extracted amounts.

Duplicate detection should show a friendly warning rather than a technical error.

## 5.3 Budgets

**Purpose:** Help users understand and control spending.

Use simple progress indicators.

Example:

Food & Groceries  
Spent: ₹3,500 / ₹5,000  
Remaining: ₹1,500

Recommended visual states:

- Neutral: Normal spending.
- Amber: 80% of budget consumed.
- Red: Budget exceeded.

Allow users to:
- Create a budget.
- Edit a budget.
- View category-wise spending.
- Understand overspending.

Avoid making the entire page dependent on complex charts.

## 5.4 Bills

**Purpose:** Make recurring and upcoming payments easy to manage.

This is one of the most important screens in Tinku.

Each bill card should display:

- Bill name.
- Amount.
- Due date.
- Payment status.
- Payment mode.
- Primary action.

Example:

**Electricity Bill**

₹2,000  
Due November 15

AutoPay Enabled

Actions:
- Pay Now
- Manage Bill

For different payment modes, use clear descriptions:

**Remind Me**
"We'll remind you before the due date."

**Ask Before Paying**
"We'll ask for your approval before making the payment."

**AutoPay**
"Payment will be attempted automatically on the due date within your approved limit."

Allow one-time actions:
- Postpone.
- Skip this payment.
- Mark as paid outside Tinku.

Do not confuse one-time postponement with changing the recurring schedule.

## 5.5 AutoPay

**Purpose:** Make automatic payments transparent and trustworthy.

This feature deserves a dedicated, carefully designed experience.

Before enabling AutoPay, show a confirmation screen:

- Bill name.
- Expected amount.
- Maximum authorized amount.
- Payment date or schedule.
- Payment provider.
- What happens if payment fails.
- How to pause or cancel authorization.

Example:

Electricity Bill

Expected amount: ₹2,000  
Maximum authorized amount: ₹2,500  
Payment schedule: Every month, on the 15th.

[Enable AutoPay]

After activation, show a clear authorization status.

Important UX rule:

Never make users assume that a normal PayPal checkout automatically grants recurring payment permission. The actual payment authorization mechanism must support the intended automatic-payment behavior.

## 5.6 Crisis Drill

**Purpose:** Help users prepare for unexpected financial situations.

This feature should feel like a guided financial simulation, not a complicated analytical tool.

Start with:

"What if your salary gets delayed?"

Offer three scenarios:
- Salary delayed by 30 days.
- Unexpected medical expense.
- Temporary job loss.

Allow users to select a scenario and simulation period.

Show:
- Available cash.
- Upcoming expenses.
- Bills at risk.
- Estimated financial shortfall.
- Recommended recovery plan.

Present the recovery plan as a prioritized list.

Use simple language and explain why each recommendation is being made.

Clearly label all results as simulations, not guaranteed financial predictions.

## 5.7 Groups

**Purpose:** Make shared expenses understandable.

Display:
- Group name.
- Total shared expenses.
- Your contribution.
- Who owes whom.
- Pending settlements.

Example:

Flatmates Group

You owe Rahul ₹500.

Rahul owes you ₹300.

Use clear positive and negative balance labels. Avoid relying only on red and green colors.

## 5.8 History

**Purpose:** Provide transparency and confidence in financial activity.

Show:
- Transaction amount.
- Merchant or bill name.
- Date.
- Payment status.
- Payment method.

Use simple filters:
- All
- Successful
- Pending
- Failed
- Refunded

Additional technical information such as PayPal Order ID, Capture ID and reference keys should be available inside transaction details, not displayed prominently in the default view.

# 6. UI Design System

## 6.1 Visual Direction

Recommended design characteristics:

- Minimal and clean.
- Spacious but not wasteful.
- Subtle borders.
- Soft backgrounds.
- Rounded cards.
- Clear typography.
- Limited accent colors.
- Consistent iconography.

Avoid excessive gradients, shadows, decorative illustrations and unnecessary animations.

## 6.2 Suggested Color Palette

| Purpose | Color |
|---|---|
| Primary | #2563EB |
| Background | #F8FAFC |
| Card | #FFFFFF |
| Primary text | #111827 |
| Secondary text | #64748B |
| Success | #16A34A |
| Warning | #F59E0B |
| Danger | #DC2626 |
| Border | #E2E8F0 |

Use the primary color for important actions, not every component.

Status colors must remain consistent throughout the application.

## 6.3 Typography

Recommended fonts:
- Inter
- Manrope
- Plus Jakarta Sans

Suggested hierarchy:

- Page heading: 24–28px
- Section heading: 18–20px
- Card heading: 15–16px
- Body: 14–16px
- Supporting text: 12–14px

Use readable typography and sufficient contrast.

## 6.4 Spacing and Layout

Use a consistent spacing scale based on 4px increments.

Recommended:
- 8px: Small internal gaps.
- 12px: Compact component spacing.
- 16px: Standard padding.
- 24px: Section spacing.
- 32px: Major section separation.

Avoid both cramped layouts and excessive empty space.

## 6.5 Components

Build reusable components:

- Button
- Input
- Select
- Date Picker
- Expense Card
- Bill Card
- Budget Progress
- Transaction Item
- Status Badge
- Confirmation Dialog
- Empty State
- Loading Skeleton
- Toast Notification

Components should maintain consistent behavior across every screen.

# 7. Payment UX and Error Handling

Payment-related interfaces must prioritize clarity and trust.

### Payment confirmation

Before payment, display:
- Bill name.
- Recipient or merchant.
- Exact amount.
- Currency.
- Payment method.

### Payment processing

Show a processing state and prevent accidental duplicate submissions.

### Payment successful

Show:
- Successful status.
- Amount paid.
- Bill name.
- Transaction reference.
- Payment date.

### Payment failed

Show:
- Clear failure message.
- Whether money was captured or not, based on verified transaction status.
- What the user should do next.
- A safe option to retry manually when appropriate.

### Payment pending

Never automatically label an uncertain transaction as failed or successful.

Explain that the payment status is being confirmed.

Provide access to transaction history and support.

# 8. Accessibility and Responsiveness

Follow WCAG 2.2 AA as the accessibility target.

Important requirements:

- Minimum 4.5:1 contrast for normal text.
- Visible keyboard focus.
- Proper form labels.
- Screen-reader-friendly status messages.
- Accessible error descriptions.
- Touch-friendly controls, preferably around 44–48px.
- Responsive layouts for mobile, tablet and desktop.
- Do not communicate statuses using color alone.

Keep the interface usable on smaller screens and slower network connections.

# 9. Microcopy and Content Guidelines

Use short, human-friendly language.

| Avoid | Prefer |
|---|---|
| Expenditure Overview | Your Spending |
| Outstanding Obligations | Upcoming Bills |
| Transaction Failed | Payment Failed |
| Budget Utilization | Budget Used |
| Automated Payment Authorization | Enable AutoPay |
| Financial Recovery Simulation | Crisis Drill |

Use clear action labels:

- Add Expense
- Scan Receipt
- Create Budget
- Pay Now
- Enable AutoPay
- Postpone Bill
- View Details

Avoid vague labels such as Continue, Submit or Proceed when a more descriptive action is possible.

# 10. Recommended User Journey

### First-time user

1. Welcome screen.
2. Simple explanation of Tinku.
3. Account creation and login.
4. Basic financial preferences.
5. Optional budget setup.
6. Optional first bill creation.
7. Dashboard.

Do not force users to configure every feature during onboarding.

### Everyday user

1. Opens Tinku.
2. Checks spending and remaining budget.
3. Adds an expense or scans a receipt.
4. Checks upcoming bills.
5. Pays or manages a bill.
6. Reviews recent activity.

The dashboard should make the next useful action obvious.

# 11. UX Anti-Patterns to Avoid

Do not:

- Overload the dashboard with charts.
- Display too many cards without hierarchy.
- Use technical payment terminology unnecessarily.
- Hide important actions inside multiple menus.
- Make AutoPay activation confusing.
- Show payment success based only on frontend redirects.
- Use too many colors.
- Add unnecessary confirmation dialogs for harmless actions.
- Force users to enter information already available.
- Display technical transaction identifiers on the main dashboard.
- Use ambiguous icons without labels.
- Make users navigate several screens to find an upcoming bill.

# 12. UX Success Metrics

Evaluate the design using measurable usability metrics.

| Metric | What to evaluate |
|---|---|
| Task completion rate | Can users complete common tasks? |
| Time on task | How quickly can users add an expense or pay a bill? |
| Error rate | How often do users make mistakes? |
| Payment confusion | Do users understand payment states? |
| Onboarding completion | Can new users set up the app easily? |
| AutoPay comprehension | Do users understand what they authorize? |
| User satisfaction | Do users find the application easy to use? |

Conduct usability testing with people who have different levels of digital and financial experience.

# 13. Final Design Direction

Tinku should combine the simplicity of familiar Indian payment applications with the clarity of a personal finance management tool.

The interface should prioritize:

1. Simplicity.
2. Familiarity.
3. Financial clarity.
4. Trust and transparency.
5. Minimal user effort.
6. Consistent navigation.
7. Clear payment feedback.
8. Accessible and responsive design.

**The ultimate goal: A user should be able to open Tinku and understand their financial situation within a few seconds, without needing to explore multiple screens.**

---

# Research & Design References

1. Google Pay India — https://pay.google.com/intl/en_in/about/
2. PhonePe — https://www.phonepe.com/
3. UX4G Government Design System — https://www.ux4g.gov.in/
4. Nielsen Norman Group — 10 Usability Heuristics — https://www.nngroup.com/articles/ten-usability-heuristics/
5. Reserve Bank of India — Digital Payment Security Directions — https://www.rbi.org.in/

**Note:** These guidelines are product-design recommendations, not a regulatory compliance certification. Payment authorization, security and regulatory requirements must be validated separately before production deployment.