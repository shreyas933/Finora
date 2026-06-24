const raw = "Credit Alert! Rs.1.00 credited to HDFC Bank A/c XX5866 on 16-06-26 from VPA krthk7926@okaxis (UPI 616718295169)";

async function testLive() {
  console.log('Sending transaction text to live Vercel URL...');
  try {
    const res = await fetch('https://finora-fawn.vercel.app/api/sync/categorize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw })
    });
    
    if (res.ok) {
      const data = await res.json();
      console.log('Live Server Response:', JSON.stringify(data, null, 2));
      if (data.success && data.transaction) {
        console.log(`Parsed Type: ${data.transaction.type}`);
        console.log(`Parsed Name: ${data.transaction.name}`);
        if (data.transaction.type === 'income') {
          console.log('\n--- SUCCESS: Live server is updated and working! ---');
        } else {
          console.log('\n--- PENDING: Live server is still running the old code. ---');
        }
      }
    } else {
      console.error(`Request failed with status: ${res.status}`);
    }
  } catch (err) {
    console.error('Request failed:', err.message);
  }
}

testLive();
