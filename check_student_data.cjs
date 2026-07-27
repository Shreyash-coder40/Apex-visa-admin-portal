require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws');
const supabase = createClient('https://azmzwvtdqcgiumwpkmuc.supabase.co', process.env.VITE_SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: WebSocket }
});

async function run() {
  const studentId = '931b4cdf-4750-47bc-967d-f57e55702fc1';
  
  const { data: student } = await supabase.from('students').select('*').eq('id', studentId).single();
  console.log('Student:', student);
  
  const { data: destinations } = await supabase.from('student_destinations').select('*').eq('student_id', studentId);
  console.log('Destinations:', destinations);
  
  const { data: checklists } = await supabase.from('checklist_instances').select('*').eq('student_id', studentId);
  console.log('Checklists:', checklists);
}

run();
