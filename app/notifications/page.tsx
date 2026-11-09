import type { Metadata } from 'next'
import Link from 'next/link'
import { Bell, BellRing, CalendarClock, CircleDollarSign, Info, Repeat, ShieldAlert, Users } from 'lucide-react'
import { ActionButton } from '@/components/action-button'
import { EmptyState, Notice } from '@/components/bits'
import { PageHeader } from '@/components/page-header'
import { Card } from '@/components/ui/card'
import { markAllRead } from '@/lib/actions/misc'
import { zapierConfigured } from '@/lib/config'
import { getData } from '@/lib/data'
import { formatDateTime } from '@/lib/format'
import type { NotificationKind } from '@/lib/types'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Notifications' }

const ICON: Record<NotificationKind, React.ComponentType<{ className?: string }>> = {
  reminder: CalendarClock,
  approval: BellRing,
  payment: CircleDollarSign,
  autopay: Repeat,
  drill: ShieldAlert,
  group: Users,
  system: Info,
}

export default async function NotificationsPage() {
  const db = await getData()
  const list = db.notifications
  const unread = list.filter((n) => !n.read).length

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Reminders, approvals and payment results, newest first."
        action={
          unread > 0 ? (
            <ActionButton action={markAllRead} variant="outline">
              Mark all as read
            </ActionButton>
          ) : undefined
        }
      />
      {!zapierConfigured() && (
        <Notice className="mb-5">
          These show inside Tinku. Connect Zapier (see Settings) to also get them by email, WhatsApp or Slack.
        </Notice>
      )}
      {list.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" body="You’ll see reminders and payment results here." />
      ) : (
        <Card className="divide-y">
          {list.map((n) => {
            const Icon = ICON[n.kind]
            return (
              <Link key={n.id} href={n.href ?? '/'} className={cn('flex items-start gap-3 p-4 hover:bg-muted/50', !n.read && 'bg-secondary/30')}>
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                  <Icon className="size-[18px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">
                    {n.title}
                    {!n.read && <span className="sr-only"> (unread)</span>}
                  </p>
                  <p className="text-sm text-muted-foreground">{n.body}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{formatDateTime(n.at)}</span>
              </Link>
            )
          })}
        </Card>
      )}
    </>
  )
}
