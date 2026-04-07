const { createClient } = require('@supabase/supabase-js');

async function testDoubleBookingLock() {
  console.log("--- DOUBLE BOOKING RACE CONDITION TEST ---");
  console.log("Pripájam sa na produkčnú databázu Fyzio&Fit...");
  
  const url = 'https://gtefgucwbskgknsdirvj.supabase.co';
  const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0ZWZndWN3YnNrZ2tuc2RpcnZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDE0MDUyOCwiZXhwIjoyMDg5NzE2NTI4fQ.01PjGhuJvLOIixjuGUCpsVzhX-4MWjcESC_nnkeZJJg';
  const supabase = createClient(url, key);

  // 1. Získať service_id (Fyzio)
  const { data: services } = await supabase.from('services').select('id').limit(1);
  if (!services || services.length === 0) {
      console.log("Nepodarilo sa stiahnuť službu z DB.");
      return;
  }
  const serviceId = services[0].id;

  // 2. Simulovaný slot niekde vysoko v budúcnosti (napr. o 2 roky, aby sme nenarušili reálne day to day dáta)
  const testDate = '2028-12-01';
  const testSlot = '12:00';

  // Najprv clean test slot pre istotu
  await supabase.from('bookings').delete().eq('date', testDate).eq('time_slot', testSlot);

  console.log(`\nSimulujem 2 extrémne rýchle a paralelné kliknutia (útoky) v 1 milisekundu na termín: ${testDate} ${testSlot}`);
  console.log("Spúšťam...");

  const payload1 = {
      p_service_id: serviceId,
      p_date: testDate,
      p_time_slot: testSlot,
      p_client_name: 'TEST LOCK 1 (V zlomku sekundy)',
      p_client_email: 'test1@lock.sk',
      p_client_phone: '111111'
  };

  const payload2 = {
      p_service_id: serviceId,
      p_date: testDate,
      p_time_slot: testSlot,
      p_client_name: 'TEST LOCK 2 (V zlomku sekundy)',
      p_client_email: 'test2@lock.sk',
      p_client_phone: '222222'
  };

  const startTime = Date.now();

  // Spustíme ich naraz
  const [res1, res2] = await Promise.all([
      supabase.rpc('create_secure_booking', payload1),
      supabase.rpc('create_secure_booking', payload2)
  ]);

  const duration = Date.now() - startTime;
  console.log(`\nČas spracovania oboch požiadaviek z cloudu: ${duration} ms\n`);

  console.log("Výsledok Žiadosti 1:", res1.data, "Error 1:", res1.error);
  console.log("Výsledok Žiadosti 2:", res2.data, "Error 2:", res2.error);

  // Zhodnotíme situáciu a lock
  const success1 = res1.data && res1.data.success;
  const success2 = res2.data && res2.data.success;

  if (success1 && success2) {
      console.error("\n❌ ZLYHANIE (FAIL): Obe rezervácie prešli v ten istý čas. Databáza NEZAMKLA transakciu. Nový kód tam chýba!");
  } else if ((success1 && !success2) || (!success1 && success2)) {
      console.log("\n✅ PERFEKTNÉ (PASS): Lock zafungoval nádherne! Prvého pustilo a druhého v zápätí zastavilo s chybou pre prekročenie kapacity.");
  } else {
      console.log("\nObe zlyhali na niečom inom.");
  }

  // Pre istotu vymažeme testovacie stopy
  await supabase.from('bookings').delete().in('client_email', ['test1@lock.sk', 'test2@lock.sk']);
  console.log("Testovacie dáta boli po sebe upratané.");
}

testDoubleBookingLock();
