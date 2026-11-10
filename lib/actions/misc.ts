'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { renameUser } from '../auth/accounts'
import { todayISO } from '../dates'
import { buildDrillInput } from '../drill-input'
import { formatINR } from '../format'
import { groupBalances } from '../groups'
import { newId } from '../ids'
import { notify } from '../notify'
import { NO_PLAN, scenarioLabel, simulate, type PlanOptions, type Scenario, type ScenarioKind } from '../rehearsal'
import { createGroupFor } from '../services'
import { currentUser, NEED_LOGIN } from '../session'
import { eraseUserDb, loadSampleIntoUserDb, logZapier, readUserDb, updateUserDb } from '../store'
import type { ActionState } from '../types'
import { isZapierHook, postToZapier, zapierPayload } from '../zapier'

// ---------- Settings ----------

export async function saveProfile(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await currentUser()
  if (!user) return NEED_LOGIN
  const name = String(fd.get('name') ?? '').trim()
  const monthlyIncome = Number(fd.get('monthlyIncome'))
  const salaryDay = Number(fd.get('salaryDay'))
  const currentBalance = Number(fd.get('currentBalance'))
  const emergencyReserve = Number(fd.get('emergencyReserve'))
  if (!name) return { error: 'Enter your name.' }
  if (!Number.isFinite(monthlyIncome) || monthlyIncome < 0) return { error: 'Check your monthly income.' }
  if (!Number.isInteger(salaryDay) || salaryDay < 1 || salaryDay > 31) return { error: 'Salary day must be between 1 and 31.' }
  if (!Number.isFinite(currentBalance)) return { error: 'Check the money you have now.' }
  if (!Number.isFinite(emergencyReserve) || emergencyReserve < 0) return { error: 'Check your emergency reserve.' }
  await updateUserDb(user.id, (db) => {
    const p = db.profile
    const now = new Date().toISOString()
    if (p.currentBalance !== currentBalance) p.balanceUpdatedAt = now
    Object.assign(p, {
      name: name.slice(0, 40),
      monthlyIncome: Math.round(monthlyIncome),
      salaryDay,
      currentBalance: Math.round(currentBalance),
      emergencyReserve: Math.round(emergencyReserve),
    })
    p.setupAt ??= now
    const you = db.groups.flatMap((g) => g.members).filter((m) => m.isYou)
    for (const m of you) m.name = name.slice(0, 40)
  })
  if (name !== user.name) await renameUser(user.id, name)
  revalidatePath('/', 'layout')
  return { message: 'Saved.' }
}

export async function setDemoFailure(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await currentUser()
  if (!user) return NEED_LOGIN
  const on = fd.get('on') === '1'
  await updateUserDb(user.id, (db) => {
    db.profile.demoFailNextCharge = on
  })
  revalidatePath('/', 'layout')
  return { message: on ? 'The next simulated charge will fail.' : 'Simulated charges will succeed.' }
}

/** Explicit opt-in: replaces this account's data with the sample household (keeps connections). */
export async function loadSampleData(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await currentUser()
  if (!user) return NEED_LOGIN
  if (fd.get('confirm') !== 'yes') return { error: 'Confirm that you want to replace your data with sample data.' }
  const db = await readUserDb(user.id)
  await loadSampleIntoUserDb(user.id, db.profile.name || user.name, db)
  revalidatePath('/', 'layout')
  redirect('/?sample=1')
}

/** Clears every record in this account (keeps the login and connections). */
export async function eraseMyData(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await currentUser()
  if (!user) return NEED_LOGIN
  if (fd.get('confirm') !== 'yes') return { error: 'Confirm that you want to erase your data.' }
  const db = await readUserDb(user.id)
  await eraseUserDb(user.id, db.profile.name || user.name, db)
  revalidatePath('/', 'layout')
  redirect('/?fresh=1')
}

export async function markAllRead(_prev: ActionState): Promise<ActionState> {
  const user = await currentUser()
  if (!user) return NEED_LOGIN
  await updateUserDb(user.id, (db) => {
    for (const n of db.notifications) n.read = true
  })
  revalidatePath('/', 'layout')
  return {}
}

// ---------- Zapier (the user's own hook, with consent) ----------

export async function connectZapier(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await currentUser()
  if (!user) return NEED_LOGIN
  const url = String(fd.get('url') ?? '').trim()
  if (!isZapierHook(url)) return { error: 'Paste a Zapier Catch Hook URL. It starts with https://hooks.zapier.com/hooks/catch/' }
  if (fd.get('consent') !== 'on') return { error: 'Tick the box to agree to what Tinku will send to Zapier.' }
  await updateUserDb(user.id, (db) => {
    db.integrations ??= {}
    db.integrations.zapier = { url, consentAt: new Date().toISOString(), log: db.integrations.zapier?.log ?? [] }
  })
  revalidatePath('/', 'layout')
  return { message: 'Connected. New notifications will be sent to your Zap.' }
}

export async function disconnectZapier(_prev: ActionState): Promise<ActionState> {
  const user = await currentUser()
  if (!user) return NEED_LOGIN
  await updateUserDb(user.id, (db) => {
    if (db.integrations) delete db.integrations.zapier
  })
  revalidatePath('/', 'layout')
  return { message: 'Disconnected. Nothing more will be sent to Zapier.' }
}

export async function testZapier(_prev: ActionState): Promise<ActionState> {
  const user = await currentUser()
  if (!user) return NEED_LOGIN
  const z = (await readUserDb(user.id)).integrations?.zapier
  if (!z || !isZapierHook(z.url)) return { error: 'Connect a Zapier hook first.' }
  const title = 'Test from Tinku'
  const r = await postToZapier(z.url, zapierPayload({ kind: 'system', title, body: 'If you can see this, your Zap is receiving Tinku notifications.', href: '/settings?tab=connections', at: new Date().toISOString() }))
  await logZapier(user.id, [{ at: new Date().toISOString(), title, ...r }])
  revalidatePath('/', 'layout')
  return r.ok ? { message: 'Test sent. Check your Zap history.' } : { error: r.detail }
}

// ---------- Groups ----------

export async function createGroup(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await currentUser()
  if (!user) return NEED_LOGIN
  const result = await createGroupFor(user.id, Object.fromEntries(fd))
  if ('error' in result) return { error: result.error }
  revalidatePath('/', 'layout')
  redirect(`/groups/${result.ok.id}`)
}

export async function addGroupExpense(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await currentUser()
  if (!user) return NEED_LOGIN
  const groupId = String(fd.get('groupId') ?? '')
  const title = String(fd.get('title') ?? '').trim()
  const amount = Number(fd.get('amount'))
  const paidBy = String(fd.get('paidBy') ?? '')
  const splitAmong = fd.getAll('splitAmong').map(String)
  if (!title) return { error: 'What was it for?' }
  if (!Number.isFinite(amount) || amount <= 0 || amount > 10_000_000) return { error: 'Enter the amount.' }
  if (splitAmong.length === 0) return { error: 'Pick at least one person to split with.' }
  const result = await updateUserDb(user.id, (db): ActionState => {
    const g = db.groups.find((x) => x.id === groupId)
    if (!g) return { error: 'Group not found.' }
    const ids = new Set(g.members.map((m) => m.id))
    if (!ids.has(paidBy) || splitAmong.some((m) => !ids.has(m))) return { error: 'Pick people from this group.' }
    db.groupExpenses.unshift({ id: newId('gex'), groupId, title: title.slice(0, 60), amount: Math.round(amount), paidBy, splitAmong, date: todayISO() })
    return { message: `Added. Each person’s share is ${formatINR(amount / splitAmong.length)}.` }
  })
  revalidatePath('/', 'layout')
  return result
}

export async function settleUp(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await currentUser()
  if (!user) return NEED_LOGIN
  const groupId = String(fd.get('groupId') ?? '')
  const from = String(fd.get('from') ?? '')
  const to = String(fd.get('to') ?? '')
  const amount = Number(fd.get('amount'))
  const result = await updateUserDb(user.id, (db): ActionState => {
    const g = db.groups.find((x) => x.id === groupId)
    if (!g || !Number.isFinite(amount) || amount <= 0) return { error: 'Could not record this payment.' }
    const fromM = g.members.find((m) => m.id === from)
    const toM = g.members.find((m) => m.id === to)
    if (!fromM || !toM) return { error: 'Could not record this payment.' }
    db.settlements.push({ id: newId('stl'), groupId, from, to, amount: Math.round(amount), date: todayISO() })
    notify(db, {
      kind: 'group',
      title: `${fromM.isYou ? 'You' : fromM.name} paid ${toM.isYou ? 'you' : toM.name}`,
      body: `${formatINR(amount)} settled in ${g.name}.`,
      href: `/groups/${g.id}`,
    })
    return { message: 'Marked as paid.' }
  })
  revalidatePath('/', 'layout')
  return result
}

export async function remindMember(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await currentUser()
  if (!user) return NEED_LOGIN
  const groupId = String(fd.get('groupId') ?? '')
  const memberId = String(fd.get('memberId') ?? '')
  const result = await updateUserDb(user.id, (db): ActionState => {
    const g = db.groups.find((x) => x.id === groupId)
    const m = g?.members.find((x) => x.id === memberId)
    if (!g || !m) return { error: 'Member not found.' }
    const owed = -Math.round(groupBalances(g, db.groupExpenses, db.settlements)[m.id] ?? 0)
    if (owed <= 0) return { error: `${m.name} doesn’t owe anything right now.` }
    notify(db, {
      kind: 'group',
      title: `Payment reminder for ${m.name}`,
      body: `${m.name} owes ${formatINR(owed)} in ${g.name}.`,
      href: `/groups/${g.id}`,
    })
    return {
      message: db.integrations?.zapier
        ? `Reminder sent to your Zap for ${m.name}.`
        : `Reminder logged. Connect Zapier in Settings → Connections to send it by email or WhatsApp.`,
    }
  })
  revalidatePath('/', 'layout')
  return result
}

// ---------- Crisis drill ----------

const KINDS: ScenarioKind[] = ['salary_delay', 'medical', 'income_cut', 'job_loss', 'big_expense']

/** Re-runs the drill on the server from the user's own data, then saves it. */
export async function saveDrill(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await currentUser()
  if (!user) return NEED_LOGIN
  let scenario: Scenario
  let plan: PlanOptions
  try {
    scenario = JSON.parse(String(fd.get('scenario')))
    plan = { ...NO_PLAN, ...JSON.parse(String(fd.get('plan'))) }
  } catch {
    return { error: 'Could not read this drill.' }
  }
  const horizon = Number(fd.get('horizon'))
  const planSteps = String(fd.get('planSteps') ?? '')
    .split('\n')
    .filter(Boolean)
    .slice(0, 10)
    .map((s) => s.slice(0, 200))
  if (!KINDS.includes(scenario.kind) || ![30, 60, 90].includes(horizon)) return { error: 'Could not read this drill.' }

  const db = await readUserDb(user.id)
  const today = todayISO()
  const result = simulate(buildDrillInput(db, today), scenario, plan, horizon)
  await updateUserDb(user.id, (d) => {
    d.drills.unshift({
      id: newId('drl'),
      at: new Date().toISOString(),
      scenarioLabel: scenarioLabel(scenario),
      horizonDays: horizon,
      passed: result.passed,
      score: result.score,
      shortfall: result.shortfall,
      lowestBalance: result.lowest.balance,
      lowestDate: result.lowest.date,
      planSteps,
    })
    if (d.drills.length > 50) d.drills.length = 50
    notify(d, {
      kind: 'drill',
      title: `Crisis drill: ${scenarioLabel(scenario)}`,
      body: result.passed
        ? `Passed with a score of ${result.score}/100${planSteps.length ? ' using your recovery plan' : ''}.`
        : `Short by ${formatINR(result.shortfall)}. Score ${result.score}/100.`,
      href: '/drill',
    })
  })
  revalidatePath('/', 'layout')
  return { message: 'Saved to your drill history.' }
}
