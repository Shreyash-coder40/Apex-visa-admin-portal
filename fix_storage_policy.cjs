const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.azmzwvtdqcgiumwpkmuc:Shreyash@1234@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  
  try {
    // Check existing policies
    const { rows: policies } = await client.query(`
      SELECT policyname FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
    `);
    console.log("Existing Storage Policies:", policies.map(p => p.policyname));

    // Create policy for public insert if it doesn't exist
    await client.query(`
      -- Drop if exists just in case we need to recreate
      DROP POLICY IF EXISTS "Public Upload Access" ON storage.objects;
      
      CREATE POLICY "Public Upload Access"
      ON storage.objects FOR INSERT
      TO anon, authenticated
      WITH CHECK (bucket_id = 'student_documents');
      
      -- Let them also select/read their own uploads potentially (or all for simplicity for now)
      DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
      
      CREATE POLICY "Public Read Access"
      ON storage.objects FOR SELECT
      TO anon, authenticated
      USING (bucket_id = 'student_documents');
    `);
    console.log("Storage policies applied successfully.");
  } catch (err) {
    console.error("DB Error:", err);
  } finally {
    await client.end();
  }
}

run();
