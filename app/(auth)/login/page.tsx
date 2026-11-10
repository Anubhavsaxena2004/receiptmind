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
      <h1 className="text-center text-2xl font-bold tracking-tight">Welcome back</h1>
      <p className="mt-1 text-center text-sm text-muted-foreground">Log in to see your bills, budgets and payments.</p>
      {sp.error === 'google' && (
        <p role="alert" className="mt-4 rounded-xl bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
          Google sign-in didn’t finish. Try again, or log in with your email.
        </p>
      )}
      <div className="mt-6">
        <LoginForm next={next} google={googleConfigured()} />
      </div>
    </>
  )
}
