'use client'

import Link from 'next/link'
import { useActionState, useMemo, useState } from 'react'
import {
  Briefcase,
  Hourglass,
  HeartPulse,
  LoaderCircle,
  Save,
  ShieldCheck,
  TrendingDown,
  TriangleAlert,
  Users,
  Wrench,
} from 'lucide-react'
import { BalanceChart, type ChartSeries } from './balance-chart'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { MoneyInput } from '@/components/ui/input'
import { saveDrill } from '@/lib/actions/misc'
import { formatDate, formatINR } from '@/lib/format'
import {
  NO_PLAN,
  SCENARIOS,
  scenarioLabel,
  simulate,
  suggestPlan,
  type DrillInput,
  type PlanOptions,
  type PlanStep,
  type Scenario,
  type ScenarioKind,
} from '@/lib/rehearsal'
import type { DrillRecord } from '@/lib/types'
import { cn } from '@/lib/utils'

const ICONS: Record<ScenarioKind, React.ComponentType<{ className?: string }>> = {
  salary_delay: Hourglass,
  medical: HeartPulse,
  big_expense: Wrench,
  income_cut: TrendingDown,
  job_loss: Briefcase,
}

function Chips<T extends number>({
  options,
  value,
  onChange,
  format,
  label,
}: {
  options: T[]
  value: T
  onChange: (v: T) => void
  format: (v: T) => string
  label: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          role="radio"
          aria-checked={value === o}
          onClick={() => onChange(o)}
          className={cn(
            'rounded-xl border-2 px-3.5 py-2 text-sm font-semibold transition',
            value === o ? 'border-primary bg-secondary/60 text-secondary-foreground' : 'border-border bg-card hover:border-primary/40',
          )}
        >
          {format(o)}
        </button>
      ))}
    </div>
  )
}

function applyToggles(options: PlanOptions, steps: PlanStep[], off: Set<string>): PlanOptions {
  const on = (k: PlanStep['key']) => steps.some((s) => s.key === k) && !off.has(k)
  return {
    useReserve: on('useReserve') && options.useReserve,
    cutFlexiblePct: on('cutFlexible') ? options.cutFlexiblePct : 0,
    pauseFlexibleBills: on('pauseFlexibleBills') && options.pauseFlexibleBills,
    contribution: on('contribution') ? options.contribution : 0,
  }
}

export function DrillClient({ input, pastDrills }: { input: DrillInput; pastDrills: DrillRecord[] }) {
  const [kind, setKind] = useState<ScenarioKind>('medical')
  const [amount, setAmount] = useState(12000)
  const [days, setDays] = useState(15)
  const [percent, setPercent] = useState(30)
  const [horizon, setHorizon] = useState<30 | 60 | 90>(60)
  const [off, setOff] = useState<Set<string>>(new Set())
  const [saveState, saveAction, saving] = useActionState(saveDrill, {})

  const scenario: Scenario = useMemo(() => ({ kind, amount, days, percent }), [kind, amount, days, percent])
  const base = useMemo(() => simulate(input, scenario, NO_PLAN, horizon), [input, scenario, horizon])
  const plan = useMemo(() => suggestPlan(input, scenario, horizon), [input, scenario, horizon])
  const applied = useMemo(() => applyToggles(plan.options, plan.steps, off), [plan, off])
  const withPlan = useMemo(() => simulate(input, scenario, applied, horizon), [input, scenario, applied, horizon])
  const activeSteps = plan.steps.filter((s) => !off.has(s.key))
  const usingPlan = !base.passed && activeSteps.length > 0
  const shown = usingPlan ? withPlan : base

  const series: ChartSeries[] = usingPlan
    ? [
        { key: 'base', label: 'Without a plan', color: 'var(--chart-2)', points: base.points },
        { key: 'plan', label: 'With recovery plan', color: 'var(--chart-1)', points: withPlan.points },
      ]
    : [{ key: 'base', label: 'Projected balance', color: 'var(--chart-1)', points: base.points }]
  const markers = base.billsAtRisk.map((b) => ({ date: b.date, label: b.name, amount: b.amount }))

  const pickKind = (k: ScenarioKind) => {
    setKind(k)
    setOff(new Set())
  }
  const toggle = (key: string) =>
    setOff((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  const scoreWord = shown.score >= 80 ? 'Strong' : shown.score >= 60 ? 'Okay' : 'Weak'

  return (
    <div className="space-y-6">
      {/* Step 1 */}
      <Card>
        <CardHeader
          title={
            <>
              <span className="mr-2 inline-flex size-6 items-center justify-center rounded-full bg-secondary text-xs text-secondary-foreground">1</span>
              Pick an emergency
            </>
          }
        />
        <CardBody className="space-y-5">
          <div role="radiogroup" aria-label="Emergency" className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {SCENARIOS.map((s) => {
              const Icon = ICONS[s.kind]
              const checked = kind === s.kind
              return (
                <button
                  key={s.kind}
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  onClick={() => pickKind(s.kind)}
                  className={cn(
                    'flex flex-col gap-2 rounded-2xl border-2 p-3.5 text-left transition',
                    checked ? 'border-primary bg-secondary/50' : 'border-border hover:border-primary/40',
                  )}
                >
                  <span className={cn('flex size-8 items-center justify-center rounded-lg', checked ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
                    <Icon className="size-4" />
                  </span>
                  <span className="text-sm font-semibold">{s.title}</span>
                  <span className="hidden text-xs text-muted-foreground sm:block">{s.blurb}</span>
                </button>
              )
            })}
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <p className="mb-2 text-sm font-medium">
                {kind === 'salary_delay' && 'How late?'}
                {(kind === 'medical' || kind === 'big_expense') && 'How much?'}
                {kind === 'income_cut' && 'How much less income?'}
                {kind === 'job_loss' && 'No salary for the whole drill'}
              </p>
              {kind === 'salary_delay' && <Chips label="Delay" options={[7, 15, 30]} value={days as 7 | 15 | 30} onChange={setDays} format={(d) => `${d} days`} />}
              {kind === 'income_cut' && <Chips label="Income drop" options={[20, 30, 50]} value={percent as 20 | 30 | 50} onChange={setPercent} format={(p) => `${p}% less`} />}
              {(kind === 'medical' || kind === 'big_expense') && (
                <div className="space-y-2">
                  <Chips label="Amount" options={[5000, 12000, 25000, 50000]} value={amount as 5000} onChange={setAmount} format={(a) => formatINR(a)} />
                  <div className="max-w-48">
                    <MoneyInput aria-label="Custom amount" value={amount} onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))} />
                  </div>
                </div>
              )}
              {kind === 'job_loss' && <p className="text-sm text-muted-foreground">Tinku assumes no income arrives during the drill.</p>}
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Look ahead</p>
              <Chips label="Look ahead" options={[30, 60, 90] as (30 | 60 | 90)[]} value={horizon} onChange={setHorizon} format={(d) => `${d} days`} />
            </div>
          </div>

          <p className="rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground">
            Using your real numbers: {formatINR(input.balance)} available now, {formatINR(input.reserve)} emergency reserve, salary{' '}
            {formatINR(input.monthlyIncome)} on day {input.salaryDay}, {input.bills.length} bills and your monthly budgets.{' '}
            <Link href="/settings" className="font-semibold text-primary hover:underline">
              Change
            </Link>
          </p>
        </CardBody>
      </Card>

      {/* Step 2: result */}
      <Card>
        <CardHeader
          title={
            <>
              <span className="mr-2 inline-flex size-6 items-center justify-center rounded-full bg-secondary text-xs text-secondary-foreground">2</span>
              What would happen
            </>
          }
          description={scenarioLabel(scenario)}
        />
        <CardBody className="space-y-5">
          <div
            className={cn(
              'flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between',
              base.passed ? 'bg-success-soft' : 'bg-danger-soft',
            )}
          >
            <div className="flex items-start gap-3">
              {base.passed ? (
                <ShieldCheck className="mt-0.5 size-6 shrink-0 text-success" aria-hidden />
              ) : (
                <TriangleAlert className="mt-0.5 size-6 shrink-0 text-danger" aria-hidden />
              )}
              <div>
                <p className="text-lg font-semibold">
                  {base.passed ? 'You’d get through this' : `You’d run short by ${formatINR(base.shortfall)}`}
                </p>
                <p className="text-sm text-foreground/80">
                  {base.passed
                    ? `Lowest balance: ${formatINR(base.lowest.balance)} on ${formatDate(base.lowest.date)}.`
                    : `Money runs out on ${formatDate(base.firstShortDate ?? base.lowest.date)}. ${
                        base.billsAtRisk.length === 0
                          ? 'Your bills get paid, but you’d have nothing left for daily spending.'
                          : `${base.billsAtRisk.length} bill payment${base.billsAtRisk.length === 1 ? '' : 's'} would bounce.`
                      }`}
                </p>
              </div>
            </div>
            <div className="shrink-0 rounded-xl bg-card px-4 py-2 text-center">
              <p className="text-xs font-medium text-muted-foreground">Resilience score</p>
              <p className="text-2xl font-bold">
                {base.score}
                <span className="text-sm font-medium text-muted-foreground">/100</span>
              </p>
            </div>
          </div>

          <BalanceChart series={series} markers={markers} title={`Projected balance for the next ${horizon} days: ${scenarioLabel(scenario)}`} />

          {base.billsAtRisk.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold">Bills that would bounce without a plan</p>
              <ul className="divide-y rounded-xl border">
                {base.billsAtRisk.map((b, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                    <span className="flex items-center gap-2">
                      <span className="font-medium">{b.name}</span>
                      {b.essential && <Badge tone="danger">Essential</Badge>}
                    </span>
                    <span className="text-muted-foreground">
                      {formatDate(b.date)} · <span className="font-semibold text-foreground">{formatINR(b.amount)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Step 3: plan */}
      <Card>
        <CardHeader
          title={
            <>
              <span className="mr-2 inline-flex size-6 items-center justify-center rounded-full bg-secondary text-xs text-secondary-foreground">3</span>
              {base.passed ? 'No recovery plan needed' : 'Tinku’s recovery plan'}
            </>
          }
          description={
            base.passed
              ? 'Your money covers this emergency. Save the drill to track your resilience over time.'
              : 'Least disruptive steps first. Essential bills are never cut. Untick a step to see what changes.'
          }
        />
        <CardBody className="space-y-4">
          {plan.steps.length > 0 && (
            <ul className="space-y-2">
              {plan.steps.map((s, i) => {
                const checked = !off.has(s.key)
                return (
                  <li key={s.key}>
                    <label className={cn('flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition', checked ? 'bg-card' : 'bg-muted/50 opacity-70')}>
                      <input type="checkbox" checked={checked} onChange={() => toggle(s.key)} className="mt-1 size-4 accent-[var(--primary)]" />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-semibold">
                            {i + 1}. {s.title}
                          </span>
                          <span className="text-sm font-semibold">+{formatINR(s.amount)}</span>
                        </span>
                        <span className="block text-sm text-muted-foreground">{s.detail}</span>
                      </span>
                    </label>
                  </li>
                )
              })}
            </ul>
          )}

          {!base.passed && (
            <div className={cn('rounded-2xl p-4 text-sm', withPlan.passed ? 'bg-success-soft' : 'bg-warning-soft')}>
              {withPlan.passed ? (
                <p>
                  <span className="font-semibold">With this plan you get through.</span> Lowest balance {formatINR(withPlan.lowest.balance)} on{' '}
                  {formatDate(withPlan.lowest.date)} · score {withPlan.score}/100.
                </p>
              ) : (
                <p>
                  <span className="font-semibold">Still short by {formatINR(withPlan.shortfall)}.</span> Turn more steps on, or ask for a larger contribution.
                </p>
              )}
            </div>
          )}

          <form action={saveAction} className="flex flex-wrap items-center gap-2 pt-1">
            <input type="hidden" name="scenario" value={JSON.stringify(scenario)} />
            <input type="hidden" name="plan" value={JSON.stringify(usingPlan ? applied : NO_PLAN)} />
            <input type="hidden" name="horizon" value={horizon} />
            <input type="hidden" name="planSteps" value={usingPlan ? activeSteps.map((s) => s.title).join('\n') : ''} />
            <Button type="submit" size="lg" disabled={saving}>
              {saving ? <LoaderCircle className="animate-spin" /> : <Save />} Save this drill
            </Button>
            {activeSteps.some((s) => s.key === 'contribution') && (
              <Link href="/groups" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
                <Users /> Ask your group
              </Link>
            )}
            {saveState.message && <span className="text-sm font-medium text-success">{saveState.message}</span>}
            {saveState.error && <span className="text-sm font-medium text-danger">{saveState.error}</span>}
          </form>
        </CardBody>
      </Card>

      {pastDrills.length > 0 && (
        <Card>
          <CardHeader title="Past drills" description="Run a drill every month to see if you’re getting more resilient." />
          <CardBody className="pt-3">
            <ul className="divide-y">
              {pastDrills.map((d) => (
                <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{d.scenarioLabel}</p>
                    <p className="text-xs text-muted-foreground">
                      {d.horizonDays} days{d.planSteps.length ? ` · with plan: ${d.planSteps.join(', ')}` : ''}
                    </p>
                  </div>
                  <span className="flex items-center gap-2">
                    <Badge tone={d.passed ? 'success' : 'danger'} icon={d.passed ? ShieldCheck : TriangleAlert}>
                      {d.passed ? 'Passed' : `Short ${formatINR(d.shortfall)}`}
                    </Badge>
                    <span className="text-sm font-semibold">{d.score}/100</span>
                  </span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      <p className="text-xs text-muted-foreground">
        How the score works: 80+ is strong (a healthy cushion even at your lowest point), 60–79 is okay, below 60 means you’d run short. This
        drill: {scoreWord.toLowerCase()}. The maths runs on your own data, step by step — nothing is guessed by AI.
      </p>
    </div>
  )
}
