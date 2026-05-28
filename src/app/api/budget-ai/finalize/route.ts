import { NextResponse } from "next/server";

export const maxDuration = 30;

// ── Shared AI caller: Groq → Gemini ──────────────────────────────────────────
async function callAI(systemPrompt: string, userPrompt: string): Promise<string | null> {
  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  // 1. Groq (fastest free)
  if (groqKey && groqKey !== "PASTE_YOUR_GROQ_KEY_HERE") {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${groqKey}` },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.2,
          max_tokens: 512,
          stream: false,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        const text = json?.choices?.[0]?.message?.content ?? "";
        if (text) {
          console.log("[FINORA Budget-Finalize] Using Groq LLaMA 3.3 70B");
          return text;
        }
      }
    } catch (e) {
      console.log("[FINORA Budget-Finalize] Groq failed:", e);
    }
  }

  // 2. Gemini fallback
  if (geminiKey && geminiKey !== "PASTE_YOUR_KEY_HERE") {
    const models = ["gemini-2.5-flash-preview-05-20", "gemini-2.0-flash", "gemini-2.0-flash-lite"];
    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
        const r = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              { role: "user", parts: [{ text: systemPrompt }] },
              { role: "model", parts: [{ text: "Understood. Synthesizing data into strict JSON CFO limits." }] },
              { role: "user", parts: [{ text: userPrompt }] },
            ],
            generationConfig: { temperature: 0.2, maxOutputTokens: 512 },
          }),
        });
        if (r.ok) {
          const json = await r.json();
          const text = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
          if (text) {
            console.log(`[FINORA Budget-Finalize] Using Gemini: ${model}`);
            return text;
          }
        }
      } catch { continue; }
    }
  }

  return null;
}

export async function POST(req: Request) {
  try {
    const { aggregatedSpending, questionnaireData } = await req.json();

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

    const userPrompt = `Historical Average Monthly Spending:\n${JSON.stringify(aggregatedSpending, null, 2)}\n\nUser's Answers to Interrogation:\n${JSON.stringify(questionnaireData, null, 2)}\n\nProvide my final rigid budget constraints in the exact JSON format requested based strictly on my answers.`;

    const raw = await callAI(systemPrompt, userPrompt);
    if (raw) {
      const cleaned = raw.replace(/```json|```/g, "").replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
      const firstBrace = cleaned.indexOf("{");
      const lastBrace = cleaned.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1) {
        try {
          const parsed = JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
          return NextResponse.json(parsed);
        } catch (e) {
          console.error("[FINORA Budget-Finalize] JSON parse failed");
        }
      }
    }

    // Fallback budgets
    const fallbackBudgets: Record<string, number> = {
      "Groceries": 5000,
      "Dining & Out": 1500,
      "Transport": 3000,
      "Rent & Utilities": 12000,
      "Healthcare": 2000,
      "Savings": Math.max(15000, (aggregatedSpending["Income"] ?? 0) * 0.3),
    };

    return NextResponse.json(fallbackBudgets);

  } catch (error: any) {
    console.error("[FINORA] Budget Finalize AI Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
