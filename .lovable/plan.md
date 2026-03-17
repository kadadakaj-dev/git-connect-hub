

## Plan: Aktualizácia textov služieb

Služby už existujú v databáze. Treba aktualizovať názvy a popisy podľa nových textov.

### Zmeny (SQL migrácia)

3 UPDATE príkazy na tabuľku `services`:

1. **Chiro masáž** (id: `46b646fd...`) — zmeniť `name_sk` na "Chiro masáž", `description_sk` na "klasická masáž chrbta a ramien, chiropraxia/naprávanie, mobilizácie, bankovanie, masážna pištol"
   - Aktuálny popis: "chiropraxia, klasická masáž, mobilizácie, bankovanie, masážna pištol"
   - Nový popis pridáva "chrbta a ramien" a "chiropraxia/naprávanie"

2. **Naprávanie** (id: `a7adf1c3...`) — zmeniť `name_sk` na "Chiropraxia/Naprávanie", `description_sk` na "chiropraxia, masážna pištol"
   - Aktuálny názov: "Naprávanie" → nový: "Chiropraxia/Naprávanie"
   - Popis zostáva rovnaký

3. **Celotelová chiro masáž** (id: `bc350f40...`) — zmeniť `description_sk` na "klasická masáž celého tela, bankovanie, mobilizácie, chiropraxia/naprávanie a iné"
   - Aktuálny popis: "klasická masáž, bankovanie, mobilizácie, chiropraxie a iné"
   - Nový popis: "celého tela" a "chiropraxia/naprávanie"

Ceny, trvanie a anglické texty zostávajú bez zmeny. Žiadne zmeny v kóde — len databázová migrácia.

