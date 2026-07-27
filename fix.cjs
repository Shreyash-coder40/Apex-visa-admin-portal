const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.azmzwvtdqcgiumwpkmuc:Shreyash@1234@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres', ssl: { rejectUnauthorized: false } });
async function check() {
  await client.connect();
  try {
    await client.query('ALTER TABLE document_items ADD COLUMN is_required BOOLEAN NOT NULL DEFAULT TRUE');
    console.log('Added is_required to document_items.');
  } catch(e) {
    console.log(e.message);
  }

  try {
    await client.query(`
      CREATE OR REPLACE FUNCTION fn_generate_student_checklists()
      RETURNS TRIGGER AS $$
      DECLARE
          v_template RECORD;
          v_instance_id UUID;
          v_item RECORD;
      BEGIN
          FOR v_template IN 
              SELECT id, vertical FROM checklist_templates 
              WHERE country = NEW.destination_country 
                AND education_level = NEW.target_education_level
          LOOP
              INSERT INTO checklist_instances (student_destination_id, vertical, status)
              VALUES (NEW.id, v_template.vertical, 'In Progress')
              RETURNING id INTO v_instance_id;
              
              FOR v_item IN 
                  SELECT document_name, is_required FROM checklist_template_items 
                  WHERE template_id = v_template.id
              LOOP
                  INSERT INTO document_items (instance_id, document_name, is_required, status)
                  VALUES (v_instance_id, v_item.document_name, v_item.is_required, 'Pending');
              END LOOP;
          END LOOP;
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('Fixed trigger fn_generate_student_checklists.');
  } catch(e) {
    console.log(e.message);
  }

  await client.end();
}
check();
