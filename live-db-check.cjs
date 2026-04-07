const { createClient } = require('@supabase/supabase-js');

async function dbProof() {
  const url = 'https://gtefgucwbskgknsdirvj.supabase.co';
  const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0ZWZndWN3YnNrZ2tuc2RpcnZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDE0MDUyOCwiZXhwIjoyMDg5NzE2NTI4fQ.01PjGhuJvLOIixjuGUCpsVzhX-4MWjcESC_nnkeZJJg';
  const supabase = createClient(url, key);

  console.log("--- DB CONSISTENCY SCRIPT ---");
  const today = new Date().toISOString().split('T')[0];

  const { data: bookings, error: bErr } = await supabase.from('bookings').select('id, client_name, time_slot, status').eq('date', today);
  if (bErr) console.error("Bookings error:", bErr);
  else console.log(`Today's bookings: ${bookings.length}`);
  if (bookings.length > 0) {
      console.log(`Sample booking: ${JSON.stringify(bookings[0])}`);
  }

  const { data: blocks, error: blockErr } = await supabase.from('blocked_dates').select('*');
  if (blockErr) console.error("Block error:", blockErr);
  else console.log(`Total blocked full days: ${blocks.length}`);

  const { data: configs, error: cfgErr } = await supabase.from('time_slots_config').select('day_of_week, is_active, start_time, end_time');
  if (cfgErr) console.error("Config error:", cfgErr);
  else console.log(`Active Days configs:`, configs);
}

dbProof();
