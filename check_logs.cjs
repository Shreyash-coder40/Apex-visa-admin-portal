const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.azmzwvtdqcgiumwpkmuc:Shreyash@1234@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  try {
    const { rows } = await client.query(`
      SELECT COUNT(*) FROM activity_logs;
    `);
    console.log("Total Logs:", rows[0].count);
    
    const { rows: sample } = await client.query(`
      SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT 3;
    `);
    console.log("Sample Logs:", sample);
  } catch (err) {
    console.error("DB Error:", err);
  } finally {
    await client.end();
  }
}
run();
