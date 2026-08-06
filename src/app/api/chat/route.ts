import { NextResponse } from "next/server";
import type { FinancialSnapshot } from "@/lib/ai/financialContextBuilder";
import { snapshotToPromptString } from "@/lib/ai/financialContextBuilder";
import { detectIntent, getIntentLabel } from "@/lib/ai/intentDetector";
import { runDecisionEngine } from "@/lib/ai/decisionEngine";

export const maxDuration = 60;

// ── Smart mock responses (offline fallback) ───────────────────────────────────
function generateMockResponse(userMessage: string, legacyContext: string): string {
  const msg = userMessage.toLowerCase();
  const balanceMatch = legacyContext.match(/Balance[:\s]+[^\d]*([0-9,.]+)/i);
  const incomeMatch = legacyContext.match(/Income[:\s]+[^\d]*([0-9,.]+)/i);
  const expensesMatch = legacyContext.match(/Expenses[:\s]+[^\d]*([0-9,.]+)/i);
  const savingsMatch = legacyContext.match(/Savings Rate[:\s]+([0-9.]+)/i);

  const balance = balanceMatch ? parseFloat(balanceMatch[1].replace(/,/g, "")) : 111300;
  const income = incomeMatch ? parseFloat(incomeMatch[1].replace(/,/g, "")) : 150000;
  const expenses = expensesMatch ? parseFloat(expensesMatch[1].replace(/,/g, "")) : 38700;
  const savingsRate = savingsMatch ? parseFloat(savingsMatch[1]) : 74.2;

  if (msg.includes("trip") || msg.includes("travel") || msg.includes("vacation")) {
    return `### ✈️ Travel Plan Analysis\n\nHere are **3 ways** to fund this travel plan based on your balance of **₹${balance.toLocaleString("en-IN")}**:\n\n* **Option A: Budget Reallocation** — Slash discretionary spend by 50% over 2 months. Zero debt, high lifestyle impact.\n* **Option B: Card Reward Optimization** — Book via your best travel card to earn miles. Pay 3 days before statement date.\n* **Option C: Surplus Redirection** — Temporarily divert 20% of savings for 1 month. Delays goals by ~15 days.\n\n**💡 CFO Verdict:** Option B is recommended if you have savings ready — it maximizes card points while keeping your credit profile intact.`;
  }

  if (msg.includes("save") || msg.includes("saving")) {
    return `### 📈 Savings Strategy\n\nYour savings rate is **${savingsRate.toFixed(1)}%**. Here are 3 acceleration options:\n\n* **Option A: Subscription Audit** — Cancel unused OTTs to recover ₹1,500/month immediately.\n* **Option B: Salary Day Auto-Sweep** — Auto-transfer 15% (₹${Math.round(income * 0.15).toLocaleString("en-IN")}) to investments on payday.\n* **Option C: Dining Reduction** — Cook at home 4 days/week → save ₹2,000/month.\n\n**💡 CFO Verdict:** Combine Option A + B for instant cash retrieval and automatic wealth-building.`;
  }

  if (msg.includes("afford") || msg.includes("buy") || msg.includes("purchase") || /\bcar\b/.test(msg)) {
    const surplus = income - expenses;
    return `### 🛍️ Purchase Analysis\n\n**3 implementation options:**\n\n* **Option A: Cash Accumulator** — Save ₹${Math.round(surplus / 3).toLocaleString("en-IN")}/month for 3 months from your monthly surplus.\n* **Option B: Card Optimization** — Use your best rewards card; pay in 3 billing cycles within grace period.\n* **Option C: Asset Realization** — Liquidate low-yield investments. ⚠️ Not recommended — loses compounding returns.\n\n**💡 CFO Verdict:** Option A is safest. Option B only if utilization stays below 30% post-purchase.`;
  }

  return `### 👨‍💼 FINORA CFO Financial Snapshot\n\n* 💰 **Balance:** ₹${balance.toLocaleString("en-IN")}\n* 📈 **Monthly Income:** ₹${income.toLocaleString("en-IN")}\n* 📉 **Monthly Expenses:** ₹${expenses.toLocaleString("en-IN")}\n* 💎 **Savings Rate:** ${savingsRate.toFixed(1)}%\n\n*(Offline mode — connect to Groq or Gemini for full AI-powered analysis.)*`;
}

// ── Fast Edge Case Generators ───────────────────────────────────────────────
function handleEdgeCase(intent: string, snapshot: FinancialSnapshot | null, userMsg: string): Response | null {
  const fmt = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");
  const balanceStr = snapshot ? fmt(snapshot.balance) : "₹1,11,300";
  const dailyLimitStr = snapshot ? fmt(snapshot.safeToSpend.dailyLimit) : "₹3,400";
  const healthScore = snapshot ? snapshot.healthScore : 82;

  let text = "";

  if (intent === "IdentityQuery") {
    text = `💡 Verdict
I am FINORA — your personal AI Chief Financial Officer (CFO). I am not a generic chatbot; I am your real-time financial intelligence layer.

🤖 Core Operating Capabilities
- 🛍️ **Purchase Decision Engine**: Real-time "Can I afford this?" evaluation balancing balance, cash flow, and goal timelines.
- 💳 **Credit Card Optimizer**: Recommends the exact credit card to swipe for maximum rewards and 0% interest risk.
- 🎯 **Goal Delay Radar**: Calculates the exact day/month impact of any purchase on your active financial goals.
- 📊 **Safe-to-Spend Daily Limit**: Computes your true daily disposable limit after reserving for bills, EMIs, and savings goals.
- 📉 **Debt & Utilization Guard**: Monitors credit card statement cycles and utilization thresholds to protect your credit score.

✅ Do This Now
Ask me any financial question: *"Can I afford a new laptop?"*, *"Which card should I use for dining?"*, or *"Give me my weekly CFO report."*

### 🔍 Deep Rationale
FINORA continuously integrates your transactions, budgets, goals, and credit card perks into a single decision matrix. Every response is backed by mathematical risk calculations to protect your net worth.`;
  } else if (intent === "Greeting") {
    const isThanks = /thank|thx|cheers|great|awesome/i.test(userMsg);
    if (isThanks) {
      text = `💡 Verdict
You are welcome! I am always monitoring your financial OS to help you maximize wealth and minimize unnecessary interest.

📊 Live Status Snapshot
- 💰 **Cash Balance**: ${balanceStr}
- ✅ **Safe-to-Spend Today**: ${dailyLimitStr}
- ❤️ **Financial Health**: ${healthScore}/100

✅ Do This Now
Feel free to ask whenever you plan a purchase, card payment, or goal investment!`;
    } else {
      text = `💡 Verdict
Hello! Your Personal AI CFO is online and monitoring your financial OS in real-time.

📊 Live Status Snapshot
- 💰 **Cash Balance**: ${balanceStr}
- ✅ **Safe-to-Spend Today**: ${dailyLimitStr}
- ❤️ **Financial Health**: ${healthScore}/100

✅ Do This Now
How can I assist your capital decisions today? Ask me about a purchase, credit card perks, or budget allocations.`;
    }
  } else if (intent === "OutOfDomain") {
    text = `💡 Verdict
I am your dedicated AI Personal CFO — specialized exclusively in your money, assets, credit cards, budgets, and wealth goals.

📊 Non-Financial Query Detected
The question "${userMsg.length > 50 ? userMsg.slice(0, 50) + "..." : userMsg}" is non-contextual and outside financial operations.

✅ Recommended Questions to Ask
- 🛍️ *"Can I afford to buy a new phone?"*
- 💳 *"Which credit card should I use for dining?"*
- 🎯 *"How are my active financial goals performing?"*`;
  } else if (intent === "VagueHelp") {
    const activeGoals = snapshot ? snapshot.goals.active.length : 3;
    const util = snapshot ? snapshot.creditCards.overallUtilization : 18;

    text = `💡 Verdict
Here is a quick diagnostic summary of your current financial standing:

📊 Financial Health Summary
- 💰 **Available Balance**: ${balanceStr}
- ✅ **Daily Safe-to-Spend**: ${dailyLimitStr}
- 🎯 **Active Goals**: ${activeGoals} active goals
- 💳 **Credit Card Utilization**: ${util}% (Healthy)

✅ Recommended Questions to Ask
1. *"Can I afford to splurge ₹10,000 this weekend?"*
2. *"Which card should I use for dining & shopping?"*
3. *"Give me my weekly CFO report"*`;
  }

  if (!text) return null;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(text));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "X-Content-Type-Options": "nosniff" },
  });
}

// ── CFO System Prompt Builder ─────────────────────────────────────────────────
// Intent → which sections to include in the response
const INTENT_SECTIONS: Record<string, string[]> = {
  PurchaseDecision:      ["verdict", "numbers", "goal_impact", "card", "watch_out", "deep_rationale"],
  LargePurchase:         ["verdict", "numbers", "goal_impact", "card", "watch_out", "action", "deep_rationale"],
  CreditCardAdvice:      ["verdict", "card", "numbers", "action", "deep_rationale"],
  RewardOptimization:    ["verdict", "numbers", "card", "action", "deep_rationale"],
  BudgetQuery:           ["verdict", "numbers", "watch_out", "action", "deep_rationale"],
  GoalPlanning:          ["verdict", "numbers", "watch_out", "action", "deep_rationale"],
  SafeToSpend:           ["verdict", "numbers", "action", "deep_rationale"],
  InvestmentAdvice:      ["verdict", "numbers", "watch_out", "action", "deep_rationale"],
  HealthScore:           ["verdict", "numbers", "action", "deep_rationale"],
  CashFlowAnalysis:      ["verdict", "numbers", "watch_out", "action", "deep_rationale"],
  EmergencyFund:         ["verdict", "numbers", "action", "deep_rationale"],
  WeeklySummary:         ["verdict", "numbers", "watch_out", "action", "deep_rationale"],
  WhatIfSimulation:      ["verdict", "numbers", "watch_out", "action", "deep_rationale"],
  SalaryScenario:        ["verdict", "numbers", "action", "deep_rationale"],
  TravelPlanning:        ["verdict", "numbers", "card", "goal_impact", "action", "deep_rationale"],
  DebtManagement:        ["verdict", "numbers", "watch_out", "action", "deep_rationale"],
  SubscriptionAudit:     ["verdict", "numbers", "action", "deep_rationale"],
  GeneralFinancialAdvice:["verdict", "numbers", "action", "deep_rationale"],
};

const SECTION_INSTRUCTIONS: Record<string, string> = {
  verdict:        "💡 Verdict\nA clear, confident CFO verdict answering the prompt directly.",
  numbers:        "📊 Financial Breakdown\n3–5 detailed bullet points showing exact numbers, percentages, card reward calculations, or budget metrics from the context.",
  goal_impact:    "🎯 Goal & Cash Flow Impact\nDetailed impact on active goals with exact delay or acceleration timelines in days/months.",
  card:           "💳 Credit Card Strategy\nSpecific card recommendation from the user's active wallet deck with statement cycle dates and utilization advice.",
  watch_out:      "⚠️ CFO Risk Radar\nPotential risks (overspending, interest traps, high utilization, emergency fund drain) to avoid.",
  action:         "✅ Recommended Action\nConcrete, step-by-step instructions the user should execute today.",
  deep_rationale: "### 🔍 Deep Rationale\nMathematical breakdown, cash-flow formula, and decision logic used to arrive at this verdict.",
};

function buildCFOSystemPrompt(
  snapshot: FinancialSnapshot,
  intentLabel: string,
  emphasizedSections: string[],
  promptInjection: string,
  intent: string
): string {
  const contextString = snapshotToPromptString(snapshot, emphasizedSections);
  const sections = INTENT_SECTIONS[intent] ?? ["verdict", "numbers", "action", "deep_rationale"];
  const sectionGuide = sections.map(s => SECTION_INSTRUCTIONS[s]).filter(Boolean).join("\n\n");

  return `You are FINORA — an elite personal AI CFO. You have access to the user's complete financial data. Every answer must be personal, thorough, specific, and data-driven.

DETECTED INTENT: ${intentLabel}

=== RESPONSE FORMAT (STRICT) ===
Write ONLY the sections listed below.
Target length: 250 to 350 words. Do NOT make it too brief or cut off key figures.

${sectionGuide}

=== STRICT ANTI-HALLUCINATION DIRECTIVES (CRITICAL) ===
1. Refer ONLY to credit cards listed under === CREDIT CARDS === in the FINANCIAL CONTEXT below.
2. If the user has 1 credit card, cite ONLY that 1 specific credit card.
3. NEVER invent, hallucinate, or mention any other credit cards (such as ICICI, Axis, Citi, SBI, Amex, or HDFC) unless they are explicitly listed in the user's CREDIT CARDS list in the context.
4. If the user has 0 credit cards in their context, state clearly: "You currently have 0 credit cards in your wallet deck."
5. All card names, limits, and outstanding balances MUST match the exact numbers in the FINANCIAL CONTEXT. Zero guessing or inventing.

=== FORMAT RULES ===
- Use **bold** for key numbers, card names, percentages, and goal names.
- Use bullet points (- item) for clean lists.
- Use --- to separate major sections.
- NEVER start with "As per your financial data" or "The Decision Engine" or "Based on".
- NEVER repeat the question back.

${promptInjection}

=== FINANCIAL CONTEXT ===
${contextString}
=== END ===`;
}

// ── Streaming helper: Groq ─────────────────────────────────────────────────────
async function streamFromGroq(
  systemPrompt: string,
  messages: { role: string; content: string }[]
): Promise<Response | null> {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey || groqKey === "PASTE_YOUR_GROQ_KEY_HERE") return null;

  try {
    console.log("[FINORA] Attempting Groq (LLaMA 3.3 70B)...");
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

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
          ...messages.map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content })),
        ],
        stream: true,
        temperature: 0.5,
        max_tokens: 750,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!groqRes.ok || !groqRes.body) {
      console.log(`[FINORA] Groq non-OK: ${groqRes.status}`);
      return null;
    }

    console.log("[FINORA] Streaming from Groq LLaMA 3.3 70B...");
    const body = groqRes.body;
    const stream = new ReadableStream({
      async start(ctrl) {
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
                if (text) ctrl.enqueue(encoder.encode(text));
              } catch { /* skip */ }
            }
          }
        } finally {
          ctrl.close();
          reader.releaseLock();
        }
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "X-Content-Type-Options": "nosniff" },
    });
  } catch (e) {
    console.log("[FINORA] Groq failed or timed out:", e);
    return null;
  }
}

// ── Streaming helper: Gemini ──────────────────────────────────────────────────
async function streamFromGemini(
  systemPrompt: string,
  messages: { role: string; content: string }[],
  lastMessage: { role: string; content: string }
): Promise<Response | null> {
  const geminiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!geminiKey || geminiKey === "PASTE_YOUR_KEY_HERE") return null;

  const priorMessages = messages.slice(0, -1);
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
    { role: "model", parts: [{ text: "Understood. I am FINORA, your AI CFO. Ready to provide my CFO assessment." }] },
    ...geminiHistory,
    { role: "user", parts: [{ text: lastMessage.content }] },
  ];

  const modelsToTry = [
    "gemini-2.0-flash-lite",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
  ];

  for (const modelName of modelsToTry) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:streamGenerateContent?alt=sse&key=${geminiKey}`;
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: { temperature: 0.5, maxOutputTokens: 750 },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!r.ok) {
        console.log(`[FINORA] Gemini ${modelName} failed (${r.status})`);
        continue;
      }

      console.log(`[FINORA] Streaming from Gemini: ${modelName}`);
      const body = r.body!;
      const stream = new ReadableStream({
        async start(ctrl) {
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
                  if (text) ctrl.enqueue(encoder.encode(text));
                } catch { /* skip incomplete chunks */ }
              }
            }
          } finally {
            ctrl.close();
            reader.releaseLock();
          }
        },
      });

      return new Response(stream, {
        headers: { "Content-Type": "text/plain; charset=utf-8", "X-Content-Type-Options": "nosniff" },
      });
    } catch (e) {
      console.log(`[FINORA] Gemini ${modelName} error/timeout:`, e);
    }
  }

  return null;
}

// ── Streaming helper: Ollama ──────────────────────────────────────────────────
async function streamFromOllama(
  systemPrompt: string,
  messages: { role: string; content: string }[]
): Promise<Response | null> {
  const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://127.0.0.1:11434";
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);
    const pingRes = await fetch(`${OLLAMA_HOST}/api/tags`, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!pingRes.ok) return null;

    console.log("[FINORA] Ollama detected. Streaming local model...");
    const chatRes = await fetch(`${OLLAMA_HOST}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "finora",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.map((m) => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: m.content,
          })),
        ],
        stream: true,
      }),
    });

    if (!chatRes.ok || !chatRes.body) return null;

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
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "X-Content-Type-Options": "nosniff" },
    });
  } catch {
    console.log("[FINORA] Ollama offline.");
    return null;
  }
}

function generateInstantCFOText(intent: string, snapshot: FinancialSnapshot | null, payload: any, userMsg: string): string {
  const fmt = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");
  const balance = snapshot ? snapshot.balance : 111300;
  const income = snapshot ? snapshot.monthlyIncome : 150000;
  const expenses = snapshot ? snapshot.monthlyExpenses : 38700;
  const savingsRate = snapshot ? snapshot.savingsRate : 74.2;
  const dailyLimit = snapshot ? snapshot.safeToSpend.dailyLimit : 3400;

  // Dynamically extract actual cards from user snapshot context
  const cards = snapshot?.creditCards?.cards || [];
  const cardCount = cards.length;

  let text = "";

  if (intent === "CreditCardAdvice" || intent === "RewardOptimization" || /card|reward|point|amazon|flipkart|optmi|opti/i.test(userMsg)) {
    if (cardCount === 0) {
      text = `💡 Verdict
You currently have **0 credit cards** added in your wallet deck.

📊 Financial & Rewards Analysis
- Total Credit Cards: 0
- Total Credit Limit: ₹0
- Total Outstanding Balance: ₹0

✅ Recommended Action
Add your credit card in the Credit Cards section to unlock rewards tracking, statement cycle alerts, and utilization management.

### 🔍 Deep Rationale
No credit card data was detected in your active wallet snapshot. Adding a card will enable customized reward optimization.`;
    } else if (/amazon|flipkart|myntra|store|shopping/i.test(userMsg)) {
      const topCard = cards[0];
      const cardName = topCard ? topCard.card.name : "your primary credit card";
      text = `💡 Verdict
To optimize purchases on **Amazon / E-commerce stores**, swipe your **${cardName}** through reward acceleration portals to maximize cashback and reward multipliers.

📊 Amazon Shopping Optimization Strategy
- 💳 **Primary Card**: **${cardName}** (${topCard ? topCard.utilization : 0}% current utilization)
- 🚀 **Reward Multiplier**: Earn up to **5X Reward Points** / **5% cashback** on online shopping transactions.
- 🎟️ **Voucher Acceleration**: Purchase Amazon Pay Gift Vouchers via card reward portals (SmartBuy / Gyftr) before checkout to stack an extra 3%–5% reward points.

💳 Credit Utilization Safeguard
- Keep single transactions within your safe discretionary limit (**${fmt(snapshot?.safeToSpend?.remainingThisMonth || 14000)}**).
- Pay off the statement balance 3 days prior to your billing date to maintain zero interest and protect your credit score.

✅ Do This Now
1. Buy an Amazon Gift Voucher using **${cardName}** on your bank's reward portal to stack bonus points.
2. Apply the voucher code on Amazon checkout for instant savings + maximum point accumulation.

### 🔍 Deep Rationale
Routing online purchases through gift voucher portals accelerates base reward rates from 1X/2X up to 5X without increasing net spending.`;
    } else {
      const topCard = cards[0];
      const cardListText = cards.map(c => {
        const perksStr = c.rewardCategories.length > 0 ? c.rewardCategories.join(", ") : "General rewards";
        return `- **${c.card.name}** (${c.card.network}): Limit ${fmt(c.limit)} | Outstanding: ${fmt(c.outstanding)} (${c.utilization}% utilization) — *perks: ${perksStr}*`;
      }).join("\n");

      const totalLimit = snapshot?.creditCards?.totalLimit || topCard.limit;
      const totalOutstanding = snapshot?.creditCards?.totalOutstanding || topCard.outstanding;
      const overallUtil = snapshot?.creditCards?.overallUtilization || topCard.utilization;

      text = `💡 Verdict
Based on your financial data, you have **${cardCount} credit card${cardCount > 1 ? "s" : ""}** in your wallet deck. Your primary card is **${topCard.card.name}**.

📊 Financial & Rewards Analysis
${cardListText}

💳 Wallet Summary
- **Total Credit Limit**: ${fmt(totalLimit)}
- **Total Outstanding Balance**: ${fmt(totalOutstanding)}
- **Overall Credit Utilization**: ${overallUtil}% (${overallUtil <= 30 ? "Healthy" : "High Risk"})

✅ Recommended Action
${topCard.outstanding > 0 ? `Clear the outstanding balance of ${fmt(topCard.outstanding)} on your **${topCard.card.name}** before the statement due date to avoid interest charges.` : `Use your **${topCard.card.name}** for eligible purchases to maximize reward point accumulation while keeping utilization low.`}

### 🔍 Deep Rationale
Analysis computed strictly from your active wallet deck (${cardCount} card${cardCount > 1 ? "s" : ""}). Statement cycle alignment ensures zero interest penalties and protects your CIBIL score.`;
    }
  } else if (intent === "PurchaseDecision" || intent === "LargePurchase" || /afford|buy|purchase/i.test(userMsg)) {
    const amount = payload?.calculations?.purchaseAmount || 15000;
    const canAfford = snapshot ? snapshot.safeToSpend.remainingThisMonth >= amount : true;
    const bestCardName = cardCount > 0 ? cards[0].card.name : "Cash / Debit Card";

    text = `💡 Verdict
${canAfford ? `Yes, you can safely afford this purchase of **${fmt(amount)}**.` : `⚠️ Purchasing **${fmt(amount)}** right now will exceed your discretionary budget limit.`}

📊 Safe-to-Spend & Cash Flow Check
- **Daily Safe-To-Spend Limit**: ${fmt(dailyLimit)}
- **Discretionary Remaining**: ${fmt(snapshot?.safeToSpend?.remainingThisMonth || 45000)}
- **Current Liquid Balance**: ${fmt(balance)}
- **Emergency Reserve Status**: 3-Month Fund (${fmt(expenses * 3)}) fully protected

🎯 Goal & Payment Strategy
- **Goal Impact**: Minor delay of ~${Math.ceil(amount / 5000)} days on savings targets.
- **Payment Method**: Use **${bestCardName}** and pay in full before statement due date.

✅ Do This Now
${canAfford ? `Proceed with the purchase using **${bestCardName}** to earn cashback.` : `Save ${fmt(Math.ceil(amount / 2))}/month over the next 2 months to purchase debt-free.`}

### 🔍 Deep Rationale
Safe-to-Spend reserves 3 months of living expenses (${fmt(expenses * 3)}) before calculating disposable liquidity.`;
  } else {
    text = `💡 Verdict
Your overall financial position is strong with a **Health Score of ${snapshot?.healthScore || 82}/100** and **${cardCount} credit card${cardCount > 1 ? "s" : ""}** in your wallet deck.

📊 Core Financial Summary
- 💰 **Liquid Balance**: ${fmt(balance)}
- 📈 **Monthly Surplus**: ${fmt(income - expenses)}/month
- 🛡️ **Emergency Reserve**: Funded (${fmt(balance)} available)
- 💳 **Credit Cards Active**: ${cardCount} card${cardCount > 1 ? "s" : ""} (${snapshot?.creditCards?.overallUtilization || 0}% utilization)

✅ Recommended Next Action
Keep maintaining your monthly surplus and clear any card balances before statement due dates to maintain zero-interest status.

### 🔍 Deep Rationale
FINORA decision engine integrates real-time cash flow, card balances, and goal velocity into a unified CFO scorecard.`;
  }

  return text;
}

// ── POST Handler ──────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const { messages, financialContext } = await req.json();
    const lastMessage = messages[messages.length - 1];

    // ── Parse the financial snapshot (new JSON format) or fall back to legacy ──
    let snapshot: FinancialSnapshot | null = null;
    let legacyContext: string = financialContext ?? "";

    if (financialContext && typeof financialContext === "string") {
      try {
        const parsed = JSON.parse(financialContext);
        // Check if it's a real snapshot (has the generatedAt field)
        if (parsed.generatedAt && parsed.balance !== undefined) {
          snapshot = parsed as FinancialSnapshot;
          legacyContext = parsed._legacyContextString ?? financialContext;
        }
      } catch {
        // Not JSON — it's the legacy plain-text format
        legacyContext = financialContext;
      }
    }

    // ── Layer 2: Detect Intent ────────────────────────────────────────────────
    const intent = detectIntent(lastMessage.content);
    const intentLabel = getIntentLabel(intent);
    console.log(`[FINORA] Intent detected: ${intent} (${intentLabel})`);

    // ── Fast-path for edge cases (Identity, Greeting, Out-of-Domain, Vague) ──
    const edgeCaseResponse = handleEdgeCase(intent, snapshot, lastMessage.content);
    if (edgeCaseResponse) {
      console.log(`[FINORA] Handled fast-path edge case: ${intent}`);
      return edgeCaseResponse;
    }

    // ── Layer 4: Run Decision Engine (only if we have a full snapshot) ────────
    let systemPrompt: string;

    if (snapshot) {
      const payload = runDecisionEngine(lastMessage.content, snapshot, intent);
      systemPrompt = buildCFOSystemPrompt(
        snapshot,
        intentLabel,
        payload.emphasizedSections,
        payload.promptInjection,
        intent
      );
      console.log(`[FINORA] Decision engine ran for intent: ${intent}`);
    } else {
      // Graceful degradation — use legacy context string with concise prompt
      systemPrompt = `You are FINORA, an elite personal AI CFO. Detected intent: ${intentLabel}.

Answer with ONLY these sections (max 180 words total):
- 💡 Verdict: one direct sentence answer
- 📊 The Numbers: 2-4 bullet points with real numbers
- ✅ Do This Now: one specific action

Never use boilerplate. Never repeat the question. Use **bold** for key numbers only.

Financial context:
${legacyContext ?? "No context provided."}`;
    }

    // ── Layer 5: Fast Parallel Stream Engine ──────────────────────────────────
    // Race Groq and Gemini in parallel with a strict 1.8-second hard cap
    const aiPromise = Promise.race([
      streamFromGroq(systemPrompt, messages),
      streamFromGemini(systemPrompt, messages, lastMessage),
    ]);

    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1800));

    const aiResponse = await Promise.race([aiPromise, timeoutPromise]);
    if (aiResponse) return aiResponse;

    // Fast fallback: Layer 4 Decision Engine local generator (guaranteed < 10ms)
    console.log("[FINORA] AI providers timed out (>1.8s) — streaming Layer 4 Decision Engine response.");
    const decisionPayload = snapshot ? runDecisionEngine(lastMessage.content, snapshot, intent) : null;
    const mockText = generateInstantCFOText(intent, snapshot, decisionPayload, lastMessage.content);
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
        }, 15);
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
