-- Seed: Salon services
-- Run AFTER migration_services_gender_category.sql
-- Clears existing services and re-inserts clean data

truncate public.services restart identity cascade;

insert into public.services (title, gender, category, price, duration_min, is_active) values

-- ── DÁMSKY: Strih & Styling ──────────────────────────────────────
('Dámsky strih',             'damsky', 'Strih & Styling',  30.00,  45, true),
('Fúkaná dlhé vlasy',        'damsky', 'Strih & Styling',  30.00,  45, true),
('Fúkaná polodlhé vlasy',    'damsky', 'Strih & Styling',  20.00,  30, true),
('Finálny styling',          'damsky', 'Strih & Styling',  20.00,  30, true),

-- ── DÁMSKY: Farbenie ────────────────────────────────────────────
('Farbenie odrastov so strihom',  'damsky', 'Farbenie',  60.00,  90, true),
('Farbenie odrastov',             'damsky', 'Farbenie',  45.00,  60, true),
('Kompletné farbenie',            'damsky', 'Farbenie',  70.00,  90, true),
('Kompletné farbenie so strihom', 'damsky', 'Farbenie',  90.00, 120, true),

-- ── DÁMSKY: Balayage & Melír ────────────────────────────────────
('Balayage komplet', 'damsky', 'Balayage & Melír', 150.00, 180, true),
('Balayage dorábka', 'damsky', 'Balayage & Melír', 120.00, 150, true),
('Melír dorábka',    'damsky', 'Balayage & Melír', 120.00, 150, true),
('Melír komplet',    'damsky', 'Balayage & Melír', 150.00, 180, true),

-- ── DÁMSKY: Odfarbovanie & Regenerácia ─────────────────────────
('Gumovanie alebo čistenie farby', 'damsky', 'Odfarbovanie & Regenerácia', 100.00, 120, true),
('Sťahovanie farby',               'damsky', 'Odfarbovanie & Regenerácia', 160.00, 150, true),
('Methamorphyc – rýchla kúra',     'damsky', 'Odfarbovanie & Regenerácia',  35.00,  30, true),
('Methamorphyc – exkluzívna kúra', 'damsky', 'Odfarbovanie & Regenerácia',  50.00,  45, true),
('Brazílsky keratín',              'damsky', 'Odfarbovanie & Regenerácia', 130.00, 120, true),

-- ── DÁMSKY: Predlžovanie & Účesy ───────────────────────────────
('Aplikácia Tape-in',  'damsky', 'Predlžovanie & Účesy',  40.00,  60, true),
('Prepojenie Tape-in', 'damsky', 'Predlžovanie & Účesy', 120.00,  90, true),
('Zapletané vrkôčiky', 'damsky', 'Predlžovanie & Účesy',  30.00,  30, true),
('Spoločenský účes',   'damsky', 'Predlžovanie & Účesy',  40.00,  45, true),

-- ── PÁNSKY: Vlasy ───────────────────────────────────────────────
('Strih Junior (do 15 r.)', 'pansky', 'Vlasy', 15.00, 20, true),
('Pánsky strih',            'pansky', 'Vlasy', 19.00, 30, true),

-- ── PÁNSKY: Brada & Kombinácie ──────────────────────────────────
('Úprava brady',             'pansky', 'Brada & Kombinácie', 12.00, 15, true),
('Kombinácia vlasy a brada', 'pansky', 'Brada & Kombinácie', 27.00, 40, true),
('Pánsky špeciál',           'pansky', 'Brada & Kombinácie', 50.00, 60, true),

-- ── PÁNSKY: Farbenie ────────────────────────────────────────────
('Trvalá',             'pansky', 'Farbenie', 40.00, 60, true),
('Zosvetlenie vlasov', 'pansky', 'Farbenie', 40.00, 60, true),
('Farbenie brady',     'pansky', 'Farbenie', 10.00, 20, true),
('Tónovanie sedín',    'pansky', 'Farbenie', 10.00, 20, true),

-- ── PÁNSKY: Doplnkové Služby ────────────────────────────────────
('Depilácia nosa aj uší',   'pansky', 'Doplnkové Služby',  5.00, 10, true),
('Ušné sviečky',            'pansky', 'Doplnkové Služby', 10.00, 15, true),
('Čierna zlupovacia maska', 'pansky', 'Doplnkové Služby', 12.00, 20, true);
