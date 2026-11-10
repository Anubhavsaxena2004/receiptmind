import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { SignupForm } from '@/components/auth/forms'
import { googleConfigured } from '@/lib/auth/google'
import { currentUser, safeNext } from '@/lib/session'

export const metadata: Metadata = { title: 'Sign up' }

export default async function SignupPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams
  const next = safeNext(sp.next)
  if (await currentUser()) redirect(next)
  return (
    <>
      <h1 className="text-center text-2xl font-bold tracking-tight">Let’s get you started</h1>
      <p className="mt-1 text-center text-sm text-muted-foreground">Free account. Your data stays yours, separate from the sample.</p>
      <div className="mt-6">
        <SignupForm next={next} google={googleConfigured()} />
      </div>
    </>
  )
}
