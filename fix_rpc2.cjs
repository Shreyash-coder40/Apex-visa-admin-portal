const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.azmzwvtdqcgiumwpkmuc:Shreyash@1234@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  try {
    await client.query(`
      CREATE OR REPLACE FUNCTION public.update_document_status_by_invite(p_invite_code text, p_document_id uuid, p_file_url text)
       RETURNS boolean
       LANGUAGE plpgsql
       SECURITY DEFINER
      AS $function$
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
        JOIN checklist_instances c ON c.id = d.instance_id
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
      $function$;
      
      NOTIFY pgrst, 'reload schema';
    `);
    console.log("update_document_status_by_invite fixed.");
  } catch (err) {
    console.error("DB Error:", err);
  } finally {
    await client.end();
  }
}
run();
