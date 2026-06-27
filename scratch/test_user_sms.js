const CATEGORIES = [
  "Food & Dining", "Shopping", "Transportation", "Entertainment",
  "Health", "Travel", "Utilities", "Income", "Investment", "Other"
];

const CATEGORY_TIPS = {
  Food: { idealPerk: "dining" },
  Lifestyle: { idealPerk: "shopping" },
  Transport: { idealPerk: "fuel" },
  Housing: { idealPerk: "cashback" },
  Entertainment: { idealPerk: "cashback" },
  Health: { idealPerk: "cashback" },
  Education: { idealPerk: "cashback" },
  Fitness: { idealPerk: "cashback" },
  Travel: { idealPerk: "travel" },
};
const DEFAULT_TIP = { idealPerk: "cashback" };

function mockParseTransaction(raw) {
  let amount = 100;
  const amountMatch = raw.match(/(?:₹|Rs\.?|INR)\s*([0-9,]+(?:\.[0-9]{2})?)/i);
  if (amountMatch) {
    amount = parseFloat(amountMatch[1].replace(/,/g, ""));
  } else {
    const genericAmountMatch = raw.match(/(?:debited|credited|spent|withdrawn|paid|sent|received|amount)\s+(?:of\s+)?([0-9,]+(?:\.[0-9]{2})?)/i);
    if (genericAmountMatch) {
      amount = parseFloat(genericAmountMatch[1].replace(/,/g, ""));
    }
  }

  const lowerRaw = raw.toLowerCase();

  const isIncome = /\b(?:credited|credit|received|recieved|deposited|deposit|refund|cashback|added|incoming)\b/i.test(lowerRaw) || /transfer\s+from/i.test(lowerRaw);
  const isExpense = /\b(?:debited|debit|withdrawn|withdraw|spent|spend|sent|send|paid|outgoing)\b/i.test(lowerRaw) || /transfer\s+to/i.test(lowerRaw);

  let type = "expense";
  if (isIncome && !isExpense) {
    type = "income";
  } else if (isExpense && !isIncome) {
    type = "expense";
  } else if (isIncome && isExpense) {
    const hasStrongDebit = /\b(?:debited|debit|withdrawn|withdraw|spent|spend|sent|send|paid)\b/i.test(lowerRaw);
    if (hasStrongDebit) {
      type = "expense";
    } else {
      type = "income";
    }
  }

  let name = "Other Merchant";
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
      const merchantMatch = raw.match(/(?:paid to|sent to|transfer to|spent at|at|debited for|to)\s+([A-Za-z0-9\s*]+?)(?:\.|\s+Ref|\s+UPI|\s+on|\s+from|\s+Rs|\s+INR|\s+A\/c|\s*$)/i);
      if (merchantMatch) {
        const extracted = merchantMatch[1].trim().replace(/\*+/g, " ").trim();
        if (!/^(?:hdfc|icici|sbi|axis|kotak|union|pnb|bob|hsbc|citi|bank)\b/i.test(extracted)) {
          name = extracted;
          matched = true;
        }
      }
    }
  }

  name = name.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");

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

  let availableBalance = undefined;
  const avlBalMatch = raw.match(/(?:avl\s*bal|available\s*balance|bal|balance)\s*:?\s*(?:rs\.?|₹|inr)?\s*([0-9,]+(?:\.[0-9]{2})?)/i);
  if (avlBalMatch) {
    availableBalance = parseFloat(avlBalMatch[1].replace(/,/g, ""));
  }

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

  return {
    name,
    amount,
    category,
    type,
    availableBalance,
    cardDigits,
    bank
  };
}

const testSMS = `Sent Rs.60.00
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

console.log("Parsed result:", mockParseTransaction(testSMS));
