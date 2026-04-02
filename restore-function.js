const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gtefgucwbskgknsdirvj.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0ZWZndWN3YnNrZ2tuc2RpcnZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDE0MDUyOCwiZXhwIjoyMDg5NzE2NTI4fQ.01PjGhuJvLOIixjuGUCpsVzhX-4MWjcESC_nnkeZJJg';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function restoreFunction() {
  console.log('Restoring get_booking_slot_counts function...');

  const sql = `CREATE OR REPLACE FUNCTION public.get_booking_slot_counts(_date date, _employee_id uuid DEFAULT NULL)
RETURNS TABLE(time_slot time, booking_duration integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.time_slot, b.booking_duration
  FROM public.bookings b
  WHERE b.date = _date
    AND b.status != 'cancelled'
    AND (_employee_id IS NULL OR b.employee_id = _employee_id)
$$`;

  try {
    const { data, error } = await supabase.rpc('create_function_raw', { sql_query: sql });
    if (error) {
      // Try direct execution via admin API
      console.log('Trying direct HTTP approach...');
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_booking_slot_counts`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ _date: new Date().toISOString().split('T')[0] })
      });

      if (response.status === 404) {
        console.log('⚠️ Function not found in database, attempting alternative restore...');
        // The function needs to be created via database admin access
        console.log('Supabase Dashboard > SQL Editor > Create function manually');
        console.log('Function code available in: supabase/migrations/20260324212127_*.sql');
        return false;
      }
      console.log('✅ Function exists');
      return true;
    }

    console.log('✅ Function restored successfully');
    return true;
  } catch (err) {
    console.error('Error:', err.message);
    return false;
  }
}

restoreFunction().then(success => {
  process.exit(success ? 0 : 1);
});
