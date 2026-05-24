import { NextResponse } from "next/server";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { aggregatedSpending, questionnaireData } = await req.json();
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    // Strict system prompt for Stage 2
    const systemPrompt = `You are FINORA, a strict, quant-driven Personal AI CFO.
The user is providing two things:
1. Their historical average monthly spending across categories (based on their CSVs).
2. Their answers to your targeted budget interrogation questions.

Your job is to set *realistic but restrictive* budget ceilings combining their historical behavior with their willingness to cut back (based on their answers).

You MUST follow these rules exactly:
1. Apply the percentage cuts or targets they agreed to in the questionnaire.
2. For categories not mentioned in the questions (like 'Rent', 'Utilities', 'Healthcare'), keep it close to their historical active spend.
3. Boost 'Savings' based on the funds freed up by the cuts they agreed to.
4. If a standard category is missing from their data, provide a sensible default limit.

Return ONLY a perfectly formatted JSON object mapping the 6 core categories to numeric limits. No markdown, no commentary.
Required keys: "Groceries", "Dining & Out", "Transport", "Rent & Utilities", "Healthcare", "Savings".

Example output:
{
  "Groceries": 4500,
  "Dining & Out": 600,
  "Transport": 3000,
  "Rent & Utilities": 15000,
  "Healthcare": 2000,
  "Savings": 23000
}`;

    const promptMessage = `Historical Average Monthly Spending:
${JSON.stringify(aggregatedSpending, null, 2)}

User's Answers to Interrogation:
${JSON.stringify(questionnaireData, null, 2)}

Provide my final rigid budget constraints in the exact JSON format requested based strictly on my answers.`;

    if (apiKey && apiKey !== "PASTE_YOUR_KEY_HERE") {
      const contents = [
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "model", parts: [{ text: "Understood. Synthesizing historical data with Q&A responses into strict JSON CFO limits." }] },
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
        
        const cleanJsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
        
        try {
          const parsed = JSON.parse(cleanJsonString);
          return NextResponse.json(parsed);
        } catch (e) {
          console.error("Failed to parse LLM Final JSON:", cleanJsonString);
        }
      }
    }

    // ── Fallback ──
    const fallbackBudgets: Record<string, number> = {
      "Groceries": 5000,
      "Dining & Out": 1500,
      "Transport": 3000,
      "Rent & Utilities": 12000,
      "Healthcare": 2000,
      "Savings": Math.max(15000, (aggregatedSpending["Income"] ?? 0) * 0.3)
    };

    return NextResponse.json(fallbackBudgets);

  } catch (error: any) {
    console.error("[FINORA] Budget Finalize AI Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
