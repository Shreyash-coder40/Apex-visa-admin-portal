const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.azmzwvtdqcgiumwpkmuc:Shreyash@1234@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();

    console.log('Creating fn_register_student RPC...');
    await client.query(`
      CREATE OR REPLACE FUNCTION fn_register_student(
        p_invite_code VARCHAR
      ) RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        v_student_id UUID;
      BEGIN
        -- 1. Check if the user is authenticated
        IF auth.uid() IS NULL THEN
          RAISE EXCEPTION 'Not authenticated';
        END IF;

        -- 2. Find the student with the matching invite code
        SELECT id INTO v_student_id FROM students WHERE invite_code = p_invite_code;
        
        IF NOT FOUND THEN
          RAISE EXCEPTION 'Invalid invite code';
        END IF;

        -- 3. Link the auth user to the student and clear the invite code
        UPDATE students 
        SET auth_user_id = auth.uid(), invite_code = NULL 
        WHERE id = v_student_id;

      END;
      $$;
    `);

    console.log('Successfully created RPC.');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await client.end();
  }
}

run();
