import type { Metadata } from 'next'
import Link from 'next/link'
import { ResetForm } from '@/components/auth/flows'

export const metadata: Metadata = { title: 'Set a new password' }

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { token } = await searchParams
  return (
    <>
      <h1 className="text-center text-2xl font-bold tracking-tight">Set a new password</h1>
      <p className="mt-1 text-center text-sm text-muted-foreground">You’ll be signed out everywhere else, then logged in here.</p>
      <div className="mt-6">
        {token ? (
          <ResetForm token={token} />
        ) : (
          <p className="text-center text-sm">
            This link is incomplete.{' '}
            <Link href="/forgot-password" className="font-semibold text-primary hover:underline">
              Ask for a new one
            </Link>
          </p>
        )}
      </div>
    </>
  )
}
