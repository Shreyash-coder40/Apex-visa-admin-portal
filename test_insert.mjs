const SUPABASE_URL = 'https://azmzwvtdqcgiumwpkmuc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6bXp3dnRkcWNnaXVtd3BrbXVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3ODk5ODYsImV4cCI6MjEwMDM2NTk4Nn0.VZqWnkP7CPsQ6_bacGalRKHHoTC1OTXfPK5pL6ZlCM8';

async function run() {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({
        name: 'Test Minimal',
        email: 'test@example.com',
        phone: '123',
        source: 'Web',
        status: 'New'
    })
  });
  console.log(response.status, await response.text());
}
run();
