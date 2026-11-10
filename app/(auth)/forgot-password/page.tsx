import type { Metadata } from 'next'
import Link from 'next/link'
import { connection } from 'next/server'
import { ForgotForm } from '@/components/auth/flows'
import { emailConfigured } from '@/lib/auth/email'
import { googleConfigured } from '@/lib/auth/google'

export const metadata: Metadata = { title: 'Forgot password' }

export default async function ForgotPasswordPage() {
  // Read email settings per request, not at build time.
  await connection()
  return (
    <>
      <h1 className="text-center text-2xl font-bold tracking-tight">Forgot your password?</h1>
      <p className="mt-1 text-center text-sm text-muted-foreground">Enter your email and we’ll send you a link to set a new one.</p>
      {!emailConfigured() && (
        <p className="mt-4 rounded-xl border border-warning-soft bg-warning-soft/70 p-3 text-sm">
          Email isn’t set up on this deployment yet, so reset links can’t be sent.
          {googleConfigured() ? ' If you signed up with Google, use “Continue with Google” on the login page.' : ''} The team can turn it on by adding
          RESEND_API_KEY and EMAIL_FROM.
        </p>
      )}
      <div className="mt-6">
        <ForgotForm />
      </div>
      <p className="mt-5 text-center text-sm text-muted-foreground">
        Remembered it?{' '}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Log in
        </Link>
      </p>
    </>
  )
}
