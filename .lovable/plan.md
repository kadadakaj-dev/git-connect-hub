

# Aktualizácia služieb — 4 služby + Express

## Finálny zoznam služieb

| # | Názov SK | Názov EN | Trvanie | Cena | Popis SK |
|---|----------|----------|---------|------|----------|
| 1 | Naprávanie | Adjustment | 15 min | 30 € | chiropraxia, masážna pištol |
| 2 | Chiro masáž | Chiro Massage | 50 min | 55 € | chiropraxia, klasická masáž, mobilizácie, bankovanie, masážna pištol |
| 3 | Celotelová chiro masáž | Full Body Chiro Massage | 90 min | 75 € | klasická masáž, bankovanie, mobilizácie, chiropraxie a iné |
| 4 | Express termín | Express Appointment | — | +15 € | do 36h, víkendy, sviatky — iba telefonicky |

## Čo sa zmení

### 1. Databáza — UPDATE existujúcich služieb + INSERT novej
- **UPDATE** existujúce 3 záznamy v `services` na Naprávanie, Chiro masáž, Celotelová chiro masáž (nové názvy, popisy, ceny, trvanie, ikony, sort_order)
- **INSERT** 4. službu "Express termín" s `is_active = true` a kategóriou `chiropractic` (nebude štandardne rezervovateľná, len zobrazená s tel. číslom)

### 2. ServiceSelection.tsx — Express karta
- Aktualizovať `EXPRESS_SERVICE_ID` na nové ID expresnej služby (po inserte)
- Express karta už existuje s tel. číslom — len synchronizovať ID

### 3. Booking pravidlo — minimálny čas 36h dopredu
- V `DateTimeSelection.tsx` (funkcia `isDateDisabled`): okrem blokovania minulosti a nedieľ, pridať pravidlo — dátum musí byť minimálne 36h od teraz (t.j. ak je teraz pondelok 10:00, najbližší dostupný slot je streda 22:00+)
- V `create-booking/index.ts` edge function: pridať server-side validáciu toho istého 36h pravidla
- V `useTimeSlots.ts`: filtrovať sloty, ktoré sú v rámci 36h od teraz

### 4. Preklady
- Aktualizovať `translations.ts` — expressDesc na "Do 36h · víkendy · sviatky"

## Technické detaily

**Databáza** — 3× UPDATE + 1× INSERT cez insert tool (data changes, nie schema)

**Súbory na úpravu:**
- `src/components/booking/ServiceSelection.tsx` — nové EXPRESS_SERVICE_ID
- `src/components/booking/DateTimeSelection.tsx` — 36h pravidlo v `isDateDisabled`
- `src/hooks/useTimeSlots.ts` — filtrovať sloty < 36h od teraz
- `supabase/functions/create-booking/index.ts` — server-side 36h validácia
- `src/i18n/translations.ts` — minor text update

