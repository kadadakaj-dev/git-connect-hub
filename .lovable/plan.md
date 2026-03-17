
Cieľ: keď admin/majiteľ klikne na rezerváciu kdekoľvek v admin časti, musí vždy vidieť kompletný detail rezervácie bez straty údajov.

1. Čo som zistil pri hlbokej kontrole
- Toto nie je problém databázy ani prístupových práv. Posledné rezervácie v databáze telefónne čísla majú vyplnené.
- Problém je hlavne v kalendári:
  - klik na rezerváciu v `CalendarView` neotvára detail rezervácie, ale `EventModal`
  - `EventModal` pracuje len s obmedzeným `EventFormData` (`id`, `date`, `startTime`, `duration`, `title`, `type`, `notes`, `therapistId`)
  - tým pádom sa po ceste úplne stratia `client_email`, `client_phone`, `status`, `created_at`, plný detail služby a ďalšie meta údaje
- V `BookingManagement` a `OverviewStats` sa používa `BookingDetailsDialog`, ktorý telefón/email vie zobraziť. Teda admin má dnes nekonzistentné správanie podľa toho, odkiaľ rezerváciu otvorí.
- V kalendári sa navyše trvanie berie zo `service.duration`, nie z uloženého `bookings.booking_duration`, takže detail môže ukazovať nesprávne trvanie.

2. Bežné nedostatky, ktoré audit odhalil
- `CalendarView` skrýva zrušené rezervácie úplne (`.neq('status', 'cancelled')`), takže admin nevidí celý obraz.
- Vytvorenie blokácie času sa momentálne len “tvári” ako úspešné cez toast, ale reálne sa neukladá do databázy.
- Resize rezervácie v kalendári sa vizuálne zmení, ale zmena sa neukladá.
- Farebné rozlíšenie podľa kategórie služby je pripravené utilitou, ale vo viewoch sa kategória fakticky neposúva.
- Pri načítaní adminu som zachytil aj React warning s `ref`, čiže v admin časti je ešte minimálne jeden vedľajší technický problém.

3. Návrh riešenia
- Zjednotiť admin detail rezervácie do jedného zdroja pravdy:
  - buď rozšíriť `BookingDetailsDialog`
  - alebo vytvoriť nový spoločný `AdminBookingDetailsDialog`
- Tento detail má dostávať plné údaje:
  - klient: meno, email, telefón
  - termín: dátum, čas, reálne trvanie, stav
  - služba: názov, kategória, cena, dĺžka
  - terapeut: meno
  - poznámka klienta
  - meta: created_at, prípadne info o priradení klienta k účtu
- Klik na rezerváciu v kalendári:
  - pre booking otvorí detail rezervácie
  - pre block ponechá `EventModal`
- Až z detailu má admin ísť na úpravu/presun/zrušenie, nie priamo do osekanej edit formy.

4. Konkrétne zmeny v kóde
- `src/components/admin/CalendarView.tsx`
  - rozšíriť select o `created_at`, `booking_duration` a bohatší `services(...)`
  - prestať zahadzovať údaje pri mapovaní eventov
  - zaviesť samostatný stav pre “selected booking details”
- `src/components/admin/calendar/types.ts`
  - rozšíriť `CalendarEvent` o chýbajúce polia: `createdAt`, `bookingDuration`, `serviceCategory`, prípadne bohatší service snapshot
- `src/components/admin/calendar/EventModal.tsx`
  - nechať len pre blokácie a edit operácie, nie ako primárny detail klientovej rezervácie
- `src/components/admin/BookingDetailsDialog.tsx`
  - povýšiť na plnohodnotný detail pre všetky admin vstupy
  - doplniť chýbajúce sekcie a mobilné správanie, aby sa nič nestrácalo
- `src/components/admin/BookingManagement.tsx` a `src/components/admin/OverviewStats.tsx`
  - prepnúť na rovnaký rozšírený detail model, aby všade boli totožné informácie

5. Testovací plán, ktorý by som nasadil
- Desktop + mobil:
  - klik na rezerváciu v Day, Week, Month, List view
  - klik na rezerváciu v Overview a v Bookings tabuľke
  - overiť rovnaké polia všade: meno, email, telefón, služba, trvanie, terapeut, status, poznámka, created_at
- Hraničné stavy:
  - rezervácia bez telefónu
  - rezervácia bez terapeuta
  - rezervácia s poznámkou
  - rezervácia, kde `booking_duration` nesedí s aktuálnou dĺžkou služby
- Automatické testy:
  - komponent test pre `BookingDetailsDialog`
  - mapovanie dát v `CalendarView`
  - klik-flow test pre kalendár a booking list
  - mobilné snapshoty / render test pre dlhý email a telefón

6. Priorita opráv
- Kritické hneď:
  - kompletný detail rezervácie z kalendára
  - správne trvanie z `booking_duration`
  - jednotné správanie detailu vo všetkých admin moduloch
- Hneď po tom:
  - zobrazenie zrušených rezervácií
  - reálne ukladanie blokácií
  - persist resize
  - oprava category color wiring
  - odstránenie React `ref` warningu

Technická poznámka
- Telefónne číslo nie je “stratené” v databáze. Stráca sa vo fronte medzi query a modalom.
- Jadrom problému sú najmä `src/components/admin/CalendarView.tsx`, `src/components/admin/calendar/types.ts` a `src/components/admin/calendar/EventModal.tsx`.
