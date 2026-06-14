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

  let name = "Other Merchant";
  const upiRefMatch = raw.match(/UPI\/\d+\/([^/.\s]+)/i);
  if (upiRefMatch) {
    name = upiRefMatch[1].trim();
  } else {
    // Upgraded pattern including "to" prefix
    const merchantMatch = raw.match(/(?:paid to|sent to|transfer to|spent at|at|debited for|to)\s+([A-Za-z0-9\s*]+?)(?:\.|\s+Ref|\s+UPI|\s+on|\s+from|\s+Rs|\s+INR|\s+A\/c|\s*$)/i);
    if (merchantMatch) {
      name = merchantMatch[1].trim().replace(/\*+/g, " ").trim();
    }
  }

  // Capitalize merchant name
  name = name.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");

  const lowerRaw = raw.toLowerCase();
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

  // Determine Type (Income vs. Expense) safely based on keyword patterns
  let type: "income" | "expense" = "expense";
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
  }

  // Extract available balance if present in the raw SMS
  let availableBalance: number | undefined = undefined;
  const avlBalMatch = raw.match(/(?:avl\s*bal|available\s*balance|bal|balance)\s*:?\s*(?:rs\.?|₹|inr)?\s*([0-9,]+(?:\.[0-9]{2})?)/i);
  if (avlBalMatch) {
    availableBalance = parseFloat(avlBalMatch[1].replace(/,/g, ""));
  }

  return { name, amount, category, type, ...(availableBalance !== undefined ? { availableBalance } : {}) };
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
