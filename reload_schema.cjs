const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.azmzwvtdqcgiumwpkmuc:Shreyash@1234@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  
  try {
    await client.query(`NOTIFY pgrst, 'reload schema';`);
    console.log("Notified PostgREST to reload schema cache.");
  } catch (err) {
    console.error("DB Error:", err);
  } finally {
    await client.end();
  }
}

run();
