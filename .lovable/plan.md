

## Aktualizácia storno podmienok

Aktuálne storno podmienky v systéme sú nekonzistentné -- na rôznych miestach sa uvádzajú rôzne hodnoty (24h / 12h, 50% / 10€). Treba ich zjednotiť na:

- **12 hodín** pred termínom = bezplatné zrušenie online
- **Menej ako 12 hodín** = len telefonicky (+421 905 307 198) + **storno poplatok 10 €**

### Miesta na úpravu

**1. `src/pages/Legal.tsx` -- Obchodné podmienky (sekcia 3)**
- SK (riadok 29): zmeniť "24 hodín" → "12 hodín" a "50% z ceny služby" → "10 €"
- EN (riadok 57): zmeniť "24 hours" → "12 hours" a "50% of the service price" → "€10"
- Aktualizovať "Posledná aktualizácia" na Marec 2026

**2. `src/pages/CancelBooking.tsx` -- TOO_LATE_TO_CANCEL stav (riadky 53-55, 77-79)**
- Doplniť informáciu o storno poplatku 10 € do textu `tooLateText` v SK aj EN

**3. `supabase/functions/cancel-booking/index.ts` -- chybová správa (riadok 105)**
- Doplniť info o storno poplatku 10 € do `TOO_LATE_TO_CANCEL` message

**4. `supabase/functions/send-booking-email/index.ts` -- emailové šablóny**
- HTML aj text verzie (riadky 136-200) sú už správne (12h + 10€) -- bez zmeny

### Súhrn zmien
- 3 súbory, 2 frontend + 1 edge function
- Žiadne zmeny v dizajne ani UX

