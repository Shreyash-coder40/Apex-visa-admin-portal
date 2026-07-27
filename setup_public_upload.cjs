const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.azmzwvtdqcgiumwpkmuc:Shreyash@1234@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();

  try {
    // 1. Create a Security Definer function to fetch checklist by invite code
    await client.query(`
      CREATE OR REPLACE FUNCTION get_checklist_by_invite(p_invite_code text)
      RETURNS json
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        v_student record;
        v_dest record;
        v_docs json;
      BEGIN
        SELECT id, name INTO v_student FROM students WHERE invite_code = p_invite_code LIMIT 1;
        IF NOT FOUND THEN
          RETURN NULL;
        END IF;

        SELECT id, destination_country, target_education_level INTO v_dest 
        FROM student_destinations 
        WHERE student_id = v_student.id AND status = 'Active' LIMIT 1;

        IF NOT FOUND THEN
          RETURN json_build_object('student_name', v_student.name, 'documents', '[]');
        END IF;

        SELECT json_agg(json_build_object(
          'id', d.id,
          'document_name', d.document_name,
          'status', d.status,
          'description', d.description
        )) INTO v_docs
        FROM document_items d
        JOIN checklist_instances c ON c.id = d.checklist_instance_id
        WHERE c.student_destination_id = v_dest.id AND (d.status = 'Pending' OR d.status = 'Rejected');

        RETURN json_build_object(
          'student_id', v_student.id,
          'student_name', v_student.name,
          'destination', v_dest.destination_country,
          'level', v_dest.target_education_level,
          'documents', COALESCE(v_docs, '[]'::json)
        );
      END;
      $$;
    `);
    console.log('Created get_checklist_by_invite function');

    // 2. Create Security Definer function to update document status
    await client.query(`
      CREATE OR REPLACE FUNCTION update_document_status_by_invite(
        p_invite_code text,
        p_document_id uuid,
        p_file_url text
      )
      RETURNS boolean
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        v_student_id uuid;
        v_valid boolean;
      BEGIN
        SELECT id INTO v_student_id FROM students WHERE invite_code = p_invite_code LIMIT 1;
        IF NOT FOUND THEN
          RETURN false;
        END IF;

        -- Verify document belongs to student (through joins)
        SELECT true INTO v_valid
        FROM document_items d
        JOIN checklist_instances c ON c.id = d.checklist_instance_id
        JOIN student_destinations sd ON sd.id = c.student_destination_id
        WHERE d.id = p_document_id AND sd.student_id = v_student_id;

        IF NOT FOUND THEN
          RETURN false;
        END IF;

        UPDATE document_items 
        SET status = 'Received', file_url = p_file_url, updated_at = now()
        WHERE id = p_document_id;

        RETURN true;
      END;
      $$;
    `);
    console.log('Created update_document_status_by_invite function');

    // 3. Update storage policies to allow anon inserts
    await client.query(`
      DROP POLICY IF EXISTS "Anon can upload" ON storage.objects;
      CREATE POLICY "Anon can upload" ON storage.objects
      FOR INSERT TO public
      WITH CHECK ( bucket_id = 'student_documents' );
    `);
    console.log('Created storage policy');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
