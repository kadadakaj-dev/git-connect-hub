

# Integrácia nového kalendára do admin dashboardu

## Čo sa zmení

Nahradíme existujúci `CalendarView.tsx` (623 riadkov, len týždenný pohľad s hodinovými slotmi) novým plnohodnotným kalendárom s dennným/týždenným/mesačným pohľadom, resizingom blokov, current-time ukazovateľom a lepším UX.

## Kľúčové úpravy oproti dodanému kódu

Dodaný kód je standalone React komponent s lokálnym stavom a hardcoded dátami. Treba ho adaptovať:

### 1. TypeScript konverzia a napojenie na DB
- Konvertovať celý komponent na TypeScript
- Nahradiť lokálny `events` stav dátami z `bookings` tabuľky (cez Supabase query)
- Nahradiť hardcoded `THERAPISTS` zoznamom z `employees` tabuľky
- Mapovať DB booking na interný event formát: `service.category` → `type`, `employee_id` → `therapistId`

### 2. Zachovanie existujúcej funkcionality
- Drag & drop presun bookingov s aktualizáciou v DB (existujúca logika z pôvodného CalendarView)
- Kapacitná kontrola pri presune (počet aktívnych zamestnancov)
- Detailný dialog s informáciami o klientovi
- Farebné rozlíšenie podľa služby (existujúca paleta `serviceColors`)

### 3. Integrácia s projektom
- Použiť `useLanguage()` pre SK/EN preklady
- Použiť `date-fns` (už v projekte) namiesto custom date helper funkcií
- Použiť shadcn komponenty (`Card`, `Dialog`, `Button`, `Badge`, `Select`) namiesto raw HTML
- Zachovať `@dnd-kit` pre drag & drop (už nainštalovaný)
- Štýlovať cez Tailwind CSS premenné (`bg-primary`, `text-muted-foreground`) namiesto hardcoded HSL hodnôt

### 4. Nové funkcie z dodaného kódu (zachovať)
- **3 pohľady**: deň / týždeň / mesiac
- **Current-time červená čiara** na dnešnom dni
- **Resizing blokov** (ťahanie spodného okraja)
- **Filtrovanie podľa zamestnanca** (select dropdown)
- **Vytváranie blokov** (blokovaný čas) priamo z kalendára
- **Opakujúce sa udalosti** (recurring)
- **Overlap prevention** checkbox
- **Kaskádovanie kolízií** (viac udalostí v rovnakom čase vedľa seba)

### 5. Čo sa neurobí (z dodaného kódu)
- Lokálny stav pre eventy — všetko pôjde cez DB
- Hardcoded terapeuti — načítajú sa z `employees` tabuľky
- `alert()` a `window.confirm()` — nahradí sa `toast()` a `AlertDialog`

## Rozsah zmien

| Súbor | Akcia |
|-------|-------|
| `src/components/admin/CalendarView.tsx` | Kompletný prepis (~700 riadkov) |

Žiadne nové závislosti, žiadne DB migrácie, žiadne zmeny v iných komponentoch.

