

# Diagnostika: Rezervácie, Emaily, ENV hodnoty

## Výsledky testovania

### 1. Create-booking edge function — FUNGUJE SPRÁVNE

- Edge function je nasadená a odpovedá na requesty
- Validácia vstupov funguje (testované s neplatnými dátami → 400 + detaily chýb)
- Používa `service_role` kľúč → obchádza RLS → INSERT do `bookings` tabuľky funguje aj bez verejnej INSERT policy
- Posledná úspešná rezervácia: dnes 26.3.2026 (larsenevans@proton.me, status: confirmed)

### 2. RLS polícy — OPRAVENÉ

**bookings tabuľka** (3 polícy):
- `Admins can manage all bookings` (ALL) — admin má plný prístup
- `Users can view their own bookings` (SELECT) — klient vidí svoje
- `Users can update their own bookings` (UPDATE) — klient môže aktualizovať svoje
- ~~`Public can create bookings`~~ — ÚSPEŠNE ODSTRÁNENÁ

**user_roles tabuľka** (5 polícy):
- INSERT: `WITH CHECK (has_role(auth.uid(), 'admin'))` — bežný user NEMÔŽE pridať rolu
- UPDATE/DELETE: len admin
- SELECT: admin vidí všetky, user vidí svoje

### 3. Emaily — DVA SAMOSTATNÉ SYSTÉMY

Projekt používa **dva nezávislé emailové systémy**:

**A) SMTP cez Websupport (booking emaily)**
- `send-booking-email` edge function → SMTP `smtp.m1.websupport.sk:465`
- Autorizácia: vyžaduje `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` v headeri
- Posiela: potvrdenia, pripomienky, admin notifikácie, zrušenia
- Secret `SMTP_PASSWORD` je nastavený ✅
- Emaily sa posielajú fire-and-forget z `create-booking` funkcie

**B) Lovable Email queue (auth emaily)**
- `auth-email-hook` + `process-email-queue` (pgmq fronta)
- pg_cron job `process-email-queue` aktívny (každých 5s) ✅
- `email_send_state` nakonfigurovaný (batch=10, delay=200ms) ✅
- Posledný auth email: signup pre test.klient.fyziofit@gmail.com → `sent` ✅

### 4. ENV hodnoty — STAV

**Automaticky dostupné v edge functions (Deno.env):**
| Premenná | Stav |
|---|---|
| `SUPABASE_URL` | ✅ automaticky |
| `SUPABASE_ANON_KEY` | ✅ automaticky |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ automaticky |

**Manuálne nastavené secrety:**
| Secret | Stav | Použitie |
|---|---|---|
| `SMTP_PASSWORD` | ✅ nastavený | send-booking-email SMTP auth |
| `VAPID_PRIVATE_KEY` | ✅ nastavený | push notifikácie |
| `VAPID_PUBLIC_KEY` | ✅ nastavený | push notifikácie |
| `VAPID_SUBJECT` | ✅ nastavený | push notifikácie |
| `LOVABLE_API_KEY` | ✅ automaticky | Lovable AI |

**Frontend .env (automaticky):**
| Premenná | Stav |
|---|---|
| `VITE_SUPABASE_URL` | ✅ |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | ✅ |
| `VITE_SUPABASE_PROJECT_ID` | ✅ |
| `VITE_VAPID_PUBLIC_KEY` | ✅ |

**Chýbajúce/voliteľné:**
| Premenná | Kde | Poznámka |
|---|---|---|
| `SITE_URL` | edge functions | Voliteľný — fallback na `https://booking-fyzioafit.lovable.app` v kóde |

### 5. Čo treba overiť manuálne

Nasledovné veci nemôžem otestovať automaticky — vyžadujú manuálny test:

1. **Vytvorenie rezervácie cez UI**: Otvor booking wizard, vyber službu, dátum, čas, vyplň údaje a odošli. Over že sa zobrazí potvrdenie.
2. **Doručenie potvrdzovacieho emailu**: Skontroluj inbox emailu, ktorý si zadal pri rezervácii.
3. **Admin notifikácia**: Skontroluj inbox `booking@fyzioafit.sk` — mal by prísť email o novej rezervácii.
4. **SMTP heslo**: Ak emaily neprichádzajú, over platnosť SMTP hesla pre `booking@fyzioafit.sk` na Websupport paneli.

### Záver

Všetko je správne nakonfigurované:
- Bezpečnostné opravy (RLS) sú aplikované
- Edge functions sú nasadené a funkčné
- Všetky potrebné secrety sú nastavené
- Email infraštruktúra (SMTP + queue) je aktívna

Jediné, čo nemôžem overiť programaticky, je skutočné doručenie SMTP emailov — to závisí od platnosti `SMTP_PASSWORD` a stavu Websupport SMTP servera.

