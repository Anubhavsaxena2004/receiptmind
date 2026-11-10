import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { LoginForm } from '@/components/auth/forms'
import { googleConfigured } from '@/lib/auth/google'
import { currentUser, safeNext } from '@/lib/session'

export const metadata: Metadata = { title: 'Log in' }

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams
  const next = safeNext(sp.next)
  if (await currentUser()) redirect(next)
  return (
    <>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Log in to your account</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Let’s continue managing your money wisely.</p>
      </div>
      {sp.error === 'google' && (
        <p role="alert" className="mb-4 rounded-xl bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
          Google sign-in didn’t finish. Try again, or log in with your email.
        </p>
      )}
      <div>
        <LoginForm next={next} google={googleConfigured()} />
      </div>
    </>
  )
}
