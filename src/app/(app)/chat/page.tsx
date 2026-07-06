"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import { useFinance } from "@/context/FinanceContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Bot, Send, User, Sparkles } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const quickButtons = [
  { emoji: "🛒", text: "New Phone", query: "Can I afford a new phone?" },
  { emoji: "✈", text: "Goa Trip", query: "Can I afford a Goa trip?" },
  { emoji: "🚗", text: "Buy a Bike", query: "Can I afford to buy a bike?" },
  { emoji: "📈", text: "Invest ₹10,000", query: "Can I afford to invest ₹10,000?" },
  { emoji: "🏠", text: "Increase Rent", query: "Can I afford to increase rent?" },
  { emoji: "💳", text: "Which card?", query: "Which credit card should I use?" },
];

export default function ChatPage() {
  const { balance, monthlyIncome, monthlyExpenses, savingsRate, investments, goals, transactions } = useFinance();
  const [financialContext, setFinancialContext] = useState("");

  useEffect(() => {
    // Safely load local storage data
    const budgetsRaw = localStorage.getItem("finora_budgets");
    const walletRaw = localStorage.getItem("finora_wallet_items");

    const budgets = budgetsRaw ? JSON.parse(budgetsRaw) : [];
    const walletItems = walletRaw ? JSON.parse(walletRaw) : [];
    const creditCards = walletItems.filter((i: any) => i.type === "credit");

    // Tally current month discretionary safe to spend spendings
    let safeToSpendVal = 0;
    if (monthlyIncome > 0) {
      const discretionary = budgets.filter((b: any) => !["Rent & Utilities", "Healthcare", "Savings", "Rent", "Housing", "Medical"].includes(b.name || b.category));
      const discretionaryTarget = discretionary.reduce((acc: number, curr: any) => acc + Number(curr.budget || curr.limit || 0), 0);
      
      const fixed = budgets.filter((b: any) => ["Rent & Utilities", "Healthcare", "Savings", "Rent", "Housing", "Medical"].includes(b.name || b.category));
      const fixedTarget = fixed.reduce((acc: number, curr: any) => acc + Number(curr.budget || curr.limit || 0), 0);
      
      const maxDiscretionary = Math.max(0, monthlyIncome - fixedTarget);
      const target = budgets.length > 0 ? Math.min(discretionaryTarget, maxDiscretionary) : (monthlyIncome * 0.3);

      const currentMonth = new Date().getMonth();
      let discretionarySpent = 0;
      transactions.forEach(t => {
        if (t.type === "expense") {
          const txDate = new Date(t.date);
          if (txDate.getMonth() === currentMonth) {
            const isFixed = ["Rent & Utilities", "Healthcare", "Savings", "Rent", "Housing", "Medical"].some(k => t.category.includes(k));
            if (!isFixed) discretionarySpent += t.amount;
          }
        }
      });

      const remaining = Math.max(0, target - discretionarySpent);
      const now = new Date();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const daysLeft = Math.max(1, daysInMonth - now.getDate() + 1);
      safeToSpendVal = Math.round(remaining / daysLeft);
    }

    // Tally income sources
    const incomeTx = transactions.filter(t => t.type === "income");
    const incomeSources: Record<string, number> = {};
    incomeTx.forEach(t => {
      const cleanName = t.name.includes(" || ") ? t.name.split(" || ")[0] : t.name;
      const key = cleanName || t.category;
      incomeSources[key] = (incomeSources[key] ?? 0) + t.amount;
    });
    const incomeBreakdownStr = Object.entries(incomeSources)
      .map(([source, amt]) => `- ${source}: ${formatCurrency(amt)}`)
      .join("\n    ") || "No transaction-based income sources recorded.";

    // Tally expense categories
    const expenseTx = transactions.filter(t => t.type === "expense");
    const categorySpent: Record<string, number> = {};
    expenseTx.forEach(t => {
      categorySpent[t.category] = (categorySpent[t.category] ?? 0) + t.amount;
    });
    const categorySummaryStr = Object.entries(categorySpent)
      .map(([cat, amt]) => `- ${cat}: ${formatCurrency(amt)}`)
      .join("\n    ") || "No expense transactions recorded.";

    // Format top 10 recent transactions for better context depth
    const recentTx = transactions.slice(0, 10).map(t => {
      const cleanName = t.name.includes(" || ") ? t.name.split(" || ")[0] : t.name;
      return `${t.date}: ${cleanName} - ${formatCurrency(t.amount)} (${t.category}) [${t.type}]`;
    }).join("\n      ");

    const contextStr = `
    User Financial Context:
    - Current Balance: ${formatCurrency(balance)}
    - Monthly Income: ${formatCurrency(monthlyIncome)}
    - Monthly Expenses: ${formatCurrency(monthlyExpenses)}
    - Savings Rate: ${savingsRate.toFixed(2)}%
    - Today's Safe-To-Spend Limit: ${formatCurrency(safeToSpendVal)}

    Income Sources Breakdown:
    ${incomeBreakdownStr}

    Category Spending Summary:
    ${categorySummaryStr}

    Budgets:
    ${budgets.map((b: any) => `- ${b.category || b.name}: Spent ${formatCurrency(b.spent || 0)} / Limit ${formatCurrency(b.limit || b.budget || 0)}`).join("\n    ") || "None set"}

    Credit Cards:
    ${creditCards.map((card: any) => {
      const cardLimitNum = card.limit ? Number(card.limit.replace(/,/g, '')) : 0;
      const cardTx = transactions.filter(tx => {
        if (tx.type !== "expense") return false;
        const match = tx.name.match(/\((?:[^)]*?\s*)?([0-9]{4})\)$/);
        return match ? match[1] === card.number : false;
      });
      const outstanding = cardTx.reduce((sum, tx) => sum + tx.amount, 0);
      const util = cardLimitNum > 0 ? Math.min(100, Math.round((outstanding / cardLimitNum) * 100)) : 0;
      return `- ${card.name} (${card.network}): Outstanding ${formatCurrency(outstanding)} / Limit ${formatCurrency(cardLimitNum)} (Utilization: ${util}%, Billing Date: ${card.billingDate || "N/A"}th of the month, Perks: ${card.perks?.join(", ") || "None"})`;
    }).join("\n    ") || "None added"}

    Investments:
    ${investments.map(i => {
      const netGain = i.current_value - i.invested;
      const gainPercent = i.invested > 0 ? ((netGain / i.invested) * 100).toFixed(1) : "0.0";
      return `- ${i.name} (${i.type}): Value ${formatCurrency(i.current_value)} (Original Invested: ${formatCurrency(i.invested)}, Gain/Loss: ${netGain >= 0 ? "+" : ""}${formatCurrency(netGain)} [${gainPercent}%])`;
    }).join("\n    ") || "None"}

    Goals:
    ${goals.map(g => `- ${g.name}: Saved ${formatCurrency(g.current_amount)} of ${formatCurrency(g.target_amount)} (Target Date: ${g.target_date || "Not set"})`).join("\n    ") || "None"}

    Recent Transactions:
    ${recentTx || "None"}
    `;

    setFinancialContext(contextStr);
  }, [balance, monthlyIncome, monthlyExpenses, savingsRate, investments, goals, transactions]);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! I am your AI Personal CFO. I have access to your current financial context. How can I help you today? You can ask me things like 'Can I afford a trip?' or 'How can I increase my savings?'",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!financialContext) return;
    const params = new URLSearchParams(window.location.search);
    const query = params.get("q");
    if (query) {
      window.history.replaceState({}, document.title, window.location.pathname);
      const timer = setTimeout(() => {
        handleQuickButtonClick(query);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [financialContext]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: trimmed,
    };

    const assistantId = (Date.now() + 1).toString();
    const assistantMsg: Message = { id: assistantId, role: "assistant", content: "" };

    // Optimistic update — add both messages immediately
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
    setIsLoading(true);

    try {
      // Use all current messages (before the new user msg) as history
      const historyForApi = [...messages, userMsg];

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: historyForApi.map((m) => ({ role: m.role, content: m.content })),
          financialContext,
        }),
      });

      if (!response.ok || !response.body) {
        const errText = await response.text();
        throw new Error(errText || "API error");
      }

      // Stream the response word-by-word into the assistant message
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: m.content + chunk } : m
          )
        );
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Unknown error";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: `⚠️ Error: ${errMsg}. Please try again.` }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickButtonClick = async (query: string) => {
    if (isLoading) return;
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: query,
    };

    const assistantId = (Date.now() + 1).toString();
    const assistantMsg: Message = { id: assistantId, role: "assistant", content: "" };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsLoading(true);

    try {
      const historyForApi = [...messages, userMsg];

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: historyForApi.map((m) => ({ role: m.role, content: m.content })),
          financialContext,
        }),
      });

      if (!response.ok || !response.body) {
        const errText = await response.text();
        throw new Error(errText || "API error");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: m.content + chunk } : m
          )
        );
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Unknown error";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: `⚠️ Error: ${errMsg}. Please try again.` }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-7.5rem)] md:h-[calc(100vh-4rem)] max-w-4xl mx-auto bg-background text-foreground font-sans -m-4 md:-m-8 p-4">
      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto space-y-6 pb-4 scrollbar-hide">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex flex-col max-w-[90%]",
              message.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
            )}
          >
            {message.role === "assistant" && (
              <div className="flex items-center gap-2 mb-2">
                 <div className="p-1">
                   <Sparkles className="w-4 h-4 text-primary" />
                 </div>
              </div>
            )}
            
            <div
              className={cn(
                "rounded-2xl p-4 text-[15px] leading-relaxed shadow-lg bg-gradient-to-br from-primary to-secondary text-white",
                message.role === "user" ? "rounded-tr-sm" : "rounded-tl-sm"
              )}
            >
              {message.content ? (
                <div className="whitespace-pre-wrap">{message.content}</div>
              ) : (
                <div className="flex gap-1.5 items-center h-5">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce [animation-delay:0.4s]" />
                </div>
              )}
            </div>

            {message.id === "welcome" && messages.length === 1 && (
              <div className="mt-4 flex flex-wrap gap-2.5 max-w-2xl">
                {quickButtons.map((btn) => (
                  <button
                    key={btn.text}
                    type="button"
                    onClick={() => handleQuickButtonClick(btn.query)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-accent text-card-foreground text-sm font-semibold transition-all active:scale-95 shadow-sm cursor-pointer"
                  >
                    <span>{btn.emoji}</span>
                    <span>{btn.text}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Example custom interactive cards for assistant (mocked if content includes certain keywords for demo) */}
            {message.role === "assistant" && message.content.includes("approach this:") && (
              <div className="mt-3 bg-card rounded-2xl p-4 border border-border shadow-lg w-full">
                <div className="space-y-3">
                  <div className="p-3 rounded-xl border border-border bg-muted/50">
                    <div className="text-xs font-bold text-foreground mb-1">CASH ACCUMULATION</div>
                    <div className="text-sm text-muted-foreground">Save ₹8,333/mo for 3 months. Safest, zero debt.</div>
                  </div>
                  <div className="p-3 rounded-xl border border-primary/50 bg-primary/10">
                    <div className="flex justify-between items-center mb-1">
                      <div className="text-xs font-bold text-foreground">CARD OPTIMIZATION</div>
                      <div className="text-[10px] font-bold text-red-400 bg-primary/20 px-2 py-0.5 rounded-full">RECOMMENDED</div>
                    </div>
                    <div className="text-sm text-muted-foreground">HDFC card gives 5% cashback. Pay within grace period.</div>
                  </div>
                  <div className="p-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5">
                    <div className="text-xs font-bold text-white mb-1">PAUSE A GOAL</div>
                    <div className="text-sm text-white/60">Pause Goa Trip temporarily. Delays goal by 9 days.</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="w-full pt-4 pb-[23px] bg-background z-10 shrink-0">
        <form onSubmit={handleSubmit} className="flex items-center gap-3 bg-muted rounded-full p-2 pl-6 shadow-[0_8px_30px_rgb(0,0,0,0.5)] border border-border">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your finances..."
            className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-base min-w-0"
            disabled={isLoading}
          />
          <button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            className="bg-primary text-primary-foreground p-3 rounded-full shadow-[0_0_15px_rgb(129,1,0,0.5)] hover:opacity-90 disabled:opacity-50 transition-all shrink-0"
          >
            <Send className="w-5 h-5 fill-current" />
          </button>
        </form>
      </div>
    </div>
  );
}
