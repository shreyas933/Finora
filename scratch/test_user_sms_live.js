const raw = `Sent Rs.60.00
From HDFC Bank A/C
*5866
To VENDEKIN
TECHNOLOGIES PRI
On 22/06/26
Ref 125131610979
Not You?
Call 18002586161/SMS
BLOCK UPI to
7308080808`;

async function testLive() {
  console.log('Sending user SMS text to live Vercel URL...');
  try {
    const res = await fetch('https://finora-fawn.vercel.app/api/sync/categorize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw })
    });
    
    if (res.ok) {
      const data = await res.json();
      console.log('Live Server Response:', JSON.stringify(data, null, 2));
    } else {
      console.error(`Request failed with status: ${res.status}`);
      const text = await res.text();
      console.error('Response text:', text);
    }
  } catch (err) {
    console.error('Request failed:', err.message);
  }
}

testLive();
