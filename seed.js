import { Client } from 'pg';
import fs from 'fs';

const DB_URI = 'postgresql://postgres.azmzwvtdqcgiumwpkmuc:Shreyash@1234@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres';

async function runSeed() {
  console.log('Connecting to PostgreSQL database using Session Pooler...');
  const client = new Client({
    connectionString: DB_URI,
    ssl: { rejectUnauthorized: false } // Required for Supabase
  });

  try {
    await client.connect();
    console.log('Successfully connected to database engine!');

    // 1. Run schema.sql
    console.log('Reading schema.sql...');
    const schemaSql = fs.readFileSync('../visa-portal/sql/schema.sql', 'utf8');
    
    console.log('Executing schema.sql on production database (this may take a few seconds)...');
    await client.query(schemaSql);
    console.log('Schema successfully deployed! All 15 tables and triggers created.');

    // 2. Insert into staff_users (since the auth user was already created successfully in the previous step)
    console.log('Assigning super_admin role in staff_users table for admin@apexvisa.com...');
    
    // We fetch the UUID of the admin we created earlier from the auth.users table using SQL!
    const { rows } = await client.query(`SELECT id FROM auth.users WHERE email = 'admin@apexvisa.com' LIMIT 1;`);
    
    if (rows.length > 0) {
      const newUserId = rows[0].id;
      await client.query(`
        INSERT INTO public.staff_users (id, email, name, role) 
        VALUES ($1, 'admin@apexvisa.com', 'Apex Super Admin', 'super_admin')
        ON CONFLICT (id) DO UPDATE SET role = 'super_admin';
      `, [newUserId]);
      
      console.log('Staff user role assigned successfully!');
    } else {
       console.log('Could not find auth user in database. Make sure it was created!');
    }

    // 3. Seed branches
    console.log('Seeding branches...');
    await client.query(`
      INSERT INTO public.branches (id, name, code, country) VALUES 
      (gen_random_uuid(), 'Downtown Toronto HQ', 'TOR-01', 'Canada'),
      (gen_random_uuid(), 'Vancouver Pacific Hub', 'VAN-01', 'Canada'),
      (gen_random_uuid(), 'Sydney Global Branch', 'SYD-01', 'Australia')
      ON CONFLICT DO NOTHING;
    `);

    console.log('\n✅ ALL SEEDING AND SETUP COMPLETE! ✅');
    console.log('-------------------------');
    console.log('You can now log in at http://localhost:5173/ with:');
    console.log('Email: admin@apexvisa.com');
    console.log('Password: ApexAdmin123!');
    console.log('-------------------------\n');

  } catch (err) {
    console.error('ERROR SEEDING DATABASE:', err);
  } finally {
    await client.end();
  }
}

runSeed();
