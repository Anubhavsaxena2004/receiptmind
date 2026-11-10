'use client'

import Link from 'next/link'
import { useActionState, useRef, useState } from 'react'
import { LoaderCircle, ScanLine, Sparkles, TriangleAlert, Upload, X } from 'lucide-react'
import { Notice } from '@/components/bits'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Field, Input, MoneyInput, Select } from '@/components/ui/input'
import { addExpense } from '@/lib/actions/expenses'
import { CATEGORIES, isCategoryId } from '@/lib/categories'
import { formatDate, formatINR } from '@/lib/format'
import type { CategoryId } from '@/lib/types'
import { useAuth, useGuardedSubmit } from '@/components/auth/auth-context'

type Scan =
  | { status: 'idle' }
  | { status: 'scanning'; preview?: string }
  | { status: 'done'; preview?: string; confidence: string; note: string; currency: string }
  | { status: 'error'; preview?: string; message: string }

export function ExpenseForm({ today }: { today: string }) {
  const [state, formAction, pending] = useActionState(addExpense, {})
  const onSubmit = useGuardedSubmit(formAction, { mode: 'resume', reason: 'Create a free account (or log in) to save this expense to your own account.' })
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [cat, setCat] = useState<CategoryId>('groceries')
  const [date, setDate] = useState(today)
  const [note, setNote] = useState('')
  const [source, setSource] = useState<'manual' | 'receipt'>('manual')
  const [scan, setScan] = useState<Scan>({ status: 'idle' })
  const fileRef = useRef<HTMLInputElement>(null)
  const { requireAccount } = useAuth()

  async function onFile(file: File | undefined) {
    if (!file) return
    // Scanning costs money per call, so guests sign up first; the scan then continues with this photo.
    if (!requireAccount({ mode: 'resume', reason: 'Create a free account (or log in) to scan receipts with AI.', resume: () => void onFile(file) })) {
      if (fileRef.current) fileRef.current.value = ''
      return
    }
    const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
    setScan({ status: 'scanning', preview })
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/receipts/extract', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) {
        setScan({ status: 'error', preview, message: json.error ?? 'Could not read the receipt.' })
        return
      }
      const r = json.receipt as {
        merchant: string
        total_amount: number
        currency: string
        date: string
        category: string
        confidence: string
        note: string
      }
      if (r.merchant) setTitle(r.merchant)
      if (r.total_amount > 0) setAmount(String(r.total_amount))
      if (isCategoryId(r.category)) setCat(r.category)
      if (/^\d{4}-\d{2}-\d{2}$/.test(r.date) && r.date <= today) setDate(r.date)
      setSource('receipt')
      setScan({ status: 'done', preview, confidence: r.confidence, note: r.note, currency: r.currency })
    } catch {
      setScan({ status: 'error', preview, message: 'Could not reach the scanner. Enter the details by hand.' })
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const clearScan = () => {
    setScan({ status: 'idle' })
    setSource('manual')
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
      {/* Step 1: optional scan */}
      <Card className="p-5">
        <p className="text-sm font-semibold">
          <span className="mr-2 inline-flex size-6 items-center justify-center rounded-full bg-secondary text-xs text-secondary-foreground">1</span>
          Scan a receipt <span className="font-normal text-muted-foreground">(optional)</span>
        </p>
        <p className="mt-1 text-sm text-muted-foreground">Tinku’s AI reads the shop, total, date and category. You check it before saving.</p>

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          capture="environment"
          className="sr-only"
          id="receipt-file"
          onChange={(e) => onFile(e.target.files?.[0])}
        />

        {scan.status === 'idle' ? (
          <label
            htmlFor="receipt-file"
            className="mt-4 flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-primary/25 bg-secondary/40 px-5 py-9 text-center transition hover:border-primary/50"
          >
            <span className="flex size-12 items-center justify-center rounded-2xl bg-card text-primary shadow-sm">
              <ScanLine className="size-6" />
            </span>
            <span className="mt-3 font-semibold">Take a photo or upload</span>
            <span className="mt-0.5 text-sm text-muted-foreground">JPG, PNG or PDF · up to 5 MB</span>
          </label>
        ) : (
          <div className="mt-4 space-y-3">
            {scan.preview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={scan.preview} alt="Receipt preview" className="max-h-56 w-full rounded-xl border object-contain" />
            )}
            {scan.status === 'scanning' && (
              <p className="flex items-center gap-2 text-sm font-medium">
                <LoaderCircle className="size-4 animate-spin text-primary" /> Reading your receipt…
              </p>
            )}
            {scan.status === 'error' && <Notice tone="warning">{scan.message}</Notice>}
            {scan.status === 'done' && (
              <Notice tone={scan.confidence === 'high' ? 'success' : 'warning'} title="Filled from your receipt — please check">
                {scan.confidence !== 'high' && 'Some details were hard to read. '}
                {scan.currency && scan.currency !== 'INR' && `The receipt is in ${scan.currency}; enter the rupee amount. `}
                {scan.note}
              </Notice>
            )}
            <div className="flex gap-2">
              <label htmlFor="receipt-file" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                <Upload /> Use another
              </label>
              <Button type="button" variant="ghost" size="sm" onClick={clearScan}>
                <X /> Clear
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Step 2: details */}
      <Card className="p-5">
        <p className="mb-4 text-sm font-semibold">
          <span className="mr-2 inline-flex size-6 items-center justify-center rounded-full bg-secondary text-xs text-secondary-foreground">2</span>
          Check the details
        </p>
        <form onSubmit={onSubmit} className="space-y-4">
          <input type="hidden" name="source" value={source} />
          <Field label="What was it?" htmlFor="title">
            <Input id="title" name="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Weekly groceries" required maxLength={80} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Amount" htmlFor="amount">
              <MoneyInput id="amount" name="amount" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" required />
            </Field>
            <Field label="Date" htmlFor="date">
              <Input id="date" name="date" type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)} required />
            </Field>
          </div>
          <Field label="Category" htmlFor="category" hint="Decides which budget this counts against.">
            <Select id="category" name="category" value={cat} onChange={(e) => setCat(e.target.value as CategoryId)}>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Note (optional)" htmlFor="note">
            <Input id="note" name="note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} />
          </Field>

          {state.error && (
            <p role="alert" className="text-sm font-medium text-danger">
              {state.error}
            </p>
          )}

          {state.duplicateOf ? (
            <div className="rounded-2xl border border-warning-soft bg-warning-soft/70 p-4">
              <p className="flex items-center gap-2 font-semibold">
                <TriangleAlert className="size-4 text-warning" /> This looks like a duplicate
              </p>
              <p className="mt-1 text-sm">
                You already have “{state.duplicateOf.title}” for {formatINR(state.duplicateOf.amount)} on {formatDate(state.duplicateOf.date)}.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button type="submit" name="confirmDuplicate" value="1" disabled={pending}>
                  Save anyway
                </Button>
                <Link href="/expenses" className={buttonVariants({ variant: 'outline' })}>
                  Don’t save
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 pt-1">
              <Button type="submit" size="lg" disabled={pending || scan.status === 'scanning'}>
                {pending ? <LoaderCircle className="animate-spin" /> : source === 'receipt' ? <Sparkles /> : null}
                Save expense
              </Button>
              <Link href="/expenses" className={buttonVariants({ variant: 'ghost', size: 'lg' })}>
                Cancel
              </Link>
            </div>
          )}
        </form>
      </Card>
    </div>
  )
}
