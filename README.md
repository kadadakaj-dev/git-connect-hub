# FYZIOAFIT Booking Platform

Rezervačná platforma pre fyzioterapeutické a chiropraktické služby. Dizajn systém **"Baby Blue Glass"** — moderné, profesionálne UI.

---

## Deployment — kompletný postup

### 1. Frontend (Vercel)
```bash
git add -A
git commit -m "popis zmien"
git push origin main
```
Vercel sa deployuje **automaticky** po každom push na `main`.
Produkčná URL: **https://booking.fyzioafit.sk**

---

### 2. Supabase Edge Functions
```bash
# Všetky funkcie naraz
supabase functions deploy

# Len jedna konkrétna funkcia
supabase functions deploy send-booking-email
supabase functions deploy create-booking
supabase functions deploy cancel-booking
supabase functions deploy send-booking-reminder
supabase functions deploy send-push-notification
supabase functions deploy get-booking-by-token
supabase functions deploy delete-account
```

---

### 3. Databázové migrácie
```bash
# Pozri stav — čo je lokálne vs remote
supabase migration list

# Pushni čakajúce migrácie
supabase db push

# Ak je história rozbitá (remote má migrácie bez lokálnych súborov)
supabase migration repair --status reverted <id1> <id2>
supabase db push --include-all
```

---

### 4. Secrets (env premenné pre Edge Functions)
```bash
# Zobraz aktuálne secrets
supabase secrets list

# Nastav/aktualizuj secret
supabase secrets set NAZOV_PREMENNEJ=hodnota

# Potrebné secrets:
# SMTP_PASSWORD, SITE_URL, SITE_NAME
# VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT
# SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY
```

---

### 5. Vercel env premenné (frontend)
```bash
# Zobraz
vercel env ls

# Pridaj
vercel env add NAZOV_PREMENNEJ

# Stiahni lokálne (development)
vercel env pull .env.local

# Potrebné premenné:
# VITE_SUPABASE_URL
# VITE_SUPABASE_ANON_KEY
# VITE_SUPABASE_PUBLISHABLE_KEY
# VITE_VAPID_PUBLIC_KEY
```

---

## Lokálny vývoj

### Inštalácia
```bash
npm install
```

### Spustenie
```bash
npm run dev
```

### Testy
```bash
# Frontend testy (Vitest)
npm test

# Email šablóny (Deno)
deno test supabase/functions/send-booking-email/templates_test.ts

# E2E testy (Playwright)
npm run test:e2e

# Linting
npm run lint
```

---

## Biznis pravidlá

| Pravidlo | Hodnota | Kde je vynútené |
|----------|---------|----------------|
| Otváracie hodiny | 09:00 – 18:00 | DB + Edge Fn + Frontend |
| Min. predstih rezervácie | 36 hodín | DB + Edge Fn + Frontend |
| Blokácia zrušenia | < 10 hodín pred termínom | DB SQL RPC + Frontend |
| Storno poplatok | 10 € | Email šablóny + CancelBooking UI |
| Kapacita slotu | 1 (clinic-wide) | DB atomická kontrola |

---

## Emailové šablóny

Všetky šablóny sú v `supabase/functions/send-booking-email/templates.ts`.

| Šablóna | Popis |
|---------|-------|
| `confirmation` | Potvrdenie rezervácie klientovi |
| `reminder` | Pripomienka 20h pred termínom |
| `admin-notification` | Nová rezervácia — upozornenie admina |
| `cancellation-client` | Zrušenie — klient |
| `cancellation-admin` | Zrušenie — admin |

Po každej zmene šablón: `supabase functions deploy send-booking-email`

---

## Štruktúra projektu

```
src/
├── components/
│   ├── admin/          # Admin panel komponenty
│   └── booking/        # Booking wizard komponenty
├── hooks/              # React hooks (useTimeSlots, useCreateBooking...)
├── lib/                # Biznis logika (booking-rules, pushNotifications)
└── pages/              # Stránky (Admin, Auth, CancelBooking...)

supabase/
├── functions/          # Edge Functions (Deno)
│   ├── create-booking/
│   ├── cancel-booking/
│   ├── send-booking-email/
│   ├── send-booking-reminder/
│   ├── send-push-notification/
│   └── ...
└── migrations/         # SQL migrácie (chronologicky)
```

---

## Route prehľad

| URL | Popis | Prístup |
|-----|-------|---------|
| `/` | Booking wizard | Verejný |
| `/portal` | Klientský portál | Prihlásený |
| `/admin` | Admin dashboard | Len admin |
| `/auth` | Prihlásenie | Verejný |
| `/cancel` | Zrušenie rezervácie | Verejný (token) |
| `/legal` | GDPR & podmienky | Verejný |

---

## Infraštruktúra

- **Frontend**: React + Vite + TypeScript → Vercel
- **Backend**: Supabase (PostgreSQL + Edge Functions Deno)
- **Email**: denomailer SMTP → smtp.m1.websupport.sk
- **Push notifikácie**: Web Push API + VAPID
- **PWA**: Workbox service worker

---

© 2026 FYZIOAFIT. All rights reserved.
