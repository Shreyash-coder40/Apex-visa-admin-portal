const { Client } = require('pg');
const fs = require('fs');

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
    console.log("Connected to Supabase PostgreSQL!");
    
    const sql = fs.readFileSync('sql_update.sql', 'utf8');
    console.log("Executing sql_update.sql...");
    
    await client.query(sql);
    console.log("Database successfully updated with new RLS policies and triggers!");
    
  } catch (err) {
    console.error("Error executing SQL:", err);
  } finally {
    await client.end();
  }
}

runSql();
