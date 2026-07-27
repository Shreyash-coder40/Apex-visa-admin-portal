const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.azmzwvtdqcgiumwpkmuc:Shreyash@1234@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  try {
    const { rows } = await client.query(`
      SELECT id, document_name, status, file_url 
      FROM document_items 
      WHERE status = 'Received' OR file_url IS NOT NULL
      ORDER BY updated_at DESC LIMIT 5;
    `);
    console.log("Recently uploaded docs:", rows);
  } catch (err) {
    console.error("DB Error:", err);
  } finally {
    await client.end();
  }
}
run();
