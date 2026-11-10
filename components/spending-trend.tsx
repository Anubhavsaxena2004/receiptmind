'use client'

import { useState } from 'react'
import { compactINR, formatINR } from '@/lib/format'

export interface TrendPoint {
  month: string
  label: string
  total: number
}

function niceStep(max: number): number {
  const rough = max / 4
  const pow = 10 ** Math.floor(Math.log10(Math.max(rough, 1)))
  const n = rough / pow
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow
}

/**
 * Day-to-day spending per month (one series, so no legend: the title names it).
 * Thin bars with rounded data-ends on the baseline, a dashed budget reference line,
 * the latest value labelled directly, and a tooltip on every bar.
 */
export function SpendingTrend({ points, budget }: { points: TrendPoint[]; budget: number }) {
  const [hover, setHover] = useState<number | null>(null)
  const W = 560
  const H = 200
  const pad = { l: 44, r: 12, t: 22, b: 26 }
  const max = Math.max(budget, ...points.map((p) => p.total), 1)
  const step = niceStep(max * 1.08)
  const top = Math.ceil((max * 1.08) / step) * step
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step)
  const plotW = W - pad.l - pad.r
  const plotH = H - pad.t - pad.b
  const slot = plotW / points.length
  const barW = Math.min(36, slot * 0.5)
  const y = (v: number) => pad.t + plotH - (v / top) * plotH
  const r = 4

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Day-to-day spending by month">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeWidth={1} />
            <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" className="fill-muted-foreground text-[11px]">
              {compactINR(t)}
            </text>
          </g>
        ))}
        {budget > 0 && (
          <g>
            <line x1={pad.l} x2={W - pad.r} y1={y(budget)} y2={y(budget)} stroke="var(--muted-foreground)" strokeWidth={1.5} strokeDasharray="5 4" />
            <text x={W - pad.r} y={y(budget) - 6} textAnchor="end" className="fill-muted-foreground text-[11px] font-medium">
              Monthly budget {compactINR(budget)}
            </text>
          </g>
        )}
        {points.map((p, i) => {
          const cx = pad.l + slot * i + slot / 2
          const x = cx - barW / 2
          const yTop = y(p.total)
          const h = pad.t + plotH - yTop
          const rr = Math.min(r, h)
          const last = i === points.length - 1
          return (
            <g key={p.month}>
              {h > 0 && (
                <path
                  d={`M${x},${pad.t + plotH} V${yTop + rr} Q${x},${yTop} ${x + rr},${yTop} H${x + barW - rr} Q${x + barW},${yTop} ${x + barW},${yTop + rr} V${pad.t + plotH} Z`}
                  fill="var(--chart-1)"
                  opacity={hover === null || hover === i ? 1 : 0.55}
                />
              )}
              {last && p.total > 0 && (
                <text x={cx} y={yTop - 6} textAnchor="middle" className="fill-foreground text-[11px] font-semibold">
                  {compactINR(p.total)}
                </text>
              )}
              <text x={cx} y={H - 8} textAnchor="middle" className={last ? 'fill-foreground text-[11px] font-semibold' : 'fill-muted-foreground text-[11px]'}>
                {p.label}
              </text>
              {/* Hit target bigger than the bar */}
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
                aria-label={`${p.label}: ${formatINR(p.total)}`}
              />
            </g>
          )
        })}
      </svg>
      {hover !== null && (
        <div
          className="pointer-events-none absolute z-10 w-44 -translate-x-1/2 rounded-xl border bg-popover px-3 py-2 text-xs shadow-lg"
          style={{ left: `${((pad.l + slot * hover + slot / 2) / W) * 100}%`, top: 0 }}
        >
          <p className="font-semibold">{points[hover].label}</p>
          <p className="mt-0.5 flex justify-between gap-2">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="size-2 rounded-sm bg-[var(--chart-1)]" aria-hidden /> Spent
            </span>
            <span className="font-semibold tabular-nums">{formatINR(points[hover].total)}</span>
          </p>
          {budget > 0 && (
            <p className="mt-0.5 flex justify-between gap-2 text-muted-foreground">
              <span>{points[hover].total > budget ? 'Over budget by' : 'Under budget by'}</span>
              <span className="font-medium tabular-nums">{formatINR(Math.abs(budget - points[hover].total))}</span>
            </p>
          )}
        </div>
      )}
      <table className="sr-only">
        <caption>Day-to-day spending by month</caption>
        <tbody>
          {points.map((p) => (
            <tr key={p.month}>
              <th scope="row">{p.label}</th>
              <td>{formatINR(p.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
