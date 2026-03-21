

## Diagnostika a oprava appky pre finálnu produkciu

### Identifikované problémy

**1. SplashScreen — zlý fade-out a AnimatePresence bug**
- `AnimatePresence` obaľuje `motion.div`, ale nikdy nedochádza k unmount animácii — komponent sa odstraňuje cez React state (`showSplash && ...`), nie cez AnimatePresence key. Exit animácia sa nikdy nespustí.
- Fade-out overlay (`bg-white`) zakrýva obsah, ale samotný splash `motion.div` sa nikdy korektne nezanimuje von.
- Písmená majú `y: 8` animáciu, čo je v rozpore s CLS optimalizáciou (memory note).
- **Oprava:** Odstrániť `AnimatePresence` (zbytočný), odstrániť `y` transform z písmen (použiť len opacity), zjednodušiť exit — App.tsx už rieši skrytie cez state.

**2. SplashScreen — timing mismatch**
- `FADE_START = 3.4s`, overlay fade trvá `0.6s` = vizuálne hotové v `4.0s`
- `TOTAL_DURATION = 4000ms` = `onComplete` sa volá presne keď overlay skončí fade
- Memory note hovorí 3000ms. Znížiť na 3000ms pre lepší UX.

**3. App.tsx — hlavný obsah je `visibility: hidden` počas splash**
- Keď splash beží, hlavný content je `visibility: hidden + position: absolute`. Toto spôsobuje, že lazy-loaded stránky sa nenačítavajú paralelne. Po splash skončí, užívateľ vidí loading spinner namiesto okamžitého obsahu.
- **Oprava:** Zmeniť na `opacity: 0` namiesto `visibility: hidden`, aby sa obsah renderoval a lazy chunks sa stiahli počas splash animácie.

**4. Testy — App.integration.test.tsx treba aktualizovať**
- Test "should show splash screen on first visit" hľadá `role="status"` s `name=/Loading FYZIO/i` — toto funguje.
- Po oprave splash timingu (3s → 3s) testy ostanú OK, ale treba overiť.

### Plán zmien

**Súbor 1: `src/components/SplashScreen.tsx`**
- Odstrániť `AnimatePresence` wrapper (nič neanimuje)
- Odstrániť `y: 8` z letter animácií (len opacity fade-in)
- Znížiť `TOTAL_DURATION` na `3000`ms
- Upraviť `FADE_START` na `2.4s` (aby overlay stihl fade pred onComplete)
- Odstrániť breathing `scale` animáciu (CLS problém)

**Súbor 2: `src/App.tsx`**
- Zmeniť `visibility: 'hidden'` na `opacity: 0` + `pointerEvents: 'none'` počas splash — umožní paralelné načítanie lazy chunks
- Pridať `transition: 'opacity 0.3s'` pre plynulý prechod

**Súbor 3: `src/__tests__/integration/App.integration.test.tsx`**
- Aktualizovať test aby reflektoval zmenu z `visibility:hidden` na `opacity:0`
- Pridať test pre plynulý prechod splash → content

### Súhrn
- 3 súbory, žiadne vizuálne zmeny v bežnom UX
- Rýchlejšie načítanie po splash (lazy chunks sa sťahujú paralelne)
- Žiadne CLS problémy zo splash animácií
- Konzistentný timing (3s)

