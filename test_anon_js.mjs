import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import ws from 'ws';

const env = fs.readFileSync('C:\\Users\\HP PC\\.gemini\\antigravity\\scratch\\apex-crm-portal\\.env', 'utf8');
const SUPABASE_URL = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const SUPABASE_ANON_KEY = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
  realtime: { transport: ws } // use ws so it works in node < 22
});

async function run() {
  const inviteCode = "261859"; // valid code
  const { data, error } = await supabase.rpc('get_checklist_by_invite', { p_invite_code: inviteCode });
  
  console.log("Supabase-js Data:", typeof data, data);
  if (data && typeof data === 'object') {
    console.log("data.documents type:", typeof data.documents, Array.isArray(data.documents) ? 'array' : 'not array');
  }
  console.log("Supabase-js Error:", error);
}

run();
