

# Liquid Glass UI Enhancement Plan

## Overview
Upgrade the existing light glassmorphism aesthetic to a full **Liquid Glass** design system based on the provided CSS kit. The project already uses glass-like styling (backdrop-blur, semi-transparent whites). This plan deepens that with animated background blobs, reflection layers, refined glass tokens, and component-level glass enhancements.

## What Changes

### 1. CSS Design Tokens (`src/index.css`)
Add glass-specific custom properties alongside existing Tailwind HSL tokens:
- Glass surface tints (`--glass-white`, `--glass-white-md`, `--glass-white-lg`)
- Glass borders (`--glass-border`, `--glass-border-subtle`, `--glass-border-bright`)
- Blur scale (`--blur-sm/md/lg/xl`)
- Shadows (`--shadow-glass`, `--shadow-float`)
- Reflection gradients (`--reflection-top`, `--reflection-inner`)
- Easing/duration tokens for liquid animations
- All tuned for light theme (the project is light-only since dark vars mirror light)

### 2. Animated Background Scene
Add a fixed background layer with 3 animated gradient blobs (aqua/blue, violet/pink, amber/rose) using `filter: blur(80px)` and slow drift keyframes. Low opacity (~0.25) to stay subtle on the light background. This replaces the static `bg-gradient-to-br from-slate-100 via-blue-50/80 to-slate-200`.

Create a reusable `GlassBackground` React component used in BookingWizard, ClientPortal, AdminDashboard, ClientAuth, AdminLogin.

### 3. Glass Utility Classes Enhancement (`src/index.css`)
Update existing `.glass-card` and `.glass-premium` classes and add new utilities:
- `.glass` base: backdrop-filter + border + shadow + `::before` reflection overlay
- `.glass-card`: hover lift (`translateY(-4px)`) + float shadow + shimmer `::after`
- Keep Tailwind composition working alongside these classes

### 4. Component Style Updates

**Cards** (inline in components): Enhance `GlassCard` wrapper in BookingWizard with reflection `::before` pseudo-element via the `.glass` class, and hover lift animation.

**Buttons** (`src/components/ui/button.tsx`): Add a `glass` variant with glass surface, border, reflection inner shadow, and liquid hover transform.

**Inputs** (`src/components/ui/input.tsx`): Add glass focus ring (colored glow instead of plain ring), glass background on focus.

**Dialogs** (`src/components/ui/dialog.tsx`): Update overlay to use backdrop-blur, modal content gets glass surface with top accent gradient bar and reflection.

**Tabs** (`src/components/ui/tabs.tsx`): Glass pill container with glass-active state on selected tab.

**Switch** (`src/components/ui/switch.tsx`): Glass track with inner reflection, glowing thumb on checked.

**Tooltips** (`src/components/ui/tooltip.tsx`): Glass surface with blur and border.

**Toast** (`src/components/ui/sonner.tsx`): Glass surface styling.

### 5. Animations (`tailwind.config.ts` + `src/index.css`)
Add keyframes:
- `blob-drift` for background blobs
- Enhanced `fade-in-up` with liquid easing
- `prefers-reduced-motion` media query to disable all animations

### 6. Pages Updated
- **BookingWizard**: Replace static gradient bg with `<GlassBackground />`, keep `GlassCard` but apply `.glass` class
- **ClientPortal**: Same background treatment
- **AdminDashboard**: Same background treatment
- **ClientAuth / AdminLogin**: Same background treatment

## Technical Details

Files modified:
- `src/index.css` — Add ~120 lines of glass tokens + utility classes + blob keyframes + reduced-motion
- `tailwind.config.ts` — Add liquid easing, glass shadow tokens
- `src/components/ui/button.tsx` — Add `glass` variant
- `src/components/ui/input.tsx` — Glass focus styles
- `src/components/ui/dialog.tsx` — Glass modal with accent bar
- `src/components/ui/tabs.tsx` — Glass pill styling
- `src/components/ui/switch.tsx` — Glass track
- `src/components/ui/tooltip.tsx` — Glass surface
- `src/components/ui/sonner.tsx` — Glass toast

New files:
- `src/components/GlassBackground.tsx` — Animated blob background component

Pages updated (background swap):
- `src/components/booking/BookingWizard.tsx`
- `src/pages/ClientPortal.tsx`
- `src/pages/AdminDashboard.tsx`
- `src/pages/ClientAuth.tsx`
- `src/pages/AdminLogin.tsx`

No database or backend changes needed.

