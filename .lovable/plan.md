

# Redizajn Express karty — Liquid Glass štýl

## Zmeny

### 1. `src/components/booking/ServiceSelection.tsx` (riadky 40-77)
Nahradiť Express blok novým dizajnom:

- **Glass pozadie** — `backdrop-blur-xl bg-[var(--glass-white)] border border-[var(--glass-border)]` + `shadow-glass` + `::before` reflection overlay (rovnaký vzor ako Card komponent)
- **Amber accent gradient** — jemný `bg-gradient-to-r from-amber-500/8 to-orange-500/5` overlay vnútri glass karty na odlíšenie od modrých service kariet
- **Layout**:
  - Horný riadok: `⚡ EXPRESNÝ TERMÍN` badge (amber pill, glass štýl) vľavo, veľké `+15 €` vpravo s menším "k cene" pod tým
  - Stredný riadok: `Do 36h · víkendy · sviatky` — krátky, čistý popis
  - Spodný riadok: Glass CTA tlačidlo `tel:` link s ikonou Phone a číslom, amber/orange border
- **Hover efekt** — `hover:-translate-y-1 hover:shadow-glass-float` konzistentný s glass-card triedou
- **Reflection** — `before:` pseudo-element s `var(--reflection-top)` gradient

### 2. `src/i18n/translations.ts`
Pridať preklady pre oba jazyky:
- `expressLabel`: "⚡ Expresný termín" / "⚡ Express Appointment"
- `expressDesc`: "Do 36h · víkendy · sviatky" / "Within 36h · weekends · holidays"  
- `expressSurcharge`: "k cene služby" / "added to service price"
- `expressCta`: "Zavolajte nám" / "Call us"

### Súbory
1. **`src/components/booking/ServiceSelection.tsx`** — prepísať Express blok
2. **`src/i18n/translations.ts`** — pridať 4 prekladové kľúče

