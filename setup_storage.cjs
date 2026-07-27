require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws');
const supabase = createClient('https://azmzwvtdqcgiumwpkmuc.supabase.co', process.env.VITE_SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: WebSocket }
});

const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SERVICE_KEY) {
  console.log('No service key provided, skipping bucket creation check via admin API');
  process.exit(0);
}
const adminSupabase = createClient('https://azmzwvtdqcgiumwpkmuc.supabase.co', SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function run() {
  const { data: buckets, error: getError } = await adminSupabase.storage.listBuckets();
  if (getError) {
    console.error('Error fetching buckets:', getError);
    return;
  }
  
  const hasBucket = buckets.find(b => b.name === 'student_documents');
  if (!hasBucket) {
    console.log('Creating student_documents bucket...');
    const { data, error } = await adminSupabase.storage.createBucket('student_documents', {
      public: true, // Making public for easy access for now
      fileSizeLimit: 10485760, // 10MB
    });
    if (error) console.error('Error creating bucket:', error);
    else console.log('Bucket created!');
  } else {
    console.log('Bucket already exists.');
  }
}
run();
