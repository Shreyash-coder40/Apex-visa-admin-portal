const fs = require('fs');
const env = fs.readFileSync('C:\\Users\\HP PC\\.gemini\\antigravity\\scratch\\apex-crm-portal\\.env', 'utf8');
const SUPABASE_URL = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const SUPABASE_ANON_KEY = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();

async function run() {
  const inviteCode = "123456"; // Ensure this exists in the DB first!
  const url = `${SUPABASE_URL}/rest/v1/rpc/get_checklist_by_invite`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ p_invite_code: inviteCode })
  });

  const data = await response.text();
  console.log("Status:", response.status);
  console.log("Response:", data);
}

run();
