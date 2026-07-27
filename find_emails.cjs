const { Client } = require('pg');
const DB_URI = 'postgresql://postgres.azmzwvtdqcgiumwpkmuc:Shreyash@1234@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres';

async function run() {
  const client = new Client({ connectionString: DB_URI, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    const { rows } = await client.query(`SELECT email, role FROM staff_users;`);
    console.log(rows);
  } finally {
    await client.end();
  }
}
run();
