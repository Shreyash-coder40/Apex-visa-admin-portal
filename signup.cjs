require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws');

const supabase = createClient(
  'https://azmzwvtdqcgiumwpkmuc.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    realtime: {
      transport: WebSocket
    }
  }
);

async function run() {
  console.log('Signing up...');
  const { data, error } = await supabase.auth.signUp({
    email: 'test_student_123@gmail.com',
    password: 'Password123!'
  });
  
  if (error) {
    console.error('Signup error:', error);
    return;
  }
  
  console.log('Signup success:', data.user.id);
  
  // Now link this user in the database
  const { Client } = require('pg');
  const client = new Client({
    connectionString: 'postgresql://postgres.azmzwvtdqcgiumwpkmuc:Shreyash@1234@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
    ssl: { rejectUnauthorized: false }
  });
  
  await client.connect();
  // Get first student
  const { rows } = await client.query('SELECT id FROM students ORDER BY created_at ASC LIMIT 1');
  if (rows.length > 0) {
    await client.query('UPDATE students SET auth_user_id = $1, invite_code = NULL WHERE id = $2', [data.user.id, rows[0].id]);
    console.log('Linked to student:', rows[0].id);
  }
  await client.end();
}

run();
