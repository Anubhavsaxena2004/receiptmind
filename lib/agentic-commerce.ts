import { billViews } from './bills'
import { monthKey, todayISO } from './dates'
import { formatINR } from './format'
import type { Db, WishlistItem } from './types'

export interface WishlistProgressItem {
  item: WishlistItem
  coveragePct: number
  unlocked: boolean
  remainingToSave: number
}

export interface AgenticCommerceState {
  currentBalance: number
  emergencyReserve: number
  due14DaysTotal: number
  monthlyIncome: number
  spentThisMonth: number
  totalBudget: number
  budgetSavings: number
  safeSurplus: number
  topRecommendation?: {
    item: WishlistItem
    coveragePct: number
    unlocked: boolean
    reason: string
    agentHeadline: string
  }
  itemsWithProgress: WishlistProgressItem[]
}

const PRIORITY_WEIGHT: Record<WishlistItem['priority'], number> = {
  high: 3,
  medium: 2,
  low: 1,
}

export function evaluateAgenticCommerce(db: Db, today = todayISO()): AgenticCommerceState {
  const p = db.profile
  const month = monthKey(today)
  const views = billViews(db, today)

  // 1. Calculate obligations in next 14 days
  const due14 = views.filter((v) => v.occ && v.occ.status === 'upcoming' && (v.daysLeft ?? 99) <= 14)
  const due14DaysTotal = due14.reduce((s, v) => s + (v.occ?.amount ?? 0), 0)

  // 2. Calculate budget surplus
  const spentThisMonth = db.expenses.filter((e) => monthKey(e.date) === month).reduce((s, e) => s + e.amount, 0)
  const totalBudget = db.budgets.reduce((s, b) => s + b.limit, 0)
  const budgetSavings = Math.max(0, totalBudget - spentThisMonth)

  // 3. True "Guilt-Free" surplus available for reward purchases:
  // Must keep emergency reserve completely intact and leave enough for next 14 days of bills!
  const availableLiquidity = p.currentBalance - due14DaysTotal
  const safeSurplus = Math.max(0, availableLiquidity - p.emergencyReserve)

  const items = db.wishlist ?? []
  const activeItems = items.filter((i) => !i.purchased)

  const itemsWithProgress: WishlistProgressItem[] = activeItems.map((item) => {
    const coveragePct = Math.min(100, item.price > 0 ? Math.round((safeSurplus / item.price) * 100) : 100)
    const unlocked = safeSurplus >= item.price
    const remainingToSave = Math.max(0, item.price - safeSurplus)
    return {
      item,
      coveragePct,
      unlocked,
      remainingToSave,
    }
  })

  // Sort items: unlocked items first, then by priority (high > medium > low), then price desc
  itemsWithProgress.sort((a, b) => {
    if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1
    const pDiff = PRIORITY_WEIGHT[b.item.priority] - PRIORITY_WEIGHT[a.item.priority]
    if (pDiff !== 0) return pDiff
    return b.coveragePct - a.coveragePct
  })

  let topRecommendation: AgenticCommerceState['topRecommendation'] = undefined

  if (itemsWithProgress.length > 0) {
    const best = itemsWithProgress[0]
    if (best.unlocked) {
      topRecommendation = {
        item: best.item,
        coveragePct: 100,
        unlocked: true,
        agentHeadline: `Goal Unlocked: ${best.item.title}`,
        reason: `Your budget discipline generated ${formatINR(safeSurplus)} in surplus. Emergency reserve (${formatINR(p.emergencyReserve)}) and 14-day bills (${formatINR(due14DaysTotal)}) are fully protected. This item is safe to execute with PayPal!`,
      }
    } else {
      topRecommendation = {
        item: best.item,
        coveragePct: best.coveragePct,
        unlocked: false,
        agentHeadline: `Goal in Progress: ${best.item.title} (${best.coveragePct}%)`,
        reason: `You have ${formatINR(safeSurplus)} towards this ${best.item.priority}-priority goal. Save ${formatINR(best.remainingToSave)} more under your everyday budgets to unlock it without touching your emergency fund.`,
      }
    }
  }

  return {
    currentBalance: p.currentBalance,
    emergencyReserve: p.emergencyReserve,
    due14DaysTotal,
    monthlyIncome: p.monthlyIncome,
    spentThisMonth,
    totalBudget,
    budgetSavings,
    safeSurplus,
    topRecommendation,
    itemsWithProgress,
  }
}

