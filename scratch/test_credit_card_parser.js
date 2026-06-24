const testCases = [
  "Spent Rs.450.00 on HDFC Bank Credit Card ending 5866 at ZOMATO on 2026-06-17.",
  "Your SBI Card ending in 9876 has been debited by Rs.1200.00 at Amazon.in.",
  "Txn of INR 50.00 on ICICI Bank Card xx1234 at Chaayos.",
  "Transaction of Rs 500 on Kotak Debit Card xxxx4321 at Starbucks.",
  "Dear Customer, your A/c XX1293 has been debited by Rs. 850.00 on 2026-05-28 for UPI Ref 610928374829 paid to Swiggy. - HDFC Bank",
  "Union Bank SMS: Rs. 140.00 debited from A/c XX9021. Ref: UPI/6102983746/Zomato. Charges nil.",
  "Sent Rs.1.00 From HDFC Bank A/C *5866 To KARTHIK VIVEK On 12/06/26 Ref 616351384396"
];

function localParse(raw) {
  let cardDigits = undefined;
  const cardMatch = raw.match(/\b(?:card|a\/c|ending\s*(?:in)?|xx|x+)\s*\*?([0-9]{4})\b/i);
  if (cardMatch) {
    cardDigits = cardMatch[1];
  }

  let bank = undefined;
  const bankMatch = raw.match(/\b(hdfc|icici|sbi|axis|kotak|hsbc|citi|rbl|pnb|bob|yes bank|yesbank|union)\b/i);
  if (bankMatch) {
    const b = bankMatch[1].toLowerCase();
    if (b === 'hdfc') bank = 'HDFC Bank';
    else if (b === 'icici') bank = 'ICICI Bank';
    else if (b === 'sbi') bank = 'SBI';
    else if (b === 'axis') bank = 'Axis Bank';
    else if (b === 'kotak') bank = 'Kotak Bank';
    else if (b === 'pnb') bank = 'PNB';
    else if (b === 'bob') bank = 'Bank of Baroda';
    else if (b === 'union') bank = 'Union Bank';
    else bank = b.charAt(0).toUpperCase() + b.slice(1);
  }

  return { cardDigits, bank };
}

testCases.forEach((tc, idx) => {
  console.log(`\nTest Case ${idx + 1}: "${tc}"`);
  console.log(JSON.stringify(localParse(tc), null, 2));
});
