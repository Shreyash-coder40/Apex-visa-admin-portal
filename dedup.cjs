const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.azmzwvtdqcgiumwpkmuc:Shreyash@1234@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  
  // Find all students for student1@test.com
  const { rows } = await client.query("SELECT id FROM students WHERE email = 'student1@test.com' ORDER BY created_at ASC");
  console.log('Found students:', rows);
  
  if (rows.length > 1) {
    // Delete all except the first one
    for (let i = 1; i < rows.length; i++) {
      await client.query("DELETE FROM students WHERE id = $1", [rows[i].id]);
      console.log('Deleted duplicate student:', rows[i].id);
    }
  }
  
  await client.end();
}

run();
