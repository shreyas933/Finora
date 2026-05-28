import { NextResponse } from "next/server";

export const maxDuration = 30;

// ── Shared AI caller: Groq → Gemini ──────────────────────────────────────────
async function callAI(systemPrompt: string): Promise<string | null> {
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
          messages: [{ role: "user", content: systemPrompt }],
          temperature: 0.4,
          max_tokens: 1024,
          stream: false,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        const text = json?.choices?.[0]?.message?.content ?? "";
        if (text) {
          console.log("[FINORA Tax-AI] Using Groq LLaMA 3.3 70B");
          return text;
        }
      }
    } catch (e) {
      console.log("[FINORA Tax-AI] Groq failed:", e);
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
            contents: [{ role: "user", parts: [{ text: systemPrompt }] }],
            generationConfig: { temperature: 0.4, maxOutputTokens: 1024 },
          }),
        });
        if (r.ok) {
          const json = await r.json();
          const text = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
          if (text) {
            console.log(`[FINORA Tax-AI] Using Gemini: ${model}`);
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
    const { payload } = await req.json();
    const { currency, monthlyIncome, expenses, balance, txSummary } = payload;

    const monthlySurplus = Math.max(0, monthlyIncome - expenses);
    const annualSurplus = monthlySurplus * 12;
    const availableLiquid = Math.max(0, balance);

    const systemPrompt = `You are FINORA, an elite AI CFO and Tax Attorney.
The user wants custom tax loopholes generated securely based exclusively on their actual financial footprint and their currency/jurisdiction limits.

Context provided:
Currency: ${currency}
Monthly Income: ${monthlyIncome}
Monthly Surplus: ${monthlySurplus} (Total liquid cashflow available to safely lock away into tax traps)
Current Bank Balance: ${availableLiquid}
Historical Expense Insights: ${JSON.stringify(txSummary)}

YOUR JOB:
1. Examine what they spend on (e.g. rent, medical, general expenses).
2. Look at their active currency to identify country-specific legal tax loopholes (INR=80C, HRA; USD=401k, HSA; GBP=ISA, Salary Sacrifice; AED=Offshore, VAT refs; Gen=Loss Harvesting).
3. Ensure the 'optimalAmount' you recommend is strictly mathematically affordable based on their 'Monthly Surplus' and 'Bank Balance'. DO NOT recommend locking away 150k if they only have 20k surplus.
4. Generate 3 to 4 completely different valid strategies. 
5. Select the absolute #1 most mathematically lucrative loophole and flag it as 'isSupreme': true. The rest must be false.

You MUST map the 'inputKey' to one of the following exact React State hooks so the frontend can auto-apply the math: 
- "ind80C" (For 80C investments, NPS, PPF, ELSS)
- "indHRA" (For Rent deductions based on Housing expenses found)
- "usPreTax" (For 401k, HSA, IRA)
- "ukPension" (For UK Salary Sacrifice, ISA wrappers)
- "genDeductions" (For everything else: Losses, Charity, Business deductions)

Return ONLY valid JSON matching this schema exactly:
{
  "loopholes": [
    {
      "id": "unique-name",
      "title": "Strategy Name",
      "description": "Why you chose this based on their data...",
      "inputKey": "ind80C",
      "optimalAmount": 50000,
      "feasibility": "High - Easily covered by current surplus",
      "isSupreme": true
    }
  ]
}`;

    const raw = await callAI(systemPrompt);
    if (raw) {
      const cleaned = raw.replace(/```json|```/g, "").replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
      const firstBrace = cleaned.indexOf("{");
      const lastBrace = cleaned.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1) {
        try {
          const parsed = JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
          return NextResponse.json(parsed);
        } catch (e) {
          console.error("[FINORA Tax-AI] JSON parse failed");
        }
      }
    }

    // Safe fallback
    let defKey = "genDeductions";
    if (currency === "INR") defKey = "ind80C";
    if (currency === "USD") defKey = "usPreTax";
    if (currency === "GBP") defKey = "ukPension";

    const safeOptimal = Math.min(annualSurplus * 0.3, 150000);

    return NextResponse.json({
      loopholes: [
        {
          id: "fb-1",
          title: "AI Standard Limit Maximization",
          description: `Based on your cashflow surplus of ₹${monthlySurplus.toLocaleString("en-IN")}/month, safely routing funds into your local tax wrapper is highly recommended.`,
          inputKey: defKey,
          optimalAmount: Math.round(safeOptimal || 10000),
          feasibility: "Validated by active surplus modeling",
          isSupreme: true,
        },
        {
          id: "fb-2",
          title: "Advanced Loss Harvesting",
          description: "Scan your portfolio for underperforming assets and securely harvest paper losses to offset capital gains.",
          inputKey: "genDeductions",
          optimalAmount: 5000,
          feasibility: "Requires active underwater portfolio equity",
          isSupreme: false,
        },
        {
          id: "fb-3",
          title: "Charitable & Alt Deductions",
          description: "Strategically funnel a baseline percentage of discretionary income into registered charitable exemptions.",
          inputKey: "genDeductions",
          optimalAmount: 2000,
          feasibility: "Low effort, easy execution",
          isSupreme: false,
        },
      ],
    });

  } catch (error: any) {
    console.error("[FINORA] AI Tax Gen Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
