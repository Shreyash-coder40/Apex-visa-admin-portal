const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.azmzwvtdqcgiumwpkmuc:Shreyash@1234@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();

    const email = 'student1@test.com';

    // 1. Get the auth user
    const { rows: users } = await client.query(`SELECT id FROM auth.users WHERE email = $1`, [email]);
    if (users.length === 0) {
      console.log('User not found!');
      return;
    }
    const authUserId = users[0].id;

    // 2. Insert into auth.identities if not exists
    const { rows: identities } = await client.query(`SELECT id FROM auth.identities WHERE user_id = $1`, [authUserId]);
    if (identities.length === 0) {
      console.log('Inserting into auth.identities...');
      await client.query(`
        INSERT INTO auth.identities (
          id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), '${authUserId}', '${authUserId}', '{"sub":"${authUserId}","email":"${email}"}'::jsonb, 'email', now(), now(), now()
        )
      `);
      console.log('Identity added! User can now log in.');
    } else {
      console.log('Identity already exists!');
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
