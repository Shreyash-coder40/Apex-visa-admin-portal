const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.azmzwvtdqcgiumwpkmuc:Shreyash@1234@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  
  try {
    console.log("Dropping both overloaded functions...");
    // Drop both signatures if they exist
    await client.query(`
      DROP FUNCTION IF EXISTS fn_convert_lead_to_student(uuid, uuid, character varying, uuid);
      DROP FUNCTION IF EXISTS fn_convert_lead_to_student(uuid, uuid, text, uuid);
    `);
    
    console.log("Re-creating single function...");
    // Recreate the function using text
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
      BEGIN
        -- Get lead details
        SELECT * INTO v_lead FROM leads WHERE id = p_lead_id;
        
        IF NOT FOUND THEN
          RAISE EXCEPTION 'Lead not found';
        END IF;

        -- Create student record
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

        -- Mark lead as converted
        UPDATE leads 
        SET status = 'Converted', 
            converted_to_student_id = v_student_id,
            updated_at = NOW()
        WHERE id = p_lead_id;

        -- Log timeline event
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
    console.log("Function re-created successfully!");
  } catch (err) {
    console.error("Error updating DB:", err);
  } finally {
    await client.end();
  }
}

run();
