import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { FlaskConical, ShieldCheck } from 'lucide-react'
import { MailBadge, ResendButton, VerifyForm } from '@/components/auth/flows'
import { buttonVariants } from '@/components/ui/button'
import { demoCodeFor } from '@/lib/auth/accounts'
import { emailConfigured } from '@/lib/auth/email'
import { currentUser, safeNext } from '@/lib/session'

export const metadata: Metadata = { title: 'Verify your email' }

export default async function VerifyPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams
  const next = safeNext(sp.next)
  const user = await currentUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(`/verify?next=${next}`)}`)

  if (user.emailVerifiedAt) {
    return (
      <div className="text-center">
        <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-success-soft text-success">
          <ShieldCheck className="size-8" aria-hidden />
        </span>
        <h1 className="mt-5 text-2xl font-bold tracking-tight">Your email is verified</h1>
        <p className="mt-2 text-sm text-muted-foreground">Payments and AutoPay are available for {user.email}.</p>
        <Link href={next} className={buttonVariants({ size: 'lg', className: 'mt-6 w-full' })}>
          Continue
        </Link>
      </div>
    )
  }

  const demoCode = emailConfigured() ? null : await demoCodeFor(user.id)
  return (
    <>
      <MailBadge />
      <div className="text-center mt-4 mb-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Enter verification code</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
          We just emailed you. Please enter the 6-digit code sent to <span className="font-semibold text-foreground">{user.email}</span>.
        </p>
      </div>
      {!emailConfigured() && (
        <div className="mt-4 flex gap-2.5 rounded-2xl border border-warning-soft bg-warning-soft/70 p-3.5 text-sm">
          <FlaskConical className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
          <p>
            <span className="font-semibold">Demo:</span> this deployment can’t send email yet, so your code is shown here
            {demoCode ? (
              <>
                : <span className="font-mono text-base font-bold tracking-widest text-foreground">{demoCode}</span>
              </>
            ) : (
              '. Send a new code to see it.'
            )}
          </p>
        </div>
      )}
      <div className="mt-5">
        <VerifyForm next={next} />
      </div>
      <p className="mt-5 text-center text-sm text-muted-foreground">
        Didn’t get the code? <ResendButton /> ·{' '}
        <Link href={next} className="font-medium hover:text-foreground">
          Do this later
        </Link>
      </p>
    </>
  )
}
