const supabaseUrl = 'https://tqmkivmfjarmgqihvbtm.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxbWtpdm1mamFybWdxaWh2YnRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0OTExNTYsImV4cCI6MjA5MTA2NzE1Nn0.5Hm-uu7ZRYjxizIPfoC4jUAgVqrm49jGSsVUasU4Z9Y';

async function check() {
  console.log('Querying transactions table via REST API...');
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/transactions?select=*`, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`
      }
    });
    const data = await res.json();
    if (!res.ok) {
      console.error('REST API error:', data);
    } else {
      console.log('Successfully fetched transactions count:', data.length);
      console.log('Sample data:', data.slice(0, 5));
    }
  } catch (err) {
    console.error('Fetch failed:', err.message);
  }
}

check();
