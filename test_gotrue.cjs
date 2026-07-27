require('dotenv').config();

async function testGoTrue() {
  const email = 'student1@test.com';
  const password = 'Password123!';
  const url = 'https://azmzwvtdqcgiumwpkmuc.supabase.co/auth/v1/token?grant_type=password';
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`
      },
      body: JSON.stringify({ email, password })
    });
    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Body:', text.substring(0, 200)); // Truncate so it doesn't flood logs
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

testGoTrue();
