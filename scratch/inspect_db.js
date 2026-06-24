const supabaseUrl = 'https://tqmkivmfjarmgqihvbtm.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxbWtpdm1mamFybWdxaWh2YnRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0OTExNTYsImV4cCI6MjA5MTA2NzE1Nn0.5Hm-uu7ZRYjxizIPfoC4jUAgVqrm49jGSsVUasU4Z9Y';

async function checkColumn(colName) {
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/transactions?select=${colName}&limit=1`, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`
      }
    });
    if (res.status === 200) {
      console.log(`  Column "${colName}" EXISTS.`);
      return true;
    } else {
      return false;
    }
  } catch (err) {
    return false;
  }
}

async function run() {
  const cols = ['notes', 'description', 'metadata', 'card', 'card_digits', 'ref', 'reference', 'bank'];
  for (const c of cols) {
    await checkColumn(c);
  }
}

run();
