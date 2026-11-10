'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import {
  changePassword,
  confirmEmailCode,
  createSession,
  deleteAccount,
  endSession,
  logIn,
  newEmailCode,
  newResetToken,
  resetPassword,
  signUp,
} from '../auth/accounts'
import { emailConfigured, sendEmail } from '../auth/email'
import { getOrigin } from '../data'
import { clearSessionCookie, currentUser, NEED_LOGIN, safeNext, sessionToken, setSessionCookie } from '../session'
import type { ActionState } from '../types'

/**
 * Login/signup run in two places: full pages (redirect to `next` afterwards) and the
 * popup a guest sees when they try to save (`inline=1`: report success so the page can
 * finish the original save with the values the person already typed).
 */
const inline = (fd: FormData) => fd.get('inline') === '1'

async function startSession(userId: string) {
  const s = await createSession(userId)
  await setSessionCookie(s.token, s.expiresAt)
}

async function sendCode(userId: string): Promise<string | null> {
  const r = await newEmailCode(userId)
  if ('error' in r) return r.error
  if (emailConfigured()) {
    const sent = await sendEmail(r.email, `Your Tinku code: ${r.code}`, `Your Tinku verification code is ${r.code}.\n\nIt expires in 15 minutes. If you didn't sign up for Tinku, ignore this email.`)
    if (!sent) return 'We couldn’t send the email just now. Try “Send a new code” in a minute.'
  }
  return null
}

export async function loginAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const result = await logIn(String(fd.get('email') ?? ''), String(fd.get('password') ?? ''))
  if ('error' in result) return { error: result.error }
  await startSession(result.user.id)
  if (inline(fd)) return { ok: true }
  redirect(safeNext(fd.get('next')))
}

export async function signupAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const password = String(fd.get('password') ?? '')
  const confirm = fd.get('confirmPassword')
  if (confirm !== null && confirm !== password) return { error: 'The two passwords don’t match.' }
  const result = await signUp({ name: String(fd.get('name') ?? ''), email: String(fd.get('email') ?? ''), password })
  if ('error' in result) return { error: result.error }
  await startSession(result.user.id)
  await sendCode(result.user.id)
  if (inline(fd)) return { ok: true }
  redirect(`/verify?next=${encodeURIComponent(safeNext(fd.get('next')))}&new=1`)
}

export async function logoutAction(): Promise<void> {
  const token = await sessionToken()
  if (token) await endSession(token)
  await clearSessionCookie()
  revalidatePath('/', 'layout')
  redirect('/')
}

export async function resendCodeAction(_prev: ActionState): Promise<ActionState> {
  const user = await currentUser()
  if (!user) return NEED_LOGIN
  const error = await sendCode(user.id)
  if (error) return { error }
  revalidatePath('/verify')
  return { message: emailConfigured() ? `New code sent to ${user.email}.` : 'New code ready (shown above).' }
}

export async function verifyEmailAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await currentUser()
  if (!user) return NEED_LOGIN
  const result = await confirmEmailCode(user.id, String(fd.get('code') ?? ''))
  if ('error' in result) return { error: result.error }
  revalidatePath('/', 'layout')
  redirect(`${safeNext(fd.get('next'))}${safeNext(fd.get('next')).includes('?') ? '&' : '?'}verified=1`)
}

export async function forgotPasswordAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  if (!emailConfigured()) {
    return { error: 'Password reset by email isn’t set up on this deployment yet, so we can’t send a link.' }
  }
  const email = String(fd.get('email') ?? '')
  const r = await newResetToken(email)
  if (r) {
    const link = `${await getOrigin()}/reset-password?token=${encodeURIComponent(r.token)}`
    await sendEmail(r.user.email, 'Reset your Tinku password', `Hi ${r.user.name},\n\nUse this link to set a new password. It works once and expires in 30 minutes:\n${link}\n\nIf you didn't ask for this, ignore this email; your password stays the same.`)
  }
  // Same answer whether or not the account exists, so this can't be used to find accounts.
  return { ok: true }
}

export async function resetPasswordAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const password = String(fd.get('password') ?? '')
  if (password !== String(fd.get('confirmPassword') ?? '')) return { error: 'The two passwords don’t match.' }
  const result = await resetPassword(String(fd.get('token') ?? ''), password)
  if ('error' in result) return { error: result.error }
  await startSession(result.user.id)
  redirect('/?reset=1')
}

export async function changePasswordAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await currentUser()
  const token = await sessionToken()
  if (!user || !token) return NEED_LOGIN
  const next = String(fd.get('newPassword') ?? '')
  if (next !== String(fd.get('confirmPassword') ?? '')) return { error: 'The two new passwords don’t match.' }
  const result = await changePassword(user.id, String(fd.get('currentPassword') ?? ''), next, token)
  if ('error' in result) return { error: result.error }
  return { message: user.passwordHash ? 'Password changed. You were signed out on other devices.' : 'Password added. You can now log in with email too.' }
}

export async function deleteAccountAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await currentUser()
  if (!user) return NEED_LOGIN
  if (String(fd.get('confirmEmail') ?? '').trim().toLowerCase() !== user.email) {
    return { error: 'Type your email exactly to confirm.' }
  }
  await deleteAccount(user.id)
  await clearSessionCookie()
  revalidatePath('/', 'layout')
  redirect('/?deleted=1')
}
