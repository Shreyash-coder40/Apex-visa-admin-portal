const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.azmzwvtdqcgiumwpkmuc:Shreyash@1234@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres', ssl: { rejectUnauthorized: false } });

async function updateDB() {
  await client.connect();
  try {
    // 1. Trigger function for auto-generating checklists
    await client.query(`
      CREATE OR REPLACE FUNCTION fn_generate_student_checklists()
      RETURNS TRIGGER AS $$
      DECLARE
          v_template RECORD;
          v_instance_id UUID;
          v_item RECORD;
      BEGIN
          -- For the given destination's country and education_level, find ALL matching templates
          FOR v_template IN 
              SELECT id, vertical FROM checklist_templates 
              WHERE country = NEW.destination_country 
                AND education_level = NEW.target_education_level
          LOOP
              -- Create checklist instance
              INSERT INTO checklist_instances (student_destination_id, vertical, status)
              VALUES (NEW.id, v_template.vertical, 'Pending')
              RETURNING id INTO v_instance_id;
              
              -- Copy template items to document items
              FOR v_item IN 
                  SELECT document_name, is_required FROM checklist_template_items 
                  WHERE template_id = v_template.id
              LOOP
                  INSERT INTO document_items (checklist_instance_id, document_name, is_required, status)
                  VALUES (v_instance_id, v_item.document_name, v_item.is_required, 'Pending');
              END LOOP;
          END LOOP;
          
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // 2. The trigger
    await client.query(`
      DROP TRIGGER IF EXISTS trg_generate_student_checklists ON student_destinations;
      CREATE TRIGGER trg_generate_student_checklists
      AFTER INSERT ON student_destinations
      FOR EACH ROW EXECUTE FUNCTION fn_generate_student_checklists();
    `);

    // 3. Update fn_convert_lead_to_student
    await client.query(`
      CREATE OR REPLACE FUNCTION fn_convert_lead_to_student(
          p_lead_id UUID,
          p_branch_id UUID,
          p_education_level TEXT,
          p_staff_user_id UUID
      )
      RETURNS UUID AS $$
      DECLARE
          v_lead leads%ROWTYPE;
          v_student_id UUID;
      BEGIN
          -- 1. Lock and fetch lead record
          SELECT * INTO v_lead FROM leads WHERE id = p_lead_id FOR UPDATE;
          IF NOT FOUND THEN
              RAISE EXCEPTION 'CONVERSION ERROR: Lead with ID % does not exist.', p_lead_id;
          END IF;
      
          IF v_lead.status = 'Converted' THEN
              RAISE EXCEPTION 'CONVERSION ERROR: Lead % is already converted into a Student.', p_lead_id;
          END IF;
      
          -- 2. Create student record atomically
          INSERT INTO students (name, phone, email, branch_id, education_level, source_lead_id, overall_status)
          VALUES (v_lead.name, v_lead.phone, v_lead.email, p_branch_id, COALESCE(p_education_level, v_lead.education_level), p_lead_id, 'Active')
          RETURNING id INTO v_student_id;
          
          -- 2.5 Auto-create destination which triggers checklists
          IF v_lead.interested_country IS NOT NULL AND COALESCE(p_education_level, v_lead.education_level) IS NOT NULL THEN
              INSERT INTO student_destinations (student_id, destination_country, target_education_level, status)
              VALUES (v_student_id, v_lead.interested_country, COALESCE(p_education_level, v_lead.education_level), 'Active');
          END IF;
      
          -- 3. Mark lead as converted inside same transaction
          UPDATE leads
          SET status = 'Converted',
              assigned_branch_id = p_branch_id,
              updated_at = now()
          WHERE id = p_lead_id;
      
          -- 4. Log conversion action to activity timeline
          INSERT INTO activity_logs (entity_type, entity_id, field_changed, old_value, new_value, changed_by)
          VALUES ('Lead', p_lead_id, 'status', v_lead.status, 'Converted', p_staff_user_id);
      
          INSERT INTO activity_logs (entity_type, entity_id, field_changed, old_value, new_value, changed_by)
          VALUES ('Student', v_student_id, 'created_from_lead', p_lead_id::TEXT, 'Active', p_staff_user_id);
      
          RETURN v_student_id;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);

    console.log('Database automation setup completed successfully!');
  } catch (err) {
    console.error('Error:', err.message);
  }
  await client.end();
}
updateDB();
