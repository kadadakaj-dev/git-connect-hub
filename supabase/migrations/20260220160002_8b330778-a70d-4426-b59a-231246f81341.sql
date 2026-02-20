
-- Add employee_id to bookings
ALTER TABLE public.bookings
ADD COLUMN employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX idx_bookings_employee_id ON public.bookings(employee_id);
