const testCases = [
  "Sent Rs.1.00 From HDFC Bank A/C *5866 To KARTHIK VIVEK On 12/06/26 Ref 616351384396 Not You? Call 18002586161/SMS BLOCK UPI to 7308080808",
  "Sent Rs.40.00 From HDFC Bank A/C *5866 To MR RAJA RAMAR On 13/06/26 Ref 124673665351 Not You? Call 18002586161/SMS BLOCK UPI to 7308080808",
  "Dear Customer, your A/c XX1293 has been debited by Rs. 850.00 on 2026-05-28 for UPI Ref 610928374829 paid to Swiggy. - HDFC Bank",
  "Union Bank SMS: Rs. 140.00 debited from A/c XX9021. Ref: UPI/6102983746/Zomato. Charges nil.",
  "SBI SMS: Your A/c XX3829 debited by Rs. 2,500.00. UPI Ref 6102837465 paid to MakeMyTrip.",
  "ICICI Bank: Alert! Rs. 120.00 spent on A/c XX902. Ref: UPI/6109283/Chaayos. Avl Bal: Rs. 24,150.00.",
  "Axis Bank: Rs. 500.00 debited from A/c XX482. Info: UPI/61028374/Amazon India. 28-05-26 14:15."
];

function localParse(raw) {
  const lowerRaw = raw.toLowerCase();

  // 1. Amount
  let amount = 0;
  const amountMatch = raw.match(/(?:₹|Rs\.?|INR)\s*([0-9,]+(?:\.[0-9]{2})?)/i);
  if (amountMatch) {
    amount = parseFloat(amountMatch[1].replace(/,/g, ""));
  }

  // 2. Type (Income vs. Expense)
  let type = "expense";
  const isIncome = lowerRaw.includes("credited") || 
                   lowerRaw.includes("received") || 
                   lowerRaw.includes("recieved") || 
                   lowerRaw.includes("credit") || 
                   lowerRaw.includes("refund") || 
                   lowerRaw.includes("cashback") || 
                   lowerRaw.includes("deposited") || 
                   lowerRaw.includes("deposit") || 
                   lowerRaw.includes("added to") || 
                   lowerRaw.includes("added");
                   
  const isExpense = lowerRaw.includes("sent") || 
                    lowerRaw.includes("send") || 
                    lowerRaw.includes("debited") || 
                    lowerRaw.includes("debit") || 
                    lowerRaw.includes("spent") || 
                    lowerRaw.includes("spend") || 
                    lowerRaw.includes("paid") || 
                    lowerRaw.includes("pay") || 
                    lowerRaw.includes("withdrawn") || 
                    lowerRaw.includes("withdraw") || 
                    lowerRaw.includes("transfer") || 
                    lowerRaw.includes("to ");

  if (isIncome && !isExpense) {
    type = "income";
  } else if (isExpense && !isIncome) {
    type = "expense";
  } else if (isIncome) {
    type = "income";
  }

  // 3. Name (Merchant / Payee)
  let name = "Other Merchant";
  const upiRefMatch = raw.match(/UPI\/\d+\/([^/.\s]+)/i);
  if (upiRefMatch) {
    name = upiRefMatch[1].trim();
  } else {
    // Upgraded pattern including "to"
    const merchantMatch = raw.match(/(?:paid to|sent to|transfer to|spent at|at|debited for|to)\s+([A-Za-z0-9\s*]+?)(?:\.|\s+Ref|\s+UPI|\s+on|\s+from|\s+Rs|\s+INR|\s+A\/c|\s*$)/i);
    if (merchantMatch) {
      name = merchantMatch[1].trim().replace(/\*+/g, " ").trim();
    }
  }

  // Format merchant name
  name = name.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");

  // 4. Category
  const lowerName = name.toLowerCase();
  let category = "Other";

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
