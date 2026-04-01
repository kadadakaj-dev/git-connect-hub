# Your To-Do List for Production Launch 🚀

Ahoj! Všetko je pripravené. Tu je tvoj finálny zoznam úloh, ktoré musíš urobiť priamo v **Supabase Dashboarde**, aby systém fungoval na 100 %.

### 1. Supabase Dashboard (Najdôležitejšie!) 🔒
- [ ] **SMTP (E-maily)**: Choď do *Authentication > Settings > SMTP* a nastav svoj WebSupport server (host, port 465, email `booking@fyzioafit.sk` a heslo). Bez tohto nebudú chodiť potvrdenia!
- [ ] **Auth Providers**: Choď do *Authentication > Providers* a **vypni** Google a Apple. Potom sa už nebudú nikde zobrazovať.
- [ ] **Storage**: Choď do *Storage > Buckets* a vytvor verejný bucket s názvom `avatars` (povol public access).
- [ ] **Site URL**: Choď do *Authentication > Settings* a zmeň "Site URL" na `https://booking.fyzioafit.sk`.

### 2. Edge Function Secrets ⚡
Aby fungovalo odosielanie e-mailov a linky do kalendára, musíš v Supabase CLI (alebo cez Dashboard API) nastaviť tieto "Secrets":
- `SMTP_PASSWORD`: Tvoje heslo k e-mailu `booking@fyzioafit.sk`.
- `SITE_URL`: `https://booking.fyzioafit.sk`

### 3. Vercel Deployment 🌐
- [ ] **Environment Variables**: Skontroluj, či máš vo Verceli nastavený `VITE_SUPABASE_URL` a `VITE_SUPABASE_ANON_KEY`.
- [ ] **Assets**: Už som ti nahral `og-image.png` a ikony do priečinka `public/` – pri nasledujúcom pushi sa automaticky nasadia.

---

### Čo som dokončil (Report): 🦾
- [x] **Switch to Admin**: Majiteľ má teraz v /portal tlačidlo na rýchly prechod do /admin.
- [x] **Employee Avatars**: Opravený a funkčný upload fotiek pre terapeutov v Admin Paneli.
- [x] **Service Icons**: Booking Wizard teraz zobrazuje správne ikony (Bone, Hand, atď.) podľa DB.
- [x] **Google Calendar**: Potvrdzujúce e-maily už obsahujú tlačidlo "Pridať do kalendára".
- [x] **PWA Fix**: Služobný pracovník (Service Worker) je zaregistrovaný, notifikácie budú fungovať.

**Systém je v "Premium" stave a pripravený na odovzdanie! Držím palce!** 🚀
