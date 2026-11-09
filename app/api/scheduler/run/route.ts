import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { runScheduler } from '@/lib/scheduler'

/**
 * Daily check for reminders and AutoPay. Point a cron job at it (e.g. a Render
 * Cron Job: curl -X POST -H "Authorization: Bearer $CRON_SECRET" $APP_URL/api/scheduler/run).
 */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'Set CRON_SECRET to enable this endpoint' }, { status: 503 })
  }
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const summary = await runScheduler()
  revalidatePath('/', 'layout')
  return NextResponse.json({ ok: true, summary })
}
