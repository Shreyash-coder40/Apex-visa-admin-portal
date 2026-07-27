const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.azmzwvtdqcgiumwpkmuc:Shreyash@1234@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});
async function run() {
  await client.connect();
  await client.query(`
    UPDATE auth.identities 
    SET identity_data = jsonb_build_object(
      'sub', user_id::text,
      'email', email,
      'email_verified', false,
      'phone_verified', false
    )
    WHERE email = 'student1@test.com'
  `);
  console.log('Fixed identity data');
  await client.end();
}
run();
