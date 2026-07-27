const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.azmzwvtdqcgiumwpkmuc:Shreyash@1234@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  try {
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_publication_tables
          WHERE pubname = 'supabase_realtime' AND tablename = 'document_items'
        ) THEN
          ALTER PUBLICATION supabase_realtime ADD TABLE document_items;
        END IF;
      END
      $$;
    `);
    console.log("Realtime enabled for document_items");
  } catch (err) {
    console.error("DB Error:", err);
  } finally {
    await client.end();
  }
}
run();
