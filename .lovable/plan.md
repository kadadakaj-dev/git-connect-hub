

# Fix: Employee Phone and Email Publicly Readable

## Problem
The `employees` table has a public SELECT policy exposing all columns including `phone` and `email` to unauthenticated users. Only admin views actually need these fields.

## Analysis
- **Public/client-side queries** (CalendarView, useTimeSlots) only select `id`, `full_name`, `position`, `is_active` — never `phone` or `email`
- **Admin** (EmployeeManagement) selects `*` but runs under an authenticated admin session with the admin ALL policy
- **Edge functions** (create-booking) only select `id`

Since no public query needs `phone` or `email`, the fix is to create a view exposing only safe columns and redirect the public SELECT policy to it.

## Implementation

**1. Database migration** — Create a public view and update RLS:

```sql
-- Create a view with only non-sensitive columns
CREATE VIEW public.employees_public AS
SELECT id, full_name, position, bio_sk, bio_en, is_active, sort_order
FROM public.employees
WHERE is_active = true;

-- Drop the overly permissive public SELECT policy
DROP POLICY "Employees are publicly viewable" ON public.employees;

-- Grant public access to the view instead
GRANT SELECT ON public.employees_public TO anon, authenticated;
```

This way:
- Unauthenticated users query `employees_public` (no phone/email)
- Admins still have full access via the existing admin ALL policy on the base table

**2. Frontend code changes** — Update the two client-side queries to use `employees_public` view:
- `src/hooks/useTimeSlots.ts` — change `.from('employees')` to `.from('employees_public')`
- `src/components/admin/CalendarView.tsx` — change the non-admin employees query to `.from('employees_public')`

Admin components (`EmployeeManagement.tsx`) keep querying the base `employees` table since they operate under admin RLS.

## Security outcome
- `phone` and `email` columns are no longer accessible to unauthenticated or non-admin users
- No functional regression — public queries never used those fields

