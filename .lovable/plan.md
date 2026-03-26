

# Bug: Klik na 07:00 vyberie 06:30

## Príčina

Keď používateľ tapne na časový slot na mobile:
1. `onTimeSelect('07:00')` sa zavolá správne
2. Po 200ms sa spustí `scrollIntoView` (oprava z predchádzajúceho kroku)
3. Scroll posunie stránku a na mobile to vyvolá **phantom/ghost tap** na inom slote (06:30)
4. `onTimeSelect('06:30')` prepíše pôvodnú hodnotu

Toto je známy mobilný bug — `scrollIntoView` počas dotykovej interakcie generuje falošné kliknutia.

## Oprava

### `src/components/booking/BookingWizard.tsx`

Pridať **guard** s `useRef` timestampom, ktorý ignoruje `onTimeSelect` volania do 400ms po poslednom výbere:

```typescript
const lastTimeSelectRef = useRef<number>(0);

const handleTimeSelect = (time: string) => {
  const now = Date.now();
  if (now - lastTimeSelectRef.current < 400) return; // ignore ghost taps
  lastTimeSelectRef.current = now;
  
  updateBookingData('time', time);
  setTimeout(() => {
    if (submitRef.current) {
      submitRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    } else {
      detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 300); // slightly longer delay
};
```

Zmeny:
- Nový `useRef<number>(0)` na uloženie timestampu posledného výberu
- Guard na začiatku `handleTimeSelect` — ak < 400ms od posledného výberu, ignoruje sa
- Scroll delay zvýšený z 200ms na 300ms pre istotu

Jeden súbor, ~5 riadkov zmien.

