const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

// We need the supabase client from the actual project to use its URL/Key
const file = fs.readFileSync('src/lib/supabaseClient.js', 'utf8');
const urlMatch = file.match(/VITE_SUPABASE_URL\s*\|\|\s*'([^']+)'/);
const keyMatch = file.match(/VITE_SUPABASE_ANON_KEY\s*\|\|\s*'([^']+)'/);

const supabase = createClient(urlMatch[1], keyMatch[1]);

async function run() {
  const { data, error } = await supabase
    .from('payment_transactions')
    .select(`
      *,
      fee_records(
        fee_types(name),
        students(
          name,
          leads(name),
          branches(name, id)
        )
      )
    `);
  if (error) console.error(error);
  else console.log(JSON.stringify(data, null, 2));
}
run();
