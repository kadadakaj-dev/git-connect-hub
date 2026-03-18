

## Aktualizácia storno podmienok na presné znenie

Telefónne číslo predpokladám ako **+421 905 307 198** (kompletné, ako je v systéme).

### Presné znenie (SK)

**Storno podmienky:**
- Rezerváciu je možné zrušiť online najneskôr 12 hodín pred termínom.
- Menej ako 12 hodín pred termínom je zrušenie možné, len telefonicky: +421 905 307 198 ale bude Vám účtovaný storno poplatok 10 €.

### Presné znenie (EN)

**Cancellation policy:**
- You can cancel online up to 12 hours before your appointment.
- Less than 12 hours before, cancellation is only possible by phone: +421 905 307 198 and a cancellation fee of €10 will be charged.

### Zmeny v súboroch

**1. `src/pages/CancelBooking.tsx`** — tooLateText (SK + EN)
- SK: Zmeniť na dve vety podľa presného znenia
- EN: Zmeniť na dve vety podľa presného znenia

**2. `src/pages/Legal.tsx`** — sekcia 3 (SK + EN)
- SK: Aktualizovať text na presné znenie (2 body namiesto 3, odstrániť vetu o nedostavení sa)
- EN: Aktualizovať text na presné znenie

**3. `supabase/functions/send-booking-email/index.ts`** — HTML aj text verzie
- Zmeniť z 3 bodov na 2 body podľa presného znenia (SK + EN)
- Odstrániť 3. bod o no-show poplatku

**4. `supabase/functions/cancel-booking/index.ts`** — error message (riadok 105)
- Aktualizovať message na presné znenie

### Súhrn
- 4 súbory (2 frontend + 2 edge functions)
- Hlavná zmena: zjednotenie na presne 2 body, zlúčenie telefónu a poplatku do jedného bodu

