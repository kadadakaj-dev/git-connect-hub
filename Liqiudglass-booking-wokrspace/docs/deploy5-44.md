# Produkčný Deploy Status - BookingPro

**Dátum:** 15.02.2026
**URL:** [https://web-mu-ten-93.vercel.app/](https://web-mu-ten-93.vercel.app/)

## Stav

- **Frontend + Dashboard:** FUNKČNÉ (Vercel)
- **Databáza:** FUNKČNÁ (Supabase)
- **API (NestJS):** ČAKÁ NA NASADENIE (lokálne beží na porte 4000)

## Čo funguje

- Zákaznícka rezervácia (zápis do DB)
- Admin dashboard (čítanie z DB, realtime updates)
- Invoices logika (prepočítaná z bookings)

## Známe issues

- `GET /auth/verify` vracia CSP error na lokálnom API (očakávané, kým nie je API na HTTPS)
- `ServiceManager` komponent nenašiel (pravdepodobne zmazaný v cleanupe)

## Ďalšie kroky

1. Nasadiť API na Vercel alebo Railway
2. Nastaviť HTTPS pre API
3. Prepojiť Frontend <-> Produkčné API
