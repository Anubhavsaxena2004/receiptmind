import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Plus, Users } from 'lucide-react'
import { EmptyState } from '@/components/bits'
import { PageHeader } from '@/components/page-header'
import { buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getData } from '@/lib/data'
import { formatINR } from '@/lib/format'
import { groupBalances } from '@/lib/groups'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Groups' }

export default async function GroupsPage() {
  const db = await getData()
  const groups = db.groups.map((g) => {
    const bal = groupBalances(g, db.groupExpenses, db.settlements)
    const you = g.members.find((m) => m.isYou)
    return { g, mine: you ? Math.round(bal[you.id] ?? 0) : 0, count: db.groupExpenses.filter((e) => e.groupId === g.id).length }
  })

  return (
    <>
      <PageHeader
        title="Groups"
        description="Share costs with flatmates, family or friends. Tinku keeps track of who paid and who still owes."
        action={
          <Link href="/groups/new" className={buttonVariants({ size: 'lg' })}>
            <Plus /> New group
          </Link>
        }
      />
      {groups.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No groups yet"
          body="Create one for your flat, family or a trip."
          action={
            <Link href="/groups/new" className={buttonVariants()}>
              <Plus /> New group
            </Link>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {groups.map(({ g, mine, count }) => (
            <Link key={g.id} href={`/groups/${g.id}`} className="group">
              <Card className="h-full p-5 transition group-hover:border-primary/40 group-hover:shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold">{g.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {g.members.map((m) => (m.isYou ? 'You' : m.name)).join(', ')} · {count} shared expenses
                    </p>
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground" aria-hidden />
                </div>
                <p className={cn('mt-4 text-sm font-semibold', mine > 0 ? 'text-success' : mine < 0 ? 'text-danger' : 'text-muted-foreground')}>
                  {mine > 0 ? `You are owed ${formatINR(mine)}` : mine < 0 ? `You owe ${formatINR(-mine)}` : 'All settled up'}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
