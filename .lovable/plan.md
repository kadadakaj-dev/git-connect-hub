

## Prompt na prepracovanie mesačného kalendára

Tu je prompt, ktorý môžeš použiť na implementáciu:

---

**Prepracuj mesačný pohľad kalendára (MonthView) na pixel-perfect dizajn:**

1. **Čísla dní** — Väčšie, ostrejšie, semi-bold font (text-base font-semibold). Dnešný deň zvýraznený plným kruhom (bg-primary text-white w-7 h-7 rounded-full flex items-center justify-center). Dni mimo aktuálneho mesiaca jemne vyblednuté (opacity-30).

2. **Mriežka** — Jemné 1px bordery (border-border/30), rovnomerné padding (p-2), minimálna výška buniek min-h-[100px]. Hlavička dní týždňa uppercase, tracking-wider, text-xs, font-medium.

3. **Eventy** — Zaoblené pill tvary (rounded-md), ľavý farebný prúžok (border-l-3), jemný shadow-sm, hover efekt (hover:shadow-md transition-shadow). Čas bold, názov regular.

4. **Blokované dni** — Jemný diagonálny šrafovaný pattern namiesto plného pozadia, červený text.

5. **Spacing** — Konzistentný 8px grid systém, gap-1 medzi eventmi, číslo dňa vždy hore vpravo.

6. **Hover na bunku** — Jemný bg-accent/20 transition pre celú bunku.

Zachovaj existujúcu funkčnosť: drag & drop, kliknutie na bunku (vytvoriť event), kliknutie na event (editovať), filtrovanie podľa terapeuta, zobrazenie blokovaných dátumov.

---

