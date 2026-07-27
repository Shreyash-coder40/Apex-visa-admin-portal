const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.azmzwvtdqcgiumwpkmuc:Shreyash@1234@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to Supabase DB.');

    console.log('1. Updating students table...');
    await client.query(`
      ALTER TABLE students 
      ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id),
      ADD COLUMN IF NOT EXISTS invite_code VARCHAR(20);
    `);

    console.log('2. Updating document_items table...');
    await client.query(`
      ALTER TABLE document_items 
      ADD COLUMN IF NOT EXISTS file_url TEXT,
      ADD COLUMN IF NOT EXISTS student_uploaded_at TIMESTAMPTZ;
    `);

    console.log('3. Setting up storage bucket...');
    await client.query(`
      INSERT INTO storage.buckets (id, name, public) 
      VALUES ('student_documents', 'student_documents', false) 
      ON CONFLICT (id) DO NOTHING;
    `);

    console.log('4. Configuring storage RLS policies...');
    // We drop them first if they exist to avoid errors during re-runs
    await client.query(`
      DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON storage.objects;
      DROP POLICY IF EXISTS "Enable insert for authenticated users" ON storage.objects;
      DROP POLICY IF EXISTS "Enable update for authenticated users" ON storage.objects;

      CREATE POLICY "Enable read access for all authenticated users" 
      ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'student_documents');

      CREATE POLICY "Enable insert for authenticated users" 
      ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'student_documents');

      CREATE POLICY "Enable update for authenticated users" 
      ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'student_documents');
    `);

    console.log('Setup complete!');

  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await client.end();
  }
}

run();
