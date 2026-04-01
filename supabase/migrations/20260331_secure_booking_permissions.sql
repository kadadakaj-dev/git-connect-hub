-- Migration to restrict access to the secure booking RPC.
-- This ensures only the service_role (Edge Function) and admins can execute it.

-- 1) Remove EXECUTE permissions from everyone (public)
REVOKE EXECUTE ON FUNCTION public.create_secure_booking(
    UUID, DATE, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, UUID
) FROM PUBLIC;

-- 2) Explicitly remove from anon and authenticated roles
REVOKE EXECUTE ON FUNCTION public.create_secure_booking(
    UUID, DATE, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, UUID
) FROM anon;

REVOKE EXECUTE ON FUNCTION public.create_secure_booking(
    UUID, DATE, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, UUID
) FROM authenticated;

-- 3) Grant EXECUTE only to service_role and postgres roles
GRANT EXECUTE ON FUNCTION public.create_secure_booking(
    UUID, DATE, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, UUID
) TO service_role;

GRANT EXECUTE ON FUNCTION public.create_secure_booking(
    UUID, DATE, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, UUID
) TO postgres;
