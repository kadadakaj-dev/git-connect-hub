

# Liquid Glass zjednotenie — všetky stránky

Stránky **AdminLogin** a **ClientAuth** už používajú `GlassBackground` + glass karty. Tieto 4 stránky ešte používajú starý `bg-gradient-to-br from-slate-100` pozadie bez glass efektov:

## Stránky na úpravu

### 1. `src/pages/NotFound.tsx`
- Pridať `GlassBackground` komponent
- Nahradiť `bg-gradient-to-br from-slate-100...` za `relative overflow-hidden`
- Zabaliť obsah do glass karty (`backdrop-blur-xl bg-[var(--glass-white)] border border-[var(--glass-border)] shadow-glass` + reflection `before:`)

### 2. `src/pages/AdminResetPassword.tsx`
- Pridať `GlassBackground` komponent
- Nahradiť `bg-gradient-to-br from-slate-100...` za `relative overflow-hidden`
- Card komponent už má glass štýly, len treba zmeniť pozadie na GlassBackground

### 3. `src/pages/CancelBooking.tsx`
- Pridať `GlassBackground` komponent
- Nahradiť `bg-gradient-to-br from-slate-100...` za `relative overflow-hidden`
- Inline glass štýly (`bg-white/75 backdrop-blur-2xl...`) nahradiť za konzistentné `var(--glass-*)` tokeny

### 4. `src/pages/Legal.tsx`
- Pridať `GlassBackground` komponent
- Nahradiť `bg-gradient-to-br from-slate-100...` za `relative overflow-hidden`
- Inline glass štýly v tab content kartách nahradiť za `var(--glass-*)` tokeny

## Vzor zmeny (rovnaký pre všetky)
```
- bg-gradient-to-br from-slate-100 via-blue-50/80 to-slate-200
+ relative overflow-hidden
+ <GlassBackground />
```

Karty: použiť `backdrop-blur-xl bg-[var(--glass-white)] border border-[var(--glass-border)] shadow-glass` + reflection overlay, konzistentne s AdminLogin/ClientAuth.

