import { diffDays, parseISODate } from './dates'
import type { Frequency } from './types'

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })

export function formatINR(n: number): string {
  return inr.format(Math.round(n))
}

export function formatUSD(value: string | number): string {
  return `$${Number(value).toFixed(2)}`
}

/** Short money for chart axes: ₹950 · ₹12K · ₹1.2L */
export function compactINR(n: number): string {
  const abs = Math.abs(n)
  const sign = n < 0 ? '−' : ''
  const trim = (x: number) => x.toFixed(x >= 10 ? 0 : 1).replace(/\.0$/, '')
  if (abs >= 100_000) return `${sign}₹${trim(abs / 100_000)}L`
  if (abs >= 1_000) return `${sign}₹${trim(abs / 1_000)}K`
  return `${sign}₹${Math.round(abs)}`
}

const dShort = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' })
const dYear = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
const dLong = new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })
const dMonth = new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' })

export function formatDate(s: string): string {
  return dShort.format(parseISODate(s))
}

export function formatDateYear(s: string): string {
  return dYear.format(parseISODate(s))
}

export function formatDateLong(s: string): string {
  return dLong.format(parseISODate(s))
}

export function formatMonth(key: string): string {
  return dMonth.format(parseISODate(`${key}-01`))
}

/** For ISO timestamps. Use in server components or client-only components (timezone dependent). */
export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso))
}

export function dueLabel(due: string, today: string): string {
  const n = diffDays(today, due)
  if (n === 0) return 'Due today'
  if (n === 1) return 'Due tomorrow'
  if (n > 1) return `Due in ${n} days`
  if (n === -1) return 'Overdue by 1 day'
  return `Overdue by ${-n} days`
}

export const FREQUENCY_LABEL: Record<Frequency, string> = {
  once: 'One time',
  weekly: 'Every week',
  monthly: 'Every month',
  quarterly: 'Every 3 months',
  yearly: 'Every year',
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('')
}
