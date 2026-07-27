import { Client } from 'pg';

const DB_URI = 'postgresql://postgres.azmzwvtdqcgiumwpkmuc:Shreyash@1234@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres';

async function seedFinancials() {
  const client = new Client({
    connectionString: DB_URI,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL');

    // 1. Get all students
    const resStudents = await client.query('SELECT id FROM public.students');
    const students = resStudents.rows;

    if (students.length === 0) {
      console.log('No students found. Convert a lead first!');
      return;
    }

    // 2. Get fee types
    const resFeeTypes = await client.query('SELECT id, default_amount FROM public.fee_types');
    const feeTypes = resFeeTypes.rows;

    if (feeTypes.length === 0) {
      console.log('No fee types found in DB.');
      return;
    }

    // 3. Get super admin ID to record the fee
    const resAdmin = await client.query("SELECT id FROM public.staff_users WHERE role = 'super_admin' LIMIT 1");
    const adminId = resAdmin.rows[0]?.id;

    if (!adminId) {
      console.log('No super admin found!');
      return;
    }

    console.log(`Found ${students.length} students. Generating financial records...`);

    // 4. Insert a fee record for each student
    for (const student of students) {
      const feeType = feeTypes[0]; // Just pick the first fee type (e.g. Initial Consultation)
      
      const insertQuery = `
        INSERT INTO public.fee_records (student_id, fee_type_id, total_amount, currency, status)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT DO NOTHING
      `;
      
      await client.query(insertQuery, [
        student.id,
        feeType.id,
        feeType.default_amount,
        'USD',
        'Pending'
      ]);
    }

    console.log('Successfully seeded financial records!');

  } catch (err) {
    console.error('Error seeding financials:', err);
  } finally {
    await client.end();
  }
}

seedFinancials();
