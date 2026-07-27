const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.azmzwvtdqcgiumwpkmuc:Shreyash@1234@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  try {
    await client.query(`
      CREATE OR REPLACE FUNCTION public.get_checklist_by_invite(p_invite_code text)
       RETURNS json
       LANGUAGE plpgsql
       SECURITY DEFINER
      AS $function$
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
          RETURN json_build_object('student_name', v_student.name, 'documents', '[]'::json);
        END IF;

        SELECT json_agg(json_build_object(
          'id', d.id,
          'document_name', d.document_name,
          'status', d.status,
          'description', d.notes
        )) INTO v_docs
        FROM document_items d
        JOIN checklist_instances c ON c.id = d.instance_id
        WHERE c.student_destination_id = v_dest.id AND (d.status = 'Pending' OR d.status = 'Rejected');

        RETURN json_build_object(
          'student_id', v_student.id,
          'student_name', v_student.name,
          'destination', v_dest.destination_country,
          'level', v_dest.target_education_level,
          'documents', COALESCE(v_docs, '[]'::json)
        );
      END;
      $function$;
      
      -- Also reload schema cache immediately
      NOTIFY pgrst, 'reload schema';
    `);
    
    // Also check update_document_status_by_invite just in case
    const { rows } = await client.query(`
      SELECT pg_get_functiondef(oid)
      FROM pg_proc
      WHERE proname = 'update_document_status_by_invite';
    `);
    console.log(rows[0]?.pg_get_functiondef);

  } catch (err) {
    console.error("DB Error:", err);
  } finally {
    await client.end();
  }
}
run();
