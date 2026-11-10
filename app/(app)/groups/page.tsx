import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Plus, Users } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/tinku'
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
    return { g, mine: Math.round(you ? bal[you.id] ?? 0 : 0), count: db.groupExpenses.filter((e) => e.groupId === g.id).length }
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Groups"
        description="Split household and travel costs with flatmates, family, or friends. Tinku maintains a transparent settlement ledger."
        action={
          <Link href="/groups/new" className={cn(buttonVariants({ size: 'lg', variant: 'default' }), 'gap-1.5 font-semibold shadow-sm')}>
            <Plus className="size-4 stroke-[2.5]" /> New group
          </Link>
        }
      />

      {groups.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No shared groups yet"
          description="Create a group for your apartment, family groceries, or a holiday trip to split expenses and track who owes whom."
          action={{
            label: 'Create group',
            href: '/groups/new',
          }}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {groups.map(({ g, mine, count }) => (
            <Link key={g.id} href={`/groups/${g.id}`} className="group outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-2xl">
              <Card className="h-full p-5 border-border bg-card shadow-xs transition-all hover:border-primary/40 hover:shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-bold text-foreground group-hover:text-primary transition-colors truncate">
                      {g.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {g.members.map((m) => (m.isYou ? 'You' : m.name)).join(', ')} · {count} expense{count === 1 ? '' : 's'}
                    </p>
                  </div>
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:text-foreground group-hover:bg-muted/80 transition-colors">
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </span>
                </div>

                <div className="mt-5 pt-3 border-t border-border/60 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Your net position:</span>
                  <span
                    className={cn(
                      'text-sm font-bold tabular-nums',
                      mine > 0 ? 'text-success' : mine < 0 ? 'text-danger' : 'text-muted-foreground',
                    )}
                  >
                    {mine > 0 ? `+${formatINR(mine)} (owed to you)` : mine < 0 ? `−${formatINR(-mine)} (you owe)` : 'All settled up'}
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
