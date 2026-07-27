const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.azmzwvtdqcgiumwpkmuc:Shreyash@1234@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  
  try {
    await client.query(`
      INSERT INTO storage.buckets (id, name, public) 
      VALUES ('student_documents', 'student_documents', true)
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log("Bucket 'student_documents' ensured.");
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
run();
