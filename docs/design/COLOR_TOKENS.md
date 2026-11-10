# Tinku Color Tokens

> This is the definitive color reference for Tinku. **Never use raw hex values in component files.** Always use the CSS custom property tokens or their corresponding Tailwind utility classes.

---

## Brand Palette (Vibrant Orange Design System)

### Dark Theme

| Token | HEX | Purpose |
|---|---|---|
| Background | `#181817` | Primary dark canvas background |
| Surface | `#272727` | Secondary surface / muted sections |
| Card | `#343333` | Card & container surfaces |
| Elevated Surface | `#52514F` | Elevated popups, borders & dividers |
| Primary Accent | `#F25A0C` | Primary brand accent — CTAs, active pills, badges |
| Secondary Accent | `#F7854A` | Secondary brand accent — progress highlights |
| Primary Text | `#FBFBFB` | Headings & high-emphasis text |
| Secondary Text | `#999A9A` | Supporting descriptions & labels |
| Muted Text | `#777876` | Low-emphasis metadata & timestamps |
| Border | `#52514F` | Structural borders |

### Light Theme

| Token | HEX | Purpose |
|---|---|---|
| Background | `#FEFEFD` | Primary clean light canvas background |
| Surface | `#F7F7F5` | Secondary surface / muted sections |
| Card | `#FFFFFF` | Pure white card surfaces |
| Primary Accent | `#FB7507` | Primary brand accent — CTAs, active pills, badges |
| Secondary Accent | `#D97C2F` | Secondary accent |
| Warm Accent | `#EDAC72` | Warm secondary accent |
| Primary Text | `#0E0D0D` | Headings & high-emphasis text |
| Secondary Text | `#615A56` | Supporting descriptions & labels |
| Muted Text | `#878584` | Low-emphasis metadata & timestamps |
| Border | `#DCD7D3` | Structural borders |

---

## Complete Semantic Token Table

| Token | CSS Variable | Light Value | Dark Value | Tailwind Class |
|---|---|---|---|---|
| Background | `--background` | `#FEFEFD` | `#181817` | `bg-background` / `text-background` |
| Surface | `--surface` | `#F7F7F5` | `#272727` | `bg-surface` |
| Card | `--card` | `#FFFFFF` | `#343333` | `bg-card` |
| Card Foreground | `--card-foreground` | `#0E0D0D` | `#FBFBFB` | `text-card-foreground` |
| Elevated | `--elevated` | `#E8E3DF` | `#52514F` | `bg-elevated` |
| Popover | `--popover` | `#FFFFFF` | `#272727` | `bg-popover` |
| Popover Foreground | `--popover-foreground` | `#0E0D0D` | `#FBFBFB` | `text-popover-foreground` |
| Primary | `--primary` | `#FB7507` | `#F25A0C` | `bg-primary` / `text-primary` |
| Primary Foreground | `--primary-foreground` | `#FFFFFF` | `#FFFFFF` | `text-primary-foreground` |
| Secondary | `--secondary` | `#FFF5ED` | `#30241E` | `bg-secondary` |
| Secondary Foreground | `--secondary-foreground` | `#D97C2F` | `#F7854A` | `text-secondary-foreground` |
| Muted | `--muted` | `#F7F7F5` | `#272727` | `bg-muted` |
| Muted Foreground | `--muted-foreground` | `#615A56` | `#999A9A` | `text-muted-foreground` |
| Muted Text Subtle | `--text-muted` | `#878584` | `#777876` | `text-muted` |
| Border | `--border` | `#DCD7D3` | `#52514F` | `border-border` |
| Input | `--input` | `#DCD7D3` | `#52514F` | (input fields) |
| Ring | `--ring` | `#FB7507` | `#F25A0C` | (focus rings) |
| Success | `--success` | `#16A34A` | `#4ADE80` | `text-success` / `bg-success` |
| Success Soft | `--success-soft` | `#DCFCE7` | `#052E16` | `bg-success-soft` |
| Warning | `--warning` | `#D97706` | `#FBBF24` | `text-warning` |
| Warning Soft | `--warning-soft` | `#FEF3C7` | `#451A03` | `bg-warning-soft` |
| Destructive / Danger | `--danger` | `#DC2626` | `#F87171` | `text-danger` / `bg-danger` |
| Info | `--info` | `#2563EB` | `#60A5FA` | `text-info` |

---

## Chart Tokens

| Token | CSS Variable | Light Value | Dark Value |
|---|---|---|---|
| Chart 1 (Primary) | `--chart-1` | `#FB7507` | `#F25A0C` |
| Chart 2 (Secondary) | `--chart-2` | `#D97C2F` | `#F7854A` |
| Chart 3 (Accent) | `--chart-3` | `#EDAC72` | `#FB923C` |
| Chart 4 (Muted) | `--chart-4` | `#DCD7D3` | `#52514F` |
| Chart 5 (Subtle) | `--chart-5` | `#878584` | `#777876` |
