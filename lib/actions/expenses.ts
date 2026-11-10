'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { addExpenseFor, saveBudgetsFor } from '../services'
import { currentUser, NEED_LOGIN } from '../session'
import { updateUserDb } from '../store'
import type { ActionState } from '../types'

export async function addExpense(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await currentUser()
  if (!user) return NEED_LOGIN
  const result = await addExpenseFor(user.id, Object.fromEntries(fd))
  if ('error' in result) return { error: result.error }
  if ('duplicateOf' in result) return { duplicateOf: result.duplicateOf }
  revalidatePath('/', 'layout')
  redirect('/expenses?added=1')
}

export async function deleteExpense(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await currentUser()
  if (!user) return NEED_LOGIN
  const id = String(fd.get('id') ?? '')
  const error = await updateUserDb(user.id, (db) => {
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
  const user = await currentUser()
  if (!user) return NEED_LOGIN
  const result = await saveBudgetsFor(user.id, Object.fromEntries(fd))
  if ('error' in result) return { error: result.error }
  revalidatePath('/', 'layout')
  redirect('/budgets?saved=1')
}
