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

export default function ChatPage() {
  const { balance, monthlyIncome, monthlyExpenses, savingsRate, investments, goals, transactions } = useFinance();
  const [financialContext, setFinancialContext] = useState("");

  useEffect(() => {
    // Safely load local storage data
    const budgetsRaw = localStorage.getItem("finora_budgets");
    const cardsRaw = localStorage.getItem("finora_credit_cards");

    const budgets = budgetsRaw ? JSON.parse(budgetsRaw) : [];
    const cards = cardsRaw ? JSON.parse(cardsRaw) : [];

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

    // Format top 5 recent transactions
    const recentTx = transactions.slice(0, 5).map(t =>
      `${t.date}: ${t.name} - ${formatCurrency(t.amount)} (${t.category})`
    ).join("\n      ");

    const contextStr = `
    User Financial Context:
    - Current Balance: ${formatCurrency(balance)}
    - Monthly Income: ${formatCurrency(monthlyIncome)}
    - Monthly Expenses: ${formatCurrency(monthlyExpenses)}
    - Savings Rate: ${savingsRate.toFixed(2)}%
    - Today's Safe-To-Spend Limit: ${formatCurrency(safeToSpendVal)}

    Budgets:
    ${budgets.map((b: any) => `- ${b.category || b.name}: Spent ${formatCurrency(b.spent || 0)} / Limit ${formatCurrency(b.limit || b.budget || 0)}`).join("\n    ") || "None set"}

    Credit Cards:
    ${cards.map((c: any) => `- ${c.name} (${c.network}, ${c.color}): Limit ${formatCurrency(parseInt(c.limit?.replace(/,/g, '') || '0') || 0)}, Perks: ${c.perks.join(", ")}`).join("\n    ") || "None added"}

    Investments:
    ${investments.map(i => `- ${i.name} (${i.type}): Value ${formatCurrency(i.current_value)}`).join("\n    ") || "None"}

    Goals:
    ${goals.map(g => `- ${g.name}: ${formatCurrency(g.current_amount)} / ${formatCurrency(g.target_amount)}`).join("\n    ") || "None"}

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

  return (
    <div className="flex flex-col h-[calc(100dvh-13rem)] md:h-[calc(100vh-10rem)] max-w-4xl mx-auto">
      <div className="mb-4">
        <h2 className="text-3xl font-bold tracking-tight">AI CFO Assistant</h2>
        <p className="text-muted-foreground">
          Ask questions about your finances and get data-driven advice.
        </p>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden border-border shadow-level-1">
        <CardHeader className="bg-secondary/30 py-3 border-b border-border">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Bot className="h-4 w-4 text-foreground" /> Active Session
            <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground font-normal">
              <Sparkles className="h-3 w-3 text-violet-600 animate-pulse" /> Powered by Gemini AI
            </span>
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-secondary/15">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.role === "user" ? "ml-auto flex-row-reverse max-w-[85%]" : "max-w-[85%]"
                )}
              >
                <div
                  className={cn(
                    "flex shrink-0 h-8 w-8 items-center justify-center rounded-full border border-border shadow-sm",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-foreground"
                  )}
                >
                  {message.role === "user" ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>
                <div
                  className={cn(
                    "flex flex-col rounded-lg p-3 text-sm shadow-sm",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border text-foreground"
                  )}
                >
                  {message.content ? (
                    <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  ) : (
                    // Typing indicator for empty assistant message (while streaming)
                    <div className="flex gap-1.5 items-center h-4">
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" />
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0.4s]" />
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-card border-t border-border">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1"
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading || !input.trim()}>
                <Send className="h-4 w-4" />
                <span className="sr-only">Send</span>
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
