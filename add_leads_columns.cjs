const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const client = new Client({
  connectionString: 'postgresql://postgres.azmzwvtdqcgiumwpkmuc:Shreyash@1234@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();

    console.log('Adding new columns to leads table...');
    const addColumnsQuery = `
      ALTER TABLE leads
      ADD COLUMN IF NOT EXISTS date_of_birth DATE,
      ADD COLUMN IF NOT EXISTS gender VARCHAR(50),
      ADD COLUMN IF NOT EXISTS marital_status VARCHAR(50),
      ADD COLUMN IF NOT EXISTS nationality VARCHAR(100),
      ADD COLUMN IF NOT EXISTS passport_number VARCHAR(100),
      ADD COLUMN IF NOT EXISTS passport_expiry DATE,
      ADD COLUMN IF NOT EXISTS address TEXT,
      ADD COLUMN IF NOT EXISTS highest_qualification VARCHAR(255),
      ADD COLUMN IF NOT EXISTS english_test_type VARCHAR(50),
      ADD COLUMN IF NOT EXISTS english_overall_score VARCHAR(20);
    `;
    await client.query(addColumnsQuery);
    console.log('Successfully added columns to leads table.');

    console.log('Updating fn_convert_lead_to_student function...');
    const updateFunctionQuery = `
      CREATE OR REPLACE FUNCTION fn_convert_lead_to_student(
        p_lead_id UUID,
        p_branch_id UUID,
        p_education_level VARCHAR,
        p_staff_user_id UUID
      ) RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        v_lead RECORD;
        v_student_id UUID;
        v_dest_id UUID;
      BEGIN
        -- 1. Get the lead
        SELECT * INTO v_lead FROM leads WHERE id = p_lead_id;
        IF NOT FOUND THEN
          RAISE EXCEPTION 'Lead not found';
        END IF;

        -- 2. Create the student, copying all details from the lead
        INSERT INTO students (
          name, phone, email, branch_id, education_level, source_lead_id, overall_status,
          date_of_birth, gender, marital_status, nationality, passport_number, passport_expiry,
          address, highest_qualification, english_test_type, english_overall_score
        )
        VALUES (
          v_lead.name, v_lead.phone, v_lead.email, p_branch_id, COALESCE(p_education_level, v_lead.education_level), p_lead_id, 'Active',
          v_lead.date_of_birth, v_lead.gender, v_lead.marital_status, v_lead.nationality, v_lead.passport_number, v_lead.passport_expiry,
          v_lead.address, v_lead.highest_qualification, v_lead.english_test_type, v_lead.english_overall_score
        )
        RETURNING id INTO v_student_id;

        -- 3. Mark the lead as Converted
        UPDATE leads SET status = 'Converted', updated_at = NOW() WHERE id = p_lead_id;

        -- 4. Create the student_destination
        INSERT INTO student_destinations (
          student_id, destination_country, target_education_level, university_or_course, status
        )
        VALUES (
          v_student_id, COALESCE(v_lead.interested_country, 'Any'), COALESCE(p_education_level, v_lead.education_level), COALESCE(v_lead.intended_course, 'TBD'), 'Active'
        )
        RETURNING id INTO v_dest_id;

        -- 5. Auto-generate checklists for this destination (if templates exist)
        -- Admission template
        INSERT INTO checklist_instances (student_destination_id, template_id, vertical, status)
        SELECT v_dest_id, id, 'admission', 'In Progress'
        FROM checklist_templates
        WHERE country = v_lead.interested_country AND education_level = p_education_level AND vertical = 'admission'
        LIMIT 1;

        -- Visa template
        INSERT INTO checklist_instances (student_destination_id, template_id, vertical, status)
        SELECT v_dest_id, id, 'visa', 'In Progress'
        FROM checklist_templates
        WHERE country = v_lead.interested_country AND education_level = p_education_level AND vertical = 'visa'
        LIMIT 1;

        -- Note: If we had a robust document_items generation trigger, it would fire here.
        -- We will just insert the activity log now.

        -- 6. Log the conversion activity
        INSERT INTO activity_logs (entity_type, entity_id, field_changed, old_value, new_value, changed_by, branch_id)
        VALUES ('Lead', p_lead_id, 'status', 'Contacted', 'Converted', p_staff_user_id, p_branch_id);

      END;
      $$;
    `;
    await client.query(updateFunctionQuery);
    console.log('Successfully updated fn_convert_lead_to_student.');

  } catch (err) {
    console.error('Error during migration:', err);
  } finally {
    await client.end();
  }
}

run();
