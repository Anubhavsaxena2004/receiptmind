import type { Metadata } from 'next'
import { CircleCheck, CircleDashed, RotateCcw } from 'lucide-react'
import { ProfileForm } from './profile-form'
import { ActionButton } from '@/components/action-button'
import { PageHeader } from '@/components/page-header'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { resetDemo, setDemoFailure } from '@/lib/actions/misc'
import { paypalConfigured, paypalWebhookConfigured, receiptScanConfigured, zapierConfigured } from '@/lib/config'
import { getData } from '@/lib/data'
import { formatDateTime } from '@/lib/format'

export const metadata: Metadata = { title: 'Settings' }

export default async function SettingsPage() {
  const db = await getData()
  const p = db.profile

  const connections = [
    {
      name: 'PayPal Sandbox',
      on: paypalConfigured(),
      onText: paypalWebhookConfigured() ? 'Checkout and verified webhooks are on.' : 'Checkout is on. Add PAYPAL_WEBHOOK_ID for webhooks.',
      offText: 'Not connected — payments use the labelled simulator. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.',
    },
    {
      name: 'Receipt scanning (Claude)',
      on: receiptScanConfigured(),
      onText: 'Photos of receipts are read automatically. You always check before saving.',
      offText: 'Set ANTHROPIC_API_KEY to read receipts automatically. Manual entry always works.',
    },
    {
      name: 'Zapier notifications',
      on: zapierConfigured(),
      onText: 'Every notification is also sent to your Zap (email, WhatsApp, Slack, Sheets…).',
      offText: 'Set ZAPIER_WEBHOOK_URL to a Zapier “Catch Hook” to send notifications outside the app.',
    },
  ]

  return (
    <>
      <PageHeader title="Settings" description="Your money basics, connected services and demo tools." />

      <Card>
        <CardHeader
          title="Your money basics"
          description="The Crisis drill and plans use these. Tinku lowers “money available” when you record expenses or pay bills."
        />
        <CardBody>
          <ProfileForm profile={p} />
          <p className="mt-3 text-xs text-muted-foreground">Money available last set {formatDateTime(p.balanceUpdatedAt)}.</p>
        </CardBody>
      </Card>

      <Card className="mt-5">
        <CardHeader title="Connections" description="Configured with environment variables on the server. Secrets never reach the browser." />
        <CardBody className="pt-3">
          <ul className="divide-y">
            {connections.map((c) => (
              <li key={c.name} className="flex items-start gap-3 py-3">
                {c.on ? (
                  <CircleCheck className="mt-0.5 size-5 shrink-0 text-success" aria-hidden />
                ) : (
                  <CircleDashed className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
                )}
                <div>
                  <p className="text-sm font-semibold">
                    {c.name} <span className="font-normal text-muted-foreground">· {c.on ? 'Connected' : 'Not connected'}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">{c.on ? c.onText : c.offText}</p>
                </div>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>

      <Card className="mt-5">
        <CardHeader title="Demo tools" description="For showing the app to judges." />
        <CardBody className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold">Make the next simulated charge fail</p>
              <p className="text-sm text-muted-foreground">
                Shows how Tinku handles a failed payment: the bill stays unpaid and nothing is retried automatically.{' '}
                <span className="font-medium text-foreground">Now: {p.demoFailNextCharge ? 'ON' : 'off'}</span>
              </p>
            </div>
            <ActionButton action={setDemoFailure} fields={{ on: p.demoFailNextCharge ? '0' : '1' }} variant="outline">
              {p.demoFailNextCharge ? 'Turn off' : 'Turn on'}
            </ActionButton>
          </div>
          <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold">Reset demo data</p>
              <p className="text-sm text-muted-foreground">Restores the sample bills, expenses and group, dated around today.</p>
            </div>
            <ActionButton action={resetDemo} variant="destructive" confirm="Reset all data to the demo sample? Your changes will be lost.">
              <RotateCcw /> Reset demo
            </ActionButton>
          </div>
        </CardBody>
      </Card>
    </>
  )
}
