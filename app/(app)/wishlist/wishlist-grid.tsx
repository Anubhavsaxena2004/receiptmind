'use client'

import dynamic from 'next/dynamic'
import type { WishlistProgressItem } from '@/lib/agentic-commerce'

const Grid = dynamic(() => import('./wishlist-grid-inner'), {
  ssr: false,
  loading: () => <div className="h-96 animate-pulse rounded-2xl border bg-card" />,
})

export function WishlistGrid({ rows }: { rows: WishlistProgressItem[] }) {
  return <Grid rows={rows} />
}
