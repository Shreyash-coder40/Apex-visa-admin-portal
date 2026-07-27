const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.azmzwvtdqcgiumwpkmuc:Shreyash@1234@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  const { rows: users } = await client.query("SELECT * FROM auth.users WHERE email IN ('branchadmin1@gmail.com', 'student1@test.com')");
  console.log('Users:');
  console.dir(users, { depth: null });
  
  const { rows: identities } = await client.query("SELECT * FROM auth.identities WHERE email IN ('branchadmin1@gmail.com', 'student1@test.com')");
  console.log('Identities:');
  console.dir(identities, { depth: null });
  
  await client.end();
}
run();
