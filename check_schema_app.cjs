const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.azmzwvtdqcgiumwpkmuc:Shreyash@1234@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  
  const { rows: cols1 } = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'students'");
  console.log('students cols:', cols1);
  
  const { rows: cols2 } = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'student_destinations'");
  console.log('student_destinations cols:', cols2);
  
  await client.end();
}

run();
