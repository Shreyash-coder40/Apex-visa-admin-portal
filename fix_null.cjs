const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.azmzwvtdqcgiumwpkmuc:Shreyash@1234@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  await client.query("UPDATE auth.users SET email_change = '' WHERE email = 'student1@test.com'");
  console.log('Fixed email_change null value');
  await client.end();
}
run();
