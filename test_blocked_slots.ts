
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Chýbajú prihlasovacie údaje k Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  console.log('Skúšam vložiť blokáciu do blocked_slots...');
  const { data, error } = await supabase
    .from('blocked_slots')
    .insert({
      date: '2026-12-24',
      time_slot: '12:00:00',
      duration: 30,
      reason: 'TEST BLOKACIE'
    })
    .select();

  if (error) {
    console.error('❌ Chyba pri vkladaní:', error.message);
    console.error('Kód chyby:', error.code);
  } else {
    console.log('✅ Úspešne vložené:', data);
    
    // Hneď to aj zmažeme, aby sme nerobili neporiadok
    console.log('Mažem testovací záznam...');
    if (data && data[0]) {
      await supabase.from('blocked_slots').delete().eq('id', data[0].id);
    }
    console.log('✅ Hotovo.');
  }
}

testInsert();
