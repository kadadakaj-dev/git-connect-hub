-- Migration: Remove unused 9-param overload of create_secure_booking
-- Date: 2026-04-11
-- Context: Two overloads of create_secure_booking coexisted after migrations 000001 and 000016.
--   - 10-param version (p_client_request_id uuid) → called by create-booking edge function → KEEP
--   - 9-param version  (p_client_request_id text) → never called, created confusion → DROP

DROP FUNCTION IF EXISTS public.create_secure_booking(
  uuid,   -- p_service_id
  date,   -- p_date
  text,   -- p_time_slot
  text,   -- p_client_name
  text,   -- p_client_email
  text,   -- p_client_phone
  text,   -- p_notes
  uuid,   -- p_employee_id
  text    -- p_client_request_id  ← text variant (unused)
);

-- The 10-param version (p_client_user_id uuid, p_client_request_id uuid, p_employee_id uuid)
-- remains untouched — it is the canonical implementation used by the edge function.
