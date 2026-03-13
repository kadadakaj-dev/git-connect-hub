

# Generovanie preview obrazku "Atmospheric Technical" dizajnu

## Co spravim
Vytvorim edge funkciu ktora vygeneruje 2k preview obrazok noveho dizajnu pomocou AI image generation (google/gemini-3-pro-image-preview pre vyssiu kvalitu). Obrazok zobrazim na jednoduchou stranku aby si ho mohol/a schvalit pred implementaciou.

## Prompt pre generovanie
Pouzije sa detailny prompt z tvojho zadania:
- Dark mode zinc-950 pozadie
- Glassmorphic karty s 5% opacitou a 12px blur
- Emerald akcenty
- Bento-grid layout
- Spotlight hover efekty
- Gradient headingy (biela -> zinc-400)
- Minimalisticky booking wizard pre fyzioterapiu/chiroprakticke sluzby
- Logo "FYZIO&FIT" v headeri

## Kroky
1. Vytvorim edge funkciu `generate-preview` ktora zavola AI image model s detailnym promptom
2. Vygenerovany obrazok ulozim do storage bucketu
3. Zobrazim ho na docasnej /preview stranke kde si ho mozes pozriet
4. Po schvaleni prejdem na implementaciu plneho redizajnu

## Technicke detaily
- Model: `google/gemini-3-pro-image-preview` (najvyssia kvalita pre UI preview)
- Vystup: PNG, zobrazeny inline na preview stranke
- Edge funkcia bude jednorazova -- po schvaleni ju mozem odstranit
- Ziadne zmeny existujuceho kodu, len novy endpoint a docasna stranka

