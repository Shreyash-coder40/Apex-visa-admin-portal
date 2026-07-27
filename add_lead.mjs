const SUPABASE_URL = 'https://azmzwvtdqcgiumwpkmuc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6bXp3dnRkcWNnaXVtd3BrbXVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3ODk5ODYsImV4cCI6MjEwMDM2NTk4Nn0.VZqWnkP7CPsQ6_bacGalRKHHoTC1OTXfPK5pL6ZlCM8';

async function addSampleLead() {
  console.log("Inserting sample lead...");
  const response = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
        name: 'Elena Rostova',
        email: 'elena.r.2026@example.com',
        phone: '+1 (604) 555-0188',
        interested_country: 'Canada Post-Graduate',
        intended_course: 'MSc Data Science',
        status: 'New',
        source: 'Website - Free Eligibility Check',
        message: 'I am looking to study in Vancouver for the Fall 2026 intake. Need guidance on GIC and visa processing.',
        assigned_branch_id: null // Put into Shared Pool
    })
  });

  if (!response.ok) {
    console.error("Error inserting lead:", await response.text());
  } else {
    console.log("Successfully inserted lead!");
  }
}

addSampleLead();
