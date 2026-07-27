import { Client } from 'pg';

const DB_URI = 'postgresql://postgres.azmzwvtdqcgiumwpkmuc:Shreyash@1234@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres';

async function seedLeads() {
  const client = new Client({
    connectionString: DB_URI,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to DB. Seeding leads...');

    await client.query(`
      INSERT INTO public.leads (id, name, email, phone, interested_country, education_level, intended_course, status, assigned_branch_id)
      VALUES 
      (gen_random_uuid(), 'John Doe', 'john.doe@example.com', '+14165550198', 'Canada', 'Undergraduate', 'Computer Science', 'New', NULL),
      (gen_random_uuid(), 'Sarah Smith', 'sarah.smith@example.com', '+61255501234', 'Australia', 'Postgraduate', 'MBA', 'New', NULL),
      (gen_random_uuid(), 'Raj Patel', 'raj.patel@example.com', '+447911123456', 'UK', 'High School', 'BSc Physics', 'New', NULL)
      ON CONFLICT DO NOTHING;
    `);

    console.log('✅ 3 Sample Leads inserted into the Triage Pool!');
  } catch (err) {
    console.error('Error seeding leads:', err);
  } finally {
    await client.end();
  }
}

seedLeads();
