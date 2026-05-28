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
          temperature: 0.3,
          max_tokens: 1024,
          stream: false,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        const text = json?.choices?.[0]?.message?.content ?? "";
        if (text) {
          console.log("[FINORA Budget-Q] Using Groq LLaMA 3.3 70B");
          return text;
        }
      }
    } catch (e) {
      console.log("[FINORA Budget-Q] Groq failed:", e);
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
              { role: "model", parts: [{ text: "Understood. Returning strict JSON." }] },
              { role: "user", parts: [{ text: userPrompt }] },
            ],
            generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
          }),
        });
        if (r.ok) {
          const json = await r.json();
          const text = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
          if (text) {
            console.log(`[FINORA Budget-Q] Using Gemini: ${model}`);
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
    const { aggregatedSpending } = await req.json();

    const systemPrompt = `You are FINORA, a strict, quant-driven Personal AI CFO.
The user uploaded their bank statements, and we aggregated their average historical spending into categories.
Your job is NOT to set limits yet. Your job is to interrogate the user.

Rules:
1. Look at their data and identify 5 areas where they are overspending or where savings can be improved.
2. Ask 5 highly targeted Multiple Choice Questions (MCQs) regarding their willingness to cut back on those specific categories.
3. Each question MUST have exactly 3 options (e.g., Aggressive cut, Moderate cut, No change).
4. Return ONLY a pure JSON object with a "questions" array. No markdown backticks or commentary.

Output Format:
{
  "questions": [
    {
      "id": "spend_dining",
      "text": "Your historical data shows high spending in Dining. Are you willing to cook at home 5 days a week to slash this?",
      "options": ["Yes, cut this by 50%", "I can commit to a 20% reduction", "No, keep my dining budget as is"]
    }
  ]
}`;

    const userPrompt = `Historical average monthly spending:\n${JSON.stringify(aggregatedSpending, null, 2)}\n\nGenerate my 5 interrogation questions in the exact JSON format requested.`;

    const raw = await callAI(systemPrompt, userPrompt);
    if (raw) {
      let cleaned = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
      cleaned = cleaned.replace(/```json|```/g, "").trim();
      const firstBrace = cleaned.indexOf("{");
      const lastBrace = cleaned.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1) {
        try {
          const parsed = JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
          return NextResponse.json(parsed);
        } catch (e) {
          console.error("[FINORA Budget-Q] JSON parse failed:", cleaned.slice(0, 200));
        }
      }
    }

    // Fallback questions
    return NextResponse.json({
      questions: [
        { id: "q1", text: "We spotted discretionary spending bloat. Do you want to heavily restrict non-essential shopping to force savings?", options: ["Yes, strict 50% cut", "Moderate 20% cut", "No change"] },
        { id: "q2", text: "Are you willing to cook more at home to curb dining out and food delivery expenses?", options: ["Yes, slash dining by 40%", "Slight reduction", "Keep as is"] },
        { id: "q3", text: "Active recurring subscriptions were found in your statements. Would you audit and cancel unused services?", options: ["Yes, cancel unused plans", "Reduce to cheaper tiers", "Keep current active plans"] },
        { id: "q4", text: "Transport and fuel represent dynamic outlays. Can you commit to carpooling or public transit?", options: ["Yes, optimize transport by 30%", "Slight effort to cut", "Cannot reduce transport spends"] },
        { id: "q5", text: "Are you comfortable routing these recovered funds aggressively into your target savings goals?", options: ["Yes, route 100% to savings targets", "Save 50%, use 50% as flexible buffer", "Keep as flexible buffer"] },
      ],
    });

  } catch (error: any) {
    console.error("[FINORA] Budget Question AI Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
