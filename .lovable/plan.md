

## Analýza aktuálneho stavu a odporúčanie ďalšieho kroku

### Aktuálny problém: Build je rozbitý

Aplikácia sa momentálne nespúšťa kvôli chýbajúcemu `@swc/core` balíčku a nekompatibilným TypeScript typom. **Toto musí byť opravené ako prvé**, inak žiadna ďalšia práca nebude mať efekt.

**Plán opravy buildu:**
1. Pridať `@swc/core` do devDependencies (chýba, ale `@vitejs/plugin-react-swc` ho vyžaduje)
2. Opraviť TS chyby s `react-helmet-async` — pinúť kompatibilnú verziu alebo pridať `@types/react` override
3. Opraviť `sheet.tsx` typy (chýbajúce `className`/`children` props)
4. Supabase auth typy — pravdepodobne nesúlad verzie `@supabase/supabase-js`

### Po oprave buildu — najlogickejší ďalší krok

Podľa `navod.md` a aktuálneho stavu kódu, všetky 5 hlavných bodov sú už implementované (DB, booking wizard, admin dashboard, správa služieb, emaily). Najlogickejšie pokračovanie:

**1. Online platby / storno poplatky** — Integrovať Stripe pre online platby za služby a automatické účtovanie storno poplatku 10 € (naviazané na aktuálne storno podmienky).

**2. SMS notifikácie** — Pridať SMS pripomienky 24h pred termínom cez Twilio/externé API, keďže email pripomienky už existujú.

**3. Google Calendar sync** — Dvojsmerná synchronizácia rezervácií s Google Calendar (uvedené v navod.md ako bonus).

**4. Klientske hodnotenia** — Po návšteve umožniť klientom ohodnotiť službu (hviezdičky + recenzia), zobrazovať na hlavnej stránke.

**5. Dashboard analytika** — Grafy tržieb, obsadenosti, najpopulárnejších služieb v admin paneli.

### Odporúčanie

**Najprv opraviť build**, potom by som odporučil **Google Calendar sync** alebo **klientske hodnotenia** — oboje výrazne zvýšia hodnotu pre koncových používateľov aj pre admina.

