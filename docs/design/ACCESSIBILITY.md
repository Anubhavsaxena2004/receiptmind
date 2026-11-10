# Tinku Accessibility Guidelines

> Tinku is committed to meeting **WCAG 2.2 AA** accessibility standards. Financial information must be accessible to every user, including those using screen readers, keyboard-only navigation, and high contrast settings.

---

## Accessibility Goals

1. **WCAG 2.2 Level AA compliance** across all screens
2. **Keyboard navigable** without a mouse
3. **Screen reader compatible** (VoiceOver, NVDA, TalkBack)
4. **Color alone never communicates meaning**
5. **Touch targets ≥ 44×44px** on touch devices
6. **Focus indicators clearly visible** in all themes

---

## Color Contrast (WCAG AA Compliance)

### Standard Requirements

| Text Type | Contrast Ratio Required | Tinku Token Compliance |
|---|---|---|
| Normal text (< 18px regular, < 14px bold) | **4.5:1** minimum | Foreground `#0F0F0F` on `#F8F8F8` = 19.3:1 ✅ |
| Large text (≥ 18px regular, ≥ 14px bold) | **3.0:1** minimum | Display balance on card = 19.3:1 ✅ |
| UI components and borders | **3.0:1** minimum | Border `#E5E7E0` on `#F8F8F8` = 1.2:1 (decorative) |
| Focus indicators | **3.0:1** minimum | Ring `#5DD62C` on `#0F0F0F` = 7.2:1 ✅ |

### Light Mode Contrast Table

| Element | Background | Text/Fill | Contrast | Passes AA |
|---|---|---|---|---|
| Primary button | `#5DD62C` | `#0F0F0F` | 7.2:1 | ✅ AAA |
| Primary text | `#F8F8F8` | `#0F0F0F` | 19.3:1 | ✅ AAA |
| Card text | `#FFFFFF` | `#0F0F0F` | 20.6:1 | ✅ AAA |
| Muted text | `#F8F8F8` | `#6B7280` | 4.6:1 | ✅ AA |
| Card muted text | `#FFFFFF` | `#6B7280` | 4.9:1 | ✅ AA |
| Green text on card | `#FFFFFF` | `#337418` | 5.3:1 | ✅ AA |
| Green text on card (lime) | `#FFFFFF` | `#5DD62C` | 3.1:1 | ⚠️ Large text only |
| Success badge | `#DCFCE7` | `#16A34A` | 4.5:1 | ✅ AA |
| Warning badge | `#FEF3C7` | `#B45309` | 4.6:1 | ✅ AA |
| Danger badge | `#FEE2E2` | `#DC2626` | 4.5:1 | ✅ AA |

### Dark Mode Contrast Table

| Element | Background | Text/Fill | Contrast | Passes AA |
|---|---|---|---|---|
| Primary button | `#5DD62C` | `#0F0F0F` | 7.2:1 | ✅ AAA |
| Primary text | `#0F0F0F` | `#F5F5F5` | 18.4:1 | ✅ AAA |
| Card text | `#202020` | `#F5F5F5` | 14.8:1 | ✅ AAA |
| Muted text | `#0F0F0F` | `#9CA3AF` | 5.4:1 | ✅ AA |
| Card muted text | `#202020` | `#9CA3AF` | 4.8:1 | ✅ AA |
| Primary green on dark | `#0F0F0F` | `#5DD62C` | 7.2:1 | ✅ AAA |
| Success badge | `#052E16` | `#4ADE80` | 7.8:1 | ✅ AAA |
| Warning badge | `#451A03` | `#FBBF24` | 8.2:1 | ✅ AAA |
| Danger badge | `#450A0A` | `#F87171` | 6.4:1 | ✅ AAA |

---

## Keyboard Navigation

### General Rules

- **Tab order matches visual reading order** (left-to-right, top-to-bottom)
- Every interactive element (links, buttons, inputs, selects, details/summaries) must be focusable
- **No keyboard traps** — user can always Tab out of any component
- Modals trap focus while open; `Escape` closes the modal and returns focus to the trigger
- Dropdown menus: Arrow keys navigate items, Enter/Space selects, Escape closes

### Focus Indicators

The focus indicator is defined globally in `globals.css`:

```css
:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}
```

- In light mode: `--ring` is `#5DD62C` (lime green)
- In dark mode: `--ring` is `#5DD62C` (lime green) — passes 7.2:1 on `#0F0F0F`
- **Never use `outline: none`** or `outline-0` without providing an alternative focus ring

### Skip to Main Content Link

Add an accessible skip link at the top of the body:

```tsx
// components/skip-link.tsx
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-xl focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-lg focus:outline-none"
    >
      Skip to main content
    </a>
  )
}
```

Add `id="main-content"` to the `<main>` tag in `AppShell`.

---

## Screen Reader Guidelines

### Financial Amounts

Screen readers can struggle with the rupee symbol and Indian number groupings:

```tsx
// ✅ Correct — accessible amount
<span aria-label={`${formatINR(amount)}`}>
  <span aria-hidden="true">{formatINR(amount)}</span>
</span>

// Even better — spelled out for critical totals
<span aria-label={`${amount} rupees`}>
  <span aria-hidden="true">{formatINR(amount)}</span>
</span>
```

### Status Badges

Badges must convey their meaning in text, not just color:

```tsx
// ✅ Correct — status text included
<Badge className="bg-success-soft text-success">
  <CheckCircle className="size-3 mr-1" aria-hidden="true" />
  <span>Paid</span>
</Badge>

// ❌ Wrong — icon only or color only
<div className="size-3 rounded-full bg-green-500" />
```

### Icons

All decorative icons must be hidden from screen readers:

```tsx
// Decorative icon — hide it
<CalendarClock className="size-4" aria-hidden="true" />

// Functional icon (button) — provide label
<button aria-label="Delete bill">
  <Trash2 className="size-4" aria-hidden="true" />
</button>
```

### Live Regions for Dynamic Updates

When an action causes dynamic content changes (like AutoPay running, or a payment completing), announce it to screen readers:

```tsx
// In components that update asynchronously
<div role="status" aria-live="polite" className="sr-only">
  {statusMessage}
</div>
```

---

## Form Accessibility

### Label Association

Every form control must have a visible `<label>` with a matching `htmlFor` / `id`:

```tsx
// ✅ Correct
<Label htmlFor="bill-name">Bill name</Label>
<Input id="bill-name" aria-describedby="bill-name-hint" />
<p id="bill-name-hint" className="text-xs text-muted-foreground">
  e.g. Bescom Electricity, Airtel Fiber
</p>

// ❌ Wrong — no association
<Label>Bill name</Label>
<Input placeholder="Enter name" />
```

### Error Messages

Associate error messages with inputs using `aria-describedby` and `aria-invalid`:

```tsx
<Input
  id="amount"
  aria-invalid={Boolean(errors.amount)}
  aria-describedby={errors.amount ? "amount-error" : undefined}
/>
{errors.amount && (
  <p id="amount-error" role="alert" className="text-xs text-destructive">
    {errors.amount.message}
  </p>
)}
```

---

## Touch Targets (Mobile)

All tappable elements must meet the **44×44px** minimum:

```tsx
// ✅ Correct — adequate touch target via padding
<button className="flex min-h-[44px] min-w-[44px] items-center justify-center p-2.5">
  <MoreVertical className="size-5" />
</button>

// ❌ Wrong — too small to tap reliably
<button className="p-1">
  <MoreVertical className="size-4" />
</button>
```

---

## Reduced Motion

Respect the user's OS-level motion preference:

```css
/* In globals.css */
@media (prefers-reduced-motion: reduce) {
  *,
  ::before,
  ::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

This globally disables non-essential animations when the user prefers reduced motion.

---

## Accessibility Checklist for Each Screen

Before marking any screen complete, verify:

- [ ] Can navigate all interactive elements using `Tab` only
- [ ] Focus indicator clearly visible on every focused element
- [ ] No keyboard traps (can tab out of every component)
- [ ] All icon buttons have an `aria-label`
- [ ] Decorative icons have `aria-hidden="true"`
- [ ] All inputs have associated `<Label htmlFor="...">`
- [ ] Form errors announce to screen readers via `role="alert"`
- [ ] Color is not the sole indicator of status (always pair with text or icon)
- [ ] Touch targets are at least 44×44px on mobile
- [ ] Color contrast meets 4.5:1 for normal text and 3.0:1 for large text
- [ ] Modals close on `Escape` key and restore focus
- [ ] Financial amounts read clearly with a screen reader
