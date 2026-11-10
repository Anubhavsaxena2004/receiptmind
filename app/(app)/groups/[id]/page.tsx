import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { BellRing, CircleCheck } from 'lucide-react'
import { AddSharedExpense } from './add-shared-expense'
import { ActionButton } from '@/components/action-button'
import { SectionTitle } from '@/components/bits'
import { PageHeader } from '@/components/page-header'
import { Card } from '@/components/ui/card'
import { remindMember, settleUp } from '@/lib/actions/misc'
import { getData } from '@/lib/data'
import { formatDate, formatINR, initials } from '@/lib/format'
import { groupBalances, simplifyDebts } from '@/lib/groups'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Group' }

export default async function GroupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = await getData()
  const group = db.groups.find((g) => g.id === id)
  if (!group) notFound()

  const bal = groupBalances(group, db.groupExpenses, db.settlements)
  const debts = simplifyDebts(bal)
  const name = (mid: string) => {
    const m = group.members.find((x) => x.id === mid)
    return m?.isYou ? 'You' : (m?.name ?? 'Someone')
  }
  const expenses = db.groupExpenses.filter((e) => e.groupId === group.id)
  const settlements = db.settlements.filter((s) => s.groupId === group.id).slice(-5).reverse()

  return (
    <>
      <PageHeader
        title={group.name}
        description="Add what someone paid for the group. Tinku works out who owes whom with the fewest payments."
        back={{ href: '/groups', label: 'Groups' }}
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {group.members.map((m) => {
          const v = Math.round(bal[m.id] ?? 0)
          return (
            <div key={m.id} className="flex items-center gap-2 rounded-full border bg-card py-1 pr-3 pl-1">
              <span className="flex size-7 items-center justify-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground">
                {initials(m.name)}
              </span>
              <span className="text-sm font-medium">{m.isYou ? 'You' : m.name}</span>
              <span className={cn('text-xs font-semibold', v > 0 ? 'text-success' : v < 0 ? 'text-danger' : 'text-muted-foreground')}>
                {v > 0 ? `gets ${formatINR(v)}` : v < 0 ? `owes ${formatINR(-v)}` : 'settled'}
              </span>
            </div>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <section>
          <SectionTitle>Who owes whom</SectionTitle>
          <Card className="divide-y">
            {debts.length === 0 ? (
              <div className="flex items-center gap-3 p-5">
                <CircleCheck className="size-5 text-success" aria-hidden />
                <p className="text-sm font-medium">Everyone is settled up.</p>
              </div>
            ) : (
              debts.map((d) => (
                <div key={`${d.from}-${d.to}`} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm">
                    <span className="font-semibold">{name(d.from)}</span> {name(d.from) === 'You' ? 'owe' : 'owes'}{' '}
                    <span className="font-semibold">{name(d.to)}</span> <span className="text-base font-bold">{formatINR(d.amount)}</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <ActionButton action={settleUp} fields={{ groupId: group.id, from: d.from, to: d.to, amount: d.amount }} size="sm" variant="outline">
                      <CircleCheck /> Mark as paid
                    </ActionButton>
                    {name(d.to) === 'You' && (
                      <ActionButton action={remindMember} fields={{ groupId: group.id, memberId: d.from }} size="sm" variant="ghost">
                        <BellRing /> Remind
                      </ActionButton>
                    )}
                  </div>
                </div>
              ))
            )}
          </Card>

          <div className="mt-6">
            <SectionTitle>Shared expenses</SectionTitle>
            <Card className="divide-y">
              {expenses.length === 0 && <p className="p-5 text-sm text-muted-foreground">Nothing added yet.</p>}
              {expenses.map((e) => (
                <div key={e.id} className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{e.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {name(e.paidBy)} paid · split {e.splitAmong.length} ways · {formatDate(e.date)}
                    </p>
                  </div>
                  <span className="font-semibold">{formatINR(e.amount)}</span>
                </div>
              ))}
            </Card>
          </div>

          {settlements.length > 0 && (
            <div className="mt-6">
              <SectionTitle>Recent payments</SectionTitle>
              <Card className="divide-y">
                {settlements.map((s) => (
                  <p key={s.id} className="p-4 text-sm">
                    <span className="font-medium">{name(s.from)}</span> paid <span className="font-medium">{name(s.to)}</span> {formatINR(s.amount)} ·{' '}
                    <span className="text-muted-foreground">{formatDate(s.date)}</span>
                  </p>
                ))}
              </Card>
            </div>
          )}
        </section>

        <section>
          <SectionTitle>Add a shared expense</SectionTitle>
          <AddSharedExpense groupId={group.id} members={group.members.map((m) => ({ id: m.id, name: m.isYou ? 'You' : m.name }))} />
        </section>
      </div>
    </>
  )
}
