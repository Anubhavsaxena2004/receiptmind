import Link from 'next/link'
import { SearchX } from 'lucide-react'
import { EmptyState } from '@/components/bits'
import { buttonVariants } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="py-10">
      <EmptyState
        icon={SearchX}
        title="We couldn’t find that"
        body="It may have been deleted, or the link is out of date."
        action={
          <Link href="/" className={buttonVariants()}>
            Go home
          </Link>
        }
      />
    </div>
  )
}
