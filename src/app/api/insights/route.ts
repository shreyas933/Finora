export const maxDuration = 30;

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

  const insights: Insight[] = [
    {
      id: "1",
      type: "warning",
      message: `Your spending this month is ${spending_pct}% of your income — ${
        spending_pct > 50
          ? "you're spending more than half your income. Consider cutting discretionary expenses."
          : "you're within a healthy range. Keep it up!"
      }`,
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

  return insights;
}

export async function POST(req: Request) {
  try {
    const { financialContext } = await req.json();
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (apiKey && apiKey !== "PASTE_YOUR_KEY_HERE") {
      const prompt = `You are FINORA, an AI Personal CFO. Based on this user's financial data, generate exactly 3 concise, personalized insight messages.

Financial context:
${financialContext}

Return ONLY a valid JSON array with exactly 3 objects. Each object must have:
- "id": string ("1", "2", "3")
- "type": one of "warning" | "tip" | "alert"
- "message": string (max 120 chars, no markdown, plain text, mention specific ₹ figures)
- "linkLabel": optional string (e.g. "View Goal", "See Details")
- "linkHref": optional string (e.g. "/goals", "/budget", "/transactions")

Use "warning" for spending alerts, "tip" for positive/goal insights, "alert" for actionable cautions.
Return ONLY the JSON array, no markdown, no explanation.`;

      const modelsToTry = [
        "gemini-2.0-flash-lite",
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-1.5-flash-latest",
      ];

      for (const modelName of modelsToTry) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
        const r = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.4, maxOutputTokens: 512 },
          }),
        });

        if (!r.ok) {
          console.error(`[FINORA Insights] ${modelName} failed (${r.status})`);
          continue;
        }

        const json = await r.json();
        const raw = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        const cleaned = raw.replace(/```json|```/g, "").trim();

        try {
          const insights: Insight[] = JSON.parse(cleaned);
          return Response.json({ insights });
        } catch {
          console.error("[FINORA Insights] JSON parse failed:", cleaned.slice(0, 200));
          continue;
        }
      }
    }

    // Fallback to smart mock
    const insights = generateMockInsights(financialContext ?? "");
    return Response.json({ insights });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[FINORA Insights] Error:", msg);
    return Response.json({ insights: [] }, { status: 500 });
  }
}
