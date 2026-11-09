import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export function PageHeader({
  title,
  description,
  action,
  back,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  back?: { href: string; label: string }
}) {
  return (
    <div className="mb-6">
      {back && (
        <Link
          href={back.href}
          className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden /> {back.label}
        </Link>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight sm:text-[1.7rem]">{title}</h1>
          {description && <p className="mt-1 max-w-2xl text-[0.95rem] text-muted-foreground">{description}</p>}
        </div>
        {action && <div className="flex shrink-0 flex-wrap gap-2">{action}</div>}
      </div>
    </div>
  )
}
