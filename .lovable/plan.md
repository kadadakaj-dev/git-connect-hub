

# Oprava admin kalendára: 3 problémy

## Problém 1: Admin nemôže vytvoriť rezerváciu z kalendára
V `CalendarView.tsx` riadky 291-297 — keď admin klikne na slot a vytvorí booking, `handleSave` len zobrazí toast "Nové rezervácie vytvárajte cez rezervačný systém" a vráti sa. Treba namiesto toho **skutočne vložiť záznam do tabuľky `bookings`**.

### Riešenie
Nahradiť toast v `handleSave` za `supabase.from('bookings').insert(...)` s údajmi z formulára (date, time_slot, client_name=title, employee_id, notes, booking_duration, status='confirmed'). Admin má RLS politiku "Admins can manage all bookings" takže INSERT prejde.

**Súbor:** `src/components/admin/CalendarView.tsx` — riadky 289-297
- Zmeniť `else` vetvu pre `formData.type === 'booking'` z toast na reálny INSERT
- Ak `formData.isRecurring`, vložiť viacero záznamov (každý týždeň)

## Problém 2: Swipe gestá pre horizontálnu navigáciu
Pridať touch swipe detekciu na kalendár — swipe doľava = ďalší deň/týždeň, swipe doprava = predchádzajúci.

### Riešenie
Pridať `onTouchStart`/`onTouchEnd` handler na wrapper div v `CalendarView.tsx`:
- Sledovať `touchStartX` a `touchEndX`
- Ak rozdiel > 50px, volať `handlePrev()` alebo `handleNext()`

**Súbor:** `src/components/admin/CalendarView.tsx`
- Pridať `useRef` pre touch tracking
- Pridať `onTouchStart`, `onTouchEnd` na hlavný kontajner

## Problém 3: Zdeformované objednávky
Posledná úprava v `utils.ts` pridala minimum výšku eventu (`SLOT_HEIGHT * 1.5`). Treba overiť že funguje správne a event text sa nezrezáva.

### Riešenie
Skontrolovať `getDayEventsWithPositions` v `utils.ts` — uistiť sa, že `min-h` v `TimeGridView.tsx` zodpovedá minimálnej výške z utils a text má `whitespace-normal break-words` pre čitateľnosť.

**Súbor:** `src/components/admin/calendar/TimeGridView.tsx` — event card styling

## Technické detaily

### INSERT pre admin booking (hlavná zmena)
```typescript
// V handleSave, vetva pre create + booking:
const { error } = await supabase.from('bookings').insert({
  date: formData.date,
  time_slot: formData.startTime,
  client_name: formData.title,
  client_email: 'admin@fyzioafit.sk', // placeholder pre admin-created
  employee_id: formData.therapistId || null,
  notes: formData.notes || null,
  booking_duration: formData.duration,
  status: 'confirmed',
});
```

### Swipe handler
```typescript
const touchRef = useRef({ startX: 0, startY: 0 });
onTouchStart={(e) => { touchRef.current = { startX: e.touches[0].clientX, startY: e.touches[0].clientY }; }}
onTouchEnd={(e) => {
  const dx = e.changedTouches[0].clientX - touchRef.current.startX;
  const dy = Math.abs(e.changedTouches[0].clientY - touchRef.current.startY);
  if (Math.abs(dx) > 50 && dy < Math.abs(dx)) {
    dx > 0 ? handlePrev() : handleNext();
  }
}}
```

## Zhrnutie zmien
| Súbor | Zmena |
|---|---|
| `CalendarView.tsx` | Admin booking INSERT + swipe gestá + email pole do EventModal |
| `EventModal.tsx` | Pridať pole pre email klienta (povinné pre bookings) |
| `TimeGridView.tsx` | Overiť min-height a text wrapping |

