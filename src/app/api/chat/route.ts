import { NextResponse } from "next/server";

export const maxDuration = 60;

// ── Smart mock responses for total offline fallback ──────────────────────────
function generateMockResponse(userMessage: string, financialContext: string): string {
  const msg = userMessage.toLowerCase();
  const balanceMatch = financialContext.match(/Balance[:\s]+[^\d]*([0-9,.]+)/i);
  const incomeMatch = financialContext.match(/Income[:\s]+[^\d]*([0-9,.]+)/i);
  const expensesMatch = financialContext.match(/Expenses[:\s]+[^\d]*([0-9,.]+)/i);
  const savingsMatch = financialContext.match(/Savings Rate[:\s]+([0-9.]+)/i);

  const balance = balanceMatch ? parseFloat(balanceMatch[1].replace(/,/g, "")) : 111300;
  const income = incomeMatch ? parseFloat(incomeMatch[1].replace(/,/g, "")) : 150000;
  const expenses = expensesMatch ? parseFloat(expensesMatch[1].replace(/,/g, "")) : 38700;
  const savingsRate = savingsMatch ? parseFloat(savingsMatch[1]) : 74.2;

  if (msg.includes("trip") || msg.includes("travel") || msg.includes("vacation")) {
    return `### 🌏 Travel Plan Analysis

Here are **3 different ways** we can implement funding this travel plan based on your balance of **₹${balance.toLocaleString("en-IN")}**:

* **🚀 Option A: Aggressive Budget Reallocation (Cash Only)**
  - **Strategy**: Slash discretionary expenditures (dining, entertainment) by 50% over the next 2 months. 
  - **Trade-off**: High lifestyle impact, but 0% debt. You save an extra ₹${Math.round((income - expenses) * 0.25).toLocaleString("en-IN")} monthly to fund the trip instantly.
  
* **💳 Option B: Smart Leverage (Card Rewards Optimization)**
  - **Strategy**: Book through **HDFC Regalia** to accelerate air miles & secure free hotel upgrades. Pay the entire bill 3 days before statement generation using your savings.
  - **Trade-off**: Reports ~10% card utilization temporarily, but maximizes points.

* **🏦 Option C: Emergency Surplus Redirection**
  - **Strategy**: Temporarily divert 20% of your active savings targets for 1 month.
  - **Trade-off**: Delays other goals by ~15 days, but keeps your everyday lifestyle untouched.

**💡 CFO Verdict:** Option B is highly recommended if you have savings ready, as it optimizes card points. Otherwise, implement Option A to protect your credit profile.`;
  }

  if (msg.includes("save") || msg.includes("saving") || msg.includes("savings")) {
    return `### 📈 Savings Acceleration Strategy

Your current savings rate is **${savingsRate.toFixed(1)}%**. To optimize this, here are **3 implementation options**:

* **🥗 Option A: Daily Micro-savings (High Effort, Low Risk)**
  - **Action**: Direct ₹2,000/month from dining budgets to savings targets by cooking at home 4 days a week.
  
* **📑 Option B: Subscription Auditing (Low Effort, Direct Yield)**
  - **Action**: Terminate unused OTT plans to immediately recover ₹1,500/month in cashflow.
  
* **🤖 Option C: Salary Day Auto-Sweep (Zero Discretion)**
  - **Action**: Set up auto-transfer of 15% (₹${Math.round(income * 0.15).toLocaleString("en-IN")}) directly to mutual funds on salary day.

**💡 CFO Verdict:** Combine Option B (instant cash retrieval) with Option C for automatic wealth-building.`;
  }

  if (msg.includes("afford") || msg.includes("buy") || msg.includes("purchase") || msg.includes("iphone") || /\bcar\b/.test(msg)) {
    const amountMatch = msg.match(/[₹]?\s?([0-9,]+(?:k|lakh|l)?)/i);
    const amount = amountMatch ? parseInt(amountMatch[1].replace(/[k,]/g, "")) * (amountMatch[1].toLowerCase().includes("k") ? 1000 : 1) : 80000;

    return `### 🛍️ Large Purchase Analysis: ₹${amount.toLocaleString("en-IN")}

To fund this purchase cleanly without breaking your cashflow stability, here are **3 implementation options**:

* **💵 Option A: The Cash-flow Accumulator**
  - **Plan**: Put away ₹${Math.round(amount / 3).toLocaleString("en-IN")}/month for 3 months from your monthly surplus of ₹${(income - expenses).toLocaleString("en-IN")}.
  - **Trade-off**: Delays purchase by 90 days, but maintains perfect financial safety.
  
* **💳 Option B: Card Optimization + 3-Month Grace Buffer**
  - **Plan**: Swipe your optimized credit card to earn points, then pay 1/3 of the balance mid-cycle across 3 billing cycles.
  - **Trade-off**: Safe card utilization remains below 20%, zero interest charges.

* **📉 Option C: Asset Realization (Not Recommended)**
  - **Plan**: Liquidate index fund holdings to purchase today.
  - **Trade-off**: Heavy long-term opportunity cost (losing 12%+ compounded yields).

**💡 CFO Verdict:** Implement **Option A** to completely secure your funds before swiping, or route via **Option B** only if you have liquid buffer backstops.`;
  }

  return `### 👨‍💼 FINORA AI CFO Financial Audit

Here is your current financial snapshot:
* 💰 **Liquid Balance:** ${balance.toLocaleString()}
* 📈 **Monthly Cashflow In:** ${income.toLocaleString()}
* 📉 **Active Outlays:** ${expenses.toLocaleString()}
* 💎 **Savings Ratio:** ${savingsRate.toFixed(1)}%

*(Note: You are currently talking to the **Offline Mock AI** because no Groq or Gemini API keys are configured in your environment variables. This mock AI only responds to specific keywords like "trip", "afford", or "savings".)*`;
}

// ── Build the full system prompt ─────────────────────────────────────────────
function buildSystemPrompt(financialContext: string): string {
  return `You are FINORA, an elite, quant-driven Personal AI CFO and certified wealth strategist.
You have access to the user's complete real-time financial profile, including their detailed balances, income sources, category outlays, budgets, credit cards configuration, investments, and goals.

YOUR ROLE:
Provide high-conviction, professional financial advice. Do not just list numbers; perform mathematical analysis, calculate compounding opportunities, evaluate interest-savings trade-offs, and outline action-oriented pathways.

YOUR KNOWLEDGE DOMAIN HANDLERS:

1. 💳 CREDIT CARD OPTIMIZATION:
   - When asked about credit cards, dues, billing dates, or utilization, inspect the "Credit Cards" context details.
   - Address cards specifically (e.g. HDFC Regalia). Suggest routing category outlays to cards matching specific perks (e.g., dining, shopping, lounge).
   - Advise paying off card outstandings 3 days before their billing/statement date (e.g., "HDFC statement prints on the 12th; clear balance by the 9th to report 0% utilization").
   - Highlight cards approaching or exceeding the safety threshold (30% utilization) and construct a transfer strategy to preserve credit health.

2. 🎯 GOAL MILESTONE AUDITING:
   - For queries on goals or timeline progress, inspect the "Goals" context.
   - Calculate exact completion percentages: (Saved Amount / Target Amount) * 100.
   - Project target completion months using the user's savings rate and income capacity: Months Remaining = (Target - Saved) / Monthly Savings Capacity.
   - Compare all goal needs against the Monthly Savings Capacity. Declare a Savings Conflict if total monthly targets exceed monthly savings, and propose a priority stack.

3. 💼 INVESTMENT PORTFOLIO AUDITING:
   - For investment, mutual fund, or asset queries, inspect the "Investments" context.
   - Tally total portfolio asset size and calculate gains or losses: Gain = Current Value - Invested Value.
   - Display gain/loss percentages: (Gain / Invested) * 100.
   - Advise on diversification ratios and suggest rebalancing options based on asset types (e.g., index funds, equity, cash).

4. 💰 INCOME & CASH FLOW OPTIMIZATION:
   - When asked about income sources or stability, check the "Income Sources Breakdown".
   - List all recurring sources, compute their exact percentage contribution to total monthly inflow, and recommend diversification pathways (e.g. side-hustles, interest returns, dividend portfolios).

5. 🥗 BUDGET ADHERENCE:
   - Tally spent vs. limit for all active categories under "Budgets".
   - Warn on any categories nearing limit (>80%) or already breached, and suggest rolling balance reallocations.

YOUR DECISION ENGINE (MANDATORY PURCHASE & SPLURGE ANALYSIS):
For any purchase, splurge, or expense inquiry (e.g., "Can I buy a ₹15,000 gadget?", "Can I afford X?", "Should I buy Y?"):
You MUST calculate and explicitly display:
1. **Safe Spend Fit**: Check if the amount exceeds their "Today's Safe-To-Spend Limit" listed in the context.
2. **Budget Category Exhaustion**: Tally what percentage of the relevant category budget limit (under Budgets) the purchase consumes.
3. **Savings Rate Impact**: Calculate how much it drops their monthly savings rate:
   - New Savings Capacity = Monthly Savings Capacity - Purchase Amount
   - New Savings Rate = (New Savings Capacity / Monthly Income) * 100
4. **Goal Timeline Delay**: Calculate exactly how many days the splurge delays their active goals (under Goals):
   - Daily Savings Capacity = (Monthly Income * Savings Rate) / 3000
   - Days Delayed = Purchase Amount / Daily Savings Capacity
   - For EACH active goal, state: "Delays [Goal Name] by [Days] days."
5. **CFO Guidance & Alternative Strategy**:
   - If safe: Give a solid green verification: "✓ CFO Safe Decision: Safely within discretionary limits."
   - If risky: Warn them and recommend a cooling-off wait time.

RULES OF OPTIONS (MULTI-PATH ANALYSIS):
For any request regarding purchases, splurges, EMIs, or savings:
1. NEVER suggest a single rigid answer. Always provide exactly 2 to 3 different ways (options) the user can implement the decision.
2. Outline clear trade-offs for each option.
   - Option A (Aggressive/Direct Cashflow): Slashed discretionary spending, direct bank drafts, zero debt.
   - Option B (Smart Leverage/Card Optimizer): Swiping a specific credit card to lock in cashbacks/points.
   - Option C (Asset Allocation/Savings Redirection): Liquidating low-yield margins or temporarily pausing goals.
3. Finish with a clear, concise "CFO Verdict" advising which option fits their long-term health score best.

Always format with clean markdown, bullet points, and emojis. Always cite the user's specific details, cards, or goals when giving advice. Be concise, direct, and authoritative.

Financial context:
${financialContext ?? "No context provided."}`;
}

export async function POST(req: Request) {
  try {
    const { messages, financialContext } = await req.json();
    const lastMessage = messages[messages.length - 1];
    const systemPrompt = buildSystemPrompt(financialContext);

    // ── 1. GROQ (Fastest — LLaMA 3.3 70B, ~300 tokens/sec) ──────────────────
    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey && groqKey !== "PASTE_YOUR_GROQ_KEY_HERE") {
      try {
        console.log("[FINORA] Attempting Groq (LLaMA 3.3 70B)...");
        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              { role: "system", content: systemPrompt },
              ...messages.map((m: any) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content }))
            ],
            stream: true,
            temperature: 0.7,
            max_tokens: 1024,
          }),
        });

        if (groqRes.ok && groqRes.body) {
          console.log("[FINORA] Streaming from Groq LLaMA 3.3 70B...");
          const body = groqRes.body;
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
                      const text = json?.choices?.[0]?.delta?.content ?? "";
                      if (text) controller.enqueue(encoder.encode(text));
                    } catch { /* skip */ }
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
      } catch (e) {
        console.log("[FINORA] Groq failed, falling back...", e);
      }
    }

    // ── 2. GEMINI (Google AI — 1500 req/day free) ────────────────────────────
    const geminiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (geminiKey && geminiKey !== "PASTE_YOUR_KEY_HERE") {
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
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "model", parts: [{ text: "Understood. I am FINORA, your AI CFO. I will provide tailored, multi-path options outlining financial trade-offs." }] },
        ...geminiHistory,
        { role: "user", parts: [{ text: lastMessage.content }] },
      ];

      // Try newest models first — all free on Google AI Studio
      const modelsToTry = [
        "gemini-2.5-flash-preview-05-20",
        "gemini-2.0-flash",
        "gemini-2.0-flash-lite",
        "gemini-1.5-flash",
      ];

      for (const modelName of modelsToTry) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:streamGenerateContent?alt=sse&key=${geminiKey}`;
          const r = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents,
              generationConfig: { temperature: 0.7, maxOutputTokens: 1024 }
            }),
          });

          if (!r.ok) {
            console.log(`[FINORA] Gemini ${modelName} failed (${r.status})`);
            continue;
          }

          console.log(`[FINORA] Streaming from Gemini: ${modelName}`);
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
                    } catch { /* skip incomplete chunks */ }
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
        } catch (e) {
          console.log(`[FINORA] Gemini ${modelName} error:`, e);
          continue;
        }
      }
    }

    // ── 3. LOCAL OLLAMA (Fallback) ────────────────────────────────────────────
    const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://127.0.0.1:11434";
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);
      const pingRes = await fetch(`${OLLAMA_HOST}/api/tags`, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (pingRes.ok) {
        console.log("[FINORA] Ollama detected. Streaming local model...");
        const chatRes = await fetch(`${OLLAMA_HOST}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "finora",
            messages: [
              { role: "system", content: systemPrompt },
              ...messages.map((m: any) => ({
                role: m.role === "assistant" ? "assistant" : "user",
                content: m.content
              }))
            ],
            stream: true
          })
        });

        if (chatRes.ok && chatRes.body) {
          const body = chatRes.body;
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
                    const trimmed = line.trim();
                    if (!trimmed) continue;
                    try {
                      const parsed = JSON.parse(trimmed);
                      const text = parsed?.message?.content ?? "";
                      if (text) controller.enqueue(encoder.encode(text));
                    } catch { /* skip */ }
                  }
                }
              } finally {
                controller.close();
                reader.releaseLock();
              }
            }
          });
          return new Response(stream, {
            headers: { "Content-Type": "text/plain; charset=utf-8", "X-Content-Type-Options": "nosniff" },
          });
        }
      }
    } catch (e) {
      console.log("[FINORA] Ollama offline. Using smart mock fallback.");
    }

    // ── 4. SMART MOCK FALLBACK ────────────────────────────────────────────────
    console.log("[FINORA] All AI providers unavailable — using smart mock.");
    const mockText = generateMockResponse(lastMessage.content, financialContext ?? "");
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
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
        }, 25);
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
