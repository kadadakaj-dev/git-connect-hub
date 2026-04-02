const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const envs = [
  { name: 'VITE_SUPABASE_URL', value: 'https://gtefgucwbskgknsdirvj.supabase.co' },
  { name: 'VITE_SUPABASE_PUBLISHABLE_KEY', value: 'sb_publishable_LHXMJxk4HF71YLtQxNt94Q_yIbH7Kta' },
  { name: 'VITE_SUPABASE_PROJECT_ID', value: 'gtefgucwbskgknsdirvj' },
  { name: 'VITE_VAPID_PUBLIC_KEY', value: 'BByTjS2R7rEqoVjW_nK6F9Z8VlWb3F4M8N3W5_nK9v0z1Z8VlWb3F4M8A' }
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
