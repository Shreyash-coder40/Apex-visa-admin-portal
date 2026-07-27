const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.azmzwvtdqcgiumwpkmuc:Shreyash@1234@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres', ssl: { rejectUnauthorized: false } });

async function fix() {
  await client.connect();
  try {
    await client.query(`
      CREATE POLICY "Super Admins full control payment_transactions" ON payment_transactions
        FOR ALL TO authenticated
        USING (fn_is_super_admin())
        WITH CHECK (fn_is_super_admin());
    `);
    console.log('Fixed RLS for payment_transactions!');
  } catch (err) {
    console.log(err.message);
  }
  await client.end();
}
fix();
