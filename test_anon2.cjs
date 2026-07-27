const fs = require('fs');
const { Client } = require('pg');

const env = fs.readFileSync('C:\\Users\\HP PC\\.gemini\\antigravity\\scratch\\apex-crm-portal\\.env', 'utf8');
const SUPABASE_URL = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const SUPABASE_ANON_KEY = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();

const client = new Client({
  connectionString: 'postgresql://postgres.azmzwvtdqcgiumwpkmuc:Shreyash@1234@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  let inviteCode;
  try {
    const { rows } = await client.query("SELECT invite_code FROM students WHERE invite_code IS NOT NULL LIMIT 1;");
    if (rows.length > 0) {
      inviteCode = rows[0].invite_code;
    } else {
      console.log("No invite code found in DB!");
      return;
    }
  } finally {
    await client.end();
  }
  
  console.log("Testing with valid invite code:", inviteCode);
  
  const url = `${SUPABASE_URL}/rest/v1/rpc/get_checklist_by_invite`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ p_invite_code: inviteCode })
  });

  const data = await response.text();
  console.log("Status:", response.status);
  console.log("Response:", data);
}

run();
