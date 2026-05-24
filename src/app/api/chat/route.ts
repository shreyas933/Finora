
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

  if (msg.includes("afford") || msg.includes("buy") || msg.includes("purchase") || msg.includes("iphone") || /\bcar\b/.test(msg)) {
    const amountMatch = msg.match(/[₹]?\s?([0-9,]+(?:k|lakh|l)?)/i);
    const amount = amountMatch ? parseInt(amountMatch[1].replace(/[k,]/g, "")) * (amountMatch[1].toLowerCase().includes("k") ? 1000 : 1) : 80000;
    const canAfford = balance > amount * 1.5;
    
    if (msg.includes("emi") || msg.includes("loan")) {
       return `**EMI / Recurring Liability Analysis**\n\nIf you take an EMI of ₹${amount.toLocaleString("en-IN")}/month:\n- **New Monthly Expenses:** ₹${(expenses + amount).toLocaleString("en-IN")}\n- **New Savings Rate:** ${(((income - (expenses + amount)) / income) * 100).toFixed(1)}%\n\n**Verdict:** ${(expenses + amount) > (income * 0.5) ? '⚠️ This breaks the 50/30/20 rule. Your fixed obligations will be too high.' : '✅ This fits within your 50% needs limit.'}`;
    }

    return `**Large Purchase Analysis: ₹${amount.toLocaleString("en-IN")}**\n\n${canAfford
      ? `✅ **Yes, you can afford this.**\n\nYour balance is ₹${balance.toLocaleString("en-IN")} — this purchase would bring it to ₹${(balance - amount).toLocaleString("en-IN")}.\n\n**Optimal Financing:**\n- Use a credit card with high reward multipliers for this category.\n- Pay off the card immediately using liquid savings to avoid interest.`
      : `⚠️ **Caution advised.**\n\nThis would severely deplete your liquid cash.\n\n**Alternative Strategy:**\n- **Save:** Put away ₹${Math.round(amount / 3).toLocaleString("en-IN")}/month for 3 months.\n- **Investments:** Do not liquidate high-yield Index Funds for a depreciating asset.`}`;
  }

  if (msg.includes("hotel") || msg.includes("card to use") || msg.includes("which card")) {
    return `**Credit Card Optimization**\n\nSince you are booking a hotel/travel, I checked your active credit cards in the FINORA system.\n\n**Recommendation:**\n- Use your **HDFC Regalia** or travel-focused card.\n- Why? It offers accelerated reward points on hotel bookings and free lounge access if you are flying.\n\nEnjoy your stay!`;
  }

  if (msg.includes("budget") || msg.includes("spending") || msg.includes("treat") || msg.includes("splurge")) {
    return `**Discretionary Spending Analysis**\n\nIf you spend ₹5,000 on a treat:\n- **Impact:** Checks against your "Food & Dining" or "Entertainment" budget.\n- **Payment Strategy:** Use your dining-focused credit card (e.g., HDFC Swiggy) to get 10% cashback on this bill.\n- **Overall Budget:** Your total expenses are ₹${expenses.toLocaleString("en-IN")}, leaving you with ₹${(income - expenses).toLocaleString("en-IN")} to save. Enjoy the treat, you've earned it!`;
  }

  if (msg.includes("emergency") || msg.includes("hospital") || msg.includes("mechanic") || msg.includes("broke down")) {
    return `**Emergency Expense Protocol**\n\n**Immediate Action:**\n- **Credit:** Use your highest limit credit card to pay the bill now. This gives you a 45-day interest-free buffer.\n- **Liquidation:** Pull the required amount from your **Emergency Liquid** fund or a low-yield savings account.\n- **Warning:** Do NOT sell your long-term equity mutual funds or stocks for this.`;
  }

  if (msg.includes("bonus") || msg.includes("windfall") || msg.includes("lottery")) {
    return `**Windfall Allocation Strategy**\n\nCongratulations on the extra cash! Here is how to deploy it:\n1. **Debt:** Clear any outstanding high-interest credit card balances immediately.\n2. **Goals:** Put 40% towards your most urgent financial goal (e.g., House Downpayment).\n3. **Invest:** Deploy 40% into your Index Funds.\n4. **Guilt-free:** Keep 20% to treat yourself!`;
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
      const systemPrompt = `You are FINORA, a highly intelligent, proactive Personal AI CFO.
You have access to the user's complete financial profile, including their balances, income, expenses, budgets, credit cards, investments, and goals.

YOUR ROLE:
Act as a strict, highly analytical financial advisor. Do not just spit back numbers. Analyze "what-if" scenarios, calculate impacts on budgets, and provide actionable decisions.

SCENARIO INSTRUCTIONS:
1. Discretionary Splurges (e.g., "Can I spend 5k on a treat?"): 
   - Check their specific budget categories (e.g., Food & Dining). Will this push them over the limit?
   - Suggest which of their specific Credit Cards to use based on the perks (e.g., dining rewards).
2. Large Asset Purchases (e.g., "How do I afford an iPhone?"):
   - Do NOT just say "save up". Look at their Investments. Suggest which low-yield assets (like FDs or liquid funds) they could liquidate, but warn against selling high-yield Index Funds.
   - Suggest splitting the cost using a specific credit card for points, and paying it off using their Monthly Savings rate over X months.
3. Recurring Liabilities (e.g., "Can I take a 15k EMI?"):
   - Calculate their new Monthly Expenses (Current Expenses + EMI).
   - Check if this breaks the 50/30/20 rule (Fixed expenses > 50% of Income).
   - Tell them exactly how much it will drop their current Savings Rate.
4. Emergency Expenses (e.g., "Car broke down, need 25k"):
   - Tell them to put it on a credit card for the 45-day interest-free buffer.
   - Instruct them exactly which liquid asset or balance to use to pay the bill when it arrives.
5. Windfalls (e.g., "Got a 1 lakh bonus"):
   - Tell them to clear high-interest debt first.
   - Distribute the rest specifically to their active Goals and Investments.

FORMATTING:
- Use markdown, bullet points, and emojis for clarity.
- Always provide a "Verdict" or "Action Plan" at the end.
- Be concise and direct.

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
