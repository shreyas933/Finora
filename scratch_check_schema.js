const supabaseUrl = 'https://tqmkivmfjarmgqihvbtm.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxbWtpdm1mamFybWdxaWh2YnRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0OTExNTYsImV4cCI6MjA5MTA2NzE1Nn0.5Hm-uu7ZRYjxizIPfoC4jUAgVqrm49jGSsVUasU4Z9Y';

async function checkSchema() {
  console.log('Inspecting table schema/constraints...');
  try {
    // We can run a POST to /rest/v1/transactions with two identical rows to see if it allows duplicates
    const res = await fetch(`${supabaseUrl}/rest/v1/transactions`, {
      method: 'POST',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify([
        {
          user_id: '00000000-0000-0000-0000-000000000000',
          name: 'Double test vendor',
          amount: 40,
          category: 'Other',
          type: 'expense',
          date: '2026-06-13T12:00:00.000Z'
        },
        {
          user_id: '00000000-0000-0000-0000-000000000000',
          name: 'Double test vendor',
          amount: 40,
          category: 'Other',
          type: 'expense',
          date: '2026-06-13T12:00:00.000Z'
        }
      ])
    });
    const data = await res.json();
    if (!res.ok) {
      console.error('Insert failed:', data);
    } else {
      console.log('Insert succeeded! Created both items:', data);
      
      // Clean up the dummy records
      const delRes = await fetch(`${supabaseUrl}/rest/v1/transactions?name=eq.Double test vendor`, {
        method: 'DELETE',
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`
        }
      });
      console.log('Cleaned up records status:', delRes.status);
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkSchema();
