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
    const merchantMatch = raw.match(/(?:paid to|sent to|transfer to|spent at|at|debited for)\s+([A-Za-z0-9\s*]+?)(?:\.|\s+Ref|\s+UPI|\s+on|\s+from|\s+Rs|\s+INR|\s+A\/c|\s*$)/i);
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

  let type = "expense";
  if (lowerRaw.includes("credited") || lowerRaw.includes("refund") || lowerRaw.includes("cashback") || lowerRaw.includes("received") || lowerRaw.includes("added to") || lowerRaw.includes("deposited")) {
    type = "income";
  }

  return { name, amount, category, type };
}

export async function POST(req: NextRequest) {
  try {
    const { raw } = await req.json();
    if (!raw || typeof raw !== "string") {
      return NextResponse.json({ error: "Missing raw notification string" }, { status: 400 });
    }

    const prompt = `You are a financial transaction parser. Parse this bank/payment notification and return ONLY valid JSON with no markdown, no explanation.

Keys to return:
- name: merchant or payee name (clean, human-readable, e.g. "Zomato" not "ZOMATO*POS4291")
- amount: the transaction amount as a number (no currency symbol)
- category: one of exactly: ${CATEGORIES.join(", ")}
- type: "income" or "expense"

If the string looks like earnings, salary, cashback, or a refund, use type "income".
If it looks like a payment, debit, or purchase, use type "expense".

Raw notification/SMS string:
"${raw}"

Return ONLY the JSON object. Example: {"name":"Zomato","amount":450,"category":"Food & Dining","type":"expense"}`;

    const resultText = await callAI(prompt);

    let parsed;
    if (!resultText) {
      console.log("[FINORA sync/categorize] AI models failed or keys missing. Using rule-based fallback parser.");
      parsed = mockParseTransaction(raw);
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
