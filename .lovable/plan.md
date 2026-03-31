

# Kompletná úprava emailov: 12h → 10h + chýbajúce emaily

## Zhrnutie

Zmena storno podmienok z 12 hodín na 10 hodín vo všetkých miestach (emaily, edge functions, UI). Pridanie chýbajúceho emailu klientovi pri zrušení rezervácie. Audit všetkých emailových šablón.

---

## Aktuálny stav emailov

| Email | Klient | Admin | Stav |
|---|---|---|---|
| Potvrdenie novej rezervácie | ✅ | ✅ | Funguje |
| Pripomienka (20h pred) | ✅ (email + push) | - | Funguje |
| Zrušenie rezervácie | ❌ CHÝBA | ✅ | Admin dostane, klient NIE |
| Zmena statusu (admin zmení) | ❌ CHÝBA | - | Neexistuje |

---

## Plán zmien

### 1. Zmena 12h → 10h všade

Súbory na úpravu:
- **`supabase/functions/cancel-booking/index.ts`** — linka 111: `hoursUntilBooking < 12` → `< 10`, linka 113: text "12 hodín" → "10 hodín"
- **`supabase/functions/send-booking-email/index.ts`** — 6 miest v šablónach (confirmation, reminder): všetky zmienky "12 hodín/12 hours" → "10 hodín/10 hours"
- **`src/pages/CancelBooking.tsx`** — linky 54, 78: text "12 hodín/12 hours" → "10 hodín/10 hours"
- **`supabase/functions/send-booking-reminder/index.ts`** — window ostáva 20h (pripomienka sa posiela skôr ako storno deadline, čo je správne)

### 2. Nový email: Potvrdenie zrušenia pre klienta

V `send-booking-email/index.ts`:
- Pridať nový template typ `"cancellation-client"`
- Vytvoriť `generateCancellationClientHtml()` — modrý gradient header, text "Vaša rezervácia bola úspešne zrušená", detaily rezervácie, CTA "Vytvoriť novú rezerváciu"
- Vytvoriť `generateCancellationClientText()` — plain text verzia

V `cancel-booking/index.ts`:
- Po úspešnom zrušení pridať fire-and-forget volanie `send-booking-email` s template `"cancellation-client"` na `booking.client_email`

### 3. Vylepšenie existujúcich emailov

- Profesionálnejšie formulácie storno podmienok vo všetkých šablónach
- SK: "Bezplatné online zrušenie je možné najneskôr 10 hodín pred termínom. Po uplynutí tejto lehoty je zrušenie možné výlučne telefonicky na čísle +421 905 307 198, pričom bude účtovaný storno poplatok vo výške 10 €."
- EN: "Free online cancellation is available up to 10 hours before your appointment. After this period, cancellation is only possible by phone at +421 905 307 198, subject to a €10 cancellation fee."

### 4. Deploy

Nasadenie všetkých upravených edge functions: `create-booking` (nie je potrebný), `cancel-booking`, `send-booking-email`, `send-booking-reminder`.

---

## Technické detaily

### Nový template `cancellation-client`

```
Header: Modrý gradient (#4a90d9 → #6ba3e0) — rovnaký ako confirmation
Nadpis: "Vaša rezervácia bola zrušená"
Telo: Detaily zrušenej rezervácie (služba, dátum, čas, miesto)
Info box: "Ak si želáte vytvoriť novú rezerváciu, kliknite na tlačidlo nižšie."
CTA tlačidlo: "Vytvoriť novú rezerváciu" → link na hlavnú stránku
Footer: Kontakt
```

### Zmeny v cancel-booking/index.ts

Po riadku 164 (za admin email) pridať:
```typescript
// Send cancellation confirmation to client
fetch(`${supabaseUrl}/functions/v1/send-booking-email`, {
  method: 'POST',
  headers: { ... },
  body: JSON.stringify({
    to: booking.client_email,
    clientName: booking.client_name,
    serviceName: service?.name_sk || 'Služba',
    date: booking.date,
    time: booking.time_slot,
    cancellationToken: '',
    language: 'sk',
    template: 'cancellation-client',
  }),
}).catch(err => console.error('Error sending cancellation client email:', err))
```

### Emailová šablóna pre zmenu statusu — zatiaľ NEIMPLEMENTOVAŤ

Status zmeny z admin dashboardu (confirmed → cancelled alebo pending → confirmed) by si vyžadovali úpravu admin dashboardu + novú šablónu. Toto je rozšírenie na neskôr.

