import { AppShell } from '@/components/app-shell'
import { AuthProvider, type ClientViewer } from '@/components/auth/auth-context'
import { AutoScheduler } from '@/components/auto-scheduler'
import { TourProvider } from '@/components/tour/tour-provider'
import { googleConfigured } from '@/lib/auth/google'
import { paypalConfigured } from '@/lib/config'
import { getData } from '@/lib/data'
import { storageKind } from '@/lib/db'
import { todayISO } from '@/lib/dates'
import { getViewer } from '@/lib/session'

export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [db, viewer] = await Promise.all([getData(), getViewer()])
  const unread = db.notifications.filter((n) => !n.read).length
  const demoLabel = paypalConfigured() ? 'PayPal Sandbox' : 'Demo payments'
  const client: ClientViewer =
    viewer.kind === 'user'
      ? { kind: 'user', name: viewer.user.name, email: viewer.user.email, verified: viewer.user.verified }
      : { kind: 'guest' }
  return (
    <AuthProvider viewer={client} google={googleConfigured()}>
      <TourProvider>
        <AppShell
          unread={unread}
          demoLabel={demoLabel}
          viewer={client}
          sample={viewer.kind === 'user' && Boolean(db.meta.sample)}
          storageWarning={storageKind() === 'temporary'}
        >
          {children}
        </AppShell>
        {viewer.kind === 'user' && <AutoScheduler lastRun={db.meta.lastSchedulerRun} today={todayISO()} />}
      </TourProvider>
    </AuthProvider>
  )
}
