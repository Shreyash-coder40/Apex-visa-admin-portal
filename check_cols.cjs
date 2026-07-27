const pg = require('pg');
const { Client } = pg;

async function checkCols() {
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
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'activity_logs';
    `);
    console.log(result.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
checkCols();
