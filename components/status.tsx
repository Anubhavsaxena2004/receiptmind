import {
  Ban,
  Bell,
  CircleCheck,
  CircleX,
  Clock,
  Hand,
  Hourglass,
  LoaderCircle,
  Pause,
  Repeat,
  TriangleAlert,
} from 'lucide-react'
import { Badge, type Tone } from '@/components/ui/badge'
import type { MandateStatus, OccurrenceStatus, PaymentMode, PaymentStatus } from '@/lib/types'

type Icon = React.ComponentType<{ className?: string }>

export const MODE_INFO: Record<PaymentMode, { label: string; short: string; description: string; icon: Icon }> = {
  reminder: {
    label: 'Remind me',
    short: 'Reminder',
    description: 'Tinku reminds you. You pay it yourself, then mark it paid.',
    icon: Bell,
  },
  manual: {
    label: 'Ask before paying',
    short: 'Ask first',
    description: 'On the due date Tinku asks you: pay now, postpone or skip.',
    icon: Hand,
  },
  autopay: {
    label: 'AutoPay',
    short: 'AutoPay',
    description: 'You approve once with a limit. Tinku pays on the due date and tells you.',
    icon: Repeat,
  },
}

export function ModeBadge({ mode }: { mode: PaymentMode }) {
  const info = MODE_INFO[mode]
  return (
    <Badge tone={mode === 'autopay' ? 'primary' : 'neutral'} icon={info.icon}>
      {info.short}
    </Badge>
  )
}

function occurrenceInfo(status: OccurrenceStatus, mode: PaymentMode): { label: string; tone: Tone; icon: Icon } {
  switch (status) {
    case 'upcoming':
      return { label: 'Upcoming', tone: 'neutral', icon: Clock }
    case 'due':
      return {
        label: mode === 'reminder' ? 'Due — pay & mark paid' : mode === 'autopay' ? 'Needs you' : 'Needs approval',
        tone: 'warning',
        icon: TriangleAlert,
      }
    case 'processing':
      return { label: 'Processing', tone: 'primary', icon: LoaderCircle }
    case 'paid':
      return { label: 'Paid', tone: 'success', icon: CircleCheck }
    case 'paid_outside':
      return { label: 'Paid outside app', tone: 'success', icon: CircleCheck }
    case 'skipped':
      return { label: 'Skipped (unpaid)', tone: 'neutral', icon: Ban }
    case 'failed':
      return { label: 'Payment failed', tone: 'danger', icon: CircleX }
  }
}

export function OccurrenceBadge({ status, mode }: { status: OccurrenceStatus; mode: PaymentMode }) {
  const info = occurrenceInfo(status, mode)
  return (
    <Badge tone={info.tone} icon={info.icon}>
      {info.label}
    </Badge>
  )
}

export const PAYMENT_STATUS_INFO: Record<PaymentStatus, { label: string; tone: Tone; icon: Icon }> = {
  created: { label: 'Started', tone: 'neutral', icon: Clock },
  pending: { label: 'Pending', tone: 'warning', icon: Hourglass },
  captured: { label: 'Verified', tone: 'success', icon: CircleCheck },
  failed: { label: 'Failed', tone: 'danger', icon: CircleX },
  cancelled: { label: 'Cancelled', tone: 'neutral', icon: Ban },
  refunded: { label: 'Refunded', tone: 'neutral', icon: Repeat },
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  const info = PAYMENT_STATUS_INFO[status]
  return (
    <Badge tone={info.tone} icon={info.icon}>
      {info.label}
    </Badge>
  )
}

export function MandateBadge({ status }: { status: MandateStatus | 'none' }) {
  if (status === 'active') return <Badge tone="success" icon={CircleCheck}>Active</Badge>
  if (status === 'paused') return <Badge tone="warning" icon={Pause}>Paused</Badge>
  if (status === 'expired') return <Badge tone="danger" icon={TriangleAlert}>Expired</Badge>
  if (status === 'revoked') return <Badge tone="neutral" icon={Ban}>Cancelled</Badge>
  return <Badge tone="warning" icon={TriangleAlert}>Not authorized</Badge>
}
