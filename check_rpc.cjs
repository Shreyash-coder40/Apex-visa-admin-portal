const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.azmzwvtdqcgiumwpkmuc:Shreyash@1234@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  
  try {
    const { rows } = await client.query(`
      SELECT p.prosrc as function_body, p.prosecdef as is_security_definer
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE p.proname = 'get_checklist_by_invite' AND n.nspname = 'public';
    `);
    
    console.log(rows);
  } catch (err) {
    console.error("DB Error:", err);
  } finally {
    await client.end();
  }
}

run();
