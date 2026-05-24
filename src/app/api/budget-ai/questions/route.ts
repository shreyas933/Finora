import { NextResponse } from "next/server";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { aggregatedSpending } = await req.json();
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    const systemPrompt = `You are FINORA, a strict, quant-driven Personal AI CFO.
The user uploaded their bank statements, and we aggregated their average historical spending into categories.
Your job is NOT to set limits yet. Your job is to interrogate the user.

Rules:
1. Look at their data and identify 5 areas where they are overspending or where savings can be improved.
2. Ask 5 highly targeted Multiple Choice Questions (MCQs) regarding their willingness to cut back on those specific categories.
3. Each question MUST have exactly 3 options (e.g., Aggressive cut, Moderate cut, No change).
4. Return ONLY a pure JSON object mapping a "questions" array. No markdown backticks or commentary.

Output Format:
{
  "questions": [
    {
      "id": "spend_dining",
      "text": "Your historical data shows a high $450/month in Dining. Are you willing to strictly adhere to cooking at home 5 days a week to slash this?",
      "options": ["Yes, cut this by 50%", "I can commit to a 20% reduction", "No, keep my dining budget as is"]
    }
  ]
}`;

    const promptMessage = `Historical average monthly spending:
${JSON.stringify(aggregatedSpending, null, 2)}

Generate my 5 interrogation questions in the exact JSON format requested.`;

    if (apiKey && apiKey !== "PASTE_YOUR_KEY_HERE") {
      const contents = [
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "model", parts: [{ text: "Understood. Returning strict JSON." }] },
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
          console.error("Failed to parse LLM Question JSON:", cleanJsonString);
        }
      }
    }

    // ── Fallback ──
    const fallbackQs = {
      questions: [
        {
          id: "fallback_shopping",
          text: "We noticed consistent discretionary spending. How aggressively do you want to restrict non-essential shopping?",
          options: ["Strict restriction (Cut 50%)", "Moderate restriction (Cut 20%)", "Leave it as is"]
        },
        {
          id: "fallback_dining",
          text: "Dining out forms a noticeable portion of your expenses. Are you willing to cook more to save?",
          options: ["Yes, slash dining by 40%", "Slight reduction", "No change"]
        },
        {
          id: "fallback_subscriptions",
          text: "We spotted recurring active subscriptions in your accounts. Are you willing to audit and cancel unused services?",
          options: ["Yes, audit & cancel plans", "Reduce to cheaper tiers", "Keep current plans intact"]
        },
        {
          id: "fallback_transport",
          text: "Transport and fuel represent dynamic outlays. Can you commit to carpooling or public transit?",
          options: ["Yes, optimize transport by 30%", "Slight effort to cut", "Cannot reduce transport spends"]
        },
        {
          id: "fallback_savings",
          text: "Are you comfortable routing these recovered funds aggressively into standard savings?",
          options: ["Yes, route 100% to savings targets", "Save 50%, use 50% as flexible buffer", "I prefer a relaxed savings goal"]
        }
      ]
    };

    return NextResponse.json(fallbackQs);

  } catch (error: any) {
    console.error("[FINORA] Budget Question AI Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
