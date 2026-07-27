import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import ws from 'ws';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
  realtime: { transport: ws }
});

async function check() {
  const { data: leadsData } = await supabase.from('leads').select('*').limit(1);
  if (leadsData && leadsData.length > 0) {
    console.log("Leads Columns:", Object.keys(leadsData[0]).join(', '));
  }
  
  const { data: studentsData } = await supabase.from('students').select('*').limit(1);
  if (studentsData && studentsData.length > 0) {
    console.log("Students Columns:", Object.keys(studentsData[0]).join(', '));
  }
}
check();
