

## Luxusný redizajn všetkých emailových šablón s Dark Mode

### Prehľad zmien

Zjednotenie všetkých emailov na rovnaký luxusný štýl ako má potvrdzovací email klienta, s plnou Dark Mode podporou. Každý typ emailu si zachová svoju farebnú identitu v headeri.

### Farebné rozlíšenie podľa typu

```text
┌─────────────────────────┬──────────────────────────────────┐
│ Typ emailu              │ Header gradient                  │
├─────────────────────────┼──────────────────────────────────┤
│ Klientský (potvrdenie)  │ Modrá #4a90d9 → #6ba3e0  (hotové)│
│ Admin - nová rezervácia │ Zelená #2d8a5e → #40b07a         │
│ Admin - zrušenie        │ Červená #b91c1c → #ef4444         │
│ Auth (signup, recovery…)│ Modrá #4a90d9 → #6ba3e0          │
└─────────────────────────┴──────────────────────────────────┘
```

Spoločné prvky pre všetky:
- Pozadie: `#f7f9fc` (light) / `#18181b` (dark)
- Karta: `#ffffff` + shadow (light) / `#242427` + border (dark)
- Detail box: `#f0f4f8` (light) / `#2f2f36` (dark)
- Footer: `#f0f4f8` (light) / `#1e1e22` (dark)
- Zaoblenie karty: `16px`, shadow: `0 8px 30px rgba(0,0,0,0.08)`

### Zmeny v súboroch

**1. `supabase/functions/send-booking-email/index.ts`**
- `generateAdminNotificationHtml()` — kompletný redizajn: pridať `<style>` s dark mode CSS triedami, luxusný layout s väčším paddingom, zaobleniami, tieňmi, zelený gradient header
- `generateCancellationAdminHtml()` — rovnako: dark mode, luxusný layout, červený gradient header, detail box s jemným červeným pozadím (light: `#fef2f2`, dark: `#2e1616`)

**2. Auth email šablóny** (6 súborov v `supabase/functions/_shared/email-templates/`):
- `signup.tsx` — aktualizovať inline štýly: jemnejšie pozadie, väčší border-radius (16px), väčší shadow, väčší padding, zaoblený button (10px)
- `recovery.tsx` — rovnaké štýlové zmeny
- `magic-link.tsx` — rovnaké štýlové zmeny
- `invite.tsx` — rovnaké štýlové zmeny
- `email-change.tsx` — rovnaké štýlové zmeny
- `reauthentication.tsx` — rovnaké štýlové zmeny (kód box tiež zaobliť)

Auth šablóny používajú React Email (inline styles), takže dark mode tu bude cez `@media` v `<Head>` tagu s CSS triedami na kľúčových elementoch.

### Celkom: 7 súborov + deploy 2 edge functions (send-booking-email, auth-email-hook)

