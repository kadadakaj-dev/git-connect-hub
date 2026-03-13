

## Problem Analysis

Looking at the screenshot and code, the issue is clear: the page background is an overwhelming blue gradient (`from-primary/80 via-primary/60 to-ring/70`) which drowns out the liquid glass effect. True liquid glass needs a subtle, neutral background so the frosted glass cards stand out with depth and refraction, not compete with a saturated color wash.

## Plan: Liquid Glass Optimization

### 1. Reduce background saturation — shift to neutral-cool tones
Replace the heavy blue gradient with a soft, neutral gradient that lets the glass cards breathe:
- Background: `bg-gradient-to-br from-slate-100 via-blue-50/80 to-slate-200` — very subtle blue tint, mostly neutral
- This mimics Apple's approach: content floats on a light, airy surface

### 2. Upgrade GlassCard to true liquid glass effect
- Higher white opacity: `bg-white/75` instead of `/60`
- Add a subtle inner highlight: `shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6)]` for the refraction edge
- Refined outer shadow: `shadow-[0_8px_32px_rgba(0,0,0,0.08)]`
- Border: `border-white/60` for the frosted edge

### 3. Update header to match neutral background
- Header: `bg-white/70 backdrop-blur-2xl border-b border-black/5` — subtle, not white-on-blue

### 4. Fix section headers for neutral background
- Step numbers: change from white text on blue bg to primary-colored badges on neutral
- Step titles: `text-foreground` instead of `text-white`

### 5. Update footer
- Footer: `bg-white/60 backdrop-blur-xl border-t border-black/5` instead of `border-white/20`

### 6. Fix submit button
- Currently white on blue — change to primary button: `bg-primary text-white` for proper contrast on neutral bg

### Files to modify:
- `src/components/booking/BookingWizard.tsx` — background, GlassCard, header, SectionHeader, submit button
- `src/components/Footer.tsx` — border and bg adjustments for neutral context

