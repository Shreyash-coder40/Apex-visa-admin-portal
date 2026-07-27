const pg = require('pg');
const { Client } = pg;

async function checkIds() {
  const client = new Client({
    user: 'postgres.azmzwvtdqcgiumwpkmuc',
    password: 'Shreyash@1234',
    host: 'aws-0-ap-southeast-1.pooler.supabase.com',
    port: 5432,
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const result = await client.query(`
      SELECT id, user_id, provider_id, provider 
      FROM auth.identities 
      LIMIT 1;
    `);
    console.log(result.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
checkIds();
