/** All app dates are local calendar dates stored as 'YYYY-MM-DD'. */

export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function todayISO(): string {
  return toISODate(new Date())
}

export function isISODate(s: unknown): s is string {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(parseISODate(s).getTime())
}

export function addDays(s: string, n: number): string {
  const d = parseISODate(s)
  d.setDate(d.getDate() + n)
  return toISODate(d)
}

export function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate()
}

/** Adds months, clamping the day (31 Jan + 1 month = 28/29 Feb). */
export function addMonths(s: string, n: number): string {
  const d = parseISODate(s)
  const day = d.getDate()
  const target = new Date(d.getFullYear(), d.getMonth() + n, 1)
  target.setDate(Math.min(day, daysInMonth(target.getFullYear(), target.getMonth())))
  return toISODate(target)
}

/** Whole days from a to b (positive when b is later). */
export function diffDays(a: string, b: string): number {
  return Math.round((parseISODate(b).getTime() - parseISODate(a).getTime()) / 86_400_000)
}

/** The given day of month in a month, clamped to the month's length. */
export function dayOfMonth(year: number, monthIndex: number, day: number): string {
  const clamped = Math.min(day, daysInMonth(year, monthIndex))
  return toISODate(new Date(year, monthIndex, clamped))
}

/** The next date (today or later) that falls on the given day of month. */
export function nextDayOfMonth(today: string, day: number): string {
  const t = parseISODate(today)
  const thisMonth = dayOfMonth(t.getFullYear(), t.getMonth(), day)
  if (thisMonth >= today) return thisMonth
  return dayOfMonth(t.getFullYear(), t.getMonth() + 1, day)
}

export function monthKey(s: string): string {
  return s.slice(0, 7)
}

export function shiftMonthKey(key: string, n: number): string {
  return monthKey(addMonths(`${key}-01`, n))
}
