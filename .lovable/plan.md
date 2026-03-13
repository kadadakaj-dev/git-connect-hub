

# Express karta — Baby Blue Liquid Glass

## Zmeny v `src/components/booking/ServiceSelection.tsx`

Nahradiť všetky amber/orange farby za baby blue odtiene:

| Aktuálne (amber) | Nové (baby blue) |
|---|---|
| `from-amber-500/[0.08] to-orange-500/[0.05]` | `from-sky-400/[0.08] to-blue-400/[0.05]` |
| `bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20` | `bg-sky-400/15 text-sky-600 dark:text-sky-400 border-sky-400/20` |
| `text-amber-600 dark:text-amber-400` (cena) | `text-sky-600 dark:text-sky-400` |
| `border-amber-500/20` + `group-hover:bg-amber-500/10 group-hover:border-amber-500/30` (CTA) | `border-sky-400/20` + `group-hover:bg-sky-400/10 group-hover:border-sky-400/30` |
| Phone icon `text-amber-600 dark:text-amber-400` | `text-sky-600 dark:text-sky-400` |
| Telefónne číslo `text-amber-600 dark:text-amber-400` | `text-sky-600 dark:text-sky-400` |

Komentár "Amber gradient overlay" → "Baby blue gradient overlay".

Jeden súbor, čisto farebná výmena — layout a glass efekty zostávajú rovnaké.

