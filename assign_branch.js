import { Client } from 'pg';

const DB_URI = 'postgresql://postgres.azmzwvtdqcgiumwpkmuc:Shreyash@1234@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres';

async function assignBranch() {
  const client = new Client({
    connectionString: DB_URI,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    // Check branch_assignments schema
    const schema = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'branch_assignments'
    `);
    console.log('Columns:', schema.rows.map(r => r.column_name));
    
    // get user ID
    const userRes = await client.query("SELECT id FROM staff_users WHERE email = 'admin@apexvisa.com' LIMIT 1");
    if (userRes.rows.length === 0) throw new Error('User not found');
    const userId = userRes.rows[0].id;
    
    // check if assignment exists
    const existing = await client.query('SELECT * FROM branch_assignments WHERE staff_user_id = $1', [userId]);
    if (existing.rows.length === 0) {
      // If it doesn't have an 'id' column, don't insert it.
      const hasId = schema.rows.some(r => r.column_name === 'id');
      if (hasId) {
         await client.query("INSERT INTO branch_assignments (id, staff_user_id, branch_id) VALUES (gen_random_uuid(), $1, 'b1111111-1111-1111-1111-111111111111')", [userId]);
      } else {
         await client.query("INSERT INTO branch_assignments (staff_user_id, branch_id) VALUES ($1, 'b1111111-1111-1111-1111-111111111111')", [userId]);
      }
      console.log('Successfully assigned admin to Toronto HQ!');
    } else {
      console.log('Already assigned to a branch!');
    }
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
assignBranch();
