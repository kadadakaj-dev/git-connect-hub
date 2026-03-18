## Vylepšenie potvrdzovacieho emailu

### Prosím o úpravu súboru supabase/functions/send-booking-email/index.ts (HTML generátor, textová verzia aj preklady). Cieľom je zladiť dizajn s webom, dodať mu luxusný vzhľad a plne podporovať Dark Mode.

​**Zmeny na implementáciu:**

​**1. Adresa miesta**

- ​Zmeniť všade z "Košice" na "Krmanová 6, Košice" (SK aj EN verzia, HTML aj plain-text verzia).

​**2. Luxusná farebná schéma & Dark Mode podpora**

E-mail musí obsahovať CSS pre @media (prefers-color-scheme: dark), aby sa farby automaticky prispôsobili.

- ​**Header / Značka:** Ponechať náš modrý prechod #4a90d9 → #6ba3e0 (vyzerá dobre v oboch režimoch).
- ​**Pozadie e-mailu (Body):**
  - ​*Svetlý režim:* Jemná elegantná sivá #f7f9fc
  - ​*Tmavý režim:* Hlboká tmavá (napr. #121212 alebo #18181b)
- ​**Hlavná karta (Obsah):**
  - ​*Svetlý režim:* Čistá biela #ffffff s jemným tieňom
  - ​*Tmavý režim:* Elegantná tmavosivá #242427 s jemným okrajom
- ​**Texty:**
  - ​*Svetlý režim:* Tmavá navy/antracitová #1a2b42
  - ​*Tmavý režim:* Svetlosivá pre výbornú čitateľnosť #e4e4e7
- ​**Detail box (Služba, Dátum, Miesto):**
  - ​*Svetlý režim:* Veľmi jemná modrosivá #f0f4f8
  - ​*Tmavý režim:* Tlmená tmavosivá #2f2f36

​**3. Storno podmienky (Výrazné, ale elegantné)**

Nechceme, aby to vyzeralo ako agresívna chyba. Spravíme to štýlovo pomocou "Alert" boxu.

- ​**Dizajn boxu:** Namiesto celého červeného pozadia použijeme hrubší červený pásik na ľavej strane (border-left: 4px solid #ef4444).
- ​**Pozadie sekcie:** Veľmi jemný červený nádych (Svetlý: #fef2f2, Tmavý: #2e1616).
- ​**Nadpis "Storno podmienky":** Tučný a červený (Svetlý: #dc2626, Tmavý: #f87171).
- ​**Text podmienok:** Štandardná farba textu (nie červená), aby bol dobre čitateľný.

​**4. Tlačidlo "Zrušiť rezerváciu"**

- ​Ponechať aktuálnu červenú, zabezpečiť dobrý kontrast. Pridať zaoblené rohy (border-radius) pre modernejší vzhľad.
- &nbsp;

&nbsp;