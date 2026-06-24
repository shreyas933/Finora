async function testIngest() {
  console.log('Sending transaction ingest to live Vercel URL...');
  const payload = {
    userId: '00000000-0000-0000-0000-000000000000',
    isBudgetSet: false,
    transaction: {
      name: 'Vendekin\ntechnologies Pri',
      amount: 60,
      category: 'Other',
      type: 'expense',
      cardDigits: '5866',
      bank: 'HDFC Bank'
    }
  };

  try {
    const res = await fetch('https://finora-fawn.vercel.app/api/sync/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (res.ok) {
      const data = await res.json();
      console.log('Ingest Response:', JSON.stringify(data, null, 2));
    } else {
      console.error(`Request failed with status: ${res.status}`);
      const text = await res.text();
      console.error('Response text:', text);
    }
  } catch (err) {
    console.error('Request failed:', err.message);
  }
}

testIngest();
