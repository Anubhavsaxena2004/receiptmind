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
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Let’s Go! Sign Up</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Welcome! Please enter your details.</p>
      </div>
      <div>
        <SignupForm next={next} google={googleConfigured()} />
      </div>
    </>
  )
}
