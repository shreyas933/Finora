const supabaseUrl = 'https://tqmkivmfjarmgqihvbtm.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxbWtpdm1mamFybWdxaWh2YnRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0OTExNTYsImV4cCI6MjA5MTA2NzE1Nn0.5Hm-uu7ZRYjxizIPfoC4jUAgVqrm49jGSsVUasU4Z9Y';

async function testInsert() {
  console.log('Testing raw insert via REST API...');
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/transactions`, {
      method: 'POST',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
        name: 'Mock Test Store',
        amount: 100,
        category: 'Shopping',
        type: 'expense',
        date: new Date().toISOString()
      })
    });
    const data = await res.json();
    if (!res.ok) {
      console.error('Insert failed:', data);
    } else {
      console.log('Insert succeeded! Return data:', data);
    }
  } catch (err) {
    console.error('Error during insert:', err.message);
  }
}

testInsert();
