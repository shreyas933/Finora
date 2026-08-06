"use client";

import { useState, useRef, useEffect, FormEvent, Fragment } from "react";
import { useFinance } from "@/context/FinanceContext";
import { Sparkles, Send, Search, ChevronDown, ChevronUp, Calculator, ShieldAlert, Target, Lightbulb } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { buildFinancialSnapshot } from "@/lib/ai/financialContextBuilder";
import { detectIntent, getIntentLabel } from "@/lib/ai/intentDetector";
import type { FinancialSnapshot, WalletCard, BudgetItem, UserProfile, MemoryItem } from "@/lib/ai/financialContextBuilder";

// ── Types ──────────────────────────────────────────────────────────────────────
type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

// ── Markdown Renderer ──────────────────────────────────────────────────────────
function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-bold text-white">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*") && !part.startsWith("**")) {
      return <em key={i} className="italic text-white/90">{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={i} className="px-1.5 py-0.5 rounded bg-white/15 font-mono text-xs text-amber-200">{part.slice(1, -1)}</code>;
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

function MarkdownMessage({ content, isUser }: { content: string; isUser: boolean }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;
  let bulletBuffer: string[] = [];

  const flushBullets = () => {
    if (bulletBuffer.length === 0) return;
    elements.push(
      <ul key={`ul-${i}`} className="space-y-1.5 my-2 pl-1">
        {bulletBuffer.map((item, idx) => (
          <li key={idx} className="flex items-start gap-2 leading-snug">
            <span className="mt-[6px] shrink-0 w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>{renderInline(item)}</span>
          </li>
        ))}
      </ul>
    );
    bulletBuffer = [];
  };

  while (i < lines.length) {
    const line = lines[i];

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      flushBullets();
      elements.push(<hr key={`hr-${i}`} className="border-white/10 my-3" />);
      i++;
      continue;
    }

    // Headings (### or ##)
    const headingMatch = line.match(/^#{1,3}\s+(.+)/);
    if (headingMatch) {
      flushBullets();
      elements.push(
        <p key={`h-${i}`} className="text-[13px] font-black uppercase tracking-widest text-amber-300 mt-4 mb-1.5 first:mt-0">
          {headingMatch[1]}
        </p>
      );
      i++;
      continue;
    }

    // Emoji section label
    const emojiHeadingMatch = line.match(/^([\p{Emoji_Presentation}\p{Emoji}\u200d]+)\s+(.+)/u);
    if (emojiHeadingMatch && line.trim().length < 60 && !line.startsWith("-") && !line.startsWith("*")) {
      const isSection = /^(Verdict|Breakdown|Numbers|Watch\s*Out|What\s*to|Best\s*Card|Optimise|Risk|Action|Summary|Analysis|Impact|Recommendation|CFO|Do\s*This)/i.test(emojiHeadingMatch[2]);
      if (isSection) {
        flushBullets();
        elements.push(
          <p key={`eh-${i}`} className="text-[12px] font-black uppercase tracking-widest text-white/70 mt-3.5 mb-1 first:mt-0 flex items-center gap-1.5">
            {line}
          </p>
        );
        i++;
        continue;
      }
    }

    // Bullet list (- / * / •)
    const bulletMatch = line.match(/^[\-\*•]\s+(.+)/);
    if (bulletMatch) {
      bulletBuffer.push(bulletMatch[1]);
      i++;
      continue;
    }

    // Numbered list (1. 2.)
    const numberedMatch = line.match(/^(\d+)\.\s+(.+)/);
    if (numberedMatch) {
      bulletBuffer.push(`**${numberedMatch[1]}.** ${numberedMatch[2]}`);
      i++;
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      flushBullets();
      if (elements.length > 0) {
        elements.push(<div key={`sp-${i}`} className="h-1" />);
      }
      i++;
      continue;
    }

    // Paragraph
    flushBullets();
    elements.push(
      <p key={`p-${i}`} className="leading-relaxed">
        {renderInline(line)}
      </p>
    );
    i++;
  }

  flushBullets();
  return <div className="space-y-0.5 text-[15px]">{elements}</div>;
}

// ── Deep Explanation Panel Component ─────────────────────────────────────────
function DeepExplanationPanel({ message, onAskDetailed }: { message: Message; onAskDetailed: (query: string) => void }) {
  return (
    <div className="mt-3 bg-black/40 backdrop-blur-md rounded-xl p-4 border border-white/20 text-white shadow-2xl animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-amber-300" />
          <span className="text-xs font-bold uppercase tracking-wider text-amber-200">FINORA Decision Logic & Proof</span>
        </div>
        <span className="text-[10px] bg-amber-400/20 text-amber-300 font-semibold px-2 py-0.5 rounded-full border border-amber-400/30">
          Layer 4 Engine Verified
        </span>
      </div>

      <div className="space-y-3 text-xs leading-relaxed">
        <div className="bg-white/5 p-2.5 rounded-lg border border-white/10">
          <div className="flex items-center gap-1.5 font-bold text-amber-300 mb-1">
            <Target className="w-3.5 h-3.5" />
            <span>Mathematical Safe-To-Spend Matrix</span>
          </div>
          <p className="text-white/80">
            Calculated via <code className="text-amber-200">SafeToSpend = (Balance - RecurringObligations - GoalReservations) / DaysLeft</code>.
            Ensures emergency funds (3x monthly spend) remain uncompromised.
          </p>
        </div>

        <div className="bg-white/5 p-2.5 rounded-lg border border-white/10">
          <div className="flex items-center gap-1.5 font-bold text-amber-300 mb-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Risk Radar & Credit Utilization Thresholds</span>
          </div>
          <p className="text-white/80">
            Card recommendation factors statement cycle timing (interest-free 45-day window) and keeps individual credit utilization below 30% to guard CIBIL score.
          </p>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5 text-white/60 text-[11px]">
            <Lightbulb className="w-3.5 h-3.5 text-amber-300" />
            <span>Need deeper math?</span>
          </div>
          <button
            type="button"
            onClick={() => onAskDetailed("Explain the mathematical calculations and decision logic behind this CFO verdict in full detail")}
            className="text-[11px] font-bold text-amber-300 hover:text-amber-200 underline cursor-pointer"
          >
            Ask CFO to explain math step-by-step →
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Quick action buttons ──────────────────────────────────────────────────────
const quickButtons = [
  { emoji: "🛒", text: "New Phone", query: "Can I afford a new phone?" },
  { emoji: "✈", text: "Goa Trip", query: "Can I afford a Goa trip?" },
  { emoji: "🚗", text: "Buy a Bike", query: "Can I afford to buy a bike?" },
  { emoji: "📈", text: "Invest ₹10,000", query: "Can I afford to invest ₹10,000?" },
  { emoji: "🏠", text: "Increase Rent", query: "Can I afford to increase rent?" },
  { emoji: "💳", text: "Which card?", query: "Which credit card should I use?" },
];

// ── localStorage helpers ───────────────────────────────────────────────────────
function loadWalletItems(): WalletCard[] {
  try {
    const raw = localStorage.getItem("finora_wallet_items");
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function loadBudgets(): BudgetItem[] {
  try {
    const raw = localStorage.getItem("finora_budgets");
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function loadUserProfile(): UserProfile {
  try {
    const raw = localStorage.getItem("finora_user_profile");
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function loadMemory(): MemoryItem[] {
  try {
    const raw = localStorage.getItem("finora_ai_memory");
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function ChatPage() {
  const {
    balance, monthlyIncome, monthlyExpenses, savingsRate, healthScore,
    investments, goals, transactions,
  } = useFinance();

  const [snapshot, setSnapshot] = useState<FinancialSnapshot | null>(null);
  const [activeIntentLabel, setActiveIntentLabel] = useState<string | null>(null);
  const [expandedDeepExplains, setExpandedDeepExplains] = useState<Record<string, boolean>>({});

  const toggleDeepExplain = (id: string) => {
    setExpandedDeepExplains((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    const walletItems = loadWalletItems();
    const budgets = loadBudgets();
    const profile = loadUserProfile();
    const mem = loadMemory();

    const built = buildFinancialSnapshot({
      transactions,
      goals,
      investments,
      balance,
      monthlyIncome,
      monthlyExpenses,
      savingsRate,
      healthScore,
      walletItems,
      budgets,
      profile,
      memory: mem,
      formatCurrency,
    });

    setSnapshot(built);
  }, [balance, monthlyIncome, monthlyExpenses, savingsRate, healthScore, investments, goals, transactions]);

  useEffect(() => {
    if (!snapshot) return;
    const params = new URLSearchParams(window.location.search);
    const query = params.get("q");
    if (query) {
      window.history.replaceState({}, document.title, window.location.pathname);
      const timer = setTimeout(() => {
        handleSendMessage(query);
      }, 400);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot]);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! I am your AI Personal CFO. I have access to your complete financial profile — balances, budgets, goals, investments, and credit cards. Ask me anything: 'Can I afford this?', 'Which card should I use?', 'How are my goals doing?', or 'Give me my weekly summary.'",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (query: string) => {
    if (!query.trim() || isLoading) return;

    const intent = detectIntent(query);
    const label = getIntentLabel(intent);
    setActiveIntentLabel(label);

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: query,
    };

    const assistantId = (Date.now() + 1).toString();
    const assistantMsg: Message = { id: assistantId, role: "assistant", content: "" };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const historyForApi = [...messages, userMsg];

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: historyForApi.map((m) => ({ role: m.role, content: m.content })),
          financialContext: snapshot ? JSON.stringify(snapshot) : null,
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
            ? { ...m, content: `⚠️ ${errMsg}. Please try again.` }
            : m
        )
      );
    } finally {
      setIsLoading(false);
      setActiveIntentLabel(null);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleSendMessage(input.trim());
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
                "rounded-2xl p-4 shadow-lg bg-gradient-to-br from-primary to-secondary text-white w-full",
                message.role === "user" ? "rounded-tr-sm text-[15px] leading-relaxed max-w-[85%] ml-auto" : "rounded-tl-sm"
              )}
            >
              {message.content ? (
                message.role === "assistant" ? (
                  <MarkdownMessage content={message.content} isUser={false} />
                ) : (
                  <div className="whitespace-pre-wrap text-[15px] leading-relaxed">{message.content}</div>
                )
              ) : (
                /* Loading state */
                <div className="flex flex-col gap-2">
                  {activeIntentLabel && (
                    <div className="text-xs text-white/70 font-semibold tracking-wide mb-1 animate-pulse flex items-center gap-1.5">
                      {activeIntentLabel}
                    </div>
                  )}
                  <div className="flex gap-1.5 items-center h-5">
                    <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
            </div>

            {/* Deep Explanation Button (for Assistant Messages) */}
            {message.role === "assistant" && message.content && message.id !== "welcome" && (
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => toggleDeepExplain(message.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/30 bg-card hover:bg-accent text-card-foreground text-xs font-semibold transition-all active:scale-95 shadow-sm cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5 text-primary" />
                  <span>{expandedDeepExplains[message.id] ? "Hide Deep Explanation" : "🔍 Deep Explanation"}</span>
                  {expandedDeepExplains[message.id] ? (
                    <ChevronUp className="w-3.5 h-3.5 opacity-60" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                  )}
                </button>

                {/* Expanded Deep Explanation Panel */}
                {expandedDeepExplains[message.id] && (
                  <DeepExplanationPanel message={message} onAskDetailed={handleSendMessage} />
                )}
              </div>
            )}

            {/* Quick buttons after welcome message */}
            {message.id === "welcome" && messages.length === 1 && (
              <div className="mt-4 flex flex-wrap gap-2.5 max-w-2xl">
                {quickButtons.map((btn) => (
                  <button
                    key={btn.text}
                    type="button"
                    onClick={() => handleSendMessage(btn.query)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-accent text-card-foreground text-sm font-semibold transition-all active:scale-95 shadow-sm cursor-pointer"
                  >
                    <span>{btn.emoji}</span>
                    <span>{btn.text}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Interactive option cards */}
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
            placeholder="Ask your CFO anything..."
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
