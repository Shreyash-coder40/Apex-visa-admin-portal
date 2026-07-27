const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.azmzwvtdqcgiumwpkmuc:Shreyash@1234@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});
async function run() {
  await client.connect();
  const { rows } = await client.query("SELECT * FROM auth.users WHERE email = 'admin@apexconsultancy.com'");
  console.log('Admin user:', rows[0]);
  
  const { rows: idents } = await client.query("SELECT * FROM auth.identities WHERE email = 'admin@apexconsultancy.com'");
  console.log('Admin identity:', idents[0]);
  await client.end();
}
run();
