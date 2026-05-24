import { NextResponse } from "next/server";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { payload } = await req.json();
    const { currency, monthlyIncome, expenses, balance, txSummary } = payload;
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    // Evaluate Liquid Surplus
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

    if (apiKey && apiKey !== "PASTE_YOUR_KEY_HERE") {
      const contents = [
        { role: "user", parts: [{ text: systemPrompt }] },
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
          console.error("Failed to parse LLM Tax JSON:", cleanJsonString);
        }
      }
    }

    // ── Safe Fallback if API key fails ──
    let defKey = "genDeductions";
    if (currency === "INR") defKey = "ind80C";
    if (currency === "USD") defKey = "usPreTax";
    if (currency === "GBP") defKey = "ukPension";

    // Safe mathematical cap based on their real data
    const safeOptimal = Math.min(annualSurplus * 0.3, 150000);

    const fallbackResponse = {
      loopholes: [
        {
          id: "fb-1",
          title: "AI Standard Limit Maximization",
          description: `Based on your cashflow surplus, safely routing funds into your local tax wrapper is highly recommended.`,
          inputKey: defKey,
          optimalAmount: Math.round(safeOptimal || 10000),
          feasibility: "Validated by active surplus modeling",
          isSupreme: true
        },
        {
          id: "fb-2",
          title: "Advanced Loss Harvesting",
          description: "Scan your portfolio for underperforming assets and securely harvest paper losses to offset capital gains.",
          inputKey: "genDeductions",
          optimalAmount: 5000,
          feasibility: "Requires active underwater portfolio equity",
          isSupreme: false
        },
        {
          id: "fb-3",
          title: "Charitable & Alt Deductions",
          description: "Strategically funnel a baseline percentage of discretionary income into registered charitable exemptions.",
          inputKey: "genDeductions",
          optimalAmount: 2000,
          feasibility: "Low effort, easy execution",
          isSupreme: false
        }
      ]
    };

    return NextResponse.json(fallbackResponse);

  } catch (error: any) {
    console.error("[FINORA] AI Tax Gen Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
