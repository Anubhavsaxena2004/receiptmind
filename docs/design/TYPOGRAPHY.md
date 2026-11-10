# Tinku Typography

> Typography is the backbone of financial readability. Users need to scan amounts quickly, understand hierarchy at a glance, and read comfortably across all screen sizes.

---

## Font Choice

### Primary Font: Plus Jakarta Sans

**Why Plus Jakarta Sans:**
- Excellent legibility at small sizes (crucial for financial data)
- Geometric sans-serif with a warm, modern character (not coldly technical)
- Strong tabular number support (all digits same width for aligning amounts)
- Great Indian market adoption — feels contemporary and familiar
- Superior bold weights for financial headlines
- Available on Google Fonts (free, no licensing concerns)

**Fallback stack:**
```
'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif
```

### Google Fonts Import

Add to `app/layout.tsx` (or as `next/font/google` for optimal performance):

```typescript
// app/layout.tsx
import { Plus_Jakarta_Sans } from 'next/font/google'

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
})

// Apply to <html>:
// className={plusJakartaSans.variable}
```

Then in `globals.css` (Tailwind v4):
```css
@theme inline {
  --font-sans: var(--font-sans);
}
```

---

## Type Scale

### Display — Hero Numbers and Primary Metrics

| Step | Size | Weight | Line Height | Use |
|---|---|---|---|---|
| `display-xl` | 48px / 3rem | 800 | 1.1 | Total balance on hero card (desktop) |
| `display-lg` | 36px / 2.25rem | 800 | 1.15 | Total balance (mobile), drill score |
| `display-md` | 30px / 1.875rem | 700 | 1.2 | Major stat, monthly total |

### Headings — Page and Section Structure

| Step | Size | Weight | Line Height | Tailwind | Use |
|---|---|---|---|---|---|
| `h1` | 24px / 1.5rem | 700 | 1.25 | `text-2xl font-bold` | Page title (mobile) |
| `h1-lg` | 30px / 1.875rem | 700 | 1.25 | `sm:text-3xl font-bold` | Page title (desktop) |
| `h2` | 20px / 1.25rem | 700 | 1.3 | `text-xl font-bold` | Section heading, card heading |
| `h3` | 16px / 1rem | 700 | 1.4 | `text-base font-bold` | Subsection, widget title |
| `h4` | 14px / 0.875rem | 600 | 1.4 | `text-sm font-semibold` | Group label, card subheading |

### Body — Reading and Supporting Text

| Step | Size | Weight | Line Height | Tailwind | Use |
|---|---|---|---|---|---|
| `body-lg` | 16px / 1rem | 400 | 1.6 | `text-base` | Primary body text, descriptions |
| `body-md` | 14px / 0.875rem | 400 | 1.5 | `text-sm` | Card content, form labels, list items |
| `body-sm` | 12px / 0.75rem | 400 | 1.5 | `text-xs` | Supporting text, timestamps, hints |
| `body-xs` | 11px / 0.6875rem | 500 | 1.4 | `text-[11px] font-medium` | Badges, tags, nav section labels |

### Financial Numbers — Amounts and Metrics

| Step | Size | Weight | Features | Tailwind | Use |
|---|---|---|---|---|---|
| `fin-xl` | 36px+ | 800 | tabular-nums | `text-4xl font-extrabold tabular-nums` | Hero balance |
| `fin-lg` | 24px | 700 | tabular-nums | `text-2xl font-bold tabular-nums` | Stat cards, bill totals |
| `fin-md` | 20px | 700 | tabular-nums | `text-xl font-bold tabular-nums` | Card amounts |
| `fin-sm` | 16px | 600 | tabular-nums | `text-base font-semibold tabular-nums` | List item amounts |
| `fin-xs` | 14px | 600 | tabular-nums | `text-sm font-semibold tabular-nums` | Inline amounts, secondary amounts |

> [!IMPORTANT]
> **Always use `tabular-nums` for financial amounts.** This CSS feature (`font-variant-numeric: tabular-nums`) ensures all digits are the same width, making amounts scannable and comparable in a list.

### Labels and Captions

| Step | Size | Weight | Tailwind | Use |
|---|---|---|---|---|
| `label` | 12px | 500 | `text-xs font-medium` | Form field labels, input labels |
| `label-sm` | 11px | 600 | `text-[11px] font-semibold` | Navigation section labels (uppercase + tracking) |
| `caption` | 11px | 400 | `text-[11px]` | Helper text, footnotes, timestamps |

---

## Font Weight Reference

| Weight | Value | Use |
|---|---|---|
| Regular | 400 | Body text, descriptions, secondary content |
| Medium | 500 | Slightly emphasized labels, secondary headings |
| Semibold | 600 | Card headings, button labels, amounts, nav items |
| Bold | 700 | Page headings, section titles, stat card amounts |
| Extrabold | 800 | Hero numbers, balance display, primary metrics |

---

## Tracking (Letter Spacing)

| Use Case | Value | Tailwind |
|---|---|---|
| Body text | 0 | (default) |
| Headings | -0.025em | `tracking-tight` |
| Hero numbers | -0.05em | `tracking-tighter` |
| Nav section labels | 0.14em | `tracking-[0.14em]` |
| Badges | 0.025em | `tracking-wide` |
| Uppercase labels | 0.08em | `tracking-widest` or custom |

---

## Line Heights

| Use | Line Height | Tailwind |
|---|---|---|
| Hero numbers | 1.1 | `leading-none` |
| Headings | 1.25 | `leading-tight` |
| Subheadings | 1.4 | `leading-snug` |
| Body text | 1.5–1.6 | `leading-normal` / `leading-relaxed` |
| Captions | 1.4 | `leading-snug` |

---

## Financial Number Formatting

### INR Format Rules

Tinku operates exclusively in Indian Rupees. All amounts must follow the Indian numbering system:

```
₹ [space optional] [digits in Indian grouping]

Examples:
✅ ₹1,23,456.00    (lakh grouping)
✅ ₹45,000.00
✅ ₹999.50
✅ ₹0.00
❌ ₹123,456.00     (US grouping — wrong)
❌ 1,23,456 ₹      (symbol after — wrong)
❌ INR 1,23,456    (text prefix — wrong)
❌ Rs. 1,23,456    (old format — avoid)
```

The existing `formatINR()` function in `lib/format.ts` handles this correctly. Always use it.

### Amount Color Coding

| Amount Type | Color Token | Example |
|---|---|---|
| Positive / Income | `text-success` | +₹45,000.00 |
| Expense / Outflow | `text-danger` | −₹1,200.00 |
| Neutral / Balance | `text-foreground` | ₹1,23,456.00 |
| Zero | `text-muted-foreground` | ₹0.00 |
| Overdue / Alert | `text-danger font-bold` | ₹3,500.00 (overdue) |

### Prefix Convention

| Situation | Prefix |
|---|---|
| Plain amount | ₹1,200 (no prefix) |
| Explicitly positive (income, credit) | +₹1,200 |
| Explicitly negative (expense, debit) | −₹1,200 (use minus sign −, not hyphen -) |
| Remaining budget | ₹X left (label context) |
| Due amount | ₹X due (label context) |

---

## Responsive Typography

### Mobile (< 640px)

- Page h1: `text-2xl font-bold` (24px)
- Hero balance: `text-3xl font-extrabold tabular-nums` (30px)
- Stat card amounts: `text-xl font-bold tabular-nums` (20px)
- Body: `text-sm` (14px)

### Tablet / Desktop (≥ 640px)

- Page h1: `sm:text-3xl font-bold` (30px)
- Hero balance: `sm:text-4xl font-extrabold tabular-nums` (36px)
- Stat card amounts: `sm:text-2xl font-bold tabular-nums` (24px)
- Body: `text-sm` or `text-base` depending on context

---

## Typography Anti-Patterns

| Anti-Pattern | Correct Approach |
|---|---|
| Using `text-lg font-normal` for amounts | Use `font-semibold` or `font-bold` with `tabular-nums` |
| Mixing 3 different font sizes on one card | Max 2 sizes per card (heading + content) |
| Body text smaller than 12px | Minimum 12px (11px only for badges/captions) |
| US-format numbers (₹123,456) | Indian format (₹1,23,456) via `formatINR()` |
| Color as only emphasis (colorblind) | Combine color + weight/size for status |
| `font-bold` for everything | Reserve bold for headings; use semibold for data |
| Uppercase body text | Uppercase only for navigation section labels |

