

# "Apple Pro" Redesign — Baby Blue + Sapphire + Slate

## Summary
Full visual redesign: baby blue primary color (soft, not krikľavá), slate gray foreground (nie čistá čierna), sharp 0.5rem corners, ultra-subtle shadows, sticky header with contacts, service cards with active left-border, iOS-style calendar, sidebar summary on step 3, receipt-style confirmation. Keep all existing logic untouched.

## Color Tokens (`src/index.css`)

```text
--primary:            210 70% 55%     (sapphire baby blue)
--primary-foreground: 0 0% 100%
--foreground:         215 25% 15%     (slate charcoal)
--background:         210 40% 98.5%   (cloud white)
--card:               0 0% 100%
--muted:              210 20% 96%
--muted-foreground:   215 15% 50%
--border:             210 20% 90%
--input:              210 20% 88%
--ring:               210 70% 55%     (= primary)
--destructive:        0 65% 55%
--success:            152 55% 48%
--accent:             210 40% 95%
--navy:               210 70% 55%     (= primary)
```

Dark mode = identical (no dark mode). Focus ring = baby blue. Selection = baby blue/10%.

## Files to Change

### 1. `src/index.css`
- Replace all monochrome `0 0%` values with palette above
- Add subtle utility classes: `.glass-card` = white bg + `0 1px 2px rgba(0,0,0,0.04)` border + 1px border-border
- Remove leftover atmospheric classes (gradient-hero, bg-noise, grid-pattern, glass-premium, text-gradient, etc.)
- Scrollbar thumb = primary/30%, focus ring = primary, selection = primary/10%

### 2. `tailwind.config.ts`
- Keep `--radius: 0.5rem`
- Add shadow: `soft: '0 1px 2px rgba(0,0,0,0.04)'`, `elevated: '0 2px 8px rgba(0,0,0,0.06)'`

### 3. `src/components/booking/BookingWizard.tsx`
- Remove all atmospheric blobs/gradients (lines 161-185)
- Add sticky header bar at top: logo "FYZIO&FIT" left, phone + email right, thin bottom border
- Simplify hero: "FYZIO&FIT" h1 in slate, "Rezervuj si termín" subtitle in muted
- Remove trust badges, Sparkles badge, ThemeToggle
- Clean nav buttons: primary CTA = baby blue bg, ghost back button
- On step 3: wrap content in 2-col layout (form left, sidebar summary right)

### 4. `src/components/booking/ServiceSelection.tsx`
- Replace `SpotlightCard` with plain `<button>`
- Cards: white bg, 1px border, `shadow-soft`, rounded-lg (0.5rem)
- Selected state: `border-l-[3px] border-l-primary bg-primary/5` (sharp left accent)
- Price in separate gray block (`bg-muted rounded-md px-3 py-1`)
- Remove Popular badge, category badge, bottom highlight, checkmark indicator
- Hover: slight shadow increase, no scale transform

### 5. `src/components/booking/DateTimeSelection.tsx`
- Calendar: white card, tight grid (gap-0.5), no glass-premium
- Selected date: primary bg circle
- Time slots: compact pills, selected = primary bg, no glass effects
- Unified block feel (calendar + times in one card on mobile, side-by-side on desktop)
- Remove float animations, shimmer effects

### 6. `src/components/booking/ClientDetails.tsx`
- Step 3 layout: 2-column on lg (form + sidebar)
- Sidebar panel: "Zhrnutie rezervácie" card showing selected service, date, time, price
- Below summary: trust badge "GDPR • Vaše údaje sú v bezpečí"
- Inputs: white bg, 1px border, baby blue focus border, no icon containers with bg
- Remove shadow-inner-glow, glass-premium

### 7. `src/components/booking/Confirmation.tsx`
- Receipt-style compact card: thin top border in primary
- Remove PartyPopper, Sparkles, ping animations, large success icon
- Small checkmark + "Rezervácia potvrdená" header
- Clean data rows: service, date, time, client info — simple text, no icon boxes
- Confirmation number prominent at top

### 8. `src/components/booking/ProgressBar.tsx`
- Steps: primary color for active/completed, border/muted for upcoming
- Remove glass-card wrapper, use simple border-b
- Remove SVG number icons, use simple text numbers (1, 2, 3)

### 9. `src/components/Footer.tsx`
- White bg, top 1px border
- Remove glass-card from items, backdrop-blur
- Simple inline text links, primary color on icons
- Remove gradient decorative border

### 10. `src/components/ui/button.tsx`
- `default` / `booking` / `navy`: baby blue bg, white text, shadow-soft
- `outline`: 1px border, hover bg-primary/5
- Remove shimmer effects from BookingWizard CTA

### 11. `src/components/ui/SpotlightCard.tsx`
- Remove spotlight mouse-tracking logic, simplify to basic wrapper div/button (or remove and replace usages inline)

## What stays unchanged
- All hooks, edge functions, routing, i18n, types, Supabase integration
- Component architecture and props
- Business logic in BookingWizard (validation, booking creation)

