async function testCategorize(label, raw) {
  const res = await fetch('https://finora-fawn.vercel.app/api/sync/categorize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw })
  });
  const data = await res.json();
  console.log(`\n[${label}]`);
  console.log('  Name    :', data.transaction?.name);
  console.log('  Amount  :', data.transaction?.amount);
  console.log('  Type    :', data.transaction?.type);
  console.log('  Category:', data.transaction?.category);
  console.log('  Bank    :', data.transaction?.bank || 'N/A');
}

async function run() {
  // Test 1: Groww credit (UPI credit from investment platform)
  await testCategorize(
    'Groww Credit ₹200',
    'Rs.200.00 credited to HDFC Bank A/c XX5866 from VPA groww@hdfcbank on 23-06-26. UPI Ref 613294857621'
  );

  // Test 2: Thomson Mart debit
  await testCategorize(
    'Thomson Mart Debit ₹80',
    'Rs.80.00 debited from HDFC Bank A/c XX5866. UPI Ref 613294857622 paid to THOMSOMS MART on 23-06-26'
  );

  // Test 3: Random Zomato-like
  await testCategorize(
    'Zomato Food ₹350',
    'Dear Customer, Rs. 350.00 has been debited from A/c XX5866 for UPI Ref 123456789 paid to Zomato. Avl Bal: Rs. 4,200.00 - HDFC Bank'
  );

  // Test 4: Salary credit from company
  await testCategorize(
    'Salary ₹50000',
    'Rs.50,000.00 credited to your HDFC Bank A/c XX5866 on 23-06-26 by ACME CORP PRIVATE LTD (salary). Ref 987654321'
  );

  // Test 5: Amazon shopping
  await testCategorize(
    'Amazon Shopping ₹1299',
    'Alert: Rs.1299.00 debited from A/c *5866 on 23-06-26. Info: UPI/613294/Amazon India. HDFC Bank'
  );

  // Test 6: Multiline debit (like Vendekin but different merchant)
  await testCategorize(
    'Multiline Merchant Debit',
    `Sent Rs.150.00\nFrom HDFC Bank A/C\n*5866\nTo THOMSON\nMART\nOn 23/06/26\nRef 125131610980`
  );
}

run();
