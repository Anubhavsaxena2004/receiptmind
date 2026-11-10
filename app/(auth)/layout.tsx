import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

/** Sign-in screens: one centred card, no app chrome, a clear way back to the sample. */
export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-dvh flex-col bg-[radial-gradient(ellipse_at_top,var(--secondary),transparent_60%)]">
      <main className="flex flex-1 items-start justify-center px-4 pt-10 pb-12 sm:items-center sm:pt-12">
        <div className="w-full max-w-[25rem]">
          <Link href="/" className="mx-auto mb-6 flex w-fit items-center gap-2.5 group" aria-label="Tinku home">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-2xl font-black text-primary-foreground shadow-sm shadow-primary/25 transition-transform group-hover:scale-105">
              T
            </span>
            <span className="text-xl font-bold tracking-tight">Tinku</span>
          </Link>
          <div className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">{children}</div>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link href="/" className="inline-flex items-center gap-1 font-medium hover:text-foreground">
              Explore the sample household first <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
