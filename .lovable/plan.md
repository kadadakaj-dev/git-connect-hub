

## Plan: Roztiahnuť tab bar na celú šírku na mobile

### Problém
TabsList má `justify-start` a jednotlivé TabTriggery majú fixné `px-2`, takže na mobile sa taby tlačia doľava a nezaberajú celú šírku. Ikony a texty sú malé a ťažko klikateľné.

### Riešenie
Jednoduché CSS zmeny v `src/pages/AdminDashboard.tsx`:

1. **TabsList**: zmeniť `justify-start` na `justify-between` (alebo pridať `grid grid-cols-6`) aby sa taby rovnomerne roztiahli na celú šírku
2. **TabsTrigger**: pridať `flex-1` aby každý tab zaberal rovnaký podiel šírky, zväčšiť ikony na `w-5 h-5` na mobile
3. Odstrániť `overflow-x-auto flex-nowrap` keďže taby sa zmestia do gridu

### Zmeny
- **`src/pages/AdminDashboard.tsx`** (riadky 119-130):
  - TabsList: `w-full grid grid-cols-6` namiesto `overflow-x-auto flex-nowrap justify-start`
  - TabsTrigger: pridať `flex-1 w-full`, zväčšiť touch target a ikony

