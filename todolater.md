# 📝 TODO LATER - Odložené úlohy a chyby

Tento zoznam obsahuje technické dlhy a chyby, ktoré neriešime hneď, aby sme sa mohli sústrediť na vizuálny polish.

## 🔴 Technické chyby (Bugs)
- [ ] **Admin Dashboard - Chart Dimensions Error**: 
  - `The width(-1) and height(-1) of chart should be greater than 0`
  - Potrebné skontrolovať štýly kontajnera grafu v `OverviewStats.tsx` alebo `AdminDashboard.tsx`.
- [ ] **Admin - Delete Appointment 409 Error**:
  - `Failed to load resource: the server responded with a status of 409 ()`
  - Chyba nastáva pri mazaní objednávky po jednej. Pravdepodobne konflikt v RPC alebo databázovom locku.

## 🎨 Visual & UX
- [ ] **Final Mobile Audit**: Kompletná kontrola všetkých animácií na reálnych mobilných zariadeniach.
- [ ] **Edge Cases in Booking**: Kontrola zobrazenia pri dlhých menách služieb v mobilnom zobrazení.
