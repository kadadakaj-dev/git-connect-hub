# Deploy Guide — papihairdesign.sk

Kompletný návod na nasadenie booking systému na produkciu.

---

## Domény

| Projekt | Doména | Vercel projekt |
|---------|--------|----------------|
| Frontend (Next.js) | `booking.papihairdesign.sk` | `papi-hair-booking-web` |
| Backend (NestJS API) | `api.papihairdesign.sk` | `papi-hair-booking-api` |

---

## URGENTNÉ — Opravy pred ďalším deploym

### Problém 1: Web projekt má zlý Root Directory

**Chyba v build logu:**
```
Error: No Next.js version detected. Make sure your package.json has "next"
in either "dependencies" or "devDependencies".
```

**Príčina:** Vercel stavia z root adresára repozitára, ale Next.js je v `web/`.

**Oprava (manuálne v dashboarde):**
1. Choď na [vercel.com/dashboard](https://vercel.com/dashboard)
2. Otvor projekt `papi-hair-booking-web`
3. **Settings → General → Root Directory**
4. Zmeň z `.` (root) na `web`
5. Klikni **Save**
6. Znovu spusti deploy: **Deployments → Redeploy**

---

## Nastavenie Environment Variables

### API projekt (`papi-hair-booking-api`)

**Vercel Dashboard → papi-hair-booking-api → Settings → Environment Variables**

Nastav tieto hodnoty pre `Production`:

| Premenná | Hodnota | Poznámka |
|----------|---------|----------|
| `DATABASE_URL` | `postgresql://postgres.dssdiqojkktzfuwoulbq:HESLO@aws-0-eu-central-1.pooler.supabase.com:6543/postgres` | Skopíruj z Supabase → Settings → Database → Transaction pooler |
| `SUPABASE_URL` | `https://dssdiqojkktzfuwoulbq.supabase.co` | ✅ Nastavené |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzc2RpcW9qa2t0emZ1d291bGJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNjk2NjAsImV4cCI6MjA4NjY0NTY2MH0.opbxHgoqWqF_GsGSsBsiGRpqVDBWlmPtECTy31s0mbs` | ✅ Nastavené |
| `SUPABASE_SERVICE_ROLE` | *(Supabase Dashboard → Settings → API → Secret keys → service_role)* | ⚠️ NIKDY nezverejňuj! |
| `JWT_ACCESS_SECRET` | *(nový náhodný reťazec)* | Generuj nižšie |
| `JWT_REFRESH_SECRET` | *(nový náhodný reťazec)* | Generuj nižšie |
| `API_KEY` | *(nový náhodný reťazec)* | Generuj nižšie |
| `CORS_ORIGINS` | `https://booking.papihairdesign.sk` | Už je v vercel.json |
| `NODE_ENV` | `production` | Už je v vercel.json |
| `APP_ENV` | `production` | Už je v vercel.json |

> **Generovanie bezpečných secrets (spusti v terminály):**
> ```bash
> node -e "console.log('JWT_ACCESS_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
> node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
> node -e "console.log('API_KEY=' + require('crypto').randomBytes(32).toString('hex'))"
> ```
>
> **DÔLEŽITÉ:** Staré secrets sú kompromitované (boli v gite). Vždy použi nové hodnoty!

---

### Web projekt (`papi-hair-booking-web`)

**Vercel Dashboard → papi-hair-booking-web → Settings → Environment Variables**

| Premenná | Hodnota |
|----------|---------|
| `NEXT_PUBLIC_API_BASE` | `https://api.papihairdesign.sk` |
| `NEXT_PUBLIC_API_KEY` | *(rovnaký API_KEY ako v api projekte)* |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://dssdiqojkktzfuwoulbq.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzc2RpcW9qa2t0emZ1d291bGJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNjk2NjAsImV4cCI6MjA4NjY0NTY2MH0.opbxHgoqWqF_GsGSsBsiGRpqVDBWlmPtECTy31s0mbs` |
| `NEXT_PUBLIC_APP_ENV` | `production` |

---

## Nastavenie vlastných domén

### Krok 1: Pridaj domény vo Vercel

**Pre web projekt:**
1. `papi-hair-booking-web` → Settings → Domains
2. Klikni **Add** → vlož `booking.papihairdesign.sk`
3. Vercel zobrazí CNAME záznam (napr. `cname.vercel-dns.com`)

**Pre API projekt:**
1. `papi-hair-booking-api` → Settings → Domains
2. Klikni **Add** → vlož `api.papihairdesign.sk`
3. Vercel zobrazí CNAME záznam

### Krok 2: Pridaj DNS záznamy u registrátora

Prihlás sa k správcovi domény `papihairdesign.sk` a pridaj:

| Typ | Meno | Hodnota | TTL |
|-----|------|---------|-----|
| CNAME | `booking` | `cname.vercel-dns.com` | 3600 |
| CNAME | `api` | `cname.vercel-dns.com` | 3600 |

> Vercel vydáva SSL certifikáty automaticky po overení domény.

---

## Verifikácia deployu

```bash
# Overenie API (po nastavení domény)
curl https://api.papihairdesign.sk/health

# Overenie CORS
curl -I -H "Origin: https://booking.papihairdesign.sk" \
     https://api.papihairdesign.sk/health
# Odpoveď musí obsahovať: Access-Control-Allow-Origin: https://booking.papihairdesign.sk

# Overenie Frontendu
curl -I https://booking.papihairdesign.sk
# Odpoveď musí byť: HTTP/2 200
```

---

## Checklist pred spustením

### Bezpečnosť
- [ ] `JWT_ACCESS_SECRET` je nový náhodný reťazec (nie `dev-jwt-secret`)
- [ ] `JWT_REFRESH_SECRET` je nový náhodný reťazec
- [ ] `API_KEY` je nový náhodný reťazec (nie `papihair-secret-key-2025`)
- [ ] Supabase heslo zmenené (keďže bolo v gite)
- [ ] `api/.env` NIE JE commitnutý (`git status` nesmie ukazovať `api/.env`)

### Vercel
- [ ] `papi-hair-booking-web` → Root Directory = `web`
- [ ] Všetky env vars nastavené pre oba projekty
- [ ] Oba projekty úspešne buildnuté (zelené)

### Domény
- [ ] `booking.papihairdesign.sk` pridaná vo Vercel (web projekt)
- [ ] `api.papihairdesign.sk` pridaná vo Vercel (api projekt)
- [ ] DNS CNAME záznamy vytvorené u registrátora
- [ ] SSL certifikáty aktívne (Vercel ich vydáva automaticky)

---

## Troubleshooting

### "No Next.js version detected"
→ Nastav Root Directory na `web` v Vercel dashboarde (pozri URGENTNÉ sekciu)

### API vracia CORS error
→ Skontroluj `CORS_ORIGINS=https://booking.papihairdesign.sk` v Vercel env vars API projektu

### API vracia 500 Internal Server Error
→ Pozri build/runtime logy: Vercel Dashboard → Deployments → Functions → Logs
→ Pravdepodobne chýba `DATABASE_URL` alebo zlý JWT secret

### DNS sa nepropaguje (doména nefunguje)
→ DNS propagácia trvá 5 minút až 48 hodín
```bash
nslookup booking.papihairdesign.sk
dig booking.papihairdesign.sk CNAME
```

### Prisma chyba pri builde
→ Skontroluj `DATABASE_URL` — musí byť connection pooler URL zo Supabase (port 6543)

---

## Supabase informácie

| | Hodnota |
|-|---------|
| **Project URL** | `https://dssdiqojkktzfuwoulbq.supabase.co` |
| **Project ID** | `dssdiqojkktzfuwoulbq` |
| **Region** | EU (eu-central-1) |
| **Anon/Public key** | Supabase Dashboard → Settings → API |
| **Service Role key** | Supabase Dashboard → Settings → API (nikdy neexponuj!) |
| **DB Connection** | Supabase Dashboard → Settings → Database → Connection string |

---

## Lokálne vs. Produkcia

| | Lokálne | Produkcia |
|--|---------|-----------|
| Frontend URL | `http://localhost:3000` | `https://booking.papihairdesign.sk` |
| API URL | `http://localhost:4000` | `https://api.papihairdesign.sk` |
| CORS_ORIGINS | `http://localhost:3000` | `https://booking.papihairdesign.sk` |
| NODE_ENV | `development` | `production` |
| Databáza | Docker / local PG | Supabase (`dssdiqojkktzfuwoulbq`) |
