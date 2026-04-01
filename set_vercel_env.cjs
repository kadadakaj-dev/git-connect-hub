const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const envs = [
  { name: 'VITE_SUPABASE_URL', value: 'https://gtefgucwbskgknsdirvj.supabase.co' },
  { name: 'VITE_SUPABASE_ANON_KEY', value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0ZWZndWN3YnNrZ2tuc2RpcnZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNDA1MjgsImV4cCI6MjA4OTcxNjUyOH0.0U0_nqaraTmezjEONg16wyal_q5CFmJaRho7xqDkiuc' },
  { name: 'SUPABASE_SERVICE_ROLE_KEY', value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0ZWZndWN3YnNrZ2tuc2RpcnZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDE0MDUyOCwiZXhwIjoyMDg5NzE2NTI4fQ.01PjGhuJvLOIixjuGUCpsVzhX-4MWjcESC_nnkeZJJg' },
  { name: 'VITE_SUPABASE_PROJECT_ID', value: 'gtefgucwbskgknsdirvj' },
  { name: 'NEXT_PUBLIC_SUPABASE_URL', value: 'https://gtefgucwbskgknsdirvj.supabase.co' },
  { name: 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY', value: 'sb_publishable_LHXMJxk4HF71YLtQxNt94Q_yIbH7Kta' }
];

console.log('--- Setting Vercel Production Environment Variables ---');

const tempFile = path.join(__dirname, 'temp_val.txt');

envs.forEach((env) => {
  try {
    console.log(`Setting ${env.name}...`);
    // Remove if exists
    try {
      execSync(`npx vercel env rm ${env.name} production -y`, { stdio: 'ignore' });
    } catch (e) {}

    // Write value to temp file to evitar shell escaping issues
    fs.writeFileSync(tempFile, env.value);

    // Add variable using redirection for the value
    // On Windows, we can use Get-Content if in PowerShell, but simpler to use < redirection in cmd or just provide as arg
    // Actually, npx vercel env add <name> <env> <value> should work if we quote it well
    const cmd = `npx vercel env add ${env.name} production "${env.value}"`;
    // We add 'n' to the stdin to answer the "Mark as sensitive?" prompt
    execSync(`echo n | ${cmd}`, { stdio: 'inherit' });
    console.log(`✅ ${env.name} set successfully.`);
  } catch (error) {
    console.error(`❌ Failed to set ${env.name}`);
  }
});

if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);

console.log('--- Triggering Redeploy ---');
try {
  execSync('npx vercel --prod --no-wait', { stdio: 'inherit' });
  console.log('✅ Production redeploy triggered.');
} catch (error) {
  console.error('❌ Failed to trigger redeploy.');
}
