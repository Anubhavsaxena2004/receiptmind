'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { compactINR, formatDate, formatINR } from '@/lib/format'
import type { DayPoint } from '@/lib/rehearsal'

export interface ChartSeries {
  key: string
  label: string
  /** CSS colour, e.g. var(--chart-1) */
  color: string
  points: DayPoint[]
}

export interface ChartMarker {
  date: string
  label: string
  amount: number
}

const H = 280
const PAD = { top: 16, right: 16, bottom: 30, left: 56 }

function niceStep(range: number, target: number): number {
  const raw = range / target
  const mag = 10 ** Math.floor(Math.log10(raw))
  const n = raw / mag
  return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * mag
}

/** Projected balance per day. Hover/arrow keys move a crosshair; a table view sits below. */
export function BalanceChart({ series, markers, title }: { series: ChartSeries[]; markers: ChartMarker[]; title: string }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(640)
  const [hover, setHover] = useState<number | null>(null)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(280, Math.round(entry.contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const n = series[0]?.points.length ?? 0
  const { yMin, yMax, ticks } = useMemo(() => {
    const values = series.flatMap((s) => s.points.map((p) => p.balance))
    let lo = Math.min(0, ...values)
    let hi = Math.max(0, ...values)
    if (hi === lo) hi = lo + 1000
    const step = niceStep(hi - lo, 5)
    lo = Math.floor(lo / step) * step
    hi = Math.ceil(hi / step) * step
    const t: number[] = []
    for (let v = lo; v <= hi + step / 2; v += step) t.push(v)
    return { yMin: lo, yMax: hi, ticks: t }
  }, [series])

  const innerW = width - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom
  const x = (i: number) => PAD.left + (n <= 1 ? 0 : (i / (n - 1)) * innerW)
  const y = (v: number) => PAD.top + (1 - (v - yMin) / (yMax - yMin)) * innerH
  const indexOfDate = useMemo(() => new Map(series[0]?.points.map((p, i) => [p.date, i]) ?? []), [series])

  const xTicks = useMemo(() => {
    const count = width < 480 ? 3 : 5
    return Array.from({ length: count }, (_, k) => Math.round((k / (count - 1)) * (n - 1)))
  }, [n, width])

  const path = (pts: DayPoint[]) => pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.balance).toFixed(1)}`).join('')

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const px = e.clientX - rect.left
    const i = Math.round(((px - PAD.left) / innerW) * (n - 1))
    setHover(Math.min(n - 1, Math.max(0, i)))
  }

  function onKey(e: React.KeyboardEvent<SVGSVGElement>) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    e.preventDefault()
    setHover((h) => {
      const cur = h ?? 0
      return Math.min(n - 1, Math.max(0, cur + (e.key === 'ArrowRight' ? 1 : -1)))
    })
  }

  const hoverMarkers = hover !== null ? markers.filter((m) => indexOfDate.get(m.date) === hover) : []
  const tipLeft = hover !== null ? Math.min(Math.max(x(hover) + 12, 8), width - 232) : 0

  return (
    <div>
      {series.length > 1 && (
        <ul className="mb-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground" aria-label="Legend">
          {series.map((s) => (
            <li key={s.key} className="flex items-center gap-2">
              <span className="h-0.5 w-5 rounded-full" style={{ background: s.color }} aria-hidden />
              {s.label}
            </li>
          ))}
          {markers.length > 0 && (
            <li className="flex items-center gap-2">
              <span className="size-2.5 rounded-full" style={{ background: 'var(--chart-3)' }} aria-hidden />
              Bill that can’t be paid
            </li>
          )}
        </ul>
      )}
      <div ref={wrapRef} className="relative w-full">
        <svg
          width={width}
          height={H}
          role="img"
          aria-label={title}
          tabIndex={0}
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
          onKeyDown={onKey}
          onBlur={() => setHover(null)}
          className="block touch-pan-y outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
        >
          {/* "Short" zone below ₹0 — a light wash */}
          {yMin < 0 && (
            <rect x={PAD.left} y={y(0)} width={innerW} height={y(yMin) - y(0)} style={{ fill: 'var(--danger-soft)', opacity: 0.45 }} />
          )}
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={PAD.left}
                x2={width - PAD.right}
                y1={y(t)}
                y2={y(t)}
                style={{ stroke: t === 0 ? 'var(--chart-5)' : 'var(--chart-4)', strokeWidth: 1 }}
              />
              <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end" className="fill-muted-foreground text-[11px] tabular-nums">
                {compactINR(t)}
              </text>
            </g>
          ))}
          {xTicks.map((i) => (
            <text
              key={i}
              x={x(i)}
              y={H - 8}
              textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}
              className="fill-muted-foreground text-[11px]"
            >
              {i === 0 ? 'Today' : formatDate(series[0].points[i].date)}
            </text>
          ))}

          {series.map((s) => (
            <path
              key={s.key}
              d={path(s.points)}
              style={{ fill: 'none', stroke: s.color, strokeWidth: 2, strokeLinejoin: 'round', strokeLinecap: 'round' }}
            />
          ))}

          {markers.map((m, k) => {
            const i = indexOfDate.get(m.date)
            if (i === undefined) return null
            // Markers sit on the "without a plan" line.
            const v = (series.find((s) => s.key === 'base') ?? series[0]).points[i]?.balance ?? 0
            return (
              <circle key={k} cx={x(i)} cy={y(v)} r={5} style={{ fill: 'var(--chart-3)', stroke: 'var(--card)', strokeWidth: 2 }} />
            )
          })}

          {hover !== null && (
            <g pointerEvents="none">
              <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + innerH} style={{ stroke: 'var(--muted-foreground)', strokeWidth: 1 }} />
              {series.map((s) => (
                <circle
                  key={s.key}
                  cx={x(hover)}
                  cy={y(s.points[hover].balance)}
                  r={4.5}
                  style={{ fill: s.color, stroke: 'var(--card)', strokeWidth: 2 }}
                />
              ))}
            </g>
          )}
        </svg>

        {hover !== null && (
          <div
            className="pointer-events-none absolute top-2 z-10 w-56 rounded-xl border bg-popover p-3 text-sm shadow-lg"
            style={{ left: tipLeft }}
            role="status"
          >
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">{hover === 0 ? 'Today' : formatDate(series[0].points[hover].date)}</p>
            {series.map((s) => (
              <div key={s.key} className="flex items-center gap-2">
                <span className="h-0.5 w-3 shrink-0 rounded-full" style={{ background: s.color }} aria-hidden />
                <span className="font-semibold tabular-nums">{formatINR(s.points[hover].balance)}</span>
                <span className="truncate text-xs text-muted-foreground">{s.label}</span>
              </div>
            ))}
            {hoverMarkers.map((m, k) => (
              <p key={k} className="mt-1.5 text-xs font-medium text-danger">
                Can’t pay {m.label} ({formatINR(m.amount)})
              </p>
            ))}
          </div>
        )}
      </div>

      <details className="mt-3 text-sm">
        <summary className="cursor-pointer font-medium text-muted-foreground hover:text-foreground">Show as a table</summary>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[320px] text-left tabular-nums">
            <thead>
              <tr className="border-b text-xs text-muted-foreground">
                <th className="py-2 font-medium">Date</th>
                {series.map((s) => (
                  <th key={s.key} className="py-2 text-right font-medium">
                    {s.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {series[0]?.points
                .map((p, i) => ({ p, i }))
                .filter(({ i }) => i % 7 === 0 || i === n - 1)
                .map(({ p, i }) => (
                  <tr key={p.date} className="border-b last:border-0">
                    <td className="py-1.5">{i === 0 ? 'Today' : formatDate(p.date)}</td>
                    {series.map((s) => (
                      <td key={s.key} className="py-1.5 text-right">
                        {formatINR(s.points[i].balance)}
                      </td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  )
}
