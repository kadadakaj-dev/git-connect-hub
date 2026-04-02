# Všeobecný TODO List (git-connect-hub)

Tento súbor slúži ako centrálny rozcestník pre nadchádzajúce úlohy a celkové upratanie vývojového prostredia.

## 🧹 1. Generálne upratovanie kódu (Linting) [HOTOVO]
- [x] Prejsť výstup príkazu `npm run lint`.
- [x] Vyriešiť chýbajúce dependencie v `useEffect` hookoch a odstrániť nepoužívané premenné.
- [x] Doplniť chýbajúce TypeScript typy tam, kde momentálne svieti varovanie alebo je vynútený záchranný `any` type.
- [x] Skontrolovať a odstrániť nevyužívané importy knižníc cez celý repozitár.
- [x] Spustiť finálny re-test po úpravách.

## 📊 2. Vylepšenie Admin Dashboardu
- [ ] Aktualizácia grafov a štatistík tak, aby správne zohľadňovali kompletne "zmazané" (hard delete) rezervácie, nielen tie zrušené (canceled).
- [ ] Prečistenie výpočtu tržieb – momentálne systém berie do úvahy staršie záznamy, je nutné upratať logiku vo vzťahu k novým migráciám databázy.
- [ ] Grafické vylepšenie "Liquid Glass" dizajnu pre admin moduly na lepšiu prehľadnosť štatistík na mobiloch.

## 🚀 3. Nasadenie a produkcia (Deployment) [HOTOVO]
- [x] Nasadiť upravený repozitár so CI Action pravidlami (`ci.yml`) na GitHub.
- [x] Konfigurácia GitHub Secrets (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`) podľa návodu.
- [x] Sledovať prvý beh v záložke *Actions*.
- [x] Preklopiť projekt na produkciu s Vercel / Netlify.


---

## 🛠️ Zmazané a vyčistené (Hotovo)
- [x] Generálne prehľadanie lokálneho disku `C:` na prítomnosť starších alebo paralelných repozitárov.
- [x] Zmazané balasty, zálohy a staré nefunkčné projekty pre uvoľnenie miesta a prevenciu chýb.
- [x] Dizajn systém `Liqiudglass-booking-wokrspace` prenesený priamo do aktuálneho repozitára pre budúce potreby.
