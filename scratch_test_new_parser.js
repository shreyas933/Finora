const testCases = [
  "Sent Rs.1.00 From HDFC Bank A/C *5866 To KARTHIK VIVEK On 12/06/26 Ref 616351384396 Not You? Call 18002586161/SMS BLOCK UPI to 7308080808",
  "Sent Rs.40.00 From HDFC Bank A/C *5866 To MR RAJA RAMAR On 13/06/26 Ref 124673665351 Not You? Call 18002586161/SMS BLOCK UPI to 7308080808",
  "Dear Customer, your A/c XX1293 has been debited by Rs. 850.00 on 2026-05-28 for UPI Ref 610928374829 paid to Swiggy. - HDFC Bank",
  "Union Bank SMS: Rs. 140.00 debited from A/c XX9021. Ref: UPI/6102983746/Zomato. Charges nil.",
  "SBI SMS: Your A/c XX3829 debited by Rs. 2,500.00. UPI Ref 6102837465 paid to MakeMyTrip.",
  "ICICI Bank: Alert! Rs. 120.00 spent on A/c XX902. Ref: UPI/6109283/Chaayos. Avl Bal: Rs. 24,150.00.",
  "Axis Bank: Rs. 500.00 debited from A/c XX482. Info: UPI/61028374/Amazon India. 28-05-26 14:15.",
  "Credit Alert! Rs.2.00 credited to HDFC Bank A/c XX5866 on 16-06-26 from VPA krthk7926@okaxis (UPI 653317704553)",
  "You received Rs. 50.00 on Google Pay from Friend.",
  "Rs. 100.00 credited to A/c XX1234 by John Doe. Ref: 12345."
];

function localParse(raw) {
  const lowerRaw = raw.toLowerCase();

  // 1. Amount
  let amount = 0;
  const amountMatch = raw.match(/(?:₹|Rs\.?|INR)\s*([0-9,]+(?:\.[0-9]{2})?)/i);
  if (amountMatch) {
    amount = parseFloat(amountMatch[1].replace(/,/g, ""));
  } else {
    const genericAmountMatch = raw.match(/(?:debited|credited|spent|withdrawn|paid|sent|received|amount)\s+(?:of\s+)?([0-9,]+(?:\.[0-9]{2})?)/i);
    if (genericAmountMatch) {
      amount = parseFloat(genericAmountMatch[1].replace(/,/g, ""));
    }
  }

  // 2. Type (Income vs. Expense)
  // Use regex with word boundaries to avoid false positives (e.g. matching "pay" in "Google Pay" or "to" in "credited to")
  const isIncome = /\b(?:credited|credit|received|recieved|deposited|deposit|refund|cashback|added|incoming)\b/i.test(lowerRaw) || /transfer\s+from/i.test(lowerRaw);
  const isExpense = /\b(?:debited|debit|withdrawn|withdraw|spent|spend|sent|send|paid|outgoing)\b/i.test(lowerRaw) || /transfer\s+to/i.test(lowerRaw);

  let type = "expense";
  if (isIncome && !isExpense) {
    type = "income";
  } else if (isExpense && !isIncome) {
    type = "expense";
  } else if (isIncome && isExpense) {
    // If both match (e.g. "debited... credited to" or "credited to... from VPA"), prioritize expense if there's a strong debit indicator
    const hasStrongDebit = /\b(?:debited|debit|withdrawn|withdraw|spent|spend|sent|send|paid)\b/i.test(lowerRaw);
    if (hasStrongDebit) {
      type = "expense";
    } else {
      type = "income";
    }
  }

  // 3. Name (Merchant / Payee)
  let name = "Other Merchant";
  
  // For income transactions, look for sender name after "from" or "by" or "received from"
  let matched = false;
  if (type === "income") {
    const incomePayeeMatch = raw.match(/(?:from|by|received from|transfer from)\s+(?:VPA\s+)?([A-Za-z0-9\s*@._-]+?)(?:\.|\s+Ref|\s+UPI|\s*\(|\s+on\b|\s+to\b|\s+by\b|\s+Rs\b|\s+INR\b|\s+A\/c|\s*via\b|\s*using\b|\s*$)/i);
    if (incomePayeeMatch) {
      name = incomePayeeMatch[1].trim();
      matched = true;
    }
  }

  if (!matched) {
    const upiRefMatch = raw.match(/UPI\/\d+\/([^/.\s]+)/i);
    if (upiRefMatch) {
      name = upiRefMatch[1].trim();
    } else {
      // Upgraded pattern including "to" prefix, but avoid matching bank names if possible
      const merchantMatch = raw.match(/(?:paid to|sent to|transfer to|spent at|at|debited for|to)\s+([A-Za-z0-9\s*]+?)(?:\.|\s+Ref|\s+UPI|\s+on|\s+from|\s+Rs|\s+INR|\s+A\/c|\s*$)/i);
      if (merchantMatch) {
        const extracted = merchantMatch[1].trim().replace(/\*+/g, " ").trim();
        // If it looks like a bank name, don't use it as merchant name
        if (!/^(?:hdfc|icici|sbi|axis|kotak|union|pnb|bob|hsbc|citi|bank)\b/i.test(extracted)) {
          name = extracted;
        }
      }
    }
  }

  // Format merchant name
  name = name.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");

  // 4. Category
  const lowerName = name.toLowerCase();
  let category = type === "income" ? "Income" : "Other";

  if (/(zomato|swiggy|chaayos|starbucks|mcdonald|kfc|pizza|burger|eats|food|dining|restaurant|cafe)/.test(lowerName)) {
    category = "Food & Dining";
  } else if (/(amazon|flipkart|myntra|nykaa|meesho|shopping|retail|groceries|bigbasket|blinkit|zepto|d-mart|dmart)/.test(lowerName)) {
    category = "Shopping";
  } else if (/(uber|ola|rapido|namma|metro|fuel|hpcl|bpcl|petrol|transport|car|auto)/.test(lowerName)) {
    category = "Transportation";
  } else if (/(netflix|spotify|prime|hotstar|youtube|ott|bms|bookmyshow|pvr|cinema|movies|entertainment)/.test(lowerName)) {
    category = "Entertainment";
  } else if (/(makemytrip|goibibo|irctc|easemytrip|booking|hotel|flight|travel|trip|airbnb)/.test(lowerName)) {
    category = "Travel";
  } else if (/(pharmacy|hospital|apollo|1mg|pharmeasy|health|medical|doctor|insurance)/.test(lowerName)) {
    category = "Health";
  } else if (/(salary|dividend|interest|credit|refund|cashback)/.test(lowerName)) {
    category = "Income";
  }

  return { name, amount, category, type };
}

testCases.forEach((tc, idx) => {
  console.log(`\nTest Case ${idx + 1}: "${tc}"`);
  console.log(JSON.stringify(localParse(tc), null, 2));
});
