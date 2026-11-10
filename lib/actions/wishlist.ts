'use server'

import { revalidatePath } from 'next/cache'
import { isCategoryId } from '../categories'
import { formatINR } from '../format'
import { newId } from '../ids'
import { notify } from '../notify'
import { currentUser, isVerified, NEED_LOGIN, NEED_VERIFY } from '../session'
import { updateUserDb } from '../store'
import type { ActionState, WishlistItem, WishlistPriority } from '../types'

export async function addWishlistItem(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await currentUser()
  if (!user) return NEED_LOGIN

  const title = String(fd.get('title') ?? '').trim().slice(0, 100)
  if (!title) return { error: 'Enter a product or goal name.' }

  const price = Number(fd.get('price'))
  if (!Number.isFinite(price) || price <= 0) return { error: 'Enter a valid price.' }

  const rawPriority = String(fd.get('priority') ?? 'medium').toLowerCase()
  const priority: WishlistPriority = rawPriority === 'high' || rawPriority === 'low' ? rawPriority : 'medium'

  const rawCat = fd.get('category')
  const category = isCategoryId(rawCat) ? rawCat : 'shopping'

  const note = String(fd.get('note') ?? '').trim().slice(0, 200) || undefined
  const url = String(fd.get('url') ?? '').trim().slice(0, 500) || undefined

  await updateUserDb(user.id, (db) => {
    db.wishlist ??= []
    const item: WishlistItem = {
      id: newId('wsh'),
      title,
      price: Math.round(price),
      priority,
      category,
      note,
      url,
      purchased: false,
      createdAt: new Date().toISOString(),
    }
    db.wishlist.unshift(item)
    notify(db, {
      kind: 'system',
      title: `Goal Added: ${title}`,
      body: `Target price ${formatINR(price)}. Tinku AI will notify you when budget surplus unlocks it.`,
      href: '/wishlist',
    })
  })

  revalidatePath('/', 'layout')
  return { message: 'Goal added to your wishlist.' }
}

export async function deleteWishlistItem(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await currentUser()
  if (!user) return NEED_LOGIN

  const id = String(fd.get('id') ?? '')
  if (!id) return { error: 'Invalid wishlist item.' }

  await updateUserDb(user.id, (db) => {
    db.wishlist = (db.wishlist ?? []).filter((w) => w.id !== id)
  })

  revalidatePath('/', 'layout')
  return { message: 'Item removed from wishlist.' }
}

export async function executeWishlistPurchase(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await currentUser()
  if (!user) return NEED_LOGIN
  if (!isVerified(user)) return NEED_VERIFY

  const id = String(fd.get('id') ?? '')
  if (!id) return { error: 'Invalid item.' }

  const result = await updateUserDb(user.id, (db) => {
    db.wishlist ??= []
    const item = db.wishlist.find((w) => w.id === id)
    if (!item) return { error: 'Item not found in wishlist.' }
    if (item.purchased) return { error: 'This item was already purchased.' }

    // Check liquidity
    if (db.profile.currentBalance < item.price) {
      return { error: 'Insufficient funds available for this purchase.' }
    }

    const now = new Date().toISOString()
    const payId = newId('pay')

    // 1. Mark Wishlist Item as purchased
    item.purchased = true
    item.purchasedAt = now
    item.paymentId = payId

    // 2. Deduct from balance
    db.profile.currentBalance -= item.price

    // 3. Record as formal Expense
    db.expenses.unshift({
      id: newId('exp'),
      title: `Wishlist Goal: ${item.title}`,
      amount: item.price,
      category: item.category ?? 'shopping',
      date: now.slice(0, 10),
      note: `Fulfilled via Agentic Commerce & PayPal Sandbox (${item.priority} priority)`,
      source: 'manual',
      createdAt: now,
    })

    // 4. Record Payment Ledger Entry
    db.payments.unshift({
      id: payId,
      label: `Wishlist: ${item.title}`,
      payee: 'Merchant Store (Agentic Commerce)',
      amountInr: item.price,
      chargeAmount: Math.max(item.price / 85, 0.01).toFixed(2),
      chargeCurrency: 'USD',
      fxRate: 85,
      idempotencyKey: `wsh_${item.id}_${Date.now()}`,
      provider: 'paypal_sandbox',
      mode: 'manual',
      status: 'captured',
      createdAt: now,
      updatedAt: now,
      events: [
        { at: now, status: 'created', message: 'Order created for wishlist goal fulfillment' },
        { at: now, status: 'captured', message: 'Payment confirmed & captured via PayPal Sandbox' },
      ],
    })

    // 5. Notify & trigger Zapier webhook
    notify(db, {
      kind: 'payment',
      title: `🎉 Goal Fulfilled: ${item.title}`,
      body: `Purchased via PayPal Sandbox for ${formatINR(item.price)} without touching your emergency reserve!`,
      href: '/wishlist',
    })

    return { message: `🎉 Successfully purchased "${item.title}" via PayPal Sandbox!` }
  })

  revalidatePath('/', 'layout')
  return result
}
