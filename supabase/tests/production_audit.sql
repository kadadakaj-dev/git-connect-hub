-- PRODUCTION AUDIT CHECKLIST FOR GIT CONNECT HUB (2026-04-01)
-- -------------------------------------------------------------

-- 1. RPC SECURITY AUDIT
-- Checking for SECURITY DEFINER and restricted search_path.
SELECT 
    proname as function_name,
    prosecdef as is_security_definer,
    array_to_string(proconfig, ', ') as configurations
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND proname IN ('create_secure_booking', 'cancel_secure_booking');

-- 2. PRIVILEGE AUDIT 
-- Checking that 'anon' and 'authenticated' roles have 0 execute permissions.
SELECT 
    routine_name, 
    grantee, 
    privilege_type
FROM information_schema.role_routine_grants 
WHERE routine_name IN ('create_secure_booking', 'cancel_secure_booking')
  AND grantee IN ('public', 'anon', 'authenticated');

-- 3. AUDIT TRAIL VERIFICATION
-- Check if booking_events table and RLS are correctly set up.
SELECT 
    pg_get_userbyid(relowner) as table_owner,
    relrowsecurity as rls_enabled
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND relname = 'booking_events';

-- 4. VIEW LATEST LOGS
-- Sanity check: have we logged anything today?
SELECT * FROM public.booking_events 
ORDER BY created_at DESC 
LIMIT 5;

-- 5. DUPLICATE CHECK
-- Ensure client_request_id uniqueness is enforced.
SELECT 
    schemaname, tablename, indexname, indexdef
FROM pg_indexes 
WHERE tablename = 'bookings' AND indexname = 'idx_bookings_client_request_id';
