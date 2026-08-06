"use client";

import { useState, useRef, useEffect, Fragment } from "react";
import { usePathname } from "next/navigation";
import { useFinance } from "@/context/FinanceContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, MessageSquare, X, Send, ChevronDown, ChevronUp,
  Activity, ShieldAlert, Target, Lightbulb, Zap, ArrowRight, Loader2
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { buildFinancialSnapshot, FinancialSnapshot, WalletCard, BudgetItem, UserProfile, MemoryItem } from "@/lib/ai/financialContextBuilder";
import { detectIntent, getIntentLabel } from "@/lib/ai/intentDetector";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

// ── Smart Context mapping based on pathname ──────────────────────────────────
const ROUTE_CONTEXTS: Record<string, { label: string; badge: string; defaultQuery: string }> = {
  "/goals": {
    label: "Ask about your goals",
    badge: "Goals Mode",
    defaultQuery: "How are my goals performing this month?"
  },
  "/credit": {
    label: "Ask which card to use",
    badge: "Card Advisor",
    defaultQuery: "Which credit card gives the best rewards for my next purchase?"
  },
  "/transactions": {
    label: "Ask why you spent more",
    badge: "Expense Audit",
    defaultQuery: "Where did I spend the most money this month?"
  },
  "/dashboard": {
    label: "Ask anything",
    badge: "Financial Copilot",
    defaultQuery: "Can you summarize my financial health right now?"
  }
};

const QUICK_CHIPS = [
  { label: "Can I Buy This?", query: "Can I afford to spend ₹5,000 on a new purchase right now?" },
  { label: "Best Card", query: "Which credit card should I use for dining and shopping?" },
  { label: "Safe To Spend", query: "What is my safe-to-spend limit today?" },
  { label: "Goal Impact", query: "How will a ₹3,000 expense impact my savings goals?" },
  { label: "Purchase Impact", query: "Will buying a phone this month push me over budget?" },
  { label: "Budget Help", query: "Which budget category am I overspending on?" },
  { label: "Compare Options", query: "Should I pay off credit card debt or add to my savings goal?" },
  { label: "Weekly Review", query: "Give me a breakdown of my financial wins and risks this week." }
];

// ── Inline Markdown Renderer ────────────────────────────────────────────────
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

function CopilotMarkdownMessage({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;
  let bulletBuffer: string[] = [];

  const flushBullets = () => {
    if (bulletBuffer.length === 0) return;
    elements.push(
      <ul key={`ul-${i}`} className="space-y-1.5 my-2 pl-1">
        {bulletBuffer.map((item, idx) => (
          <li key={idx} className="flex items-start gap-2 leading-snug text-sm text-foreground/90">
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

    if (/^---+$/.test(line.trim())) {
      flushBullets();
      elements.push(<hr key={`hr-${i}`} className="border-white/10 my-3" />);
      i++;
      continue;
    }

    const headingMatch = line.match(/^#{1,3}\s+(.+)/);
    if (headingMatch) {
      flushBullets();
      elements.push(
        <p key={`h-${i}`} className="text-[12px] font-black uppercase tracking-widest text-amber-300 mt-3 mb-1 first:mt-0">
          {headingMatch[1]}
        </p>
      );
      i++;
      continue;
    }

    const bulletMatch = line.match(/^[\-\*•]\s+(.+)/);
    if (bulletMatch) {
      bulletBuffer.push(bulletMatch[1]);
      i++;
      continue;
    }

    if (line.trim() !== "") {
      flushBullets();
      elements.push(
        <p key={`p-${i}`} className="my-1.5 leading-relaxed text-sm text-foreground/90">
          {renderInline(line)}
        </p>
      );
    }

    i++;
  }

  flushBullets();

  return <div className="space-y-1">{elements}</div>;
}

// ── Expandable Section Card Component ──────────────────────────────────────────
function ExpandableCopilotSection({ title, icon: Icon, colorClass, children }: { title: string; icon: any; colorClass: string; children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="my-2 rounded-xl border border-white/10 bg-black/40 overflow-hidden transition-colors">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-white transition-colors"
      >
        <span className={cn("flex items-center gap-2", colorClass)}>
          <Icon className="h-4 w-4" />
          {title}
        </span>
        {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="px-3.5 pb-3 pt-1 border-t border-white/5 text-xs text-foreground/80 leading-relaxed"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main Floating Copilot Component ────────────────────────────────────────────
export function FloatingCopilot() {
  const pathname = usePathname() || "/dashboard";
  const {
    balance, monthlyIncome, monthlyExpenses, savingsRate, healthScore,
    investments, goals, transactions
  } = useFinance();

  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [snapshot, setSnapshot] = useState<FinancialSnapshot | null>(null);
  const [activeIntentLabel, setActiveIntentLabel] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! I am your AI Financial CFO. I have access to your active financial profile — balances, budgets, goals, and cards. Ask me anything or pick a quick prompt below!",
    },
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isLoading]);

  // First launch tooltip logic
  useEffect(() => {
    const hasSeenTooltip = localStorage.getItem("finora_copilot_seen_fab");
    if (!hasSeenTooltip) {
      setShowTooltip(true);
      const timer = setTimeout(() => {
        setShowTooltip(false);
        localStorage.setItem("finora_copilot_seen_fab", "true");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Build snapshot context on mount or when context changes
  useEffect(() => {
    const loadItems = <T,>(key: string): T[] => {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : [];
      } catch { return []; }
    };

    const walletItems = loadItems<WalletCard>("finora_wallet_items");
    const budgets = loadItems<BudgetItem>("finora_budgets");
    const profile = loadItems<UserProfile>("finora_user_profile");
    const mem = loadItems<MemoryItem>("finora_ai_memory");

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
      profile: (profile as any) || {},
      memory: mem,
      formatCurrency: (n: number) => formatCurrency(n),
    });

    setSnapshot(built);
  }, [transactions, goals, investments, balance, monthlyIncome, monthlyExpenses, savingsRate, healthScore]);

  // Determine current page smart context
  const currentContext = ROUTE_CONTEXTS[pathname] || ROUTE_CONTEXTS["/dashboard"];

  const handleSendMessage = async (queryText: string) => {
    if (!queryText.trim() || isLoading) return;

    const intent = detectIntent(queryText);
    const label = getIntentLabel(intent);
    setActiveIntentLabel(label);

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: queryText,
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
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content:
                  "I'm sorry, I encountered a temporary connection issue. Please check your context or try asking again.",
              }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleFabClick = () => {
    setIsOpen(true);
    setShowTooltip(false);
    localStorage.setItem("finora_copilot_seen_fab", "true");
  };

  return (
    <>
      {/* ── 1. Floating Action Button (FAB) ── */}
      <div className="fixed bottom-20 md:bottom-8 right-6 z-50 flex items-center gap-3">
        {/* Tooltip on first launch */}
        <AnimatePresence>
          {showTooltip && !isOpen && (
            <motion.div
              initial={{ opacity: 0, x: 10, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 10, scale: 0.95 }}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/90 text-white text-xs font-semibold shadow-xl border border-primary/40 backdrop-blur-md"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-300 animate-pulse" />
              <span>Ask your CFO</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FAB Button */}
        {!isOpen && (
          <motion.button
            onClick={handleFabClick}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative w-[60px] h-[60px] rounded-full bg-gradient-to-br from-primary via-primary/90 to-primary/70 text-white border border-primary/40 shadow-[0_8px_30px_rgba(129,1,0,0.5)] hover:shadow-[0_0_35px_rgba(129,1,0,0.7)] flex items-center justify-center transition-all duration-200 cursor-pointer group"
            title="Ask AI CFO"
          >
            {/* Idle Breathing Outer Halo */}
            <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping opacity-30 pointer-events-none" />

            <div className="relative flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-amber-300 drop-shadow-[0_0_10px_rgba(251,191,36,0.6)] group-hover:rotate-12 transition-transform duration-300" />
              <MessageSquare className="h-3.5 w-3.5 text-white absolute -bottom-1 -right-1 drop-shadow-md" />
            </div>
          </motion.button>
        )}
      </div>

      {/* ── 2. Floating AI Panel (Slide-up Glass Drawer) ── */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Darkened Glass Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 cursor-pointer"
            />

            {/* Slide-up Drawer Container */}
            <motion.div
              initial={{ y: "100%", opacity: 0.5 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="fixed bottom-0 right-0 md:right-6 w-full md:max-w-xl h-[75vh] max-h-[720px] rounded-t-3xl border-t md:border border-white/15 bg-black/90 backdrop-blur-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between bg-white/[0.03]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center shadow-[0_0_15px_rgba(129,1,0,0.3)]">
                    <Sparkles className="h-4 w-4 text-amber-300" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold text-white tracking-tight">AI CFO</h3>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-primary/20 text-red-300 border border-primary/30">
                        Copilot
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      Using your financial context
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-semibold text-emerald-400">
                    <Activity className="h-3 w-3" />
                    <span>Score: {healthScore.toFixed(0)}</span>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-full hover:bg-white/10 text-muted-foreground hover:text-white transition-colors cursor-pointer"
                    title="Close Copilot"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Page-Aware Context Header Bar */}
              <div className="px-5 py-2 bg-gradient-to-r from-primary/10 via-white/[0.02] to-transparent border-b border-white/5 flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                  <Zap className="h-3.5 w-3.5 text-amber-400" />
                  {currentContext.label}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full">
                  {currentContext.badge}
                </span>
              </div>

              {/* Quick Action Chips Bar */}
              <div className="px-4 py-2.5 border-b border-white/5 overflow-x-auto scrollbar-none flex items-center gap-2 shrink-0 bg-black/40">
                {QUICK_CHIPS.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(chip.query)}
                    disabled={isLoading}
                    className="whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold bg-white/5 hover:bg-primary/20 border border-white/10 hover:border-primary/40 text-muted-foreground hover:text-white transition-all cursor-pointer disabled:opacity-50 shrink-0 active:scale-95"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Chat Message Scroll Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => {
                  const isUser = msg.role === "user";
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn("flex flex-col", isUser ? "items-end" : "items-start")}
                    >
                      <div
                        className={cn(
                          "max-w-[85%] px-4 py-3 text-sm shadow-md transition-all",
                          isUser
                            ? "bg-primary text-white rounded-2xl rounded-br-sm shadow-[0_4px_15px_rgba(129,1,0,0.3)]"
                            : "bg-muted/80 border border-white/10 text-foreground rounded-2xl rounded-bl-sm backdrop-blur-xl shadow-[0_4px_15px_rgba(0,0,0,0.2)]"
                        )}
                      >
                        {isUser ? (
                          <p className="leading-relaxed text-white font-medium">{msg.content}</p>
                        ) : (
                          <div>
                            <CopilotMarkdownMessage content={msg.content} />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}

                {/* Animated Typing Indicator */}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3.5 rounded-2xl bg-muted/70 border border-white/10 text-xs text-amber-300 w-max"
                  >
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="font-semibold">AI CFO is calculating mathematical boundaries...</span>
                  </motion.div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Bottom Input Field Bar */}
              <div className="p-3.5 border-t border-white/10 bg-black/60 backdrop-blur-md">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage(input);
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={currentContext.label + "…"}
                    className="flex-1 bg-white/5 border border-white/15 focus:border-primary/60 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="h-9 w-9 rounded-xl bg-primary hover:bg-primary/90 text-white flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_12px_rgba(129,1,0,0.4)] cursor-pointer active:scale-95 shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
