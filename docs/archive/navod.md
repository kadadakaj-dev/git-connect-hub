# Návod na dokončenie Booking Systému

## 5 Promptov pre dokončenie celého systému

---

### 1. Vytvorenie databázy pre rezervácie

```
Vytvor databázové tabuľky pre booking systém:
- tabuľka "bookings" s poliami: id, service_id, date, time_slot, client_name, client_email, client_phone, notes, status (pending/confirmed/cancelled), created_at
- tabuľka "services" s poliami: id, name_sk, name_en, description_sk, description_en, duration, price, category, is_active
- tabuľka "time_slots" s dostupnými časmi pre každý deň
- pridaj RLS politiky pre bezpečný prístup
- ulož ukážkové služby do databázy
```

---

### 2. Prepojenie formulára s databázou

```
Prepoj booking wizard s databázou:
- pri odoslaní formulára ulož rezerváciu do tabuľky "bookings"
- načítaj služby z databázy namiesto statických dát
- načítaj dostupné časové sloty z databázy
- kontroluj konflikty rezervácií (rovnaký čas + dátum)
- zobraz toast správu po úspešnom uložení
```

---

### 3. Admin dashboard s rezerváciami

```
Rozšír admin dashboard:
- zobraz zoznam všetkých rezervácií z databázy v tabuľke
- pridaj filtre: podľa dátumu, služby, statusu
- umožni meniť status rezervácie (potvrdiť/zrušiť)
- pridaj vyhľadávanie podľa mena klienta alebo emailu
- zobraz štatistiky: počet rezervácií dnes/tento týždeň/tento mesiac
```

---

### 4. Správa služieb a časov

```
Pridaj do admin panelu správu služieb:
- CRUD operácie pre služby (pridať/upraviť/zmazať)
- nastavenie pracovných hodín pre každý deň v týždni
- nastavenie dĺžky prestávky medzi rezerváciami
- možnosť zablokovať konkrétne dni (sviatky, dovolenka)
- nastavenie maximálneho počtu rezervácií na deň
```

---

### 5. Email notifikácie

```
Pridaj email notifikácie pomocou edge function:
- potvrdzovací email klientovi po vytvorení rezervácie
- notifikácia adminovi o novej rezervácii
- pripomienka klientovi 24 hodín pred termínom
- email pri zmene statusu rezervácie
- použi profesionálnu HTML šablónu s logom kliniky
```

---

## Bonus prompty

### Kalendárový pohľad
```
Pridaj kalendárový pohľad do admin panelu:
- zobraz rezervácie vo forme týždenného/mesačného kalendára
- drag & drop pre presúvanie rezervácií
- farebné rozlíšenie podľa typu služby
- kliknutím na slot vytvor novú rezerváciu
```

### Google Calendar integrácia
```
Pridaj Google Calendar sync:
- synchronizuj rezervácie s Google Calendar
- importuj existujúce udalosti ako blokované časy
- dvojsmerná synchronizácia
```

---

## Prihlasovací údaje pre admin

Po vytvorení admin účtu cez Supabase dashboard:
- Email: booking@fyzioafit.sk
- Heslo: oUjuGUYMuzxtCiQy

**Dôležité:** Najprv musíš vytvoriť používateľa v Supabase a potom mu priradiť admin rolu v tabuľke user_roles.
