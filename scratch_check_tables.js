const supabaseUrl = 'https://tqmkivmfjarmgqihvbtm.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxbWtpdm1mamFybWdxaWh2YnRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0OTExNTYsImV4cCI6MjA5MTA2NzE1Nn0.5Hm-uu7ZRYjxizIPfoC4jUAgVqrm49jGSsVUasU4Z9Y';

async function checkTables() {
  console.log('Checking for profiles/settings tables...');
  try {
    const pRes = await fetch(`${supabaseUrl}/rest/v1/profiles?select=*`, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`
      }
    });
    console.log('Profiles table response status:', pRes.status);
    const pData = await pRes.json().catch(() => null);
    console.log('Profiles table data or error:', pData);

    const sRes = await fetch(`${supabaseUrl}/rest/v1/settings?select=*`, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`
      }
    });
    console.log('Settings table response status:', sRes.status);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkTables();
