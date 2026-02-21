

# Dynamicke sloty podla poctu zamestnancov

## Sucasny stav
Kazdy casovy slot (napr. 10:00) moze byt obsadeny **len raz**. Ak je 10:00 zabookovane, zobrazuje sa ako nedostupne - bez ohladu na to, kolko zamestnancov je aktivnych.

## Novy system
Pocet aktivnych zamestnancov urcuje **kapacitu** kazdeho slotu. Ak su 3 aktivni zamestnanci, slot 10:00 moze mat az 3 paralelne rezervacie. Slot sa zobrazi ako nedostupny az ked su vsetci zamestnanci obsadeni.

```text
Priklad: 3 aktivni zamestnanci, slot 10:00

  0 bookovani  -->  "10:00" (zeleny, 3/3 volne)
  1 bookovany  -->  "10:00" (zeleny, 2/3 volne)
  2 bookovani  -->  "10:00" (zlty,  1/3 volne)
  3 bookovani  -->  "10:00" (sedy,  obsadene)
```

## Zmeny

### 1. useTimeSlots.ts - Kapacitna logika
- Namiesto jednoduchej kontroly "je slot v zozname bookovanych" sa spocita **pocet bookingov** pre kazdy slot
- Nacita sa **pocet aktivnych zamestnancov** z tabulky `employees`
- Slot je `available` len ak `pocet_bookingov < pocet_zamestnancov`
- Novy typ `TimeSlot` sa rozsiri o `bookedCount` a `totalCapacity` pre UI vizualizaciu

### 2. types/booking.ts - Rozsirenie typu TimeSlot
```typescript
export interface TimeSlot {
  time: string;
  available: boolean;
  bookedCount: number;    // kolko je uz obsadenych
  totalCapacity: number;  // kolko zamestnancov moze obsluzit
}
```

### 3. DateTimeSelection.tsx - Vizualne indikatory kapacity
- Pod kazdym casovym slotom sa zobrazi maly indikator obsadenosti (napr. "2/3")
- Farebne rozlisenie:
  - **Zelena** - vacsina volna (menej ako 50% obsadene)
  - **Zlta/oranzova** - takmer plne (zostava 1 miesto)
  - **Seda/nedostupna** - plne obsadene
- V hlavicke sekcie (rano/poobede) sa zobrazi celkovy pocet volnych slotov

### 4. create-booking edge function - Bez zmeny
- Uz teraz implementuje round-robin priradenie zamestnancov
- Uz kontroluje ci je slot obsadeny - tuto kontrolu treba upravit na pocitanie vs kapacitu
- Namiesto `maybeSingle()` sa spocita pocet bookingov pre dany slot a porovna s poctom aktivnych zamestnancov

### 5. CalendarView.tsx - Drobna uprava
- V kalendari admin panelu pri drag-and-drop kontrole tiez zohladnit kapacitu (nie len "uz existuje booking")

## Technicke detaily

Ziadne zmeny schemy databazy nie su potrebne - vsetko sa pocita dynamicky z existujucich dat (`employees.is_active` + `bookings` count per slot).

Dotkute subory:
- `src/types/booking.ts`
- `src/hooks/useTimeSlots.ts`
- `src/components/booking/DateTimeSelection.tsx`
- `supabase/functions/create-booking/index.ts`
- `src/components/admin/CalendarView.tsx`

