import { NextResponse } from "next/server";

export const maxDuration = 30;

// ── Shared helper: call AI with Groq → Gemini fallback chain ─────────────────
async function callAI(systemPrompt: string, userPrompt: string): Promise<string | null> {
  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  // 1. Try Groq first (fastest free model)
  if (groqKey && groqKey !== "PASTE_YOUR_GROQ_KEY_HERE") {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${groqKey}` },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.3,
          max_tokens: 512,
          stream: false,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        const text = json?.choices?.[0]?.message?.content ?? "";
        if (text) {
          console.log("[FINORA Insights] Using Groq LLaMA 3.3 70B");
          return text;
        }
      }
    } catch (e) {
      console.log("[FINORA Insights] Groq failed:", e);
    }
  }

  // 2. Gemini fallback
  if (geminiKey && geminiKey !== "PASTE_YOUR_KEY_HERE") {
    const models = ["gemini-2.5-flash-preview-05-20", "gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-1.5-flash"];
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
            generationConfig: { temperature: 0.3, maxOutputTokens: 512 },
          }),
        });
        if (r.ok) {
          const json = await r.json();
          const text = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
          if (text) {
            console.log(`[FINORA Insights] Using Gemini: ${model}`);
            return text;
          }
        }
      } catch { continue; }
    }
  }

  return null;
}

export type InsightType = "warning" | "tip" | "alert";
export interface Insight {
  id: string;
  type: InsightType;
  message: string;
  linkLabel?: string;
  linkHref?: string;
}

function generateMockInsights(financialContext: string): Insight[] {
  const expensesMatch = financialContext.match(/Expenses[:\s₹]+([0-9,]+)/i);
  const incomeMatch = financialContext.match(/Income[:\s₹]+([0-9,]+)/i);
  const savingsMatch = financialContext.match(/Savings Rate[:\s]+([0-9.]+)/i);
  const goalsMatch = financialContext.match(/Goals:\s*(.+)/i);

  const expenses = expensesMatch ? parseInt(expensesMatch[1].replace(/,/g, "")) : 38700;
  const income = incomeMatch ? parseInt(incomeMatch[1].replace(/,/g, "")) : 150000;
  const savingsRate = savingsMatch ? parseFloat(savingsMatch[1]) : 74.2;
  const hasGoals = goalsMatch && goalsMatch[1].trim().length > 0;
  const spending_pct = income > 0 ? Math.round((expenses / income) * 100) : 26;

  return [
    {
      id: "1",
      type: "warning",
      message: `Your spending this month is ${spending_pct}% of your income — ${spending_pct > 50 ? "you're spending more than half your income. Consider cutting discretionary expenses." : "you're within a healthy range. Keep it up!"}`,
    },
    {
      id: "2",
      type: "tip",
      message: hasGoals
        ? `You are on track to reach your ${goalsMatch![1].split(",")[0].trim()} goal. Keep your current savings rate of ${savingsRate.toFixed(1)}% to stay on schedule.`
        : "Set a savings goal to track your progress and stay motivated. Even ₹5,000/month adds up to ₹60,000 in a year!",
      linkLabel: hasGoals ? "View Goal" : "Set a Goal",
      linkHref: "/goals",
    },
    {
      id: "3",
      type: "alert",
      message: `Your dining & lifestyle expenses represent a significant portion of your budget. Reducing by just 20% could save ₹${Math.round(expenses * 0.08).toLocaleString("en-IN")} monthly.`,
      linkLabel: "See Details",
      linkHref: "/budget",
    },
  ];
}

function generateMockBudgetInsights(financialContext: string): Insight[] {
  return [
    {
      id: "1",
      type: "warning",
      message: "You have exceeded your Entertainment budget by 24%. Consider scaling back movie/event splurges this week.",
      linkLabel: "Set Budgets",
      linkHref: "/transactions",
    },
    {
      id: "2",
      type: "tip",
      message: "Excellent discipline on Food & Dining! You have used only 42% of your monthly budget so far.",
      linkLabel: "View Details",
      linkHref: "/transactions",
    },
    {
      id: "3",
      type: "alert",
      message: "Transportation costs are at 85% of your limit. Suggest walking or public transit to avoid overspending.",
      linkLabel: "See Details",
      linkHref: "/transactions",
    },
  ];
}

export async function POST(req: Request) {
  try {
    const { financialContext, mode } = await req.json();

    const isBudgetMode = mode === "budget";

    const systemPrompt = isBudgetMode
      ? `You are FINORA, an AI Personal CFO. Based on this user's budget data, generate exactly 3 concise, personalized budget insight messages.
You must analyze which categories are overspent or close to limits, highlight positive budget discipline (where spent is well below limit), and offer actionable budget advice.

Return ONLY a valid JSON array with exactly 3 objects. Each object must have:
- "id": string ("1", "2", "3")
- "type": one of "warning" | "tip" | "alert"
- "message": string (max 120 chars, no markdown, plain text, mention specific currency figures/percents)
- "linkLabel": optional string (e.g. "View Budget", "See Details")
- "linkHref": optional string (e.g. "/budget", "/transactions")

Use "warning" for categories over budget (e.g. overspent, red alert), "tip" for categories under control (good job, keep it up), "alert" for caution/warning of categories nearing limit.
Return ONLY the JSON array, no markdown, no explanation.`
      : `You are FINORA, an AI Personal CFO. Based on this user's financial data, generate exactly 3 concise, personalized insight messages.

Return ONLY a valid JSON array with exactly 3 objects. Each object must have:
- "id": string ("1", "2", "3")
- "type": one of "warning" | "tip" | "alert"
- "message": string (max 120 chars, no markdown, plain text, mention specific ₹ figures)
- "linkLabel": optional string (e.g. "View Goal", "See Details")
- "linkHref": optional string (e.g. "/goals", "/budget", "/transactions")

Use "warning" for spending alerts, "tip" for positive/goal insights, "alert" for actionable cautions.
Return ONLY the JSON array, no markdown, no explanation.`;

    const userPrompt = isBudgetMode
      ? `Budget spent and limit context:\n${financialContext}\n\nGenerate 3 personalized budget insights as a JSON array.`
      : `Financial context:\n${financialContext}\n\nGenerate 3 personalized insights as a JSON array.`;

    const raw = await callAI(systemPrompt, userPrompt);
    if (raw) {
      const cleaned = raw.replace(/```json|```/g, "").trim();
      const firstBracket = cleaned.indexOf("[");
      const lastBracket = cleaned.lastIndexOf("]");
      if (firstBracket !== -1 && lastBracket !== -1) {
        try {
          const insights: Insight[] = JSON.parse(cleaned.slice(firstBracket, lastBracket + 1));
          return Response.json({ insights });
        } catch {
          console.error("[FINORA Insights] JSON parse failed");
        }
      }
    }

    // Mock fallback
    const fallbackInsights = isBudgetMode
      ? generateMockBudgetInsights(financialContext ?? "")
      : generateMockInsights(financialContext ?? "");

    return Response.json({ insights: fallbackInsights });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[FINORA Insights] Error:", msg);
    return Response.json({ insights: [] }, { status: 500 });
  }
}
