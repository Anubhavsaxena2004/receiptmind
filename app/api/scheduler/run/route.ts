import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { sameHash } from '@/lib/auth/crypto'
import { listUserIds } from '@/lib/auth/accounts'
import { runScheduler, type SchedulerSummary } from '@/lib/scheduler'

/**
 * Daily check for reminders and AutoPay, for every account. Point a cron job at it
 * (e.g. curl -X POST -H "Authorization: Bearer $CRON_SECRET" $APP_URL/api/scheduler/run).
 */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'Set CRON_SECRET to enable this endpoint' }, { status: 503 })
  }
  if (!sameHash(request.headers.get('authorization') ?? '', `Bearer ${secret}`)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const total: Omit<SchedulerSummary, 'ranFor'> & { accounts: number; errors: number } = {
    accounts: 0,
    errors: 0,
    reminders: 0,
    awaitingYou: 0,
    autopayPaid: 0,
    autopayBlocked: 0,
    autopayFailed: 0,
  }
  for (const userId of await listUserIds()) {
    try {
      const s = await runScheduler(userId)
      total.accounts++
      total.reminders += s.reminders
      total.awaitingYou += s.awaitingYou
      total.autopayPaid += s.autopayPaid
      total.autopayBlocked += s.autopayBlocked
      total.autopayFailed += s.autopayFailed
    } catch (err) {
      total.errors++
      console.error('[scheduler]', userId, err)
    }
  }
  revalidatePath('/', 'layout')
  return NextResponse.json({ ok: true, summary: total })
}
