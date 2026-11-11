import type { Metadata } from 'next'
import Link from 'next/link'
import { Ban, Pause, Play, Plus, Repeat, ShieldCheck } from 'lucide-react'
import { ActionButton } from '@/components/action-button'
import { Notice } from '@/components/bits'
import { PageHeader } from '@/components/page-header'
import { MandateBadge, OccurrenceBadge, PaymentBadge } from '@/components/status'
import { buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmptyState, SectionHeader } from '@/components/tinku'
import { pauseMandate, resumeMandate, revokeMandate, runSchedulerNow } from '@/lib/actions/autopay'
import { billViews } from '@/lib/bills'
import { getData } from '@/lib/data'
import { todayISO } from '@/lib/dates'
import { dueLabel, formatDate, formatDateTime, formatINR } from '@/lib/format'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'AutoPay' }

const STEPS = [
  ['Approve once', 'You set the most Tinku may charge for a bill, and for how long.'],
  ['Checked on due date', 'Tinku pays only if the bill is within your approved limit.'],
  ['Verified, then paid', 'The bill is marked paid only after the provider confirms.'],
  ['Informed every time', 'Paid, failed or blocked, you receive a notification immediately.'],
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
    <div className="space-y-6">
      <PageHeader
        title="AutoPay"
        description="Bills Tinku pays for you on the due date, within limits you approved. Pause or cancel anytime."
        action={
          <div data-tour="autopay-run-btn" className="inline-flex">
            <ActionButton action={runSchedulerNow} variant="outline" size="lg" className="gap-2 font-semibold shadow-2xs">
              <Repeat className="size-4" /> Run today’s check now
            </ActionButton>
          </div>
        }
      />

      {sp.authorized && <Notice tone="success">AutoPay authorized. Tinku will handle it on the next due date.</Notice>}

      {/* 4 Steps Banner */}
      <div data-tour="autopay-steps" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map(([title, body], i) => (
          <div key={title} className="rounded-2xl border border-border bg-card p-4 shadow-2xs">
            <span className="flex size-7 items-center justify-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground border border-primary/20">
              {i + 1}
            </span>
            <p className="mt-2 text-sm font-bold text-foreground">{title}</p>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{body}</p>
          </div>
        ))}
      </div>

      <div data-tour="autopay-list" className="space-y-4">
        <SectionHeader title="Your AutoPay Bills" count={autopay.length} />

        {autopay.length === 0 ? (
          <EmptyState
            icon={Repeat}
            title="No AutoPay rules active"
            description="Turn on AutoPay for recurring subscriptions, utilities, or broadband. You set a maximum limit and retain full control."
          />
        ) : (
          <div className="space-y-3">
            {autopay.map(({ bill, occ, due, mandate }) => (
              <Card key={bill.id} className="p-5 border-border bg-card shadow-xs">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/bills/${bill.id}`} className="font-bold text-base text-foreground hover:text-primary transition-colors">
                        {bill.name}
                      </Link>
                      <MandateBadge status={mandate?.status ?? 'none'} />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground tabular-nums">{formatINR(occ?.amount ?? bill.amount)}</span>
                      {mandate && ` · approved limit ${formatINR(mandate.maxAmount)} · valid until ${formatDate(mandate.expiresOn)}`}
                    </p>
                    {occ && due && (
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>
                          Next execution: <span className="font-semibold text-foreground">{formatDate(due)}</span> ({dueLabel(due, today).toLowerCase()})
                        </span>
                        <OccurrenceBadge status={occ.status} mode={bill.mode} />
                      </div>
                    )}
                    {occ?.note && (occ.status === 'due' || occ.status === 'failed') && (
                      <p className="mt-2 rounded-xl border border-warning/30 bg-warning-soft px-3 py-2 text-xs font-medium text-warning">
                        {occ.note}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    {!mandate || mandate.status === 'expired' ? (
                      <Link href={`/autopay/new?bill=${bill.id}`} className={cn(buttonVariants({ size: 'sm', variant: 'default' }), 'gap-1.5 font-semibold')}>
                        <ShieldCheck className="size-4" /> {mandate ? 'Re-authorize' : 'Authorize'}
                      </Link>
                    ) : (
                      <>
                        {mandate.status === 'active' ? (
                          <ActionButton action={pauseMandate} fields={{ mandateId: mandate.id }} variant="outline" size="sm" className="gap-1.5 font-semibold">
                            <Pause className="size-3.5" /> Pause
                          </ActionButton>
                        ) : (
                          <ActionButton action={resumeMandate} fields={{ mandateId: mandate.id }} variant="outline" size="sm" className="gap-1.5 font-semibold">
                            <Play className="size-3.5" /> Resume
                          </ActionButton>
                        )}
                        <Link href={`/autopay/new?bill=${bill.id}`} className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'font-semibold text-xs')}>
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
                        className="text-muted-foreground hover:text-danger gap-1.5 font-semibold text-xs"
                      >
                        <Ban className="size-3.5" /> Cancel
                      </ActionButton>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {others.length > 0 && (
        <Card className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between border-border bg-card shadow-2xs">
          <div>
            <p className="font-bold text-sm text-foreground">Turn on AutoPay for another bill</p>
            <p className="text-xs text-muted-foreground mt-0.5">Recommended for predictable recurring amounts like broadband and memberships.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {others.slice(0, 4).map(({ bill }) => (
              <Link key={bill.id} href={`/autopay/new?bill=${bill.id}`} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5 font-semibold')}>
                <Plus className="size-3.5" /> {bill.name}
              </Link>
            ))}
          </div>
        </Card>
      )}

      {/* Recent AutoPay Executions */}
      <section className="space-y-3">
        <SectionHeader title="Recent AutoPay attempts" />
        <Card className="divide-y divide-border border-border bg-card shadow-xs overflow-hidden">
          {attempts.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground text-center">No automated attempts executed yet.</p>
          ) : (
            attempts.map((p) => (
              <Link key={p.id} href={`/payments/${p.id}`} className="flex items-center justify-between gap-3 p-4 hover:bg-muted/40 transition-colors group">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-sm text-foreground group-hover:text-primary transition-colors">{p.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDateTime(p.createdAt)} · <span className="font-medium text-foreground tabular-nums">{formatINR(p.amountInr)}</span>
                  </p>
                </div>
                <PaymentBadge status={p.status} />
              </Link>
            ))
          )}
        </Card>
      </section>

      <Notice tone="info" title="Sandbox Simulation Mode">
        AutoPay charges here are simulated via PayPal Sandbox. In production, this utilizes PayPal Vault tokenized payment methods for automated settlement.
      </Notice>
    </div>
  )
}
