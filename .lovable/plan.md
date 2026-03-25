

# Nova dedicka sablona pre pripomienkovy email

## Problem
Pripomienkovy email pouziva rovnaku sablonu ako potvrdenie (iba meni nadpis). Storno podmienky s pokutou 10€ su malo viditelne — maly text v alert boxe.

## Zmeny

### 1. `supabase/functions/send-booking-email/index.ts`

**Nova funkcia `generateReminderHtml()`** — uplne oddelena od `generateEmailHtml()`:
- **Header**: Oranzovo-cerveny gradient (`#dc2626` → `#ef4444`) namiesto modreho, s textom "PRIPOMIENKA" a ikonou zvonceka (Unicode)
- **Velky cerveny banner s pokutou**: Plne cervene pozadie (`#dc2626`), biely text, velky font (22px) s textom:
  - "STORNO POPLATOK 10 €"
  - "Zrusenie je mozne len telefonicky: +421 905 307 198"
  - Oddeleny vizualne od zvysku emailu, neda sa prehliadnut
- **Booking details**: Zachovany povodny styl (sluzba, datum, cas, miesto)
- **Zrusenie tlacidlo**: Zachovane pod detailmi
- **Subject line**: Zmena na urgentnejsie "⚠️ PRIPOMIENKA: Vas termin zajtra - FYZIO&FIT"

**Nova funkcia `generateReminderText()`** — plain-text verzia s vyraznym STORNO blokom.

**Uprava routingu** v `serve()` handleri (riadky ~499-502):
- Ked `isReminder`, volat `generateReminderHtml()` a `generateReminderText()` namiesto spolocnej `generateEmailHtml()`

### 2. Deploy edge function
Po uprave suboru deploynut `send-booking-email`.

## Technicke detaily

Nove funkcie budu v tom istom subore `send-booking-email/index.ts`. Routing sa zmeni z:
```
} else {
  subject = isReminder ? t.reminderSubject : t.subject;
  html = generateEmailHtml(data, baseUrl);
```
na:
```
} else if (isReminder) {
  subject = "⚠️ PRIPOMIENKA: ...";
  html = generateReminderHtml(data, baseUrl);
  textContent = generateReminderText(data, baseUrl);
} else {
  subject = t.subject;
  html = generateEmailHtml(data, baseUrl);
```

Cerveny banner bude full-width table row s:
- `background-color: #dc2626`, `padding: 28px 30px`
- Nadpis 22px bold biely: "STORNO POPLATOK: 10 €"
- Pod nim 16px: "Zrusenie menej ako 12h pred terminom je mozne len telefonicky"
- Telefonne cislo 20px bold biely: "+421 905 307 198"

