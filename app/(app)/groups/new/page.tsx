import type { Metadata } from 'next'
import { NewGroupForm } from './new-group-form'
import { PageHeader } from '@/components/page-header'

export const metadata: Metadata = { title: 'New group' }

export default function NewGroupPage() {
  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="New group" description="You’re added automatically." back={{ href: '/groups', label: 'Groups' }} />
      <NewGroupForm />
    </div>
  )
}
