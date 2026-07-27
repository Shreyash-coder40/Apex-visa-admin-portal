const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.azmzwvtdqcgiumwpkmuc:Shreyash@1234@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  
  // 1. Get the real student user ID
  const { rows: userRows } = await client.query("SELECT id FROM auth.users WHERE email = 'student1@test.com'");
  const studentUserId = userRows[0].id;
  
  // 2. Link it to the first student
  const { rows: students } = await client.query('SELECT id FROM students ORDER BY created_at ASC LIMIT 1');
  if (students.length > 0) {
    await client.query('UPDATE students SET auth_user_id = $1 WHERE id = $2', [studentUserId, students[0].id]);
    console.log('Restored student1@test.com to student profile:', students[0].id);
  }
  
  await client.end();
}
run();
