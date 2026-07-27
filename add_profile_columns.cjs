const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.azmzwvtdqcgiumwpkmuc:Shreyash@1234@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres', ssl: { rejectUnauthorized: false } });

async function updateDB() {
  await client.connect();
  try {
    await client.query(`
      ALTER TABLE students 
      ADD COLUMN IF NOT EXISTS date_of_birth DATE,
      ADD COLUMN IF NOT EXISTS gender VARCHAR,
      ADD COLUMN IF NOT EXISTS marital_status VARCHAR,
      ADD COLUMN IF NOT EXISTS nationality VARCHAR,
      ADD COLUMN IF NOT EXISTS passport_number VARCHAR,
      ADD COLUMN IF NOT EXISTS passport_expiry DATE,
      ADD COLUMN IF NOT EXISTS address TEXT,
      ADD COLUMN IF NOT EXISTS highest_qualification VARCHAR,
      ADD COLUMN IF NOT EXISTS english_test_type VARCHAR,
      ADD COLUMN IF NOT EXISTS english_overall_score VARCHAR;
    `);

    console.log('Columns added successfully!');
  } catch (err) {
    console.error('Error:', err.message);
  }
  await client.end();
}
updateDB();
