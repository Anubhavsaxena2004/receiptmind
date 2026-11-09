import type { CategoryId } from './types'

export interface CategoryInfo {
  id: CategoryId
  label: string
  /** Essential spending is protected in recovery plans; flexible spending can be cut. */
  essential: boolean
  /** "spending" categories are day-to-day; "bill" categories are usually paid as bills. */
  kind: 'spending' | 'bill'
}

export const CATEGORIES: CategoryInfo[] = [
  { id: 'groceries', label: 'Groceries', essential: true, kind: 'spending' },
  { id: 'food', label: 'Food & dining', essential: false, kind: 'spending' },
  { id: 'transport', label: 'Transport', essential: true, kind: 'spending' },
  { id: 'health', label: 'Health', essential: true, kind: 'spending' },
  { id: 'shopping', label: 'Shopping', essential: false, kind: 'spending' },
  { id: 'entertainment', label: 'Entertainment', essential: false, kind: 'spending' },
  { id: 'rent', label: 'Rent', essential: true, kind: 'bill' },
  { id: 'utilities', label: 'Utilities', essential: true, kind: 'bill' },
  { id: 'education', label: 'Education', essential: true, kind: 'bill' },
  { id: 'insurance', label: 'Insurance', essential: true, kind: 'bill' },
  { id: 'subscriptions', label: 'Subscriptions', essential: false, kind: 'bill' },
  { id: 'other', label: 'Other', essential: false, kind: 'spending' },
]

const BY_ID = new Map(CATEGORIES.map((c) => [c.id, c]))

export function category(id: CategoryId): CategoryInfo {
  return BY_ID.get(id) ?? BY_ID.get('other')!
}

export function isCategoryId(v: unknown): v is CategoryId {
  return typeof v === 'string' && BY_ID.has(v as CategoryId)
}

export const CATEGORY_IDS = CATEGORIES.map((c) => c.id) as [CategoryId, ...CategoryId[]]
