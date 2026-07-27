const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.azmzwvtdqcgiumwpkmuc:Shreyash@1234@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  
  const { rows: cols1 } = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'checklist_instances'");
  console.log('checklist_instances cols:', cols1.map(c => c.column_name));
  
  const { rows: cols2 } = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'document_items'");
  console.log('document_items cols:', cols2.map(c => c.column_name));
  
  await client.end();
}

run();
