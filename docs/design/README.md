# Tinku Design System — Documentation Hub

> **Phase 1 — Design Foundation & Planning**
> These documents are the single source of truth for Tinku's visual language, UX principles, and implementation strategy. Read them before touching any UI file.

---

## 📂 Document Index

| File | Purpose |
|------|---------|
| [`README.md`](./README.md) | This file — orientation and navigation |
| [`UX_PRINCIPLES.md`](./UX_PRINCIPLES.md) | The 10 UX principles that guide every screen |
| [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) | Overall design language and philosophy |
| [`COLOR_TOKENS.md`](./COLOR_TOKENS.md) | Brand palette + all semantic color tokens |
| [`TYPOGRAPHY.md`](./TYPOGRAPHY.md) | Font choice, type scale, and financial number formatting |
| [`SPACING_AND_LAYOUT.md`](./SPACING_AND_LAYOUT.md) | Spacing scale, layout containers, border radius, shadows |
| [`COMPONENT_GUIDELINES.md`](./COMPONENT_GUIDELINES.md) | Shadcn component specs and Tinku-specific components |
| [`THEME_GUIDELINES.md`](./THEME_GUIDELINES.md) | Light/Dark/System theme implementation |
| [`NAVIGATION_AND_INFORMATION_ARCHITECTURE.md`](./NAVIGATION_AND_INFORMATION_ARCHITECTURE.md) | Nav structure, IA, page hierarchy |
| [`RESPONSIVE_DESIGN.md`](./RESPONSIVE_DESIGN.md) | Breakpoints, mobile/tablet/desktop layouts |
| [`ACCESSIBILITY.md`](./ACCESSIBILITY.md) | WCAG AA compliance, keyboard nav, ARIA patterns |
| [`SCREEN_UX_GUIDELINES.md`](./SCREEN_UX_GUIDELINES.md) | Per-screen UX specs for every module |
| [`IMPLEMENTATION_PLAN.md`](./IMPLEMENTATION_PLAN.md) | Phased redesign roadmap and audit findings |

---

## 🗂 Relationship to Existing Documentation

The original design principles document lives at:
```
d:/paypal-hack/designUXprinciple.md
```

The docs in this `docs/design/` folder supersede and significantly expand that document. The original should be preserved as a historical reference but these files are authoritative going forward.

---

## 🎯 Scope and Boundaries

**What this documentation covers:**
- Visual design language (colors, typography, spacing, components)
- UX principles and decision-making framework
- Per-screen layout and interaction specs
- Theme system (light/dark/system)
- Accessibility requirements
- Implementation phasing

**What this documentation does NOT cover:**
- API design or backend logic
- Database schema
- Payment integration (PayPal/Sandbox) — see `/docs/paypal/` for that
- Authentication flows — preserved as-is
- Business logic

---

## 🏗 Application Architecture Context

**Tech Stack:**
- Next.js 16.3.3 (App Router + Turbopack)
- React 19
- TypeScript 5.7.3
- Tailwind CSS v4
- Shadcn UI (`style: base-nova`, `baseColor: neutral`)
- Lucide React (icons)
- `@base-ui/react` (Menu primitive — existing)
- AG Grid 35.3.1 (payment history table)
- Upstash Redis (data persistence)

**Route Groups:**
```
app/
├── (app)/           ← Protected routes (all main features)
│   ├── page.tsx     ← Dashboard (/)
│   ├── expenses/
│   ├── budgets/
│   ├── bills/
│   ├── autopay/
│   ├── drill/
│   ├── groups/
│   ├── history/
│   ├── notifications/
│   ├── payments/
│   └── settings/
└── (auth)/          ← Public routes
    ├── login/
    ├── signup/
    ├── verify/
    ├── forgot-password/
    └── reset-password/
```

**CSS Architecture:**
- `app/globals.css` — All CSS custom properties (Tailwind v4 `@theme inline` block + `:root` + `.dark`)
- Shadcn CSS variables already wired (sidebar, chart, semantic tokens)
- Current theme: `.dark` class-based switching (ready for toggle)
- System preference: `@media (prefers-color-scheme: dark)` applies when no `.light` class is set

---

## 👥 Who Should Read This

| Role | Documents to prioritize |
|------|------------------------|
| Developer implementing a screen | `COLOR_TOKENS.md`, `TYPOGRAPHY.md`, `SPACING_AND_LAYOUT.md`, `COMPONENT_GUIDELINES.md`, `SCREEN_UX_GUIDELINES.md` |
| Developer implementing themes | `THEME_GUIDELINES.md`, `COLOR_TOKENS.md` |
| Developer implementing navigation | `NAVIGATION_AND_INFORMATION_ARCHITECTURE.md`, `RESPONSIVE_DESIGN.md` |
| Any contributor | `UX_PRINCIPLES.md` (always read first) |
| AI coding agent | All files, in order, before making any changes |

---

## ⚠️ Implementation Rules

1. **Never bypass the design system.** Use defined tokens, not raw hex values in component files.
2. **Never hardcode spacing.** Use the defined spacing scale (multiples of 4px via Tailwind classes).
3. **Never introduce a new color not in the palette** without documenting it in `COLOR_TOKENS.md`.
4. **Shadcn UI first.** If a UI need can be met by Shadcn, use Shadcn. Avoid adding new UI libraries.
5. **Preserve existing functionality.** The redesign changes appearance only — no routes, no APIs, no business logic changes.
6. **Mobile-first.** Write styles for mobile viewport first, then scale up with responsive modifiers.
7. **Both themes must work.** Test every component in both light and dark mode before marking a screen done.
8. **Accessibility is not optional.** Every interactive element needs keyboard support and appropriate ARIA attributes.

---

## 📋 Phase Checklist

- [x] Phase 1: Design Foundation & Documentation ← **YOU ARE HERE**
- [ ] Phase 2: Theme System Implementation
- [ ] Phase 3: Dashboard Redesign
- [ ] Phase 4: Expenses & Budgets
- [ ] Phase 5: Bills, AutoPay & History
- [ ] Phase 6: Crisis Drill & Groups
- [ ] Phase 7: Settings & Auth
- [ ] Phase 8: Polish, Accessibility Audit & Launch

