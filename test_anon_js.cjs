const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('C:\\Users\\HP PC\\.gemini\\antigravity\\scratch\\apex-crm-portal\\.env', 'utf8');
const SUPABASE_URL = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const SUPABASE_ANON_KEY = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  const inviteCode = "261859"; // valid code
  const { data, error } = await supabase.rpc('get_checklist_by_invite', { p_invite_code: inviteCode });
  
  console.log("Supabase-js Data:", typeof data, data);
  console.log("Supabase-js Error:", error);
}

run();
