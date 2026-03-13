

# Fix Bookings INSERT RLS Policy

## Problem
The current INSERT policy on `bookings` uses `WITH CHECK (true)`, allowing anyone to set an arbitrary `client_user_id` and attribute bookings to other users.

## Solution
Replace the policy with a restricted check: `(client_user_id IS NULL OR client_user_id = auth.uid())`.

## Implementation
Single migration:
```sql
DROP POLICY "Public can create bookings" ON public.bookings;

CREATE POLICY "Public can create bookings" ON public.bookings
  FOR INSERT TO public
  WITH CHECK (client_user_id IS NULL OR client_user_id = auth.uid());
```

This ensures:
- Guest bookings (no `client_user_id`) still work
- Authenticated users can only create bookings for themselves
- No one can forge bookings attributed to another user

