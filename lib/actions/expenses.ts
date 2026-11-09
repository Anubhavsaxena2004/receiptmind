'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { isCategoryId, CATEGORIES } from '../categories'
import { diffDays, isISODate } from '../dates'
import { updateDb } from '../db'
import { newId } from '../ids'
import type { ActionState } from '../types'

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')

export async function addExpense(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const title = String(fd.get('title') ?? '').trim()
  const amount = Number(fd.get('amount'))
  const cat = fd.get('category')
  const date = fd.get('date')
  const note = String(fd.get('note') ?? '').trim()
  const source = fd.get('source') === 'receipt' ? 'receipt' : 'manual'
  const confirmed = fd.get('confirmDuplicate') === '1'

  if (!title) return { error: 'Add a short name, like “Groceries”.' }
  if (!Number.isFinite(amount) || amount <= 0) return { error: 'Enter an amount above ₹0.' }
  if (amount > 10_000_000) return { error: 'That amount looks too large. Check it again.' }
  if (!isCategoryId(cat)) return { error: 'Pick a category.' }
  if (!isISODate(date)) return { error: 'Pick a date.' }

  const duplicate = await updateDb((db) => {
    if (!confirmed) {
      const dup = db.expenses.find(
        (e) =>
          Math.abs(e.amount - amount) < 1 &&
          Math.abs(diffDays(e.date, date)) <= 1 &&
          (e.category === cat || norm(e.title) === norm(title)),
      )
      if (dup) return { title: dup.title, amount: dup.amount, date: dup.date }
    }
    db.expenses.unshift({
      id: newId('exp'),
      title: title.slice(0, 80),
      amount: Math.round(amount * 100) / 100,
      category: cat,
      date,
      note: note ? note.slice(0, 200) : undefined,
      source,
      createdAt: new Date().toISOString(),
    })
    db.profile.currentBalance -= amount
    return null
  })
  if (duplicate) return { duplicateOf: duplicate }

  revalidatePath('/', 'layout')
  redirect('/expenses?added=1')
}

export async function deleteExpense(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const id = String(fd.get('id') ?? '')
  const error = await updateDb((db) => {
    const e = db.expenses.find((x) => x.id === id)
    if (!e) return 'This expense no longer exists.'
    if (e.source === 'bill') return 'This came from a bill payment. It stays for your records.'
    db.expenses = db.expenses.filter((x) => x.id !== id)
    db.profile.currentBalance += e.amount
    return null
  })
  if (error) return { error }
  revalidatePath('/', 'layout')
  return { message: 'Deleted' }
}

export async function saveBudgets(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const limits: { category: (typeof CATEGORIES)[number]['id']; limit: number }[] = []
  for (const c of CATEGORIES) {
    const raw = String(fd.get(`limit_${c.id}`) ?? '').trim()
    const value = raw === '' ? 0 : Number(raw)
    if (!Number.isFinite(value) || value < 0) return { error: `Check the limit for ${c.label}.` }
    limits.push({ category: c.id, limit: Math.round(value) })
  }
  await updateDb((db) => {
    db.budgets = limits
  })
  revalidatePath('/', 'layout')
  redirect('/budgets?saved=1')
}
