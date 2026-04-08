-- Migration: Update services to chiropraxia only
-- Date: 2026-04-01
-- Description: Deactivate all old services and create 3 new chiropraxia services

-- Deactivate all old services (keeping foreign key references for existing bookings)
UPDATE services SET is_active = FALSE
WHERE id != '3caf6d26-cc3b-4126-8cef-dea395f3fa83';

-- Insert the 3 chiropraxia services
INSERT INTO services (name_sk, name_en, description_sk, description_en, duration, price, category, icon, is_active, sort_order)
VALUES
  ('Chiro masáž', 'Chiro massage', 'klasická masáž chrbta a ramien, chiropraxia/naprávanie, mobilizácie, bankovanie, masážna pištol', 'Classic back and shoulder massage with chiropractic adjustment', 50, 55, 'chiropractic', 'Bone', true, 1),
  ('Chiropraxia/Naprávanie', 'Chiropractic Adjustment', 'chiropraxia, masážna pištol', 'Chiropractic adjustment with massage gun', 15, 30, 'chiropractic', 'Bone', true, 2),
  ('Celotelová chiro masáž', 'Full body chiro massage', 'klasická masáž celého tela, bankovanie, mobilizácie, chiropraxia/naprávanie a iné', 'Full body classic massage with chiropractic treatment', 90, 75, 'chiropractic', 'Bone', true, 3);
