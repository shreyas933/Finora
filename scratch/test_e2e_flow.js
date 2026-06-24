const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Parse env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?$/);
  if (match) {
    let val = match[2] || '';
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    env[match[1]] = val;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function run() {
  const supabase = createClient(supabaseUrl, anonKey);

  // Sign in as Karthik (uses real credentials from the app)
  // We'll do a real sign-in to get a valid JWT, then use it to call the ingest endpoint
  console.log('Signing in with test account...');
  // NOTE: Change these to your actual Supabase credentials to run this test
  // You can find this in the app after login using supabase.auth.getSession()
  const { data: signData, error: signError } = await supabase.auth.signInWithPassword({
    email: 'karthikvivek2005@gmail.com',
    password: 'Password@123'  // Replace with actual password
  });

  if (signError || !signData?.session) {
    console.error('Sign-in failed:', signError?.message);
    return;
  }

  const { session } = signData;
  console.log('Signed in! UserId:', session.user.id);
  console.log('Access token (first 20 chars):', session.access_token.slice(0, 20) + '...');

  // Simulate what the Android app does when it intercepts an SMS
  const categorizeRes = await fetch('https://finora-fawn.vercel.app/api/sync/categorize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw: `Sent Rs.60.00\nFrom HDFC Bank A/C\n*5866\nTo VENDEKIN\nTECHNOLOGIES PRI\nOn 22/06/26\nRef 125131610979\nNot You?\nCall 18002586161/SMS\nBLOCK UPI to\n7308080808` })
  });

  const categorizeData = await categorizeRes.json();
  console.log('\nCategorize result:', JSON.stringify(categorizeData.transaction, null, 2));

  if (!categorizeData.success || !categorizeData.transaction) {
    console.error('Categorize failed!');
    return;
  }

  // Now call ingest with the real token (simulating what Android sends)
  console.log('\nCalling ingest with user JWT...');
  const ingestRes = await fetch('https://finora-fawn.vercel.app/api/sync/ingest', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify({
      userId: session.user.id,
      isBudgetSet: false,
      transaction: categorizeData.transaction
    })
  });

  const ingestData = await ingestRes.json();
  console.log('\nIngest result:', JSON.stringify(ingestData, null, 2));
  if (ingestRes.ok) {
    console.log('\n✅ SUCCESS: Transaction logged correctly to Supabase!');
  } else {
    console.log('\n❌ FAIL: Ingest returned error:', ingestData.error);
  }
}

run();
