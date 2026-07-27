const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.azmzwvtdqcgiumwpkmuc:Shreyash@1234@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();

    // 1. Update the RPC to mark all duplicate names as Received
    await client.query(`
      CREATE OR REPLACE FUNCTION public.update_document_status_by_invite(
        p_invite_code text,
        p_document_id uuid,
        p_file_url text
      ) RETURNS boolean AS $$
      DECLARE
        v_student_id uuid;
        v_doc_name varchar;
      BEGIN
        SELECT id INTO v_student_id FROM students WHERE invite_code = p_invite_code LIMIT 1;
        IF NOT FOUND THEN
          RETURN false;
        END IF;

        SELECT d.document_name INTO v_doc_name
        FROM document_items d
        JOIN checklist_instances c ON c.id = d.instance_id
        JOIN student_destinations sd ON sd.id = c.student_destination_id
        WHERE d.id = p_document_id AND sd.student_id = v_student_id;

        IF NOT FOUND THEN
          RETURN false;
        END IF;

        UPDATE document_items d
        SET status = 'Received', file_url = p_file_url, updated_at = now()
        FROM checklist_instances c, student_destinations sd
        WHERE d.instance_id = c.id
          AND c.student_destination_id = sd.id
          AND sd.student_id = v_student_id
          AND LOWER(TRIM(d.document_name)) = LOWER(TRIM(v_doc_name));

        RETURN true;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);

    // 2. Create a trigger function that automatically copies Received files to newly created checklists
    await client.query(`
      CREATE OR REPLACE FUNCTION public.fn_sync_duplicate_documents()
      RETURNS trigger AS $$
      DECLARE
        v_student_id uuid;
        v_existing_url text;
      BEGIN
        -- Find the student id for the newly inserted document
        SELECT sd.student_id INTO v_student_id
        FROM checklist_instances c
        JOIN student_destinations sd ON sd.id = c.student_destination_id
        WHERE c.id = NEW.instance_id;

        -- Look for an existing received document with the same name
        SELECT d.file_url INTO v_existing_url
        FROM document_items d
        JOIN checklist_instances c ON c.id = d.instance_id
        JOIN student_destinations sd ON sd.id = c.student_destination_id
        WHERE sd.student_id = v_student_id
          AND LOWER(TRIM(d.document_name)) = LOWER(TRIM(NEW.document_name))
          AND d.status = 'Received'
          AND d.file_url IS NOT NULL
        LIMIT 1;

        IF FOUND THEN
          NEW.status := 'Received';
          NEW.file_url := v_existing_url;
        END IF;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);

    // Drop if exists and create trigger
    await client.query(`
      DROP TRIGGER IF EXISTS trg_sync_duplicate_documents ON document_items;
      CREATE TRIGGER trg_sync_duplicate_documents
      BEFORE INSERT ON document_items
      FOR EACH ROW
      EXECUTE FUNCTION fn_sync_duplicate_documents();
    `);

    console.log('Database updated successfully for cross-destination deduplication.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
