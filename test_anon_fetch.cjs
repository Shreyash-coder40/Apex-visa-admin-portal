const fs = require('fs');
const env = fs.readFileSync('C:\\Users\\HP PC\\.gemini\\antigravity\\scratch\\apex-crm-portal\\.env', 'utf8');
const SUPABASE_URL = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const SUPABASE_ANON_KEY = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();

async function run() {
  const inviteCode = "261859"; // valid code
  
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_checklist_by_invite`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ p_invite_code: inviteCode })
  });

  const data = await response.json();
  console.log("Parsed JSON:", data);
  console.log("Documents type:", typeof data.documents, Array.isArray(data.documents) ? 'array' : 'not array');
}

run();
