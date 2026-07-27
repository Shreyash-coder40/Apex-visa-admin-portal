const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.azmzwvtdqcgiumwpkmuc:Shreyash@1234@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    
    // Add the missing RLS policy for students
    await client.query(`
      CREATE POLICY "Users can read own student record" ON students
      FOR SELECT USING (auth_user_id = auth.uid());
    `);
    
    console.log('Successfully added RLS policy for students!');
    
  } catch (err) {
    if (err.code === '42710') {
      console.log('Policy already exists.');
    } else {
      console.error('Error adding policy:', err);
    }
  } finally {
    await client.end();
  }
}

run();
