import type { Metadata } from 'next'
import Link from 'next/link'
import { Info } from 'lucide-react'
import { HelpCenter } from '@/components/help/help-center'
import { PageHeader } from '@/components/page-header'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Help & Tutorials',
  description: 'Interactive guided tours, category discovery explorer, application navigation map, and feature tutorials for Tinku.',
}

export default function HelpPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Help & Tutorial Center"
        description="Guided tours, category discovery, and clear instructions for every screen in Tinku."
        action={
          <Link href="/about" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'rounded-full font-semibold gap-1.5')}>
            <Info className="size-4 text-primary" /> About Tinku
          </Link>
        }
      />

      <HelpCenter />
    </div>
  )
}

