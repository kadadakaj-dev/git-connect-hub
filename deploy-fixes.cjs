const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = 'https://gtefgucwbskgknsdirvj.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0ZWZndWN3YnNrZ2tuc2RpcnZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDE0MDUyOCwiZXhwIjoyMDg5NzE2NTI4fQ.01PjGhuJvLOIixjuGUCpsVzhX-4MWjcESC_nnkeZJJg';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function deployFix() {
  const sql = fs.readFileSync('supabase/migrations/20260331_secure_booking_rpc.sql', 'utf8');
  console.log('Deploying DB lock protection...');
  const { data, error } = await supabase.rpc('create_function_raw', { sql_query: sql });
  if (error) {
    console.error('RPC Error, falling back to HTTP...');
    const response = await fetch(`${SUPABASE_URL}/rest/v1/sql`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: sql })
    });
    if (!response.ok) {
        console.log("Status:", response.status, await response.text());
        return false;
    }
  }
  console.log('Successfully deployed DB protection layer.');
  return true;
}

deployFix();
