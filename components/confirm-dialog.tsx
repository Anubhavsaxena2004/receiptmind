'use client'

import { AlertDialog } from '@base-ui/react/alert-dialog'
import { TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface ConfirmCopy {
  title: string
  body?: string
  confirmLabel?: string
  tone?: 'danger' | 'default'
}

/** A consistent "are you sure?" dialog (replaces the browser's confirm()). */
export function ConfirmDialog({
  open,
  onOpenChange,
  copy,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  copy: ConfirmCopy
  onConfirm: () => void
}) {
  const danger = copy.tone !== 'default'
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-[2px]" />
        <AlertDialog.Popup className="fixed top-1/2 left-1/2 z-50 w-[min(25rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-card p-6 shadow-2xl outline-none">
          <div className="flex gap-3">
            {danger && (
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-danger-soft text-danger">
                <TriangleAlert className="size-5" aria-hidden />
              </span>
            )}
            <div className="min-w-0">
              <AlertDialog.Title className="text-base font-bold">{copy.title}</AlertDialog.Title>
              {copy.body && <AlertDialog.Description className="mt-1 text-sm text-muted-foreground">{copy.body}</AlertDialog.Description>}
            </div>
          </div>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialog.Close render={<Button variant="outline" size="lg" />}>Cancel</AlertDialog.Close>
            <Button
              size="lg"
              variant={danger ? 'destructive' : 'default'}
              className={danger ? 'bg-danger text-white hover:bg-danger/90 dark:bg-danger dark:text-background' : undefined}
              onClick={() => {
                onOpenChange(false)
                onConfirm()
              }}
            >
              {copy.confirmLabel ?? 'Confirm'}
            </Button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
