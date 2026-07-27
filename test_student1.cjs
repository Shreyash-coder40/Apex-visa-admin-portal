require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws');
const supabase = createClient('https://azmzwvtdqcgiumwpkmuc.supabase.co', process.env.VITE_SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: WebSocket }
});

async function run() {
  const { data: { session }, error: err1 } = await supabase.auth.signInWithPassword({
    email: 'student1@test.com',
    password: 'Password123!'
  });
  if (err1) return console.error('Login error', err1);
  console.log('Logged in as:', session.user.id);
  
  const { data: student, error: err2 } = await supabase.from('students').select('id').eq('auth_user_id', session.user.id).maybeSingle();
  console.log('Student query result:', student, err2);
}
run();
