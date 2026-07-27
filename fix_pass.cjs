const bcrypt = require('bcryptjs');
const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.azmzwvtdqcgiumwpkmuc:Shreyash@1234@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  const hash = await bcrypt.hash('BranchAdmin123!', 10);
  console.log('New hash:', hash);
  
  await client.query("UPDATE auth.users SET encrypted_password = $1 WHERE email = 'branchadmin1@gmail.com'", [hash]);
  console.log('Password hash updated');
  await client.end();
}
run();
