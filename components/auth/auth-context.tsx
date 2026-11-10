'use client'

import { createContext, startTransition, useCallback, useContext, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Dialog } from '@base-ui/react/dialog'
import { ShieldCheck, X } from 'lucide-react'
import { LoginForm, SignupForm } from './forms'

export type ClientViewer = { kind: 'guest' } | { kind: 'user'; name: string; email: string; verified: boolean }

/**
 * resume = the guest typed their own data (a new expense, bill, group…): after they
 *          log in or sign up, the same save runs with exactly what they entered.
 * sample = the guest tried to change the sample household: after auth they go to
 *          their own (separate) account instead — sample records never move over.
 */
export interface AuthRequest {
  mode: 'resume' | 'sample'
  reason?: string
  resume?: () => void
  next?: string
}

interface AuthCtx {
  viewer: ClientViewer
  google: boolean
  /** True when signed in (go ahead). Otherwise opens the login popup and returns false. */
  requireAccount: (req: AuthRequest) => boolean
  openAuth: (req: AuthRequest) => void
}

const Ctx = createContext<AuthCtx | null>(null)

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

/** A form submit handler that asks a guest to log in first, then finishes the save. */
export function useGuardedSubmit(dispatch: (fd: FormData) => void, req: Omit<AuthRequest, 'resume'>) {
  const { requireAccount } = useAuth()
  return (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLElement | null
    // Snapshot now: what the person saw and submitted is exactly what gets saved later.
    const fd = new FormData(e.currentTarget, submitter)
    const run = () => startTransition(() => dispatch(fd))
    if (requireAccount({ ...req, resume: run })) run()
  }
}

export function AuthProvider({ viewer, google, children }: { viewer: ClientViewer; google: boolean; children: React.ReactNode }) {
  const [request, setRequest] = useState<AuthRequest | null>(null)
  const [tab, setTab] = useState<'signup' | 'login'>('signup')
  const router = useRouter()
  const pathname = usePathname()

  const openAuth = useCallback((req: AuthRequest) => {
    setTab('signup')
    setRequest(req)
  }, [])

  const requireAccount = useCallback(
    (req: AuthRequest) => {
      if (viewer.kind === 'user') return true
      openAuth(req)
      return false
    },
    [viewer.kind, openAuth],
  )

  const onSuccess = useCallback(() => {
    const req = request
    setRequest(null)
    if (req?.mode === 'resume' && req.resume) {
      router.refresh()
      req.resume()
    } else {
      router.push(req?.next ?? '/?welcome=1')
      router.refresh()
    }
  }, [request, router])

  const value = useMemo(() => ({ viewer, google, requireAccount, openAuth }), [viewer, google, requireAccount, openAuth])
  const next = request?.mode === 'resume' ? pathname : (request?.next ?? '/')

  return (
    <Ctx.Provider value={value}>
      {children}
      <Dialog.Root open={request !== null} onOpenChange={(open) => !open && setRequest(null)}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-[2px] transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
          <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 max-h-[92dvh] w-[min(27rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border bg-card p-6 shadow-2xl outline-none">
            <div className="flex items-start justify-between gap-3">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
                <ShieldCheck className="size-6" aria-hidden />
              </span>
              <Dialog.Close aria-label="Close" className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
                <X className="size-5" />
              </Dialog.Close>
            </div>
            <Dialog.Title className="mt-3 text-xl font-bold tracking-tight">
              {tab === 'signup' ? 'Create your free account' : 'Welcome back'}
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-muted-foreground">
              {request?.reason ??
                (request?.mode === 'resume'
                  ? 'Log in or sign up to save this to your own account.'
                  : 'You’re exploring a sample household. Sign up to manage your own money.')}
            </Dialog.Description>
            {request?.mode === 'resume' && (
              <p className="mt-3 rounded-xl bg-secondary/70 px-3 py-2 text-xs font-medium text-secondary-foreground">
                What you typed is kept. We’ll finish saving it right after you’re in.
              </p>
            )}
            <div className="mt-5">
              {tab === 'signup' ? (
                <SignupForm next={next} google={google && request?.mode !== 'resume'} onSuccess={onSuccess} onSwitch={() => setTab('login')} />
              ) : (
                <LoginForm next={next} google={google && request?.mode !== 'resume'} onSuccess={onSuccess} onSwitch={() => setTab('signup')} />
              )}
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </Ctx.Provider>
  )
}
