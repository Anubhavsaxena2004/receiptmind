import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { AppShell } from '@/components/app-shell'
import { AutoScheduler } from '@/components/auto-scheduler'
import { paypalConfigured } from '@/lib/config'
import { getData } from '@/lib/data'
import { storageKind } from '@/lib/db'
import { todayISO } from '@/lib/dates'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'Tinku · Smart expenses & bill payments', template: '%s · Tinku' },
  description: 'Track expenses, plan bills, choose how each bill is paid, and rehearse money emergencies before they happen.',
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f6f8fc' },
    { media: '(prefers-color-scheme: dark)', color: '#0c111d' },
  ],
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const db = await getData()
  const unread = db.notifications.filter((n) => !n.read).length
  const demoLabel = paypalConfigured() ? 'PayPal Sandbox' : 'Demo payments'
  return (
    <html lang="en-IN">
      <body className="antialiased">
        <AppShell unread={unread} demoLabel={demoLabel} storageWarning={storageKind() === 'temporary'}>
          {children}
        </AppShell>
        <AutoScheduler lastRun={db.meta.lastSchedulerRun} today={todayISO()} />
        {/* Vercel Analytics only works when hosted on Vercel (it 404s elsewhere, e.g. Render). */}
        {process.env.VERCEL && <Analytics />}
      </body>
    </html>
  )
}
