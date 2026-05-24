import { NextResponse } from "next/server";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { aggregatedSpending } = await req.json();
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    // Strict system prompt as requested by the user
    const systemPrompt = `You are FINORA, a strict, quant-driven Personal AI CFO.
The user is providing their average historical spending across various categories based on parsing their bulk bank statements.
Your job is NOT to just return their average.
Your job is to identify bloat, cut excess, and set *realistic but restrictive* budget ceilings to prevent overspending.

You MUST follow these rules exactly:
1. Review the provided spending data.
2. For categories like 'Dining Out', 'Shopping', 'Lifestyle', 'Entertainment': Cut the bloat. Set a limit lower than their average to force them to save.
3. For categories like 'Rent', 'Utilities', 'Healthcare': Keep it close to their actual spend as these are fixed.
4. For 'Savings' or 'Investment': Boost it. Set a challenging but achievable target based on what you cut from lifestyle.
5. If a standard category is missing from their data, provide a sensible default limit.

Return ONLY a perfectly formatted JSON object mapping the 6 core categories to numeric limits. No markdown, no conversational text, no backticks outside the JSON.
Required keys: "Groceries", "Dining & Out", "Transport", "Rent & Utilities", "Healthcare", "Savings".

Example output:
{
  "Groceries": 4500,
  "Dining & Out": 1200,
  "Transport": 3000,
  "Rent & Utilities": 15000,
  "Healthcare": 2000,
  "Savings": 18000
}`;

    const promptMessage = `Here is my historical average monthly spending:
${JSON.stringify(aggregatedSpending, null, 2)}

Provide my strict budget limits in the requested JSON format.`;

    if (apiKey && apiKey !== "PASTE_YOUR_KEY_HERE") {
      const contents = [
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "model", parts: [{ text: "Understood. I will act as a strict CFO and return only the structured JSON requested." }] },
        { role: "user", parts: [{ text: promptMessage }] },
      ];

      const modelName = "gemini-2.0-flash";
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents }),
      });

      if (r.ok) {
        const json = await r.json();
        const text = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        
        // Strip markdown backticks if the model accidentally includes them
        const cleanJsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
        
        try {
          const parsed = JSON.parse(cleanJsonString);
          return NextResponse.json(parsed);
        } catch (e) {
          console.error("Failed to parse LLM JSON:", cleanJsonString);
        }
      }
    }

    // ── Fallback if API key fails or rate limited ──
    const fallbackBudgets: Record<string, number> = {
      "Groceries": 5000,
      "Dining & Out": 2000,
      "Transport": 3000,
      "Rent & Utilities": 12000,
      "Healthcare": 2000,
      "Savings": Math.max(10000, (aggregatedSpending["Income"] ?? 0) * 0.2)
    };

    return NextResponse.json(fallbackBudgets);

  } catch (error: any) {
    console.error("[FINORA] Budget AI Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
