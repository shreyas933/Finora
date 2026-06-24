const fs = require('fs');

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

async function testCategorize() {
  console.log('Sending categorize request to local Next.js server...');
  try {
    const res = await fetch('http://localhost:3000/api/sync/categorize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw })
    });
    const data = await res.json();
    console.log('API Response:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('API request failed. Is the local server running? Error:', err.message);
    
    // Fallback: test mockParseTransaction function logic directly by copying it here
    console.log('\nTesting mockParseTransaction function logic directly...');
    const result = mockParseTransaction(raw);
    console.log('mockParseTransaction result:', JSON.stringify(result, null, 2));
  }
}

function mockParseTransaction(raw) {
  let amount = 100;
  const amountMatch = raw.match(/(?:₹|Rs\.?|INR)\s*([0-9,]+(?:\.[0-9]{2})?)/i);
  if (amountMatch) {
    amount = parseFloat(amountMatch[1].replace(/,/g, ""));
  }

  let name = "Other Merchant";
  const upiRefMatch = raw.match(/UPI\/\d+\/([^/.\s]+)/i);
  if (upiRefMatch) {
    name = upiRefMatch[1].trim();
  } else {
    const merchantMatch = raw.match(/(?:paid to|sent to|transfer to|spent at|at|debited for)\s+([A-Za-z0-9\s*]+?)(?:\.|\s+Ref|\s+UPI|\s+on|\s+from|\s+Rs|\s+INR|\s+A\/c|\s*$)/i);
    if (merchantMatch) {
      name = merchantMatch[1].trim().replace(/\*+/g, " ").trim();
    }
  }

  name = name.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");

  const lowerRaw = raw.toLowerCase();
  const lowerName = name.toLowerCase();
  let category = "Other";

  if (/(salary|dividend|interest|credit|refund|cashback)/.test(lowerName)) {
    category = "Income";
  }

  let type = "expense";
  if (lowerRaw.includes("credited") || lowerRaw.includes("refund") || lowerRaw.includes("cashback") || lowerRaw.includes("received") || lowerRaw.includes("added to") || lowerRaw.includes("deposited")) {
    type = "income";
  }

  return { name, amount, category, type };
}

testCategorize();
