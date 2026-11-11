'use client'

import { useState } from 'react'
import { compactINR, formatINR } from '@/lib/format'
import { cn } from '@/lib/utils'

export interface TrendPoint {
  month: string
  label: string
  total: number
  dayToDay?: number
  bills?: number
}

function niceStep(max: number): number {
  const rough = max / 4
  const pow = 10 ** Math.floor(Math.log10(Math.max(rough, 1)))
  const n = rough / pow
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow
}

/**
 * Monthly spending bar chart supporting both All Expenses (default, matching /expenses)
 * and Day-to-Day Only (excluding bill payments) with an inline breakdown tooltip.
 */
export function SpendingTrend({
  points,
  budget,
  dayToDayBudget,
}: {
  points: TrendPoint[]
  budget: number
  dayToDayBudget?: number
}) {
  const [hover, setHover] = useState<number | null>(null)
  const [mode, setMode] = useState<'all' | 'dayToDay'>('all')

  const hasBillsSplit = points.some((p) => (p.bills ?? 0) > 0)
  const activePoints = points.map((p) => ({
    ...p,
    value: mode === 'dayToDay' ? (p.dayToDay ?? p.total) : p.total,
  }))
  const activeBudget = mode === 'dayToDay' && dayToDayBudget !== undefined ? dayToDayBudget : budget

  const W = 560
  const H = 200
  const pad = { l: 44, r: 12, t: 22, b: 26 }
  const max = Math.max(activeBudget, ...activePoints.map((p) => p.value), 1)
  const step = niceStep(max * 1.08)
  const top = Math.ceil((max * 1.08) / step) * step
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step)
  const plotW = W - pad.l - pad.r
  const plotH = H - pad.t - pad.b
  const slot = plotW / activePoints.length
  const barW = Math.min(36, slot * 0.5)
  const y = (v: number) => pad.t + plotH - (v / top) * plotH
  const r = 4

  return (
    <div className="space-y-3">
      {hasBillsSplit && (
        <div className="flex items-center justify-end">
          <div className="inline-flex items-center rounded-full border border-border bg-muted/50 p-0.5 text-[11px] font-semibold">
            <button
              type="button"
              onClick={() => setMode('all')}
              aria-pressed={mode === 'all'}
              className={cn(
                'rounded-full px-3 py-1 transition',
                mode === 'all' ? 'bg-primary text-primary-foreground font-bold shadow-2xs' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              All expenses
            </button>
            <button
              type="button"
              onClick={() => setMode('dayToDay')}
              aria-pressed={mode === 'dayToDay'}
              className={cn(
                'rounded-full px-3 py-1 transition',
                mode === 'dayToDay' ? 'bg-primary text-primary-foreground font-bold shadow-2xs' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              Excl. bills
            </button>
          </div>
        </div>
      )}

      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Monthly spending by month">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeWidth={1} />
              <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" className="fill-muted-foreground text-[11px]">
                {compactINR(t)}
              </text>
            </g>
          ))}
          {activeBudget > 0 && (
            <g>
              <line
                x1={pad.l}
                x2={W - pad.r}
                y1={y(activeBudget)}
                y2={y(activeBudget)}
                stroke="var(--muted-foreground)"
                strokeWidth={1.5}
                strokeDasharray="5 4"
              />
              <text x={W - pad.r} y={y(activeBudget) - 6} textAnchor="end" className="fill-muted-foreground text-[11px] font-medium">
                Monthly budget {compactINR(activeBudget)}
              </text>
            </g>
          )}
          {activePoints.map((p, i) => {
            const cx = pad.l + slot * i + slot / 2
            const x = cx - barW / 2
            const yTop = y(p.value)
            const h = pad.t + plotH - yTop
            const rr = Math.min(r, h)
            const last = i === activePoints.length - 1
            return (
              <g key={p.month}>
                {h > 0 && (
                  <path
                    d={`M${x},${pad.t + plotH} V${yTop + rr} Q${x},${yTop} ${x + rr},${yTop} H${x + barW - rr} Q${x + barW},${yTop} ${x + barW},${yTop + rr} V${pad.t + plotH} Z`}
                    fill="var(--chart-1)"
                    opacity={hover === null || hover === i ? 1 : 0.55}
                  />
                )}
                {last && p.value > 0 && (
                  <text x={cx} y={yTop - 6} textAnchor="middle" className="fill-foreground text-[11px] font-semibold">
                    {compactINR(p.value)}
                  </text>
                )}
                <text x={cx} y={H - 8} textAnchor="middle" className={last ? 'fill-foreground text-[11px] font-semibold' : 'fill-muted-foreground text-[11px]'}>
                  {p.label}
                </text>
                <rect
                  x={pad.l + slot * i}
                  y={pad.t}
                  width={slot}
                  height={plotH}
                  fill="transparent"
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                  tabIndex={0}
                  aria-label={`${p.label}: ${formatINR(p.value)}`}
                />
              </g>
            )
          })}
        </svg>
        {hover !== null && (
          <div
            className="pointer-events-none absolute z-10 w-48 -translate-x-1/2 rounded-xl border bg-popover px-3 py-2 text-xs shadow-lg"
            style={{ left: `${((pad.l + slot * hover + slot / 2) / W) * 100}%`, top: 0 }}
          >
            <p className="font-semibold">{activePoints[hover].label}</p>
            <p className="mt-0.5 flex justify-between gap-2">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="size-2 rounded-sm bg-[var(--chart-1)]" aria-hidden /> Spent
              </span>
              <span className="font-semibold tabular-nums">{formatINR(activePoints[hover].value)}</span>
            </p>
            {mode === 'all' && (activePoints[hover].bills ?? 0) > 0 && (
              <div className="mt-1 space-y-0.5 border-t border-border/60 pt-1 text-[11px] text-muted-foreground">
                <p className="flex justify-between gap-2">
                  <span>Day-to-day</span>
                  <span className="tabular-nums text-foreground">{formatINR(activePoints[hover].dayToDay ?? 0)}</span>
                </p>
                <p className="flex justify-between gap-2">
                  <span>Bills</span>
                  <span className="tabular-nums text-foreground">{formatINR(activePoints[hover].bills ?? 0)}</span>
                </p>
              </div>
            )}
            {activeBudget > 0 && (
              <p className="mt-0.5 flex justify-between gap-2 text-muted-foreground">
                <span>{activePoints[hover].value > activeBudget ? 'Over budget by' : 'Under budget by'}</span>
                <span className="font-medium tabular-nums">{formatINR(Math.abs(activeBudget - activePoints[hover].value))}</span>
              </p>
            )}
          </div>
        )}
        <table className="sr-only">
          <caption>Monthly spending by month</caption>
          <tbody>
            {activePoints.map((p) => (
              <tr key={p.month}>
                <th scope="row">{p.label}</th>
                <td>{formatINR(p.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
