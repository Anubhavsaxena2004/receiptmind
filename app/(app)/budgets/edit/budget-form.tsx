'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { LoaderCircle } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { MoneyInput } from '@/components/ui/input'
import { saveBudgets } from '@/lib/actions/expenses'
import { CATEGORIES } from '@/lib/categories'
import { useGuardedSubmit } from '@/components/auth/auth-context'

export function BudgetForm({ limits }: { limits: Record<string, number> }) {
  const [state, formAction, pending] = useActionState(saveBudgets, {})
  const onSubmit = useGuardedSubmit(formAction, { mode: 'resume', reason: 'Create a free account (or log in) to save these budgets to your own account.' })
  return (
    <form onSubmit={onSubmit}>
      <Card className="divide-y">
        {(['Essential', 'Flexible'] as const).map((group) => (
          <div key={group} className="p-5">
            <p className="mb-3 text-sm font-semibold text-muted-foreground">
              {group === 'Essential' ? 'Essential — protected in emergencies' : 'Flexible — trimmed first in emergencies'}
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {CATEGORIES.filter((c) => c.essential === (group === 'Essential')).map((c) => (
                <label key={c.id} className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium">{c.label}</span>
                  <span className="w-40">
                    <MoneyInput name={`limit_${c.id}`} defaultValue={limits[c.id] || ''} placeholder="0" aria-label={`${c.label} monthly limit`} />
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </Card>
      {state.error && (
        <p role="alert" className="mt-3 text-sm font-medium text-danger">
          {state.error}
        </p>
      )}
      <div className="mt-5 flex gap-2">
        <Button type="submit" size="lg" disabled={pending}>
          {pending && <LoaderCircle className="animate-spin" />} Save limits
        </Button>
        <Link href="/budgets" className={buttonVariants({ variant: 'ghost', size: 'lg' })}>
          Cancel
        </Link>
      </div>
    </form>
  )
}
