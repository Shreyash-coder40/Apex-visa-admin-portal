const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.azmzwvtdqcgiumwpkmuc:Shreyash@1234@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  try {
    const { rows } = await client.query(`
      SELECT pg_get_functiondef(oid)
      FROM pg_proc
      WHERE proname = 'fn_is_branch_admin_for';
    `);
    console.log(rows[0]?.pg_get_functiondef);
  } catch (err) {
    console.error("DB Error:", err);
  } finally {
    await client.end();
  }
}
run();
