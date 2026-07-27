const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.azmzwvtdqcgiumwpkmuc:Shreyash@1234@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  
  try {
    await client.query(`
      GRANT EXECUTE ON FUNCTION public.get_checklist_by_invite(text) TO anon;
      GRANT EXECUTE ON FUNCTION public.get_checklist_by_invite(text) TO authenticated;
      
      GRANT EXECUTE ON FUNCTION public.update_document_status_by_invite(text, uuid, text) TO anon;
      GRANT EXECUTE ON FUNCTION public.update_document_status_by_invite(text, uuid, text) TO authenticated;
    `);
    console.log("Grants applied successfully.");
  } catch (err) {
    console.error("DB Error:", err);
  } finally {
    await client.end();
  }
}

run();
