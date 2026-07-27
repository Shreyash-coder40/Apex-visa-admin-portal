const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  'https://azmzwvtdqcgiumwpkmuc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsI...' // Replace with actual anon key if available, or I'll just use raw sql to test PostgREST output
);
