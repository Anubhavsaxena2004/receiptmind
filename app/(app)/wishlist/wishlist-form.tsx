'use client'

import { useActionState, useId, useState } from 'react'
import { Plus, Sparkles } from 'lucide-react'
import { FormError, SubmitButton } from '@/components/auth/forms'
import { Button } from '@/components/ui/button'
import { Field, Input, Select, Textarea } from '@/components/ui/input'
import { addWishlistItem } from '@/lib/actions/wishlist'
import { CATEGORIES } from '@/lib/categories'
import { submitWithoutReset } from '@/lib/submit'

export function WishlistForm() {
  const [open, setOpen] = useState(false)
  const [state, dispatch, pending] = useActionState(addWishlistItem, {})
  const id = useId()

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="gap-2 font-bold shadow-sm">
        <Plus className="size-4 stroke-[2.5]" /> Add Wishlist Goal
      </Button>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-card p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <h3 className="font-bold text-base text-foreground flex items-center gap-2">
          <Sparkles className="size-4 text-primary" /> Add a New Wishlist Goal
        </h3>
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>

      <form onSubmit={submitWithoutReset(dispatch)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Goal or Product Name" htmlFor={`${id}-title`} hint="e.g. Ergonomic Office Chair, Headphones">
            <Input id={`${id}-title`} name="title" required placeholder="Product title" maxLength={100} />
          </Field>

          <Field label="Target Price (INR)" htmlFor={`${id}-price`}>
            <Input id={`${id}-price`} name="price" type="number" step="1" min="1" required placeholder="5999" />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Priority" htmlFor={`${id}-priority`} hint="High priority unlocks first when surplus is ready.">
            <Select id={`${id}-priority`} name="priority" defaultValue="high">
              <option value="high">High (First in line)</option>
              <option value="medium">Medium</option>
              <option value="low">Low (Discretionary)</option>
            </Select>
          </Field>

          <Field label="Category" htmlFor={`${id}-category`}>
            <Select id={`${id}-category`} name="category" defaultValue="shopping">
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Product URL (Optional)" htmlFor={`${id}-url`}>
          <Input id={`${id}-url`} name="url" type="url" placeholder="https://amazon.in/... or store link" />
        </Field>

        <Field label="Why is this meaningful? (Optional)" htmlFor={`${id}-note`}>
          <Textarea id={`${id}-note`} name="note" placeholder="Reward for sticking to dining budget for 2 months." rows={2} />
        </Field>

        <FormError state={state} />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
          <SubmitButton pending={pending} className="w-auto px-6">
            Save to Wishlist
          </SubmitButton>
        </div>
      </form>
    </div>
  )
}
