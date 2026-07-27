const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.azmzwvtdqcgiumwpkmuc:Shreyash@1234@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  try {
    const { rows: payments } = await client.query(`
      SELECT pt.id, pt.amount, pt.payment_date, ft.name as fee_name, s.name as student_name
      FROM payment_transactions pt
      JOIN fee_records fr ON pt.fee_record_id = fr.id
      JOIN fee_types ft ON fr.fee_type_id = ft.id
      JOIN students s ON fr.student_id = s.id
      LIMIT 1;
    `);
    console.log("Payments Query OK:", payments);

    const { rows: refunds } = await client.query(`
      SELECT rr.id, rr.amount, rr.refund_date, rr.reason, ft.name as fee_name, s.name as student_name
      FROM refund_records rr
      JOIN fee_records fr ON rr.fee_record_id = fr.id
      JOIN fee_types ft ON fr.fee_type_id = ft.id
      JOIN students s ON fr.student_id = s.id
      LIMIT 1;
    `);
    console.log("Refunds Query OK:", refunds);
  } catch (err) {
    console.error("DB Error:", err);
  } finally {
    await client.end();
  }
}
run();
