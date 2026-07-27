const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');
const fs = require('fs');

const env = fs.readFileSync('C:\\Users\\HP PC\\.gemini\\antigravity\\scratch\\apex-crm-portal\\.env', 'utf8');
const SUPABASE_URL = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const SUPABASE_ANON_KEY = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const pgClient = new Client({
  connectionString: 'postgresql://postgres.azmzwvtdqcgiumwpkmuc:Shreyash@1234@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await pgClient.connect();
  
  try {
    // 1. Get a student with an invite code, or generate one
    const { rows: students } = await pgClient.query(`
      SELECT id, invite_code FROM students WHERE invite_code IS NOT NULL LIMIT 1;
    `);
    
    let inviteCode = students.length > 0 ? students[0].invite_code : null;
    
    if (!inviteCode) {
      // Pick any student
      const { rows: allStudents } = await pgClient.query(`SELECT id FROM students LIMIT 1`);
      if (allStudents.length > 0) {
        inviteCode = '123456';
        await pgClient.query(`UPDATE students SET invite_code = $1 WHERE id = $2`, [inviteCode, allStudents[0].id]);
        console.log("Set invite code for a student.");
      }
    }
    
    console.log("Testing with invite code:", inviteCode);
    
    // 2. Call RPC as anon
    const { data, error } = await supabase.rpc('get_checklist_by_invite', { p_invite_code: inviteCode });
    console.log("Anon RPC Result Data:", data);
    console.log("Anon RPC Result Error:", error);
    
  } catch (err) {
    console.error("Test Error:", err);
  } finally {
    await pgClient.end();
  }
}

run();
