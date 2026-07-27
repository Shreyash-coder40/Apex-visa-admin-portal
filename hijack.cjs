const bcrypt = require('bcryptjs');
const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.azmzwvtdqcgiumwpkmuc:Shreyash@1234@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  
  // 1. Get the existing working user
  const email = 'branchadmin1@gmail.com';
  const { rows } = await client.query('SELECT id FROM auth.users WHERE email = $1', [email]);
  if (rows.length === 0) return console.log('User not found');
  const userId = rows[0].id;
  
  // 2. Set password to Password123!
  const hash = await bcrypt.hash('Password123!', 10);
  await client.query('UPDATE auth.users SET encrypted_password = $1 WHERE id = $2', [hash, userId]);
  console.log('Password updated for', email);
  
  // 3. Link this user to the first student in the CRM
  const { rows: students } = await client.query('SELECT id FROM students ORDER BY created_at ASC LIMIT 1');
  if (students.length > 0) {
    await client.query('UPDATE students SET auth_user_id = $1, invite_code = NULL WHERE id = $2', [userId, students[0].id]);
    console.log('Linked to student profile:', students[0].id);
  }
  
  await client.end();
}

run();
