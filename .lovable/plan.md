

## Plan: Redizajn admin kalendára — maximálna prehľadnosť rezervácií

### Problém
Aktuálny kalendár zobrazuje na event kartách len čas začiatku, meno klienta a trvanie. Chýba časový rozsah (napr. "9:30 - 11:00"), názov služby je schovaný, kontaktné údaje nie sú viditeľné. Na mobile je grid príliš úzky a ťažko čitateľný.

### Referencia
Screenshot ukazuje čistý kalendár s:
- Časový rozsah na každom evente (bold): `9:30 - 11:00`
- Názov služby: `Chiro masáž - (Celotelová)`
- Meno klienta: `Kristián Majerníček`
- Kontakt (email/telefón) viditeľný
- Farebné odlíšenie typov služieb
- List view ako alternatíva

### Plánované zmeny

**1. Vylepšený event pill v TimeGridView** (`src/components/admin/calendar/TimeGridView.tsx`)
- Zobraziť časový rozsah: `startTime - endTime` (bold, veľký)
- Pod tým názov služby (ak existuje)
- Pod tým meno klienta
- Pod tým email/telefón (ak sa zmestí)
- Lepšie farebné rozlíšenie podľa kategórie služby (chiro = zelenkavá, fyzio = modrá)
- Väčší minimálny výška pre 30min sloty

**2. Pridať ListView** (`src/components/admin/calendar/ListView.tsx` — nový súbor)
- Tabuľkový/zoznamový pohľad na rezervácie v danom období
- Stĺpce: Čas, Služba, Klient, Telefón, Email, Stav
- Kliknuteľné riadky pre detail
- Filtrovateľné podľa terapeuta

**3. Aktualizácia CalendarHeader** (`src/components/admin/calendar/CalendarHeader.tsx`)
- Pridať "list" ako štvrtý ViewMode
- Aktualizovať toggle tlačidlá

**4. Aktualizácia typov** (`src/components/admin/calendar/types.ts`)
- Pridať `'list'` do `ViewMode`

**5. Aktualizácia CalendarView** (`src/components/admin/CalendarView.tsx`)
- Import a renderovanie ListView
- Fetch data aj pre list view
- Pridať employee name do CalendarEvent mappingu

**6. Vylepšený MonthView** (`src/components/admin/calendar/MonthView.tsx`)
- Zobraziť čas + službu namiesto len čas + meno
- Väčšie bunky na mobile

**7. Mobilná responzivita**
- Day view ako default na mobile
- Event karty s väčším písmom a padding na mobile
- Horizontálny scroll pre week view s indikátorom
- List view ideálny pre mobilné zariadenia

### Technické detaily

- `endTime` sa vypočíta z `startTime + duration` v utils.ts (nová helper funkcia)
- Employee meno sa pridá do fetch query cez join na `employees_public`
- Kategória služby sa použije pre farebné rozlíšenie (rozšírenie `getEventColorClasses`)
- Žiadne DB zmeny potrebné — všetky dáta už existujú v bookings + services + employees_public

### Súbory na úpravu/vytvorenie
1. `src/components/admin/calendar/types.ts` — ViewMode rozšírenie
2. `src/components/admin/calendar/utils.ts` — helper `minutesToTime`, rozšírenie farieb
3. `src/components/admin/calendar/TimeGridView.tsx` — vylepšené event karty
4. `src/components/admin/calendar/MonthView.tsx` — viac info na eventoch
5. `src/components/admin/calendar/ListView.tsx` — **nový** zoznamový pohľad
6. `src/components/admin/calendar/CalendarHeader.tsx` — list toggle
7. `src/components/admin/CalendarView.tsx` — integrácia ListView, employee name fetch

