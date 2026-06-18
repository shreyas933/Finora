import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 30;

const CATEGORIES = [
  "Food & Dining", "Shopping", "Transportation", "Entertainment",
  "Health", "Travel", "Utilities", "Income", "Investment", "Other"
];

// ── Shared helper: call AI with Groq → Gemini fallback chain ─────────────────
async function callAI(prompt: string): Promise<string | null> {
  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  // 1. Try Groq first (fastest free model)
  if (groqKey && groqKey !== "PASTE_YOUR_GROQ_KEY_HERE") {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${groqKey}`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.1,
          max_tokens: 512,
          stream: false,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        const text = json?.choices?.[0]?.message?.content ?? "";
        if (text) {
          console.log("[FINORA sync/categorize] Using Groq LLaMA 3.3 70B");
          return text;
        }
      }
    } catch (e) {
      console.log("[FINORA sync/categorize] Groq failed:", e);
    }
  }

  // 2. Gemini fallback
  if (geminiKey && geminiKey !== "PASTE_YOUR_KEY_HERE") {
    const models = ["gemini-2.0-flash-lite", "gemini-2.0-flash", "gemini-1.5-flash"];
    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
        const r = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 512 },
          }),
        });
        if (r.ok) {
          const json = await r.json();
          const text = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
          if (text) {
            console.log(`[FINORA sync/categorize] Using Gemini: ${model}`);
            return text;
          }
        }
      } catch { continue; }
    }
  }

  return null;
}

function mockParseTransaction(raw: string) {
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

  // Determine Type (Income vs. Expense) safely based on regex word boundary checks
  const isIncome = /\b(?:credited|credit|received|recieved|deposited|deposit|refund|cashback|added|incoming)\b/i.test(lowerRaw) || /transfer\s+from/i.test(lowerRaw);
  const isExpense = /\b(?:debited|debit|withdrawn|withdraw|spent|spend|sent|send|paid|outgoing)\b/i.test(lowerRaw) || /transfer\s+to/i.test(lowerRaw);

  let type: "income" | "expense" = "expense";
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

  let name = "Other Merchant";
  let matched = false;

  // For income transactions, look for sender name after "from" or "by" or "received from"
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
          matched = true;
        }
      }
    }
  }

  // Capitalize merchant name
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

  // Extract available balance if present in the raw SMS
  let availableBalance: number | undefined = undefined;
  const avlBalMatch = raw.match(/(?:avl\s*bal|available\s*balance|bal|balance)\s*:?\s*(?:rs\.?|₹|inr)?\s*([0-9,]+(?:\.[0-9]{2})?)/i);
  if (avlBalMatch) {
    availableBalance = parseFloat(avlBalMatch[1].replace(/,/g, ""));
  }

  // Extract card digits (last 4 digits)
  let cardDigits: string | undefined = undefined;
  const cardMatch = raw.match(/\b(?:card|a\/c|ending\s*(?:in)?|xx|x+)\s*\*?([0-9]{4})\b/i);
  if (cardMatch) {
    cardDigits = cardMatch[1];
  }

  // Extract bank / issuer
  let bank: string | undefined = undefined;
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
    ...(availableBalance !== undefined ? { availableBalance } : {}),
    ...(cardDigits !== undefined ? { cardDigits } : {}),
    ...(bank !== undefined ? { bank } : {})
  };
}

export async function POST(req: NextRequest) {
  try {
    const { raw } = await req.json();
    if (!raw || typeof raw !== "string") {
      return NextResponse.json({ error: "Missing raw notification string" }, { status: 400 });
    }

    // Fast-path local parsing check to optimize response speed and bypass API rate limits
    const localParsed = mockParseTransaction(raw);
    if (localParsed && localParsed.amount > 0 && localParsed.name !== "Other Merchant" && localParsed.name.length > 1) {
      console.log("[FINORA sync/categorize] Local parser fast-path hit. Bypassing AI models.");
      return NextResponse.json({ success: true, transaction: localParsed });
    }

    const prompt = `You are a financial transaction parser. Parse this bank/payment notification received by a user on their phone, and return ONLY valid JSON with no markdown, no explanation.

Keys to return:
- name: merchant or payee name (clean, human-readable, e.g. "Zomato" not "ZOMATO*POS4291")
- amount: the transaction amount as a number (no currency symbol)
- category: one of exactly: ${CATEGORIES.join(", ")}
- type: "income" or "expense"

Guidelines to determine type:
- If the message says "Sent Rs... to Y" or "Paid Rs... to Y" or "Debited" or "Spent" or "Withdrawn" or "Transfer to Y", the user sent money, so type must be "expense".
- If the message says "Received" or "Credited" or "Refund" or "Cashback" or "Added to" or "Deposited", the user received money, so type must be "income".

Raw notification/SMS string:
"${raw}"

Return ONLY the JSON object. Example: {"name":"Zomato","amount":450,"category":"Food & Dining","type":"expense"}`;

    const resultText = await callAI(prompt);

    let parsed;
    if (!resultText) {
      console.log("[FINORA sync/categorize] AI models failed or keys missing. Using rule-based fallback parser.");
      parsed = localParsed;
    } else {
      // Strip any accidental markdown fences
      const clean = resultText.replace(/```json|```/g, "").trim();

      // Find the first { and last } to safely extract JSON if the model added leading/trailing text
      const firstBrace = clean.indexOf("{");
      const lastBrace = clean.lastIndexOf("}");
      if (firstBrace === -1 || lastBrace === -1) {
        throw new Error("No JSON object found in response");
      }
      const jsonStr = clean.slice(firstBrace, lastBrace + 1);
      parsed = JSON.parse(jsonStr);

      // Validate required fields
      if (!parsed.name || !parsed.amount || !parsed.category || !parsed.type) {
        throw new Error("Missing required fields in AI response");
      }

      // Enforce strict local type overrides on AI responses to guarantee correctness
      if (localParsed) {
        parsed.type = localParsed.type;
        if (localParsed.availableBalance !== undefined) {
          parsed.availableBalance = localParsed.availableBalance;
        }
        if (localParsed.cardDigits !== undefined) {
          parsed.cardDigits = localParsed.cardDigits;
        }
        if (localParsed.bank !== undefined) {
          parsed.bank = localParsed.bank;
        }
      }
    }

    return NextResponse.json({ success: true, transaction: parsed });
  } catch (error: any) {
    console.error("[categorize] error:", error);
    return NextResponse.json(
      { error: "Failed to parse notification", detail: error?.message },
      { status: 500 }
    );
  }
}
