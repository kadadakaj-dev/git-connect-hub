# UI/UX Revival Blueprint

## Kontext

Tento blueprint je navrhnutý pre frontend-only revitalizáciu projektu v Lovable-connected repozitári.

Platí pevné obmedzenie:

- bez zásahov do databázy
- bez zásahov do Supabase migrácií
- bez zásahov do edge functions
- bez zmien secrets alebo infra

Cieľ je zlepšiť:

- vizuálnu konzistenciu
- UI/UX kvalitu
- performance na klientovi
- dôveryhodnosť produktu
- čitateľnosť a premium pocit značky

Pri návrhu rešpektujeme existujúci smer:

- liquid glass
- baby blue paleta
- svetlý, jemný, klinický vizuálny jazyk
- existujúce Tailwind + CSS tokeny

## Aktuálny stav

V projekte už existujú relevantné základy:

- glass tokeny a blur systém v `src/index.css`
- glass utility vrstvy `.glass`, `.glass-card`, `.glass-premium`
- gradientové blob pozadie v `src/components/GlassBackground.tsx`
- glass card wrapper v `src/components/booking/GlassCard.tsx`
- typography základ cez Inter + Google Sans Flex

To znamená:

- netreba meniť dizajnový smer
- treba ho zjednotiť, spresniť a disciplinovať

## Dizajnový zámer

Výsledný produkt má pôsobiť ako:

- čistý medicínsko-premium booking interface
- moderný, ale nie flashy
- jemne futuristický, nie candy UI
- mäkký, hladký, svetlý, transparentný
- dôveryhodný na mobile aj desktope

Vizuálna formula:

- baby blue base
- biele a ľadové sklá
- decentné navy akcenty len na text/CTA
- tekutý blur a odlesky
- minimálny noise
- mäkké tiene

## Nevyjednateľné pravidlá

1. Žiadna nová farebná anarchia.
2. Žiadne tmavé navy celé bloky ako dominantné pozadie.
3. Žiadne ťažké gradienty s fialovou a ružovou ako hlavný brand jazyk.
4. Žiadne agresívne animácie.
5. Každá nová sekcia musí používať existujúci glass system alebo jeho upravenú verziu.
6. UI zmena nesmie zhoršiť výkon homepage alebo booking flow.
7. Mobile first je povinný.

## Vizuálny systém 2.0

### 1. Farby

Primárna paleta:

- Baby Blue: `#BFE2FF`
- Ice Blue: `#EAF6FF`
- Mist Blue: `#D8EEFF`
- Sky Accent: `#7EC3FF`
- Soft Navy Text: `#1E3552`
- Deep Navy Accent: `#24476B`
- Frost White: `rgba(255,255,255,0.72)`

Pravidlá použitia:

- `Baby Blue` pre hero background a soft surfaces
- `Ice Blue` pre sekundárne pozadie sekcií
- `Sky Accent` pre hover/focus žiarenie
- `Soft Navy Text` pre headings
- `Deep Navy Accent` iba pre CTA a key interactive states

### 2. Glass vrstvy

Zaviesť 3 jasné úrovne:

- `glass-soft`
  - vysoká transparentnosť
  - menší blur
  - pre drobné prvky a top bars
- `glass-card`
  - hlavná pracovná karta
  - stredný blur
  - default pre formuláre a panely
- `glass-premium`
  - hero a focus surfaces
  - vyšší blur
  - vyšší border contrast
  - jemný float shadow

Každá vrstva musí mať:

- jednotný border behavior
- jednotný reflection layer
- jednotný hover model

### 3. Tiene

Súčasný shadow systém je dobrý základ, ale treba menej kontrastu a viac rozptýlenia.

Cieľ:

- menej "drop shadow box"
- viac "floating frosted pane"

### 4. Radius

Unifikovať:

- primárne karty: `24px`
- inputs: `16px`
- pills/selects/buttons: `14px`
- modals: `28px`

Súčasný projekt má viacero radius štýlov naraz. To treba sceliť.

## Typografia

### Headings

Použiť Google Sans Flex iba tam, kde reálne pomáha:

- hero brand
- názvy krokov
- admin panel sekčné headery
- dôležité CTA nadpisy

### Body

Inter nechať pre:

- formuláre
- tabuľky
- metadata
- explanatory text

### Typografická hierarchia

- H1: silný, ale nie obrovský
- H2: sekčný driver
- H3: karta alebo panel title
- body: čitateľný, viac white space
- meta: kontrastne slabšie, ale stále čitateľné

## Motion systém

### Povolené

- fade + translate Y
- soft scale-in
- delayed stagger pre zoznamy
- hover lift do 2-4px
- jemný blur/brightness shift

### Zakázané

- bouncing
- parallax-heavy motion
- dlhé spring animácie v každom komponente
- nekonečné mikroanimácie mimo background blobov

### Motion priority

- booking progress
- modal transitions
- section reveals
- CTA hover confidence

## Stránkový blueprint

## A. Landing / Booking home (`/`)

### Cieľ

Z homepage spraviť:

- okamžite pochopiteľný rezervačný flow
- premium klinický prvý dojem
- menej vizuálneho šumu
- vyššia dôvera

### Zmeny

- prefarbiť celé pozadie z mixu cyan/purple/pink blobov na baby blue + ice blue + soft navy akcenty
- hero header zjednodušiť
- booking wizard dostať do dominantného central glass containeru
- zmenšiť pocit "dlhého formulára"
- jasnejšie oddeliť kroky 1-4
- posilniť vizuálne completion states
- zjednotiť spacing medzi sekciami

### UX zásahy

- krok, ktorý ešte nie je aktívny, má byť jasne neinteraktívny, ale stále čitateľný
- po výbere služby musí byť scroll/transition jemný a predvídateľný
- submit area musí byť stále vizuálne prítomná
- chyby vo formulári musia byť zrozumiteľné a lokalizované pri poli

### Performance zásahy

- minimalizovať paint-heavy vrstvy nad hero sekciou
- znížiť počet veľkých blur plôch na homepage
- splash screen skrátiť alebo zjemniť

## B. Splash screen

### Cieľ

Nech nepôsobí ako blokujúca intro animácia, ale ako krátky premium handshake.

### Zmeny

- baby blue base ponechať
- znížiť trvanie
- menej kontrastný prechod
- menej pocitu "preloader", viac pocitu "brand reveal"

### Pravidlo

Ak splash zhoršuje LCP/TTI perception, musí byť buď:

- kratší
- jednoduchší
- alebo úplne potlačený na repeat návštevách

## C. Client auth (`/auth`)

### Cieľ

Znížiť friction a zvýšiť dôveru.

### Zmeny

- auth card vizuálne ukotviť do premium glass panelu
- sidebar nechať, ale spraviť ju menej dekoratívnu a viac informačnú
- sociálne sign-in tlačidlá musia byť viac konzistentné
- form tabs majú pôsobiť viac ako segmented control
- field focus states majú byť baby blue glow, nie generický ring

### UX zásahy

- znížiť vertikálny chaos
- jasnejšie oddeliť login vs register
- lepšie pracovať s error textami
- odstrániť pocit, že používateľ ide do iného produktu než booking homepage

## D. Client portal (`/portal`)

### Cieľ

Z portálu spraviť dôveryhodný self-service dashboard, nie len "záložku s kartami".

### Zmeny

- zjednotiť top bar, cards a tab surfaces
- viac rozdeliť stats, upcoming, history, favorites
- posilniť informačnú architektúru
- vizuálne zvýrazniť najbližší termín
- zlepšiť states pre empty / loading / error

### UX zásahy

- upcoming bookings majú byť najvýraznejší blok
- history má byť sekundárna
- favorites len ak pôsobia reálne užitočne
- settings/profile akcie musia byť menej schované

## E. Admin dashboard (`/admin`)

### Cieľ

Admin má pôsobiť pracovnejšie, menej marketingovo.

### Zmeny

- oslabiť dekoratívnosť glass efektu
- zvýšiť hustotu informácií bez vizuálneho chaosu
- tabs prerobiť na čitateľnejší pracovný navigation rail alebo silnejší tab bar
- overview cards musia byť funkčné, nie len pekné
- tabuľky musia mať lepší kontrast riadkov, sticky headers a čitateľnejšie filtre

### UX zásahy

- booking management: jasný filter bar, lepší search rhythm, stavové akcie čitateľnejšie
- services management: formulár a tabuľka nesmú pôsobiť ako scaffold
- employee management: rovnaký vizuálny model ako services
- opening hours: prehľadnejší weekly planner feeling
- calendar: musí pôsobiť ako plnohodnotný nástroj, nie experiment

## F. Cancel booking (`/cancel`)

### Cieľ

Minimalistický high-trust flow.

### Zmeny

- menej dekorácií
- silnejší status state
- lepší spacing okolo booking summary
- destructive akcia musí byť jasná, ale nie hysterická

## Komponentový blueprint

### Prioritné komponenty na refactor

1. `GlassBackground`
2. `GlassCard`
3. `BookingHeader`
4. `SectionHeader`
5. `SubmitButton`
6. `CookieBanner`
7. `BookingManagement`
8. `OverviewStats`
9. `CalendarView`
10. auth a portal cards

### Zaviesť shared patterns

- `SurfaceCard`
- `SurfacePanel`
- `SurfaceToolbar`
- `StatusPill`
- `EmptyState`
- `SectionShell`
- `FormFieldShell`

Tieto shared surface patterns majú znížiť chaos a opakovanie ručne skladaných className kombinácií.

## UX problémové body, ktoré treba odstrániť

- príliš veľa "krásnych" povrchov bez jasnej priority
- slabý rozdiel medzi marketing surface a pracovnou surface
- inconsistent spacing medzi stránkami
- mix jemného premium dizajnu a scaffold admin komponentov
- niektoré flows pôsobia ako prototyp, iné ako hotový produkt

## Liquid Glass implementačný smer

### Nesmie to skončiť ako:

- iOS paródia
- preblurovaný chaos
- nízky kontrast
- zlá čitateľnosť tabuliek a formulárov

### Má to skončiť ako:

- transparentné vrstvy nad baby blue atmosférou
- jemný odlesk
- vysoká čitateľnosť
- konzistentný povrchový systém
- klinická čistota

### Technické pravidlá

- blur používať cielene, nie plošne
- veľké background bloby obmedziť na 2-3 zóny
- glass vrstvy nesmú vytvárať zbytočný repaint chaos
- mobilné zariadenia dostanú ľahšiu verziu blur a shadows

## Mobile blueprint

### Cieľ

Mobil má byť hlavný scénar, nie zmenšený desktop.

### Pravidlá

- booking wizard musí byť ovládateľný jedným palcom
- CTA vždy opticky ukotvené
- spacing menší, ale nie natlačený
- glass efekty na mobile zjednodušiť
- admin na mobile nemusí byť luxuriantný, ale musí byť použiteľný

### Mobilné priority

- homepage booking flow
- auth
- cancel booking
- client portal

## Performance-first UI pravidlá

Keďže current performance je slabá, nový dizajn musí byť lacnejší než dnešný chaos.

### Povinné zásahy

- zredukovať počet veľkých dekoratívnych vrstiev
- znížiť zbytočné framer-motion použitie tam, kde neprináša UX hodnotu
- lazy load ťažších admin častí ponechať
- optimalizovať first viewport
- minimalizovať CLS pri načítaní

### Bundle disciplína

- nepridávať nové vizuálne knižnice
- nereplikovať glass patterns inline v každom komponente
- centralizovať utility

## SEO/Trust vrstva

Aj pri frontend-only zásahoch treba upratať:

- OG image konzistentne s brandom
- title/meta konzistentnejšie
- hero copy viac trust oriented
- cookie consent vizuálne aj behaviorálne profesionálnejší

## Fázovanie implementácie

## Fáza 1: Foundation cleanup

Cieľ:

- zjednotiť tokeny
- očistiť glass systém
- prefarbiť background jazyk

Úlohy:

- refactor color tokens na baby blue driven systém
- prerobiť `GlassBackground`
- zjednotiť `GlassCard` a surface classes
- vyladiť border/shadow/radius scale
- upraviť focus, selection, scrollbars

## Fáza 2: Homepage + Booking flow

Cieľ:

- najdôležitejšia konverzná plocha

Úlohy:

- BookingHeader
- ServiceSelection
- DateTimeSelection
- ClientDetailsForm
- SubmitButton
- Confirmation
- splash cleanup

## Fáza 3: Auth + Client portal

Úlohy:

- ClientAuth UI cleanup
- ClientPortal hierarchy
- profile/settings surfaces
- empty states

## Fáza 4: Admin stabilization

Úlohy:

- OverviewStats
- BookingManagement
- ServiceManagement
- EmployeeManagement
- OpeningHoursManagement
- CalendarView visual discipline

## Fáza 5: Final polish

Úlohy:

- microcopy consistency
- animation tuning
- responsive polish
- legal/cookie polish
- final visual regression pass

## Definition of Done

Blueprint je splnený, keď:

- homepage pôsobí konzistentne premium a čisto
- baby blue + glass kombinácia je jasný brand systém, nie náhodný mix
- admin a client časti patria do toho istého produktu
- mobile UX je citeľne lepšie
- vizuálne zlepšenie nezhorší build alebo klientový výkon
- nové komponenty používajú shared surface patterns
- žiadna stránka nepôsobí ako scaffold

## Čo vedome nerobiť

- nemeníme databázový model
- nemeníme Supabase flows
- nepridávame nové product modules
- nerobíme dark mode redesign
- nepretvárame brand na úplne nový smer

## Realistický výsledok

Po tejto revitalizácii bude projekt:

- vizuálne presvedčivejší
- konzistentnejší
- dôveryhodnejší
- pripravený na ďalší frontend hardening

Nebude to ešte:

- enterprise-grade booking suite
- SaaS platforma
- plne strategicky odlíšený produkt

Ale bude to:

- omnoho zdravší klinický booking frontend
- vhodný základ na ďalšie iterácie bez chaosu
