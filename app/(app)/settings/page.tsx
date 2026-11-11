import type { Metadata } from 'next'
import Link from 'next/link'
import { CircleCheck, CircleDashed, Database, Eraser, KeyRound, LogIn, MailWarning, ShieldCheck, TriangleAlert } from 'lucide-react'
import { ChangePasswordForm, DeleteAccountForm, ZapierConnect, ZapierConnected } from './account-forms'
import { ProfileForm } from './profile-form'
import { AppearanceSettings } from '@/components/appearance-settings'
import { TourSettingsCard } from '@/components/tour/tour-settings-card'
import { ActionButton } from '@/components/action-button'
import { PageHeader } from '@/components/page-header'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { logoutAction } from '@/lib/actions/auth'
import { eraseMyData, loadSampleData, setDemoFailure } from '@/lib/actions/misc'
import { emailConfigured } from '@/lib/auth/email'
import { googleConfigured } from '@/lib/auth/google'
import { paypalConfigured, paypalWebhookConfigured, receiptScanConfigured, receiptScanProvider } from '@/lib/config'
import { getData } from '@/lib/data'
import { storageKind } from '@/lib/db'
import { formatDateTime } from '@/lib/format'
import { getViewer } from '@/lib/session'
import { cn } from '@/lib/utils'
import { envZapierUrl, zapierPayload } from '@/lib/zapier'

export const metadata: Metadata = { title: 'Settings' }

const TABS = [
  { id: 'profile', label: 'Profile' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'security', label: 'Security' },
  { id: 'connections', label: 'Connections' },
  { id: 'demo', label: 'Demo tools' },
] as const
type Tab = (typeof TABS)[number]['id']

function StatusRow({ name, on, text }: { name: string; on: boolean; text: string }) {
  return (
    <li className="flex items-start gap-3 py-3">
      {on ? (
        <CircleCheck className="mt-0.5 size-5 shrink-0 text-success" aria-hidden />
      ) : (
        <CircleDashed className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
      )}
      <div>
        <p className="text-sm font-semibold">
          {name} <span className="font-normal text-muted-foreground">· {on ? 'On' : 'Not set up'}</span>
        </p>
        <p className="text-sm text-muted-foreground">{text}</p>
      </div>
    </li>
  )
}

function SignUpCard({ title, body }: { title: string; body: string }) {
  return (
    <Card className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{body}</p>
      </div>
      <div className="flex shrink-0 gap-2">
        <Link href="/login?next=/settings" className={buttonVariants({ variant: 'outline' })}>
          <LogIn /> Log in
        </Link>
        <Link href="/signup?next=/settings" className={buttonVariants()}>
          Sign up free
        </Link>
      </div>
    </Card>
  )
}

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab: rawTab } = await searchParams
  const tab: Tab = TABS.some((t) => t.id === rawTab) ? (rawTab as Tab) : 'profile'
  const [db, viewer] = await Promise.all([getData(), getViewer()])
  const user = viewer.kind === 'user' ? viewer.user : null
  const p = db.profile
  const storage = storageKind()
  const envZapier = envZapierUrl()
  const zapier = db.integrations?.zapier ?? (envZapier ? {
    url: envZapier,
    consentAt: new Date().toISOString(),
    log: db.integrations?.zapier?.log ?? [],
  } : undefined)

  return (
    <>
      <PageHeader title="Settings" description="Your money basics, account security, connected services and demo tools." />

      <nav aria-label="Settings sections" className="mb-6 flex gap-1 overflow-x-auto rounded-2xl border bg-card p-1">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`/settings?tab=${t.id}`}
            aria-current={tab === t.id ? 'page' : undefined}
            className={cn(
              'flex-1 rounded-xl px-3 py-2 text-center text-sm font-semibold whitespace-nowrap transition',
              tab === t.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {tab === 'profile' &&
        (user ? (
          <Card>
            <CardHeader
              title="Your money basics"
              description="Home and the Crisis drill use these. Tinku lowers “money available” when you record expenses or pay bills."
            />
            <CardBody>
              <ProfileForm profile={p} />
              <p className="mt-3 text-xs text-muted-foreground">Money available last set {formatDateTime(p.balanceUpdatedAt)}.</p>
            </CardBody>
          </Card>
        ) : (
          <SignUpCard title="Set your own income, balance and salary day" body="You’re viewing the sample household. Your own numbers live in your account." />
        ))}

      {tab === 'appearance' && (
        <div className="space-y-5">
          <Card className="p-6 border-border bg-card shadow-xs">
            <CardHeader
              title="Theme & Interface Appearance"
              description="Customize how Tinku looks on your device. Choose between our high-contrast light theme, deep dark mode, or match your system automatically."
            />
            <div className="mt-4">
              <AppearanceSettings />
            </div>
          </Card>

          <TourSettingsCard />
        </div>
      )}

      {tab === 'security' &&
        (user ? (
          <div className="space-y-5">
            <Card>
              <CardHeader title="Your account" />
              <CardBody>
                <dl className="grid gap-4 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-muted-foreground">Name</dt>
                    <dd className="font-semibold">{user.name}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Email</dt>
                    <dd className="font-semibold break-all">{user.email}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Email status</dt>
                    <dd className={cn('flex items-center gap-1.5 font-semibold', user.verified ? 'text-success' : 'text-warning')}>
                      {user.verified ? <ShieldCheck className="size-4" aria-hidden /> : <MailWarning className="size-4" aria-hidden />}
                      {user.verified
                        ? user.verifiedVia === 'demo-code'
                          ? 'Verified (demo code, email not set up here)'
                          : user.verifiedVia === 'google'
                            ? 'Verified by Google'
                            : 'Verified'
                        : 'Not verified'}
                    </dd>
                    {!user.verified && (
                      <Link href="/verify?next=/settings?tab=security" className="mt-1 inline-block text-sm font-semibold text-primary hover:underline">
                        Verify now
                      </Link>
                    )}
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Sign-in methods</dt>
                    <dd className="font-semibold">{[user.hasPassword && 'Email & password', user.google && 'Google'].filter(Boolean).join(' · ')}</dd>
                  </div>
                </dl>
                <p className="mt-4 text-xs text-muted-foreground">
                  Passwords are stored as scrypt hashes and sessions as hashed tokens in a secure, HTTP-only cookie. Payments and AutoPay also need a
                  verified email, and AutoPay needs your explicit consent for each bill.
                </p>
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                title={user.hasPassword ? 'Change password' : 'Add a password'}
                description={user.hasPassword ? 'You’ll stay signed in here and be signed out everywhere else.' : 'Log in with your email as well as Google.'}
              />
              <CardBody>
                <ChangePasswordForm hasPassword={user.hasPassword} />
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Log out" description="Ends your session on this device." />
              <CardBody>
                <form action={logoutAction}>
                  <button type="submit" className={buttonVariants({ variant: 'outline' })}>
                    Log out
                  </button>
                </form>
              </CardBody>
            </Card>

            <Card className="border-danger/30">
              <CardHeader title="Delete account" description="Erases your login and all your data. This can’t be undone." />
              <CardBody>
                <DeleteAccountForm email={user.email} />
              </CardBody>
            </Card>
          </div>
        ) : (
          <SignUpCard title="Log in to manage your account" body="Password, sign-in methods, email verification and account deletion live here." />
        ))}

      {tab === 'connections' && (
        <div className="space-y-5">
          <Card>
            <CardHeader title="Services" description="Set by the team with environment variables on the server. Secrets never reach the browser." />
            <CardBody className="pt-3">
              <ul className="divide-y">
                <StatusRow
                  name="Data storage"
                  on={storage !== 'temporary'}
                  text={
                    storage === 'redis'
                      ? 'Saved in Upstash Redis: shared by every server and kept between deploys.'
                      : storage === 'file'
                        ? 'Saved to files on this server (data/).'
                        : 'Temporary: this host can’t write files, so data lives in /tmp and can reset. Add Upstash Redis (Vercel → Storage → Upstash for Redis) to keep accounts and data.'
                  }
                />
                <StatusRow
                  name="PayPal Sandbox"
                  on={paypalConfigured()}
                  text={
                    paypalConfigured()
                      ? paypalWebhookConfigured()
                        ? 'Checkout and signature-verified webhooks are on.'
                        : 'Checkout is on. Add PAYPAL_WEBHOOK_ID for webhooks.'
                      : 'Payments use the labelled simulator. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.'
                  }
                />
                <StatusRow
                  name={
                    receiptScanProvider() === 'gemini'
                      ? 'Receipt scanning (Google Gemini - Free)'
                      : receiptScanProvider() === 'openai'
                        ? 'Receipt scanning (OpenAI GPT-4o-mini)'
                        : receiptScanProvider() === 'anthropic'
                          ? 'Receipt scanning (Claude)'
                          : 'Receipt scanning (AI OCR)'
                  }
                  on={receiptScanConfigured()}
                  text={
                    receiptScanConfigured()
                      ? `Active via ${
                          receiptScanProvider() === 'gemini'
                            ? `Google Gemini (${process.env.GEMINI_MODEL || 'gemini-flash-latest'} · Free)`
                            : receiptScanProvider() === 'openai'
                              ? 'OpenAI GPT-4o-mini'
                              : 'Anthropic Claude'
                        }. Photos of receipts are scanned automatically.`
                      : 'Not set up. Add GEMINI_API_KEY (Free at aistudio.google.com), OPENAI_API_KEY, or ANTHROPIC_API_KEY. Manual entry always works.'
                  }
                />
                <StatusRow
                  name="Email (verification & password reset)"
                  on={emailConfigured()}
                  text={emailConfigured() ? 'Codes and reset links are emailed through Resend.' : 'Not set up: verification shows a labelled demo code and password reset is off. Set RESEND_API_KEY and EMAIL_FROM.'}
                />
                <StatusRow
                  name="Google sign-in"
                  on={googleConfigured()}
                  text={googleConfigured() ? '“Continue with Google” is on.' : 'Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to add “Continue with Google”.'}
                />
                <StatusRow
                  name="Zapier webhook"
                  on={Boolean(envZapier || zapier)}
                  text={
                    envZapier
                      ? 'Connected via ZAPIER_WEBHOOK_URL environment variable. Notifications are forwarded automatically to your Zap.'
                      : zapier
                        ? 'Connected to your personal Zapier Catch Hook.'
                        : 'Set ZAPIER_WEBHOOK_URL in environment or connect a hook below.'
                  }
                />
              </ul>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Zapier: send my notifications elsewhere"
              description="Optional. Forward your Tinku notifications to email, WhatsApp, Slack or Google Sheets through your own Zap."
            />
            <CardBody>
              {!user && !envZapier ? (
                <p className="text-sm text-muted-foreground">
                  <Link href="/signup?next=/settings?tab=connections" className="font-semibold text-primary hover:underline">
                    Sign up
                  </Link>{' '}
                  to connect your own Zap. Each person connects their own hook; nobody else’s notifications are ever sent to it.
                </p>
              ) : zapier ? (
                <div className="space-y-4">
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    <CircleCheck className="size-4 text-success" aria-hidden />
                    Connected {envZapier && !db.integrations?.zapier ? '(via Vercel Environment)' : `on ${formatDateTime(zapier.consentAt)}`} ·{' '}
                    <span className="truncate font-mono text-xs">{zapier.url.replace(/\/[^/]+\/?$/, '/•••')}</span>
                  </p>
                  <ZapierConnected fromEnv={Boolean(envZapier && !db.integrations?.zapier)} />
                  <div>
                    <p className="mb-2 text-sm font-semibold">Recent deliveries</p>
                    {zapier.log.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nothing sent yet. Click “Send a test” to verify your Zap.</p>
                    ) : (
                      <ul className="divide-y rounded-xl border">
                        {zapier.log.slice(0, 8).map((l, i) => (
                          <li key={i} className="flex items-start gap-3 px-3 py-2 text-sm">
                            {l.ok ? (
                              <CircleCheck className="mt-0.5 size-4 shrink-0 text-success" aria-label="Delivered" />
                            ) : (
                              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-label="Not delivered" />
                            )}
                            <span className="min-w-0 flex-1">
                              <span className="block truncate font-medium">{l.title}</span>
                              <span className="block text-xs text-muted-foreground">{l.detail}</span>
                            </span>
                            <span className="shrink-0 text-xs text-muted-foreground">{formatDateTime(l.at)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    <p className="mt-2 text-xs text-muted-foreground">Failed deliveries are retried up to 3 times. Tinku keeps working even if Zapier is down.</p>
                  </div>
                </div>
              ) : (
                <ZapierConnect
                  example={JSON.stringify(
                    zapierPayload({ kind: 'reminder', title: 'Electricity bill is due in 2 days', body: '₹2,150 on 12 Nov. Tinku will ask you to approve it.', href: '/bills', at: new Date().toISOString() }),
                    null,
                    2,
                  )}
                />
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {tab === 'demo' &&
        (user ? (
          <Card>
            <CardHeader title="Demo tools" description="For trying every feature, or showing the app to judges." />
            <CardBody className="space-y-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold">Fill my account with sample data</p>
                  <p className="text-sm text-muted-foreground">
                    Replaces everything in your account with example bills, expenses, budgets and a flat-share group, dated around today. Your login
                    and connections stay.
                  </p>
                </div>
                <ActionButton
                  action={loadSampleData}
                  fields={{ confirm: 'yes' }}
                  variant="outline"
                  confirm={{
                    title: 'Replace your data with sample data?',
                    body: 'Everything in your account now (bills, expenses, budgets, groups, payments) is replaced by the sample household.',
                    confirmLabel: 'Load sample data',
                  }}
                >
                  <Database /> Load sample data
                </ActionButton>
              </div>
              <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
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
                  <p className="text-sm font-semibold">Start fresh</p>
                  <p className="text-sm text-muted-foreground">Erases all bills, expenses, budgets, groups and history. Your login and connections stay.</p>
                </div>
                <ActionButton
                  action={eraseMyData}
                  fields={{ confirm: 'yes' }}
                  variant="destructive"
                  confirm={{ title: 'Erase all your data?', body: 'This can’t be undone.', confirmLabel: 'Erase everything' }}
                >
                  <Eraser /> Erase my data
                </ActionButton>
              </div>
            </CardBody>
          </Card>
        ) : (
          <Card className="p-6">
            <div className="flex items-start gap-3">
              <Database className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
              <div>
                <p className="font-semibold">You’re exploring the sample household</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  It’s read-only and shared by every visitor, so nothing you click changes it. Create an account to get your own space; you can
                  fill it with sample data there to try payments, AutoPay and drills.
                </p>
                <Link href="/signup?next=/settings?tab=demo" className={buttonVariants({ className: 'mt-4' })}>
                  <KeyRound /> Create a free account
                </Link>
              </div>
            </div>
          </Card>
        ))}
    </>
  )
}
