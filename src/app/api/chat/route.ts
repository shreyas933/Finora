
export const maxDuration = 30;

// Smart mock responses for when real AI is unavailable
function generateMockResponse(userMessage: string, financialContext: string): string {
  const msg = userMessage.toLowerCase();

  // Parse financial context
  const balanceMatch = financialContext.match(/Balance[:\s₹]+([0-9,]+)/i);
  const incomeMatch = financialContext.match(/Income[:\s₹]+([0-9,]+)/i);
  const expensesMatch = financialContext.match(/Expenses[:\s₹]+([0-9,]+)/i);
  const savingsMatch = financialContext.match(/Savings Rate[:\s]+([0-9.]+)/i);

  const balance = balanceMatch ? parseInt(balanceMatch[1].replace(/,/g, "")) : 111300;
  const income = incomeMatch ? parseInt(incomeMatch[1].replace(/,/g, "")) : 150000;
  const expenses = expensesMatch ? parseInt(expensesMatch[1].replace(/,/g, "")) : 38700;
  const savingsRate = savingsMatch ? parseFloat(savingsMatch[1]) : 74.2;

  if (msg.includes("trip") || msg.includes("travel") || msg.includes("vacation")) {
    const canAfford = balance > 50000;
    return `**Travel Affordability Check**\n\n${canAfford
      ? `✅ Based on your current balance of ₹${balance.toLocaleString("en-IN")}, you can afford a moderate trip.\n\n**My Recommendations:**\n- Keep at least ₹${Math.round(balance * 0.3).toLocaleString("en-IN")} as emergency reserve\n- Budget your trip within ₹${Math.round(balance * 0.4).toLocaleString("en-IN")} to stay comfortable\n- Consider booking 2-3 months ahead for better deals`
      : `⚠️ Your current balance of ₹${balance.toLocaleString("en-IN")} is a bit low for a trip right now.\n\n**Suggested Plan:**\n- Save for 2-3 months at your current rate\n- You save ~₹${(income - expenses).toLocaleString("en-IN")} monthly\n- In 2 months you'll have ~₹${(balance + (income - expenses) * 2).toLocaleString("en-IN")} available`}`;
  }

  if (msg.includes("save") || msg.includes("saving") || msg.includes("savings")) {
    return `**Savings Analysis**\n\nYour current savings rate is **${savingsRate.toFixed(1)}%** — here's how to improve it:\n\n**Quick Wins:**\n- 🍽️ Reduce dining out by ₹2,000/month → saves ₹24,000/year\n- 📱 Review subscriptions and cancel unused ones\n- 🛒 Switch to weekly grocery budgeting\n\n**Smart Strategies:**\n- Set up auto-transfer of ₹${Math.round(income * 0.05).toLocaleString("en-IN")} on salary day\n- Use the 24-hour rule before any purchase over ₹2,000\n- Target: push savings rate to **30%** for faster goal achievement`;
  }

  if (msg.includes("afford") || msg.includes("buy") || msg.includes("purchase")) {
    const amountMatch = msg.match(/[₹]?\s?([0-9,]+(?:k|lakh|l)?)/i);
    const amount = amountMatch ? parseInt(amountMatch[1].replace(/[k,]/g, "")) * (amountMatch[1].toLowerCase().includes("k") ? 1000 : 1) : 10000;
    const canAfford = balance > amount * 1.5;
    return `**Purchase Analysis: ₹${amount.toLocaleString("en-IN")}**\n\n${canAfford
      ? `✅ **Yes, you can afford this.**\n\nYour balance is ₹${balance.toLocaleString("en-IN")} — this purchase would bring it to ₹${(balance - amount).toLocaleString("en-IN")}.\n\n**Consider:** This would delay your savings goal by ~${Math.ceil(amount / (income - expenses))} month(s).`
      : `⚠️ **Caution advised.**\n\nThis would leave you with only ₹${(balance - amount).toLocaleString("en-IN")}.\n\n**Better Option:** Save ₹${Math.round(amount / 3).toLocaleString("en-IN")}/month for 3 months and buy with cash — no financial stress!`}`;
  }

  if (msg.includes("budget") || msg.includes("spending")) {
    return `**Budget Breakdown**\n\nBased on your ₹${income.toLocaleString("en-IN")} income:\n\n| Category | Current | Recommended |\n|---|---|---|\n| Essentials (50%) | ₹${expenses.toLocaleString("en-IN")} | ₹${Math.round(income * 0.5).toLocaleString("en-IN")} |\n| Lifestyle (30%) | — | ₹${Math.round(income * 0.3).toLocaleString("en-IN")} |\n| Savings (20%) | ₹${(income - expenses).toLocaleString("en-IN")} | ₹${Math.round(income * 0.2).toLocaleString("en-IN")} |\n\n**Action:** Your savings of ₹${(income - expenses).toLocaleString("en-IN")}/month is excellent at ${savingsRate.toFixed(1)}%!`;
  }

  if (msg.includes("invest") || msg.includes("investment")) {
    return `**Investment Guidance**\n\nWith your savings of ~₹${(income - expenses).toLocaleString("en-IN")}/month:\n\n**Recommended Allocation:**\n- 💼 **ELSS Mutual Funds** (40%) — ₹${Math.round((income - expenses) * 0.4).toLocaleString("en-IN")}/month — Tax-saving under 80C\n- 📊 **Index Funds** (35%) — ₹${Math.round((income - expenses) * 0.35).toLocaleString("en-IN")}/month — Long-term wealth\n- 🏦 **PPF** (15%) — ₹${Math.round((income - expenses) * 0.15).toLocaleString("en-IN")}/month — Safe + tax-free\n- 💵 **Emergency Liquid** (10%) — ₹${Math.round((income - expenses) * 0.1).toLocaleString("en-IN")}/month\n\n**Goal:** Build a 6-month emergency fund (₹${(expenses * 6).toLocaleString("en-IN")}) first!`;
  }

  if (msg.includes("tax") || msg.includes("80c") || msg.includes("deduction")) {
    return `**Tax Optimization Tips**\n\nBased on your income of ₹${income.toLocaleString("en-IN")}/month (₹${(income * 12).toLocaleString("en-IN")}/year):\n\n**Key Deductions:**\n- 📋 **Section 80C** — Invest up to ₹1,50,000 in ELSS/PPF/FD → Save ~₹46,800 in taxes\n- 🏠 **HRA** — Claim rent if you pay rent\n- 💊 **80D** — Health insurance premium up to ₹25,000\n- 📚 **80E** — Education loan interest (no limit)\n\n**Quick Win:** Contribute ₹12,500/month to ELSS to max out 80C!`;
  }

  // Default response
  return `**Hello! I'm your FINORA AI CFO** 👋\n\nHere's your current financial snapshot:\n\n- 💰 **Balance:** ₹${balance.toLocaleString("en-IN")}\n- 📈 **Monthly Income:** ₹${income.toLocaleString("en-IN")}\n- 📉 **Monthly Expenses:** ₹${expenses.toLocaleString("en-IN")}\n- 💎 **Savings Rate:** ${savingsRate.toFixed(1)}%\n\nYou're doing **great**! Your savings rate is healthy. I can help you with:\n- 🌏 "Can I afford a trip?"\n- 💡 "How can I save more?"\n- 📊 "How should I invest?"\n- 🏷️ "How can I reduce taxes?"\n\nWhat would you like to know?`;
}

export async function POST(req: Request) {
  try {
    const { messages, financialContext } = await req.json();
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const lastMessage = messages[messages.length - 1];

    // ── Try real Gemini AI if API key provided ─────────────────────────────
    if (apiKey && apiKey !== "PASTE_YOUR_KEY_HERE") {
      const systemPrompt = `You are FINORA, a highly intelligent Personal AI CFO.
Give concise, actionable financial advice. Use bullet points for clarity.
Financial context: ${financialContext ?? "No context provided."}`;

      const priorMessages: { role: string; content: string }[] = messages.slice(0, -1);
      const geminiHistory: { role: string; parts: { text: string }[] }[] = [];
      let lastRole: string | null = null;
      for (const m of priorMessages) {
        const role = m.role === "assistant" ? "model" : "user";
        if (geminiHistory.length === 0 && role === "model") continue;
        if (role === lastRole) continue;
        geminiHistory.push({ role, parts: [{ text: m.content }] });
        lastRole = role;
      }

      const contents = [
        { role: "user",  parts: [{ text: systemPrompt }] },
        { role: "model", parts: [{ text: "Understood. I am FINORA, your AI CFO." }] },
        ...geminiHistory,
        { role: "user",  parts: [{ text: lastMessage.content }] },
      ];

      // Try all available models — includes flash-lite free tier
      const modelsToTry = [
        "gemini-2.0-flash-lite",
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-1.5-flash-latest",
        "gemini-1.5-pro-latest",
        "gemini-1.5-pro",
        "gemini-pro",
      ];

      for (const modelName of modelsToTry) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:streamGenerateContent?alt=sse&key=${apiKey}`;
        const r = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents }),
        });

        if (!r.ok) {
          const errText = await r.text();
          console.error(`[FINORA] ${modelName} failed (${r.status}):`, errText.slice(0, 150));
          continue;
        }

        console.log(`[FINORA] Using model: ${modelName}`);
        const body = r.body!;
        const stream = new ReadableStream({
          async start(controller) {
            const reader = body.getReader();
            const encoder = new TextEncoder();
            const decoder = new TextDecoder();
            let buffer = "";
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() ?? "";
                for (const line of lines) {
                  if (!line.startsWith("data: ")) continue;
                  const data = line.slice(6).trim();
                  if (!data || data === "[DONE]") continue;
                  try {
                    const json = JSON.parse(data);
                    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
                    if (text) controller.enqueue(encoder.encode(text));
                  } catch { /* skip bad chunks */ }
                }
              }
            } finally {
              controller.close();
              reader.releaseLock();
            }
          },
        });
        return new Response(stream, {
          headers: { "Content-Type": "text/plain; charset=utf-8", "X-Content-Type-Options": "nosniff" },
        });
      }
      
      console.warn("[FINORA] All Gemini models failed — falling back to smart mock.");
    }

    // ── Smart mock fallback (works without any API key) ───────────────────
    const mockText = generateMockResponse(lastMessage.content, financialContext ?? "");
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        // Stream the mock response word-by-word for a realistic typing effect
        const words = mockText.split(" ");
        let idx = 0;
        const interval = setInterval(() => {
          if (idx >= words.length) {
            clearInterval(interval);
            controller.close();
            return;
          }
          controller.enqueue(encoder.encode((idx > 0 ? " " : "") + words[idx]));
          idx++;
        }, 30);
      },
    });
    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "X-Content-Type-Options": "nosniff" },
    });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[FINORA] Chat API Error:", msg);
    return new Response(`Error: ${msg}`, { status: 500 });
  }
}
