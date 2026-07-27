const pg = require('pg');
const { Client } = pg;

async function runSql() {
  const client = new Client({
    user: 'postgres.azmzwvtdqcgiumwpkmuc',
    password: 'Shreyash@1234',
    host: 'aws-0-ap-southeast-1.pooler.supabase.com',
    port: 5432,
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const sql = require('fs').readFileSync('admin_setup.sql', 'utf8');
    console.log("Executing admin_setup.sql...");
    
    await client.query(sql);
    console.log("Database successfully updated with new staff creation function!");
    
  } catch (err) {
    console.error("Error executing SQL:", err);
  } finally {
    await client.end();
  }
}

runSql();
