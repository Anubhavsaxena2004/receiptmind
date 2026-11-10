import type { Metadata } from 'next'
import Link from 'next/link'
import { Ban, Pause, Play, Plus, Repeat, ShieldCheck } from 'lucide-react'
import { ActionButton } from '@/components/action-button'
import { EmptyState, Notice, SectionTitle } from '@/components/bits'
import { PageHeader } from '@/components/page-header'
import { MandateBadge, OccurrenceBadge, PaymentBadge } from '@/components/status'
import { buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { pauseMandate, resumeMandate, revokeMandate, runSchedulerNow } from '@/lib/actions/autopay'
import { billViews } from '@/lib/bills'
import { getData } from '@/lib/data'
import { todayISO } from '@/lib/dates'
import { dueLabel, formatDate, formatDateTime, formatINR } from '@/lib/format'

export const metadata: Metadata = { title: 'AutoPay' }

const STEPS = [
  ['Approve once', 'You set the most Tinku may charge for a bill, and for how long.'],
  ['Checked on the due date', 'Tinku pays only if the bill is within your limit and AutoPay is active.'],
  ['Verified, then marked paid', 'The bill is marked paid only after the provider confirms.'],
  ['You’re told every time', 'Paid, failed or blocked, you get a notification. Failures are never retried automatically.'],
]

export default async function AutoPayPage({ searchParams }: { searchParams: Promise<{ authorized?: string }> }) {
  const sp = await searchParams
  const db = await getData()
  const today = todayISO()
  const views = billViews(db, today)
  const autopay = views.filter((v) => v.bill.mode === 'autopay')
  const others = views.filter((v) => v.bill.mode !== 'autopay')
  const attempts = db.payments.filter((p) => p.mode === 'autopay').slice(0, 8)

  return (
    <>
      <PageHeader
        title="AutoPay"
        description="Bills Tinku pays for you on the due date, within limits you approved. Pause or cancel anytime."
        action={
          <ActionButton action={runSchedulerNow} variant="outline" size="lg">
            <Repeat /> Run today’s check now
          </ActionButton>
        }
      />
      {sp.authorized && <Notice tone="success" className="mb-5">AutoPay authorized. Tinku will handle it on the next due date.</Notice>}

      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map(([title, body], i) => (
          <div key={title} className="rounded-2xl border bg-card p-4">
            <span className="flex size-7 items-center justify-center rounded-full bg-secondary text-sm font-bold text-secondary-foreground">{i + 1}</span>
            <p className="mt-2 text-sm font-semibold">{title}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{body}</p>
          </div>
        ))}
      </div>

      <SectionTitle>Your AutoPay bills</SectionTitle>
      {autopay.length === 0 ? (
        <EmptyState icon={Repeat} title="No AutoPay yet" body="Turn on AutoPay for a bill below. You stay in control with a limit and can pause anytime." />
      ) : (
        <div className="space-y-3">
          {autopay.map(({ bill, occ, due, mandate }) => (
            <Card key={bill.id} className="p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/bills/${bill.id}`} className="font-semibold hover:underline">
                      {bill.name}
                    </Link>
                    <MandateBadge status={mandate?.status ?? 'none'} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatINR(occ?.amount ?? bill.amount)}
                    {mandate && ` · limit ${formatINR(mandate.maxAmount)} · valid until ${formatDate(mandate.expiresOn)}`}
                  </p>
                  {occ && due && (
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                      <span>
                        Next: <span className="font-medium">{formatDate(due)}</span> ({dueLabel(due, today).toLowerCase()})
                      </span>
                      <OccurrenceBadge status={occ.status} mode={bill.mode} />
                    </div>
                  )}
                  {occ?.note && (occ.status === 'due' || occ.status === 'failed') && (
                    <p className="mt-2 rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground">{occ.note}</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {!mandate || mandate.status === 'expired' ? (
                    <Link href={`/autopay/new?bill=${bill.id}`} className={buttonVariants({ size: 'sm' })}>
                      <ShieldCheck /> {mandate ? 'Re-authorize' : 'Authorize'}
                    </Link>
                  ) : (
                    <>
                      {mandate.status === 'active' ? (
                        <ActionButton action={pauseMandate} fields={{ mandateId: mandate.id }} variant="outline" size="sm">
                          <Pause /> Pause
                        </ActionButton>
                      ) : (
                        <ActionButton action={resumeMandate} fields={{ mandateId: mandate.id }} variant="outline" size="sm">
                          <Play /> Resume
                        </ActionButton>
                      )}
                      <Link href={`/autopay/new?bill=${bill.id}`} className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
                        Change limit
                      </Link>
                    </>
                  )}
                  {mandate && (
                    <ActionButton
                      action={revokeMandate}
                      fields={{ mandateId: mandate.id }}
                      variant="ghost"
                      size="sm"
                      confirm={`Cancel AutoPay for ${bill.name}? Tinku will ask you before paying it instead.`}
                    >
                      <Ban /> Cancel AutoPay
                    </ActionButton>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {others.length > 0 && (
        <Card className="mt-4 flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold">Turn on AutoPay for another bill</p>
            <p className="text-sm text-muted-foreground">Good for fixed amounts like subscriptions and broadband.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {others.slice(0, 4).map(({ bill }) => (
              <Link key={bill.id} href={`/autopay/new?bill=${bill.id}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                <Plus /> {bill.name}
              </Link>
            ))}
          </div>
        </Card>
      )}

      <section className="mt-8">
        <SectionTitle>Recent AutoPay attempts</SectionTitle>
        <Card className="divide-y">
          {attempts.length === 0 && <p className="p-5 text-sm text-muted-foreground">No attempts yet.</p>}
          {attempts.map((p) => (
            <Link key={p.id} href={`/payments/${p.id}`} className="flex items-center justify-between gap-3 p-4 hover:bg-muted/50">
              <div className="min-w-0">
                <p className="truncate font-medium">{p.label}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDateTime(p.createdAt)} · {formatINR(p.amountInr)}
                </p>
              </div>
              <PaymentBadge status={p.status} />
            </Link>
          ))}
        </Card>
      </section>

      <Notice tone="info" className="mt-6" title="About this demo">
        AutoPay charges here are simulated. In production this would use PayPal’s saved payment methods (Vault) for an eligible
        merchant account. PayPal does not support INR subscriptions, so Indian recurring bill payments need a local mandate partner.
      </Notice>
    </>
  )
}
