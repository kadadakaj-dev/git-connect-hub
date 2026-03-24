

# Zvýrazniť obsadené sloty výraznejšou červenou

## Problém
Obsadené (rezervované) sloty majú príliš jemné červené pozadie (`bg-red-500/18` = 18% opacity), takže na prvý pohľad nie sú dostatočne viditeľné.

## Zmeny

### 1. Súbor `src/components/booking/slotStyles.ts`
Zvýšiť viditeľnosť červenej pre obsadené sloty:
- Pozadie: `bg-red-500/18` → `bg-red-500/30` (výraznejšie červené pozadie)
- Border: `border-red-500/45` → `border-red-500/60` (viditeľnejší okraj)
- Pridať `line-through` pre prečiarknutie textu času
- Zvýšiť vnútorný tieň pre lepší kontrast

### 2. Aktualizovať test `slotStyles.test.ts`
Upraviť expected hodnoty v teste aby zodpovedali novým triedam (`bg-red-500/30`, `border-red-500/60`).

