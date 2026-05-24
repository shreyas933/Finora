import { NextRequest, NextResponse } from "next/server";

const CATEGORIES = [
  "Food & Dining", "Shopping", "Transportation", "Entertainment",
  "Health", "Travel", "Utilities", "Income", "Investment", "Other"
];

export async function POST(req: NextRequest) {
  try {
    const { raw } = await req.json();
    if (!raw || typeof raw !== "string") {
      return NextResponse.json({ error: "Missing raw notification string" }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      throw new Error("Missing Gemini API key");
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

    const modelsToTry = [
      "gemini-2.0-flash-lite",
      "gemini-2.0-flash",
      "gemini-1.5-flash",
    ];

    let resultText = "";
    
    for (const modelName of modelsToTry) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1 }
        }),
      });

      if (r.ok) {
        const json = await r.json();
        resultText = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        if (resultText) break;
      }
    }

    if (!resultText) {
      throw new Error("All Gemini models failed to parse the transaction.");
    }

    // Strip any accidental markdown fences
    const clean = resultText.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    // Validate required fields
    if (!parsed.name || !parsed.amount || !parsed.category || !parsed.type) {
      throw new Error("Missing required fields in AI response");
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

