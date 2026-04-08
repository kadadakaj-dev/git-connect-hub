import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkServices() {
  const { data, error } = await supabase
    .from('services')
    .select('id, name_sk, name_en')
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching services:', error);
    return;
  }

  console.log('Active Services:', JSON.stringify(data, null, 2));
}

checkServices();
