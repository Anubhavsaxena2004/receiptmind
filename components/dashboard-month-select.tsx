'use client'

import { ChevronDown } from 'lucide-react'
import { useRouter } from 'next/navigation'

export interface MonthOption {
  value: string
  label: string
}

export function DashboardMonthSelect({
  selectedMonth,
  currentMonth,
  options,
}: {
  selectedMonth: string
  currentMonth: string
  options: MonthOption[]
}) {
  const router = useRouter()

  return (
    <div className="relative inline-flex items-center">
      <select
        aria-label="Select spending month"
        value={selectedMonth}
        onChange={(e) => {
          const next = e.target.value
          router.push(next === currentMonth ? '/' : `/?month=${encodeURIComponent(next)}`, {
            scroll: false,
          })
        }}
        className="appearance-none rounded-full border border-border/70 bg-card pl-3 pr-7 py-1 text-xs font-semibold text-foreground capitalize shadow-2xs cursor-pointer hover:border-primary/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 transition"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-2.5 size-3.5 text-muted-foreground"
      />
    </div>
  )
}

