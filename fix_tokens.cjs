const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.azmzwvtdqcgiumwpkmuc:Shreyash@1234@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});
async function run() {
  await client.connect();
  await client.query(`
    UPDATE auth.users 
    SET confirmation_token = '',
        recovery_token = '',
        email_change_token_new = '',
        email_change_token_current = '',
        phone_change_token = ''
    WHERE email = 'student1@test.com'
  `);
  console.log('Fixed tokens for student1');
  await client.end();
}
run();
