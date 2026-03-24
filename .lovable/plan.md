

# Pridať zamestnanca "Personál FYZIO&FIT"

## Problém
Tabuľka `employees` je prázdna — booking flow nemôže priradiť terapeuta a všetky time sloty sa zobrazujú ako nedostupné.

## Riešenie
Vložiť jedného zamestnanca ktorý bude reprezentovať celú kliniku — jednoduchšie pre malú prevádzku kde je jeden fyzioterapeut.

## Zmeny

### 1. SQL migrácia — vložiť zamestnanca
```sql
INSERT INTO public.employees (full_name, email, is_active)
VALUES ('Personál FYZIO&FIT', 'booking@fyzioafit.sk', true);
```

### 2. Priradiť všetky aktívne služby tomuto zamestnancovi
```sql
INSERT INTO public.employee_services (employee_id, service_id)
SELECT e.id, s.id
FROM public.employees e
CROSS JOIN public.services s
WHERE e.email = 'booking@fyzioafit.sk'
  AND s.active = true;
```

Tým sa sprístupnia time sloty pre všetky služby a booking flow bude plne funkčný.

