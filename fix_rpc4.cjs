const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.azmzwvtdqcgiumwpkmuc:Shreyash@1234@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  
  try {
    console.log("Re-creating single function...");
    await client.query(`
      CREATE OR REPLACE FUNCTION public.fn_convert_lead_to_student(
        p_lead_id uuid,
        p_branch_id uuid,
        p_education_level text,
        p_staff_user_id uuid
      )
      RETURNS uuid
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        v_student_id uuid;
        v_lead record;
        v_dest_id uuid;
        v_checklist_id uuid;
      BEGIN
        -- Get lead details
        SELECT * INTO v_lead FROM leads WHERE id = p_lead_id;
        
        IF NOT FOUND THEN
          RAISE EXCEPTION 'Lead not found';
        END IF;

        -- 1. Create student record
        INSERT INTO students (
          name, 
          email, 
          phone, 
          branch_id, 
          education_level, 
          source_lead_id, 
          overall_status,
          date_of_birth,
          nationality,
          passport_number,
          invite_code
        )
        VALUES (
          v_lead.name,
          v_lead.email,
          v_lead.phone,
          p_branch_id,
          p_education_level,
          p_lead_id,
          'Active',
          v_lead.date_of_birth,
          v_lead.nationality,
          v_lead.passport_number,
          floor(random() * 899999 + 100000)::text
        )
        RETURNING id INTO v_student_id;

        -- 2. Create Destination
        IF v_lead.interested_country IS NOT NULL AND v_lead.interested_country != '' THEN
          INSERT INTO student_destinations (
            student_id,
            destination_country,
            target_education_level,
            university_course,
            status
          ) VALUES (
            v_student_id,
            v_lead.interested_country,
            p_education_level,
            v_lead.intended_course,
            'Active'
          ) RETURNING id INTO v_dest_id;
          
          -- 3. Create Checklist Instance (Admission)
          INSERT INTO checklist_instances (
            student_destination_id,
            status,
            vertical
          ) VALUES (
            v_dest_id,
            'In Progress',
            'admission'
          ) RETURNING id INTO v_checklist_id;
          
          -- 4. Create Initial Document Items
          INSERT INTO document_items (checklist_instance_id, document_name, status)
          VALUES 
            (v_checklist_id, 'Passport Copy', 'Pending'),
            (v_checklist_id, 'Academic Transcripts', 'Pending'),
            (v_checklist_id, 'English Language Certificate', 'Pending');
            
          IF p_education_level = 'Postgraduate' OR p_education_level = 'Post-Graduate' THEN
             INSERT INTO document_items (checklist_instance_id, document_name, status)
             VALUES 
               (v_checklist_id, 'Statement of Purpose', 'Pending'),
               (v_checklist_id, 'Resume/CV', 'Pending'),
               (v_checklist_id, 'Letters of Recommendation', 'Pending');
          END IF;
        END IF;

        -- 5. Mark lead as converted
        UPDATE leads 
        SET status = 'Converted', 
            updated_at = NOW()
        WHERE id = p_lead_id;

        -- 6. Log timeline event
        INSERT INTO lead_timeline_events (
          lead_id,
          event_type,
          staff_user_id,
          notes
        ) VALUES (
          p_lead_id,
          'Status Change',
          p_staff_user_id,
          'Lead converted to student'
        );

        RETURN v_student_id;
      END;
      $$;
    `);
    console.log("Function re-created successfully with vertical field!");
  } catch (err) {
    console.error("Error updating DB:", err);
  } finally {
    await client.end();
  }
}

run();
