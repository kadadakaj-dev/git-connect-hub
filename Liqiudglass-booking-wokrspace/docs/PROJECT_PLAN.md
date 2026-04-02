# 📋 Projektový Plán: Booking Pro LE
## Dokončenie Rezervačného Systému s Papi Hajr + Liquid Glass Design

---

## 🎯 Projektový Cieľ

Vytvoriť vysoko kvalitný, plne funkčný rezervačný systém, ktorý kombinuje:
- **Papi Hajr Design** - elegance a intuitívne UI
- **Liquid Glass Design** - moderné sklenené efekty, gold akcenty, smooth animácie
- **Full-Stack Funkcionalita** - Supabase backend, NestJS API, Next.js frontend
- **Production-Ready** - bezchybný chod, optimalizovaný výkon

---

## 📊 Súčasný Stav Projektu

### ✅ Čo Funguje
| Komponent | Stav | Poznámka |
|-----------|------|----------|
| Next.js Frontend | ✅ Funkčné | Booking flow, Admin dashboard |
| Supabase Database | ✅ Pripojené | Realtime bookings, RLS policies |
| NestJS API | ✅ Beží | Booking endpoints, Auth system |
| Design System | ✅ Implementované | Liquid Glass, gold borders, blur |
| PWA Support | ⚠️ Čiastočne | Manifest existuje, Service Worker? |
| Auth System | ⚠️ Čiastočne | JWT + OAuth + Biometric implementované |

### ❌ Identifikované Problémy

#### KRITICKÉ (Musia byť vyriešené)
1. **Schema Mismatch** - Supabase `bookings` chýba: `customer_name`, `customer_email`, `customer_phone`
2. **Services Schema** - Chýba `gender`, `category` polia používané vo fronte
3. **Dual Database Architecture** - API používa Prisma/PostgreSQL, Frontend používa Supabase priamo
4. **User ID v Bookings** - Frontend insertuje bookings bez `user_id` (required v schema)

#### VYSOKÁ PRIORITA
5. **Chýbajúca validácia** - Overlapping bookings, business hours
6. **Email notifikácie** - Žiadne potvrdenia pre zákazníkov
7. **Admin auth guard** - Admin stránka nie je chránená
8. **Error handling** - Nejednotné spracovanie chýb

#### STREDNÁ PRIORITA
9. **Slot availability** - Nie je overené proti existujúcim bookings
10. **Timezone handling** - Žiadna konverzia timezones
11. **Performance** - Chýba caching, query optimization
12. **Test coverage** - Nízke pokrytie unit tests

---

## 🗓️ Fázy Projektu s Časovými Odhadmi

### FÁZA 1: Kritické Opravy Databázy (3-4 dni)
**Priorita: KRITICKÁ | Cena nevyriešenia: Systém nefunkčný**

#### 1.1 Supabase Schema Fix (1.5 deň)
```sql
-- Pridanie chýbajúcich polí do bookings
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS customer_name text,
ADD COLUMN IF NOT EXISTS customer_email text,
ADD COLUMN IF NOT EXISTS customer_phone text;

-- Pridanie gender a category do services
ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS gender text DEFAULT 'unisex',
ADD COLUMN IF NOT EXISTS category text DEFAULT 'Všeobecné';

-- user_id môže byť NULL pre guest bookings
ALTER TABLE public.bookings 
ALTER COLUMN user_id DROP NOT NULL;
```

**Úlohy:**
- [ ] Vytvoriť migráciu `20250217_add_customer_fields.sql`
- [ ] Aktualizovať RLS policies pre guest bookings
- [ ] Update TypeScript typov v `web/utils/supabase/client.ts`
- [ ] Test insert booking z frontendu
- [ ] Seed services s gender/category dátami

#### 1.2 API ↔ Supabase Integrácia (1.5 deň)
**Rozhodnutie:** Buď použiť Supabase priamo (odstrániť Prisma) alebo nastaviť API ako proxy

**Odporúčaný prístup:** Frontend → API → Supabase (bezpečnejšie)

**Úlohy:**
- [ ] Rozhodnúť architektúru (direct Supabase vs API proxy)
- [ ] Implementovať zvolený prístup
- [ ] Aktualizovať environment variables
- [ ] Dokumentovať nový flow

#### 1.3 Data Migration & Testing (1 deň)
- [ ] Migrácia existujúcich dát
- [ ] Integration tests
- [ ] Manuálne testovanie booking flow

---

### FÁZA 2: Autentifikácia & Autorizácia (2-3 dni)
**Priorita: VYSOKÁ | Cena nevyriešenia: Bezpečnostné riziko**

#### 2.1 Admin Route Protection (0.5 deň)
- [ ] Implementovať admin guard v Next.js middleware
- [ ] Pridať auth check do `web/app/admin/page.tsx`
- [ ] Redirect na login pre neautentifikovaných
- [ ] Test RLS policies pre admin operácie

#### 2.2 Supabase Auth Integration (1 deň)
- [ ] Prejsť na Supabase Auth namiesto custom JWT
- [ ] Implementovať email verification
- [ ] Password reset flow
- [ ] Session management

#### 2.3 OAuth Providers (0.5 deň)
- [ ] Google OAuth konfigurácia
- [ ] Callback handling
- [ ] Profile creation po OAuth

---

### FÁZA 3: Booking Engine Enhancement (3-4 dni)
**Priorita: VYSOKÁ | Cena nevyriešenia: Overlapping bookings**

#### 3.1 Slot Availability Logic (1.5 deň)
- [ ] Implementovať `getAvailableSlots()` s reálnou dostupnosťou
- [ ] Check against existujúcich bookings
- [ ] Respect business hours z `business_settings`
- [ ] Respect service duration

#### 3.2 Booking Validation (1 deň)
- [ ] Overlapping detection pred insert
- [ ] Max bookings per slot limit
- [ ] Working hours validation
- [ ] Past date prevention

#### 3.3 Booking Status Workflow (0.5 deň)
- [ ] Implementovať stavový diagram:
  ```
  pending → confirmed → completed
      ↓
  cancelled
  ```
- [ ] Auto-confirm option
- [ ] Status change notifications

---

### FÁZA 4: Notifikácie (2-3 dni)
**Priorita: STREDNÁ | Cena nevyriešenia: Zákazníci bez info**

#### 4.1 Email Notifications (1.5 deň)
- [ ] Integrácia s email service (Resend/SendGrid/Supabase)
- [ ] Email templates:
  - Booking confirmation
  - Booking reminder (24h before)
  - Cancellation notice
- [ ] Admin notification pre nové bookings

#### 4.2 In-App Notifications (0.5 deň)
- [ ] Toast notifications pre status changes
- [ ] Real-time feed v admine (už existuje)

---

### FÁZA 5: UI/UX Polish (2-3 dni)
**Priorita: STREDNÁ | Cena nevyriešenia: Nižšia konverzia**

#### 5.1 Liquid Glass Enhancement (1 deň)
- [ ] Konsolidovať design tokens
- [ ] Pridať micro-interactions
- [ ] Loading states pre všetky akcie
- [ ] Empty states pre calendar, services

#### 5.2 Mobile Optimization (1 deň)
- [ ] Touch-friendly slot picker
- [ ] Responsive calendar view
- [ ] PWA install prompt vylepšenie
- [ ] Offline mode pre viewing bookings

#### 5.3 Accessibility (0.5 deň)
- [ ] ARIA labels
- [ ] Keyboard navigation
- [ ] Color contrast audit

---

### FÁZA 6: Performance & Optimization (2 dni)
**Priorita: STREDNÁ | Cena nevyriešenia: Pomalé načítanie**

#### 6.1 Database Optimization (1 deň)
- [ ] Index review a pridanie
- [ ] Query optimization
- [ ] Connection pooling
- [ ] Implementovať caching (Redis/Upstash)

#### 6.2 Frontend Optimization (1 deň)
- [ ] Code splitting
- [ ] Image optimization
- [ ] Bundle size audit
- [ ] Lighthouse score > 90

---

### FÁZA 7: Testing & Quality Assurance (2-3 dni)
**Priorita: VYSOKÁ | Cena nevyriešenia: Produkčné chyby**

#### 7.1 Unit Tests (1 deň)
- [ ] API service tests
- [ ] Utility functions tests
- [ ] Component tests

#### 7.2 Integration Tests (1 deň)
- [ ] Booking flow E2E
- [ ] Auth flow E2E
- [ ] Admin operations E2E

#### 7.3 Manual QA (0.5 deň)
- [ ] Cross-browser testing
- [ ] Mobile testing
- [ ] Edge cases

---

### FÁZA 8: Deployment & DevOps (1-2 dni)
**Priorita: VYSOKÁ | Cena nevyriešenia: Nemožnosť deploy**

#### 8.1 CI/CD Pipeline (0.5 deň)
- [ ] GitHub Actions workflow
- [ ] Automated tests v CI
- [ ] Preview deployments

#### 8.2 Production Setup (0.5 deň)
- [ ] Environment variables setup
- [ ] Domain configuration
- [ ] SSL certificates
- [ ] Monitoring (Sentry)

#### 8.3 Documentation (0.5 deň)
- [ ] API documentation update
- [ ] Deployment guide
- [ ] Runbook pre incidenty

---

## 📈 Celkový Časový Harmonogram

| Fáza | Trvanie | Priorita | Týždeň |
|------|---------|----------|--------|
| Fáza 1: Databáza | 3-4 dni | Kritická | 1 |
| Fáza 2: Auth | 2-3 dni | Vysoká | 1-2 |
| Fáza 3: Booking Engine | 3-4 dni | Vysoká | 2 |
| Fáza 4: Notifikácie | 2-3 dni | Stredná | 3 |
| Fáza 5: UI/UX | 2-3 dni | Stredná | 3 |
| Fáza 6: Performance | 2 dni | Stredná | 4 |
| Fáza 7: Testing | 2-3 dni | Vysoká | 4 |
| Fáza 8: Deployment | 1-2 dni | Vysoká | 5 |

**Celkový odhad: 17-24 pracovných dní (3-5 týždňov)**

---

## 🎯 Kritické Míľniky

### Míľnik 1: Funkčný Booking (Koniec týždňa 1)
- Database schema opravené
- Booking možné vytvoriť cez frontend
- Data sa ukladá do Supabase

### Míľnik 2: Bezpečný Systém (Koniec týždňa 2)
- Admin chránený auth
- Booking validácie fungujú
- Žiadne overlapping bookings

### Míľnik 3: Production Ready (Koniec týždňa 4)
- Všetky testy prechádzajú
- Performance optimalizovaný
- Notifikácie fungujú

### Míľnik 4: Launch (Týždeň 5)
- Deployed na production
- Monitoring aktívny
- Dokumentácia kompletná

---

## ⚠️ Riziká a Mitigácie

| Riziko | Pravdepodobnosť | Dopad | Mitigácia |
|--------|----------------|-------|-----------|
| Data migration failure | Stredná | Vysoký | Backup pred migráciou, rollback plán |
| Supabase limits | Nízka | Stredný | Monitorovanie usage, upgrade plán |
| Third-party service outage | Nízka | Vysoký | Fallback mechanizmy |
| Scope creep | Vysoká | Stredný | Striktný scope, change request proces |

---

## 📋 Technické Špecifikácie

### Architektúra (Odporúčaná)
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Next.js Web   │────▶│   NestJS API    │────▶│    Supabase     │
│   (Frontend)    │     │   (Backend)     │     │   (Database)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        │                       ▼                       │
        │              ┌─────────────────┐              │
        │              │     Redis       │              │
        │              │   (Caching)     │              │
        │              └─────────────────┘              │
        │                                                │
        └──────────────── Realtime Subscriptions ───────┘
```

### Tech Stack
- **Frontend:** Next.js 14, React 18, Tailwind CSS, Framer Motion
- **Backend:** NestJS, Prisma ORM
- **Database:** Supabase (PostgreSQL), Redis (caching)
- **Auth:** Supabase Auth + Custom JWT fallback
- **Monitoring:** Sentry
- **Deployment:** Vercel (frontend), Railway/Render (API)

---

## ✅ Akceptačné Kritériá

### Povinné pre Launch
- [ ] Booking možné vytvoriť bez chýb
- [ ] Email potvrdenia odchádzajú
- [ ] Admin dashboard funguje s auth
- [ ] Žiadne overlapping bookings
- [ ] Mobile responsive
- [ ] Lighthouse score > 80
- [ ] Všetky testy prechádzajú

### Nice-to-have
- [ ] PWA installable
- [ ] Offline mode
- [ ] Multiple language support
- [ ] Analytics dashboard

---

## 📞 Kontakty a Zodpovednosti

| Rola | Zodpovednosť |
|------|--------------|
| Project Lead | Celkové vedenie, rozhodnutia |
| Frontend Dev | UI implementácia |
| Backend Dev | API, Database |
| QA | Testing, validácia |

---

*Posledná aktualizácia: Február 2026*
*Verzia dokumentu: 1.0*