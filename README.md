# FYZIO&FIT – Rezervačný systém

Online booking systém pre FYZIO&FIT Košice.

**Live URL:** https://git-connect-hub-ruddy.vercel.app  
**Vetva pre vývoj:** `localbranchonly` (main sa nedotýkame)

---

## Lokálne spustenie

```sh
git clone https://github.com/kadadakaj-dev/git-connect-hub.git
cd git-connect-hub
git checkout localbranchonly
npm install

# Skopíruj .env.example do .env a vyplň hodnoty
cp .env.example .env

npm run dev
```

## Deploy

```sh
git add .
git commit -m "popis zmeny"
git push origin localbranchonly
npx vercel deploy --prod
```

---

## Environment Variables

Skopíruj `.env.example` → `.env` a vyplň hodnoty zo [Supabase Dashboard](https://supabase.com/dashboard/project/bqoeopfgivbvyhonkree/settings/api).

| Premenná | Popis |
|----------|-------|
| `VITE_SUPABASE_URL` | URL Supabase projektu |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Anon/public key |
| `VITE_SUPABASE_PROJECT_ID` | ID projektu |
| `VITE_VAPID_PUBLIC_KEY` | VAPID kľúč pre push notifikácie |

> ⚠️ `.env` nikdy necommituj — je v `.gitignore`.  
> Po expozícii kľúča ihneď resetuj v Supabase dashboarde.

---

## ⚠️ Pending: Rotácia Supabase kľúča

Supabase anon key bol historicky commitnutý v repozitári (`.env`).  
Súbor bol odstránený z git trackingu, ale kľúč treba invalidovať:

**Kroky:**
1. Otvor [Supabase Dashboard → Settings → API](https://supabase.com/dashboard/project/bqoeopfgivbvyhonkree/settings/api)
2. Klikni **"Reset anon key"** (vygeneruje nový JWT)
3. Skopíruj nový kľúč
4. Aktualizuj lokálny `.env` → `VITE_SUPABASE_PUBLISHABLE_KEY`
5. Aktualizuj Vercel → [Environment Variables](https://vercel.com/h4ck3d/git-connect-hub/settings/environment-variables) → `VITE_SUPABASE_PUBLISHABLE_KEY`
6. Spusti `npx vercel deploy --prod`

> Kým toto neurobíš, aplikácia funguje normálne. Po resete prestane fungovať ktokoľvek kto mal starý kľúč.

---

## Technológie

- **React** + **TypeScript** + **Vite**
- **Tailwind CSS** + shadcn/ui
- **Supabase** (databáza, auth, edge functions)
- **Vercel** (hosting)
- **Framer Motion** (animácie)
- **Workbox** (PWA, service worker)
