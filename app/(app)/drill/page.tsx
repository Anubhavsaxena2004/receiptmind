import type { Metadata } from 'next'
import { DrillClient } from './drill-client'
import { PageHeader } from '@/components/page-header'
import { getData } from '@/lib/data'
import { todayISO } from '@/lib/dates'
import { buildDrillInput } from '@/lib/drill-input'

export const metadata: Metadata = { title: 'Crisis drill' }

export default async function DrillPage() {
  const db = await getData()
  const input = buildDrillInput(db, todayISO())
  return (
    <>
      <PageHeader
        title="Crisis drill"
        description="A fire drill for your money. Pick an emergency and see whether your real bills and budget would survive it — before it ever happens."
      />
      <div data-tour="drill-workspace">
        <DrillClient input={input} pastDrills={db.drills.slice(0, 6)} />
      </div>
    </>
  )
}
