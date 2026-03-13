

# Diagnostika projektu FYZIO&FIT Booking System

## Aktuálny stav

Projekt je plne funkčný booking systém pre fyzioterapeutickú kliniku s:
- Verejným booking wizardom (4-krokový formulár)
- Admin panelom (prihlásenie, dashboard, správa rezervácií/služieb/zamestnancov/hodín, kalendár)
- Klientským portálom (registrácia, prihlásenie cez email/Google/Apple, história, obľúbené)
- Edge functions (create-booking, cancel-booking, get-booking-by-token, send-booking-email, send-booking-reminder, delete-account, generate-preview)
- Liquid Glass dizajn systém s CSS custom properties
- SK/EN lokalizácia, SEO, GDPR, Cookie banner

---

## Identifikované nedostatky pre produkciu

### 1. Vizuálna nekonzistentnosť (4 stránky)
NotFound, AdminResetPassword, CancelBooking a Legal stále používajú starý `bg-gradient-to-br from-slate-100` namiesto `GlassBackground` komponentu. Toto je popísané v `.lovable/plan.md`.

### 2. Bezpečnostné nedostatky v RLS politikách
Aktuálne RLS politiky na tabuľkách `bookings`, `blocked_dates`, `employees`, `services`, `time_slots_config` a `user_roles` používajú `auth.role() = 'authenticated'` namiesto `has_role(auth.uid(), 'admin')`. To znamená, že **každý prihlásený klient** môže meniť rezervácie, služby, zamestnancov a dokonca priraďovať admin roly. Toto je kritický bezpečnostný problém.

### 3. Chýba tabuľka `rate_limits` v schema (ale existuje v migrácii)
Tabuľka existuje v migrácii ale nie je v aktuálnom `types.ts` -- edge function `create-booking` ju používa, čo je v poriadku (service role), ale treba overiť.

### 4. Chýba SMTP secret pre emaily
V secrets nie je `SMTP_PASSWORD`, čo znamená že potvrdzujúce emaily nefungujú.

### 5. Stránka `/preview` je dev-only
Stránka pre generovanie AI preview nemá zmysel v produkcii.

### 6. Admin účet nie je vytvorený
V `navod.md` sú uvedené prihlasovacie údaje, ale admin účet musí byť vytvorený manuálne.

### 7. Booking status default je 'confirmed' ale create-booking nastavuje 'pending'
Tabuľka má default `'confirmed'` ale edge function explicitne vkladá `'pending'` -- to je OK, ale treba rozhodnúť workflow.

---

## Prompty na dokončenie pre produkciu

Tieto prompty zadaj postupne (1 na správu):

---

### Prompt 1: Oprava RLS bezpečnosti (KRITICKÉ)

```
Oprav RLS politiky na všetkých tabuľkách. Aktuálne politiky používajú "auth.role() = 'authenticated'" čo umožňuje KAŽDÉMU prihlásenému používateľovi robiť admin akcie. Nahraď ich za "public.has_role(auth.uid(), 'admin')" pre admin operácie. Konkrétne:

1. Tabuľka bookings: "Admins can manage all bookings" a "Admins can view all bookings" musia používať has_role
2. Tabuľka blocked_dates: "Admins can manage blocked dates" musí používať has_role
3. Tabuľka employees: "Admins can manage employees" musí používať has_role
4. Tabuľka services: "Admins can manage services" musí používať has_role
5. Tabuľka time_slots_config: "Admins can manage time slots" musí používať has_role
6. Tabuľka user_roles: "Admins can manage roles" musí používať has_role

Použi DROP POLICY + CREATE POLICY pre každú. Zachovaj existujúce verejné/klientské politiky.
```

---

### Prompt 2: Liquid Glass zjednotenie

```
Zjednoť dizajn na 4 stránkach podľa .lovable/plan.md:

1. NotFound.tsx - pridaj GlassBackground, nahraď bg-gradient-to-br za relative overflow-hidden, obsah zabaľ do glass karty
2. AdminResetPassword.tsx - pridaj GlassBackground, nahraď bg-gradient-to-br za relative overflow-hidden  
3. CancelBooking.tsx - pridaj GlassBackground, nahraď bg-gradient-to-br za relative overflow-hidden, inline glass štýly nahraď za var(--glass-*) tokeny
4. Legal.tsx - pridaj GlassBackground, nahraď bg-gradient-to-br za relative overflow-hidden, inline glass štýly v tab kartách nahraď za var(--glass-*) tokeny

Použij rovnaký vzor ako AdminLogin a ClientAuth - GlassBackground komponent + glass CSS custom properties.
```

---

### Prompt 3: Konfigurácia SMTP pre emaily

```
Potrebujem nakonfigurovať SMTP heslo pre odosielanie potvrdzovacích emailov. Edge function send-booking-email používa SMTP server smtp.m1.websupport.sk s účtom info@chiropraxiakosice.eu. Pridaj secret SMTP_PASSWORD do projektu.
```

---

### Prompt 4: Odstránenie dev stránky a finálne úpravy

```
Priprav aplikáciu na produkciu:
1. Odstráň route /preview a súbor src/pages/Preview.tsx - je to dev-only stránka
2. Odstráň súbor supabase/functions/generate-preview/index.ts
3. V BookingWizard.tsx zmeň hardcoded link "https://booking.fyzioafit.sk" v headeri na "/" (relatívny)
4. V send-booking-email zmeň hardcoded baseUrl z 'https://booking-black.lovable.app' na dynamickú hodnotu z SITE_URL alebo environment variable
5. Pridaj secret SITE_URL s hodnotou produkčnej domény
```

---

### Prompt 5: Vytvorenie admin účtu

```
Vytvor admin používateľa pre FYZIO&FIT booking systém:
- Email: larsenevans@proton.me
- Po vytvorení mu priraď admin rolu v tabuľke user_roles
- Aktivuj auto-confirm pre tento jeden signup a potom ho zase deaktivuj

Poznámka: Ak to nie je možné automaticky, povedz mi presné kroky ako to spraviť.
```

---

### Prompt 6 (voliteľné): PWA a performance

```
Pridaj PWA podporu pre offline prístup a inštaláciu na mobil:
1. Vytvor manifest.json s ikonami FYZIO&FIT, theme color #4a90d9
2. Pridaj service worker pre cache-first stratégiu na statické assety
3. Pridaj meta tagy pre iOS (apple-mobile-web-app-capable, status-bar-style)
4. V OfflineBanner.tsx uprav správu pre lepší UX
```

