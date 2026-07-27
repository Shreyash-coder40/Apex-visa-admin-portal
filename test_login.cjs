require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://azmzwvtdqcgiumwpkmuc.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'dummy' // we can just fetch the anon key from .env
);

async function testLogin() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'student1@test.com',
    password: 'Password123!'
  });
  console.log('Error:', error);
  console.log('Data:', data);
}

testLogin();
