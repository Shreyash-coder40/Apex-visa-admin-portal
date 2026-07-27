const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.azmzwvtdqcgiumwpkmuc:Shreyash@1234@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  
  const { rows } = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'leads'");
  console.log('leads cols:', rows);
  
  await client.end();
}

run();
