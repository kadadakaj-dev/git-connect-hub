

## Plán: Oprava emailov + storno podmienky + 12h limit

### 1. Odstrániť prázdne riadky v HTML šablónach (=20 fix)

**Súbor:** `supabase/functions/send-booking-email/index.ts`

V `generateEmailHtml()` odstrániť 4 prázdne riadky:
- Riadok 99 (medzi `</tr>` a `<!-- Content -->`)
- Riadok 105 (medzi `</p>` a `<!-- Booking Details -->`)
- Riadok 134 (medzi `</table>` a `<!-- Cancel Section -->`)
- Riadok 140 (medzi `</tr>` a `<!-- Footer -->`)

Admin šablóna nemá prázdne riadky medzi tagmi — je OK.

### 2. Prepísať storno sekciu v emaile + pridať "Tešíme sa"

Aktuálne: jednoduchý text + červené tlačidlo "Zrušiť".

Nové znenie (SK):
- Pod booking details: **"Tešíme sa na Vašu návštevu!"**
- Storno sekcia s jasným boxom:
  - "Rezerváciu je možné zrušiť online najneskôr 12 hodín pred termínom."
  - "Menej ako 12 hodín pred termínom je zrušenie možné len telefonicky: +421 905 307 198"
  - "V prípade nezrušenej rezervácie Vám bude účtovaný storno poplatok 10 €."
  - Tlačidlo "Zrušiť rezerváciu"

Nové znenie (EN):
- "We look forward to seeing you!"
- "You can cancel online up to 12 hours before your appointment."
- "Less than 12 hours before — cancellation only by phone: +421 905 307 198"
- "A no-show fee of €10 will be charged for uncancelled reservations."

Aktualizovať aj `generateEmailText()` s rovnakými pravidlami.

### 3. Pridať 12h limit do cancel-booking Edge Function

**Súbor:** `supabase/functions/cancel-booking/index.ts`

Zmeniť logiku na riadkoch 88-98: namiesto kontroly "je dátum v minulosti" pridať kontrolu **12 hodín pred termínom**:
- Spojiť `booking.date` + `booking.time_slot` do presného DateTime
- Ak je menej ako 12 hodín do termínu → vrátiť chybu s textom "Rezerváciu je možné zrušiť online len do 12 hodín pred termínom. Kontaktujte nás telefonicky: +421 905 307 198"

### 4. Aktualizovať CancelBooking stránku

**Súbor:** `src/pages/CancelBooking.tsx`

Pridať zobrazenie chybovej správy o 12h limite keď server vráti príslušnú chybu — s telefónnym číslom.

### 5. Deploy oboch Edge Functions

Po úpravách nasadiť `send-booking-email` a `cancel-booking`.

---

### Zhrnutie zmien

| Súbor | Zmena |
|---|---|
| `send-booking-email/index.ts` | Odstrániť blank lines, prepísať storno sekciu, pridať "Tešíme sa" |
| `cancel-booking/index.ts` | Pridať 12h limit pred termínom |
| `src/pages/CancelBooking.tsx` | Zobraziť 12h chybovú správu |

