const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.azmzwvtdqcgiumwpkmuc:Shreyash@1234@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  
  // Find all students for this auth_user_id
  const { rows } = await client.query("SELECT id FROM students WHERE auth_user_id = '7cd933c2-e792-4995-9c09-7c8a2f149f4f' ORDER BY created_at ASC");
  console.log('Found students:', rows);
  
  if (rows.length > 1) {
    // Unlink all except the first one
    for (let i = 1; i < rows.length; i++) {
      await client.query("UPDATE students SET auth_user_id = NULL WHERE id = $1", [rows[i].id]);
      console.log('Unlinked duplicate student:', rows[i].id);
    }
  }
  
  await client.end();
}

run();
