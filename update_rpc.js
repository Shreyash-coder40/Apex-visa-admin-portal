import { Client } from 'pg';

const DB_URI = 'postgresql://postgres.azmzwvtdqcgiumwpkmuc:Shreyash@1234@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres';

async function updateRPC() {
  const client = new Client({
    connectionString: DB_URI,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Updating fn_convert_lead_to_student...');

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
          
          -- 2.5 Auto-create student destination to trigger checklist generation
          INSERT INTO student_destinations (student_id, destination_country, target_education_level, status)
          VALUES (v_student_id, COALESCE(v_lead.interested_country, 'Canada'), COALESCE(p_education_level, v_lead.education_level, 'Post-Graduate'), 'Active');
      
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

    console.log('Successfully updated RPC!');
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

updateRPC();
