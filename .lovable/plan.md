

# Oprava: Otváracie hodiny - mobile layout

## Analýza

Piatok **je** zobrazený v zozname (potvrdené z tvojho vlastného textu). Problém je pravdepodobne vizuálny — na mobile sa nadpis "Otváracie hodiny" + tlačidlo "Uložiť" nezmestia na jeden riadok a vytlačia obsah, čo môže spôsobiť, že niektoré dni nie sú viditeľné bez scrollovania.

## Zmeny v `src/components/admin/OpeningHoursManagement.tsx`

1. **CardTitle** — zmenšiť font z default `text-2xl` na `text-lg` (resp. pridať `text-lg` class)
2. **CardDescription** — zmenšiť na `text-xs`
3. **CardHeader** — na mobile zmeniť layout na stĺpcový (`flex-col sm:flex-row`) aby sa nadpis a tlačidlo neprepisovali
4. **Deň riadky** — zmenšiť `gap-4` na `gap-2` a `p-4` na `p-3` na mobile, zmenšiť šírku názvu dňa z `w-28` na `w-24`
5. **Time inputs** — zmenšiť `w-32` na `w-28` pre lepšie zmestenie

Celkovo zmeny v jednom súbore, ~5 riadkov úprav CSS tried.

