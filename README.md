# Tinku — smart expenses & bill payments

Tinku helps one person (or a household budget owner) track what they spend, plan the bills they expect, choose **per bill** how each one gets paid, and rehearse money emergencies before they happen.

- **Track:** add expenses by hand or scan a receipt (Claude reads it, you check it).
- **Plan:** monthly budgets, bills with due dates and repeats.
- **Control:** every bill has its own payment mode: *Remind me*, *Ask before paying*, or *AutoPay* within a limit you approve.
- **Collaborate:** groups for flatmates/family: split costs, see who owes whom, send reminders.
- **Crisis drill** (flagship): a fire drill for your money. Pick an emergency (salary late, medical bill, job loss…) and Tinku simulates your real bills and budgets day by day, shows which bills would bounce, and builds a least-disruptive recovery plan.

📄 **Feature flows, page by page (PDF):** [docs/Tinku-Feature-Flows.pdf](docs/Tinku-Feature-Flows.pdf)

## Pages (one feature per page)

| Page | What you do there |
|---|---|
| **Home** `/` | See what needs you today: approvals, overdue bills, what's coming up |
| **Expenses** `/expenses` | List by month; **Add expense** `/expenses/new` with receipt scan + duplicate check |
| **Budgets** `/budgets` | Monthly limits per category, amber at 80%, red when over |
| **Bills** `/bills` | All bills, soonest first, with Pay now / Postpone / Skip / Mark as paid |
| **AutoPay** `/autopay` | Authorizations with limits; pause, resume, cancel; recent attempts |
| **Payment history** `/history` | Every payment attempt and its verified status (AG Grid) |
| **Crisis drill** `/drill` | Rehearse an emergency, see the recovery plan, save the drill |
| **Groups** `/groups` | Shared expenses, who owes whom, mark paid, remind |
| **Settings** `/settings` | Income, balance, reserve; connection status; demo tools |

## Run it

```bash
pnpm install        # if corepack complains about keys: npx pnpm@12.3.4 install
pnpm dev            # http://localhost:3000
```

No keys are needed. Demo data is created on first load (dated around today) and saved to `data/db.json` (or to Upstash Redis when configured; see Deploy). **Settings → Reset demo** restores it.

Optional keys go in `.env.local`. See [.env.example](.env.example).

## How payments work (and what we do *not* claim)

PayPal India can't take domestic payments and doesn't support INR subscriptions, so:

- **Pay now** runs a real **PayPal Sandbox** checkout when `PAYPAL_CLIENT_ID/SECRET` are set: the order is created on the server, the buyer approves on PayPal, and the server captures and **verifies** the result (status, amount, currency, our payment id). The INR bill is charged as its USD equivalent at a fixed, clearly shown demo rate (₹85 = $1).
- Without keys, a **labelled simulator** stands in for the PayPal approval screen. Same flow, same verification path.
- A bill is marked paid **only** after a verified provider result. Never on a button click or a closed popup.
- Idempotency everywhere: `PayPal-Request-Id` on create/capture, one AutoPay attempt per bill occurrence, webhook events de-duplicated by id, a verified capture is never downgraded.
- Webhooks (`/api/webhooks/paypal`) are signature-verified with PayPal before anything changes.
- Real Indian bill settlement (BBPS partner) and INR recurring mandates are **future scope**, and the app says so where it matters.

### AutoPay rules
On the due date the daily check pays an AutoPay bill only if the authorization is **active**, **not expired**, and the amount is **within the limit**. Otherwise the bill moves to "Needs you" with the reason. Failed charges are **never retried automatically**. *Postpone* and *Skip* change only that one payment, never the whole schedule. AutoPay charges are simulated in this MVP (production would use PayPal Vault on an eligible merchant account).

The daily check runs when the app is opened each day, and via `POST /api/scheduler/run` with `Authorization: Bearer $CRON_SECRET` (for a cron job).

## Crisis drill: how it works
A deterministic day-by-day cash-flow simulation (`lib/rehearsal.ts`) over 30/60/90 days using your balance, salary day, bills and spending budgets. Essential bills are paid first. The recovery plan is built least-disruptive first: emergency reserve → halve flexible spending → pause non-essential bills → ask family/flatmates for the remainder. The rupee maths is plain code, not AI, so it is always exact and explainable.

## 90-second demo for judges
1. **Home:** "Mobile recharge needs approval". Click **Pay now** → review screen (shows INR, USD charge, demo label) → approve → **Payment verified** with a full timeline.
2. **Bills:** show the three payment modes side by side.
3. **AutoPay:** the subscription was paid automatically today. Settings → *Make the next simulated charge fail*, then **Run today's check** to show a failure that stays unpaid and isn't retried.
4. **Crisis drill:** pick *Medical emergency ₹12,000*: "You'd run short by ₹…". Show the bills at risk, then the recovery plan making it pass. Try *Salary 30 days late* to show a bigger plan with a group contribution.
5. **Expenses → Add:** scan a receipt (with `ANTHROPIC_API_KEY`), then save the same expense twice to show duplicate detection.

## Deploy (Vercel)
1. Import the GitHub repo in Vercel (framework: Next.js; defaults are fine).
2. **Add storage:** project → **Storage → Upstash for Redis → Connect** (free tier is enough). Vercel adds `KV_REST_API_URL` and `KV_REST_API_TOKEN`, and Tinku saves its data there. Redeploy after connecting.
3. Optional: add `APP_URL`, PayPal, `ANTHROPIC_API_KEY`, `ZAPIER_WEBHOOK_URL`, `CRON_SECRET` from [.env.example](.env.example).

Without Redis the site still works, but Vercel can't write files: data lives in temporary `/tmp`, can reset, and separate server instances don't share changes. A yellow bar and **Settings → Data storage** say so.

## Deploy (Render)
- **Web service:** build `pnpm install && pnpm build`, start `pnpm start`. Set `APP_URL` and any keys.
- **Data:** Render's disk is temporary. Attach a persistent disk and set `TINKU_DATA_DIR` to it, or swap `lib/db.ts` for Postgres (the rest of the app only calls `readDb()` / `updateDb()`).
- **Cron job:** daily `curl -X POST -H "Authorization: Bearer $CRON_SECRET" $APP_URL/api/scheduler/run`.
- Free instances sleep when idle, so open the app before a live demo.

## Sponsor tools
- **AG Grid** (Community): the Payment history table.
- **Zapier:** set `ZAPIER_WEBHOOK_URL` to a Catch Hook; every notification is forwarded. Zapier only does notifications/logging, never payment decisions.
- **Postman:** good for testing `/api/scheduler/run`, `/api/webhooks/paypal` and the PayPal Sandbox Orders API.
- **Bryntum** is licence-gated (private npm registry), so it isn't installed. The bill timeline on Bills/Home is where a Bryntum Scheduler would slot in.

## Code map
```
app/                 one folder per page; api/ for PayPal return/cancel/webhook, scheduler, receipts
components/          app shell, status badges, buttons, small UI parts
lib/db.ts            data store: Upstash Redis (conflict-checked) or a JSON file
lib/payments.ts      checkout, verification, the single place payment outcomes are applied
lib/paypal.ts        PayPal Orders v2 + webhook verification (server only)
lib/scheduler.ts     daily reminders and AutoPay rules
lib/rehearsal.ts     crisis drill engine + recovery plan
lib/actions/         server actions used by the forms and buttons
```
