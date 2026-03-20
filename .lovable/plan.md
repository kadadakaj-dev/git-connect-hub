

## Oprava zamrznutej welcome animácie

### Problém
Splash screen animácia zamŕza / trhá sa, pravdepodobne kvôli:
1. **Breathing `scale` animácia** na wrapperi — spôsobuje layout reflow počas písmenových animácií
2. **`y: 8` transform** na každom písmene — 9 simultánnych transform animácií + scale na rodičovi = GPU preťaženie
3. **Progress dot animuje `left` CSS property** — nie je GPU-akcelerovaná (triggeruje layout)
4. **Fade-out overlay** animuje sa simultánne s ostatnými

### Plán opravy

**Súbor: `src/components/SplashScreen.tsx`**

1. **Písmená** — zmeniť `y: 8` na `opacity`-only animáciu (bez transform, bez layout shift)
2. **Breathing wrapper** — odstrániť `scale` animáciu úplne (spôsobuje reflow a CLS)
3. **Progress dot** — zmeniť z `left` na `translateX` (GPU-akcelerované, bez layout)
4. **Glow line** — zmeniť animáciu `width` na `scaleX` s `transform-origin: left` (GPU)
5. Pridať `will-change: opacity` na kľúčové animované elementy
6. Skrátiť `TOTAL_DURATION` z 4000ms na 3000ms pre lepší UX (splash nemá zdržiavať)

### Výsledok
- Všetky animácie budú GPU-akcelerované (opacity + transform only)
- Žiadne layout reflow počas animácie
- Plynulá, luxusná animácia bez trhania

