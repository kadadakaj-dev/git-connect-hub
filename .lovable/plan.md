

# Rekonštrukcia Google a Apple OAuth prihlásenia

## Čo sa spraví

Znovu nakonfigurujem Google a Apple OAuth prihlásenie pomocou nástroja Configure Social Login, ktorý vygeneruje čerstvý `src/integrations/lovable/` modul s aktuálnym `@lovable.dev/cloud-auth-js` balíkom.

Aktuálna implementácia v `ClientAuth.tsx` už správne používa `lovable.auth.signInWithOAuth()` -- po rekonfigurácii zostane kód rovnaký, len sa obnoví backend OAuth nastavenie.

## Kroky

1. Spustiť Configure Social Auth tool pre Google a Apple providera
2. Overiť že `src/integrations/lovable/index.ts` bol správne pregenerovaný
3. Žiadne zmeny v `ClientAuth.tsx` nie sú potrebné -- kód už používa správne API

## Technické detaily

- OAuth redirect URL: `window.location.origin + '/portal'`
- Provideri: `google`, `apple`
- Modul: `@lovable.dev/cloud-auth-js`

