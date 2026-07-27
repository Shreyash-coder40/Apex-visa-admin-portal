const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.azmzwvtdqcgiumwpkmuc:Shreyash@1234@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  
  const studentId = '931b4cdf-4750-47bc-967d-f57e55702fc1';
  
  const { rows: students } = await client.query("SELECT * FROM students WHERE id = $1", [studentId]);
  console.log('Student:', students[0]);
  
  const { rows: destinations } = await client.query("SELECT * FROM student_destinations WHERE student_id = $1", [studentId]);
  console.log('Destinations:', destinations);
  
  const { rows: checklists } = await client.query("SELECT * FROM checklist_instances WHERE student_id = $1", [studentId]);
  console.log('Checklists:', checklists.map(c => c.id));
  
  await client.end();
}

run();
