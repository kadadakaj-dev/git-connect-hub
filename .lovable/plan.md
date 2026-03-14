

# Nahradenie `.glass` CSS triedy za `GlassCard` komponent

## Stav
Všetky 3 stránky už majú `GlassBackground`. Používajú však CSS triedu `.glass` namiesto zdieľaného `GlassCard` komponentu, ktorý využíva CSS premenné (`var(--glass-*)`).

## Zmeny

### 1. NotFound.tsx
- Nahradiť `<div className="glass rounded-2xl p-8 md:p-12 ...">` za `<GlassCard className="p-8 md:p-12 text-center max-w-md mx-4">`

### 2. Legal.tsx (2 miesta)
- Terms tab: nahradiť `<div className="glass rounded-xl p-6 md:p-8">` za `<GlassCard className="rounded-xl p-6 md:p-8">`
- Privacy tab: rovnaká zmena

### 3. CancelBooking.tsx
- Booking details: nahradiť `<div className="glass rounded-xl p-6 ...">` za `<GlassCard className="rounded-xl p-6 text-left max-w-md mx-auto">`

Celkovo 4 nahradenia inline `.glass` triedy za `GlassCard` komponent pre konzistentný glass dizajn.

