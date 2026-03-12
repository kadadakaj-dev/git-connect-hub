

# Diagnostický Audit Projektu FYZIO&FIT

## 1. Stromová Štruktúra Projektu

```text
.
├── .lovable/
├── public/
│   ├── favicon.ico, og-image.png, placeholder.svg
│   ├── robots.txt, sitemap.xml
├── src/
│   ├── assets/          (3 obrázky konceptov)
│   ├── components/
│   │   ├── admin/       (6 komponentov: Booking, Calendar, Employee, Hours, Overview, Service)
│   │   ├── booking/     (8 komponentov: Wizard, Steps, Progress, Skeletons, Icons)
│   │   ├── client/      (ProfileEditDialog)
│   │   └── ui/          (40+ shadcn komponentov)
│   ├── data/            (services.ts, timeSlots.ts - pravdepodobne nepoužívané)
│   ├── hooks/           (8 hookov)
│   ├── i18n/            (LanguageContext, translations)
│   ├── integrations/    (supabase client/types, lovable auth)
│   ├── lib/             (utils.ts)
│   ├── pages/           (9 stránok)
│   └── types/           (booking.ts)
├── supabase/
│   ├── functions/       (6 edge functions)
│   └── migrations/      (11 migrácií)
├── package.json, tsconfig.json, vite.config.ts, tailwind.config.ts
```

---

## 2. Zoznam Problémov

### KRITICKÉ

**K1: Chýbajúca CSS premenná `--warning`**
- `CancelBooking.tsx` používa `bg-warning/10` a `text-warning`, ale táto premenná nie je definovaná v `index.css`.
- **Dopad:** Varovný indikátor na cancel stránke sa nezobrazí správne.
- **Riešenie:** Pridať `--warning: 38 92% 50%;` a `--warning-foreground: 0 0% 100%;` do `:root`.

**K2: Bookings INSERT RLS je príliš otvorená**
- Politika `"Anyone can create bookings" WITH CHECK (true)` umožňuje komukoľvek (vrátane anon) vkladať priamo do tabuľky bookings cez Supabase klienta, obchádzajúc validáciu v Edge Function `create-booking`.
- **Dopad:** Bezpečnostné riziko -- útočník môže vkladať rezervácie s ľubovoľnými dátami priamo cez anon kľúč.
- **Riešenie:** Zmeniť INSERT politiku na `WITH CHECK (false)` a ponechať vytváranie výhradne cez Edge Function s `service_role_key`. Alebo obmedziť INSERT len na `authenticated` role.

**K3: Email template v send-booking-email stále používa starú farebnú schému**
- Email HTML obsahuje hardcoded teal/emerald farby (`#0d9488`, `#14b8a6`, `#10b981`) namiesto novej baby blue palety.
- **Dopad:** Vizuálna nekonzistencia medzi aplikáciou a emailami.
- **Riešenie:** Aktualizovať farby v email šablóne na baby blue (`#4a90d9` alebo similar).

**K4: send-booking-reminder posiela nesprávne parametre do send-booking-email**
- Funkcia posiela `subject`, `template`, `booking_data` kľúče, ale `send-booking-email` očakáva `clientName`, `serviceName`, `date`, `time`, `cancellationToken`, `language`.
- **Dopad:** Pripomienky sa neodošlú správne -- email funkcia dostane neznáme parametre.
- **Riešenie:** Opraviť payload v `send-booking-reminder` alebo pridať podporu pre reminder template do `send-booking-email`.

### VAROVANIA

**V1: Nepoužívané statické dáta**
- `src/data/services.ts` a `src/data/timeSlots.ts` sú pravdepodobne pozostatky pred migráciou na DB. Mŕtvy kód.
- **Riešenie:** Overiť a odstrániť ak nie sú importované.

**V2: ThemeProvider nastavený na `dark` ale dark mode je identický s light**
- `App.tsx` má `defaultTheme="dark"`, ale v `index.css` sú `.dark` a `:root` identické.
- **Dopad:** Zbytočná závislosť na `next-themes`, `ThemeToggle` komponent existuje ale nemá účel.
- **Riešenie:** Odstrániť ThemeProvider alebo nastaviť `defaultTheme="light"`.

**V3: SpotlightCard.tsx pravdepodobne nepoužívaný**
- Po redesigne bola SpotlightCard nahradená. Mŕtvy komponent.
- **Riešenie:** Odstrániť ak sa nikde neimportuje.

**V4: QueryClient bez retry/staleTime konfigurácie**
- `App.tsx` vytvára `new QueryClient()` bez nastavení. Default retry (3x) môže spôsobiť zbytočné requesty pri zlyhaniach.
- **Riešenie:** Pridať `defaultOptions: { queries: { retry: 1, staleTime: 30_000 } }`.

**V5: Hardcoded URL v email funkcii**
- `send-booking-email` má `const baseUrl = 'https://booking-black.lovable.app'` hardcoded.
- **Riešenie:** Použiť environment premennú alebo dynamicky z requestu.

**V6: `generate-preview` prompt stále popisuje starý "atmospheric dark" dizajn**
- Prompt v edge function hovorí o emerald, zinc-950, tmavom pozadí -- nezodpovedá novému baby blue dizajnu.
- **Riešenie:** Aktualizovať prompt alebo odstrániť funkciu ak sa nepoužíva.

**V7: CancelBooking.tsx stále používa `gradient-hero` class**
- CSS trieda `gradient-hero` je teraz len `bg-background` (po redesigne), takže to funguje, ale je to zbytočná abstrakcia.

**V8: `useEffect` v CancelBooking.tsx chýba `text` v dependency array**
- Riadok 90: `[token]` ale používa `text.invalidToken` ktorý závisí od `language`.
- **Dopad:** Pri zmene jazyka sa nezaktualizuje chybová správa.

### INFO

**I1: Žiadne testy**
- Projekt nemá žiadne unit, integration ani E2E testy.
- **Riešenie:** Pridať aspoň základné testy pre hooks (useCreateBooking, useTimeSlots) a edge functions.

**I2: Žiadne CI/CD**
- Chýba `.github/workflows/` alebo iná pipeline.
- **Riešenie:** Pridať GitHub Actions pre lint, build, type-check.

**I3: Dokumentácia API**
- Žiadna formálna dokumentácia edge functions (OpenAPI/Swagger).
- Edge functions sú dobre komentované v kóde.

**I4: SEO a prístupnosť**
- `robots.txt` a `sitemap.xml` existujú. `Helmet` sa používa pre meta tagy.
- Chýba `lang` atribút na `<html>` prvku dynamicky podľa jazyka.

**I5: Správna architektúra rolí**
- `user_roles` tabuľka je správne oddelená od profilov s `SECURITY DEFINER` funkciou `has_role()`.

---

## 3. Závislosti

- **Všetky balíčky sú aktuálne** (React 18, Vite 5, TanStack Query 5).
- **`@dnd-kit/core` a `@dnd-kit/utilities`** -- overiť či sa aktívne používajú (CalendarView?). Ak nie, odstrániť.
- **`next-themes`** -- zbytočný ak nie je dark mode.
- **`embla-carousel-react`** -- pravdepodobne len pre shadcn carousel komponent, nemusí byť aktívne použitý.

---

## 4. Prioritizovaný Plán Opráv

| # | Priorita | Problém | Odhad |
|---|----------|---------|-------|
| 1 | KRITICKÉ | K2: Uzavrieť INSERT RLS na bookings | 10 min |
| 2 | KRITICKÉ | K4: Opraviť send-booking-reminder payload | 15 min |
| 3 | KRITICKÉ | K1: Pridať --warning CSS premennú | 2 min |
| 4 | KRITICKÉ | K3: Aktualizovať email farby na baby blue | 10 min |
| 5 | VAROVANIE | V2: Odstrániť dark theme / ThemeProvider | 5 min |
| 6 | VAROVANIE | V5: Odstrániť hardcoded URL v email function | 5 min |
| 7 | VAROVANIE | V8: Opraviť useEffect dependency | 2 min |
| 8 | INFO | V1, V3: Odstrániť mŕtvy kód | 10 min |
| 9 | INFO | I1: Pridať základné testy | 2+ hod |

---

Chceš aby som implementoval tieto opravy? Odporúčam začať s kritickými (K1-K4) a varovaniami (V2, V5, V8).

