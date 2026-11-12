# Tinku — Smart Expenses & Bill Payments

Tinku helps individuals and households track spending, manage recurring bills with per-bill payment control, scan receipts with AI, unlock guilt-free wishlist goals through agentic commerce, and rehearse financial emergencies before they happen.

📄 **Feature flows, page by page (PDF):** [docs/Tinku-Feature-Flows.pdf](docs/Tinku-Feature-Flows.pdf)

---

## Core Features & Pages

| Page | Route | What it does |
|---|---|---|
| **Home** | `/` | Bento financial pulse: balance, reserve, dynamic monthly Spending ring & breakdown, Earning progress, upcoming bills, recent transactions, 6-month trend, and interactive guided tour |
| **Expenses** | `/expenses` | Monthly expense ledger (list & AG Grid views), search, category filters, and duplicate detection |
| **Add Expense / AI Scan** | `/expenses/new` | Upload a receipt image (`JPG/PNG/WEBP/GIF`) or `PDF` to auto-extract fields via Google Gemini Vision, or enter manually |
| **Budgets** | `/budgets` | Monthly category spending caps with warning (`80%`) and over-budget alerts |
| **Bills** | `/bills` | Bills sorted by due date with per-bill payment modes (*Remind me*, *Ask before paying*, *AutoPay*) and PayPal Sandbox checkout |
| **AutoPay** | `/autopay` | Manage active mandates with spending limits, pause/resume/cancel controls, and execution history |
| **Wishlist (Agentic Commerce)** | `/wishlist` | Tracks goal priorities against real `safeSurplus` (after 14-day bills & emergency reserve) and executes unlocked purchases |
| **Crisis Drill** | `/drill` | Deterministic 30/60/90-day cash-flow stress test with a ranked, least-disruptive recovery plan |
| **Groups** | `/groups` | Split household or flatmate bills, settle balances, and track member shares |
| **Payment History** | `/history` | Full transaction & PayPal checkout audit ledger powered by AG Grid |
| **Settings** | `/settings` | Income, balance, emergency reserve, Light/Dark theme switcher, connection status (`/settings?tab=connections`), and demo reset |
| **Help & About** | `/help`, `/about` | App walkthroughs, architecture guide, and feature documentation |

---

## How PayPal Developer Platform Is Used (Sandbox)

All PayPal requests run strictly server-side against `https://api-m.sandbox.paypal.com` inside [`lib/paypal.ts`](lib/paypal.ts) and [`lib/payments.ts`](lib/payments.ts); `PAYPAL_CLIENT_SECRET` never reaches the browser:

- **OAuth 2.0 Client Credentials (`POST /v1/oauth2/token`):** Exchanges `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` for cached server bearer tokens.
- **PayPal Orders v2 (`POST /v2/checkout/orders`):** Creates `CAPTURE`-intent checkout sessions for bill payments (converting INR to USD at a transparent `1 USD = ₹85` demo rate since PayPal India does not support domestic INR billing). Attaches `PayPal-Request-Id` for idempotency and `<userId>:<paymentId>` as `custom_id`.
- **Server-Side Capture & Verification (`POST /v2/checkout/orders/{id}/capture`, `GET /v2/checkout/orders/{id}`):** On redirect back to `/api/paypal/return`, captures the approved order and verifies capture status (`COMPLETED`/`PENDING`), amount, currency, and `custom_id` before marking any bill occurrence settled.
- **Signature-Verified Webhooks (`POST /v1/notifications/verify-webhook-signature`):** Listens on `POST /api/webhooks/paypal` for `PAYMENT.CAPTURE.*` events, validates PayPal transmission headers against `PAYPAL_WEBHOOK_ID`, deduplicates retries by event ID, and routes updates safely to the payment owner.
- **Built-in Simulator Fallback:** If `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` are omitted locally, Tinku switches to a clearly labelled payment simulator following the exact same verification state machine.
- **Future Production Scope:** Domestic INR bill settlement (BBPS) and Vault-backed live recurring mandates require an eligible merchant production account.

---

## How AI Is Used

- **Multimodal Receipt & Bill OCR (`Google Gemini — gemini-flash-latest`):**
  - Endpoint: `POST /api/receipts/extract` ([`app/api/receipts/extract/route.ts`](app/api/receipts/extract/route.ts)).
  - Accepts images (`JPG`, `PNG`, `WEBP`, `GIF`) and `PDF` files up to 5 MB and calls Google’s `generativelanguage.googleapis.com` `generateContent` endpoint with JSON response mode.
  - Extracts `is_receipt`, `merchant`, `total_amount`, `currency`, `date`, `category`, `confidence`, and `note`, strictly validated with **Zod** (`ReceiptSchema`) before pre-filling the expense form.
  - Supports optional fallback providers (**OpenAI `gpt-4o-mini`** via `OPENAI_API_KEY` and **Anthropic `claude-3-5-sonnet-latest`** via `ANTHROPIC_API_KEY` / `@anthropic-ai/sdk`).
- **Agentic Commerce Decision Engine ([`lib/agentic-commerce.ts`](lib/agentic-commerce.ts)):**
  - Computes real `safeSurplus = max(0, currentBalance - due14DaysTotal - emergencyReserve)` and ranks wishlist goals by unlock status and priority so discretionary purchases only unlock when essential bills and savings remain protected.
- **Deterministic Crisis Rehearsal ([`lib/rehearsal.ts`](lib/rehearsal.ts)):**
  - Uses deterministic rupee math (no LLM hallucination risk) to simulate day-by-day liquidity over 30/60/90 days and construct an explainable recovery sequence.

---

## Tools, Tech Stack & Sponsor Integrations

- **Render (Deployment & Hosting):** Production web service deployment configured via [`render.yaml`](render.yaml) (`pnpm install --frozen-lockfile && pnpm build` → `pnpm start`). Supports persistent disk (`TINKU_DATA_DIR`) or Upstash Redis.
- **Postman (API Collection & Testing):** Repository includes [`postman_collection.json`](postman_collection.json) and [`postman_environment.example.json`](postman_environment.example.json) covering Tinku internal endpoints (`/api/scheduler/run`, `/api/paypal/return`, `/api/webhooks/paypal`, `/api/receipts/extract`) and direct PayPal Sandbox Orders v2 REST requests.
- **AG Grid Community (`ag-grid-react` / `ag-grid-community`):** Interactive data grids for Payment History (`/history`) and Expenses Grid view (`/expenses?view=grid`).
- **Zapier (`ZAPIER_WEBHOOK_URL`):** Forwards notifications (bill reminders, verified payments, budget alerts) to a Zapier Catch Hook for downstream email/Slack/WhatsApp workflows.
- **Upstash Redis (`UPSTASH_REDIS_REST_URL` / `KV_REST_API_URL`):** Multi-instance cloud persistence with optimistic concurrency checks and local JSON fallback (`data/db.json`) for single-node local runs.
- **Frontend & Backend Framework:** Next.js `16.3.3` (App Router + Server Actions), React `19`, TypeScript `5.7`, Tailwind CSS `v4`, `@base-ui/react`, `next-themes`, `lucide-react`, `zod`.

---

## Local Setup Instructions

### Prerequisites
- **Node.js 20+** and **pnpm 12+** (`corepack enable` or `npx pnpm@12.3.4`)

### Steps
1. **Clone the repository and install dependencies:**
   ```bash
   git clone https://github.com/Anubhavsaxena2004/receiptmind.git
   cd receiptmind
   pnpm install
   ```
2. **Configure environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   Fill in any integrations you want active (all optional — the app works with zero keys in demo/simulator mode):
   - **PayPal Sandbox:** `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`, `PAYPAL_API_BASE=https://api-m.sandbox.paypal.com`
   - **AI Receipt Scanning:** `GEMINI_API_KEY` and `GEMINI_MODEL=gemini-flash-latest` (or `OPENAI_API_KEY` / `ANTHROPIC_API_KEY`)
   - **Storage (optional for local):** `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (defaults to local `./data/db.json`)
   - **Optional Integrations:** `APP_URL=http://localhost:3000`, `ZAPIER_WEBHOOK_URL`, `CRON_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`

3. **Run the development server:**
   ```bash
   pnpm dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

4. **Run automated payment flow tests:**
   ```bash
   pnpm test
   ```

---

## Deploying on Render

Tinku is deployed using **Render**. You can deploy your own instance via **Render Blueprint** ([`render.yaml`](render.yaml)) or manually as a **Render Web Service**:

1. **Connect Repository:** Push/fork this repo on GitHub and create a new **Web Service** (or **Blueprint** using `render.yaml`) in the Render Dashboard.
2. **Build & Start Commands:**
   - **Build Command:** `pnpm install --frozen-lockfile && pnpm build`
   - **Start Command:** `pnpm start`
   - **Health Check Path:** `/`
3. **Environment Variables:** Add the variables from `.env.example` in **Render → Environment**:
   - Set `APP_URL` to your Render service URL (`https://<your-app>.onrender.com`) so PayPal Sandbox return URLs work cleanly.
   - Add `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`, and `GEMINI_API_KEY` (`GEMINI_MODEL=gemini-flash-latest`).
4. **Persistent Storage (Recommended on Render):**
   - Attach an **Upstash Redis** instance (`UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`) **or** mount a Render Persistent Disk and set `TINKU_DATA_DIR=/var/data` (otherwise Render's ephemeral disk resets between deploys/restarts).
5. **Optional Daily Cron Job:**
   - Create a Render Cron Job calling:
     ```bash
     curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://<your-app>.onrender.com/api/scheduler/run
     ```
   - *(Note: Free Render instances spin down after idle periods; load `/` once to wake the container before live demos.)*

---

## Quick Demo Guide (for Reviewers & Judges)

1. **Guest Mode / Instant Sign Up:** Explore `/` immediately in sample mode, or sign up at `/signup` with any test email — `/verify` displays the 6-digit demo verification code directly on screen when `RESEND_API_KEY` is unset. Click **"Or try with sample data"** to populate realistic household records.
2. **AI Receipt Scan:** Go to `/expenses/new`, upload any receipt image or PDF, and review Gemini’s extracted merchant, amount, date, and budget category.
3. **PayPal Sandbox Checkout:** On `/bills`, click **Pay with PayPal** on any due bill, sign in with a PayPal Sandbox Personal (Buyer) account, approve checkout, and confirm server-verified capture on `/payments/[id]`.
4. **Wishlist & Crisis Drill:** Add a goal in `/wishlist` to inspect live surplus unlock eligibility, then run an emergency shock simulation in `/drill`.
5. **Connection Check:** Visit `/settings?tab=connections` to verify active PayPal Sandbox, webhook, and Gemini configurations.

---

## Code Map

```text
app/                 Next.js App Router pages & API routes (/api/paypal/*, /api/webhooks/paypal, /api/receipts/extract, /api/scheduler/run)
components/          Shared UI components, AppShell, interactive TourProvider, AG Grid views, chart components
lib/db.ts            Persistence layer (Upstash Redis with concurrency protection or local JSON file store)
lib/paypal.ts        Server-side PayPal Sandbox OAuth2, Orders v2 & webhook signature verification client
lib/payments.ts      Idempotent payment creation, server-side capture verification, and bill settlement
lib/agentic-commerce.ts  Wishlist safe-surplus & purchase recommendation engine
lib/rehearsal.ts     Deterministic 30/60/90-day Crisis Drill & recovery plan simulator
lib/scheduler.ts     Daily reminder & rule-governed AutoPay runner
lib/actions/         Next.js Server Actions for bills, expenses, budgets, wishlist, groups & auth
render.yaml          Render Web Service deployment blueprint
postman_collection.json  Postman collection for internal APIs & PayPal Sandbox endpoints
```

---

## License

This project is open source and licensed under the **MIT License** (OSI-approved). See [`LICENSE`](LICENSE) for full details.
