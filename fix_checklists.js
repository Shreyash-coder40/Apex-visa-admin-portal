import { Client } from 'pg';

const DB_URI = 'postgresql://postgres.azmzwvtdqcgiumwpkmuc:Shreyash@1234@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres';

async function fixChecklists() {
  const client = new Client({
    connectionString: DB_URI,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    // Find students without destinations
    const res = await client.query(`
      SELECT s.id, s.education_level 
      FROM students s 
      LEFT JOIN student_destinations sd ON s.id = sd.student_id 
      WHERE sd.id IS NULL
    `);
    
    for (const student of res.rows) {
      console.log('Fixing student:', student.id);
      await client.query(`
        INSERT INTO student_destinations (student_id, destination_country, target_education_level, status)
        VALUES ($1, 'Canada', COALESCE($2, 'Post-Graduate'), 'Active')
      `, [student.id, student.education_level]);
    }

    console.log('Successfully generated missing checklists!');
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

fixChecklists();
