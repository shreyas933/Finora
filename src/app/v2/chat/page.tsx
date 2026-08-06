"use client";

import { useState, useRef, useEffect, FormEvent, Fragment } from "react";
import { useFinance } from "@/context/FinanceContext";
import { Send, Sparkles } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { buildFinancialSnapshot } from "@/lib/ai/financialContextBuilder";
import { detectIntent } from "@/lib/ai/intentDetector";
import { motion, AnimatePresence } from "framer-motion";
import { useCurrency } from "@/context/CurrencyContext";

type Message = { id: string; role: "user" | "assistant"; content: string };

// Reuse the inline markdown renderer from the original chat
function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**"))
      return <strong key={i} className="font-bold text-white">{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*") && !part.startsWith("**"))
      return <em key={i} className="italic">{part.slice(1, -1)}</em>;
    if (part.startsWith("`") && part.endsWith("`"))
      return <code key={i} className="px-1 py-0.5 rounded bg-[#1A1A1A] font-mono text-xs text-amber-300">{part.slice(1, -1)}</code>;
    return <Fragment key={i}>{part}</Fragment>;
  });
}

function ChatBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  const lines = msg.content.split("\n");

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="w-6 h-6 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center mr-2 mt-1 shrink-0">
          <Sparkles className="w-3 h-3 text-primary" />
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-primary/10 border border-primary/20 text-[#FAFAFA] rounded-br-sm"
            : "bg-[#111] border border-[#1E1E1E] text-[#A3A3A3] rounded-bl-sm"
        }`}
      >
        {lines.map((line, i) => {
          if (line.startsWith("- ") || line.startsWith("• "))
            return (
              <div key={i} className="flex items-start gap-2 my-0.5">
                <span className="w-1 h-1 rounded-full bg-primary mt-2 shrink-0" />
                <span>{renderInline(line.slice(2))}</span>
              </div>
            );
          if (/^#{1,3} /.test(line))
            return <p key={i} className="font-bold text-white mt-2 mb-0.5">{renderInline(line.replace(/^#+\s/, ""))}</p>;
          if (line.trim() === "") return <div key={i} className="h-1.5" />;
          return <p key={i}>{renderInline(line)}</p>;
        })}
      </div>
    </div>
  );
}

const PROMPT_CHIPS = [
  { label: "Am I saving enough?", emoji: "💰" },
  { label: "Where am I overspending?", emoji: "📊" },
  { label: "What is the 50-30-20 rule?", emoji: "📐" },
  { label: "How to build an emergency fund?", emoji: "🛡️" },
  { label: "Explain my health score", emoji: "💡" },
  { label: "Tips to cut food spending", emoji: "🍔" },
];

export default function ChatV2() {
  const { transactions, balance, goals, monthlyIncome, monthlyExpenses, healthScore } = useFinance();
  const { currency } = useCurrency();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showChips, setShowChips] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const buildContext = () => {
    const walletCards: any[] = (() => {
      try { return JSON.parse(localStorage.getItem("finora_wallet_items") || "[]"); } catch { return []; }
    })();
    const budgetItems: any[] = (() => {
      try { return JSON.parse(localStorage.getItem("finora_budgets") || "[]"); } catch { return []; }
    })();
    return buildFinancialSnapshot({ transactions, balance, goals, monthlyIncome, monthlyExpenses, healthScore, walletCards, budgetItems, currency });
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setShowChips(false);

    try {
      const snapshot = buildContext();
      const intent = detectIntent(text, transactions, monthlyIncome, monthlyExpenses, healthScore);
      const history = messages.map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, snapshot, history, intent }),
      });

      const data = await res.json();
      const reply = data.message || data.response || data.content || "Sorry, I couldn't process that.";
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "assistant", content: "Something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="mb-3">
        <p className="text-[9px] uppercase tracking-widest text-[#525252] font-bold">AI CFO</p>
        <h2 className="text-xl font-black tracking-tight text-white">Ask about your money</h2>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-3">
        {/* Empty state with chip orbit */}
        {messages.length === 0 && showChips && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-8 gap-5"
          >
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-[#A3A3A3]">Your AI Financial CFO</p>
              <p className="text-xs text-[#525252] mt-1">Ask anything about your money — no jargon</p>
            </div>

            {/* Prompt chips */}
            <div className="flex flex-wrap gap-2 justify-center max-w-md">
              {PROMPT_CHIPS.map((chip) => (
                <motion.button
                  key={chip.label}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => sendMessage(chip.label)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#1E1E1E] bg-[#0A0A0A] text-[10px] font-semibold text-[#A3A3A3] hover:border-primary/30 hover:text-primary transition-all"
                >
                  <span>{chip.emoji}</span>
                  <span>{chip.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Messages */}
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChatBubble msg={msg} />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading indicator */}
        {loading && (
          <div className="flex items-center gap-2 pl-8">
            <div className="w-6 h-6 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-primary animate-pulse" />
            </div>
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-[#2A2A2A]"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Chips below messages (if there are messages) */}
      {messages.length > 0 && !loading && (
        <div className="flex gap-1.5 flex-wrap mb-2">
          {PROMPT_CHIPS.slice(0, 3).map((chip) => (
            <button
              key={chip.label}
              onClick={() => sendMessage(chip.label)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-[#1E1E1E] bg-[#0A0A0A] text-[9px] font-semibold text-[#525252] hover:border-primary/30 hover:text-primary transition-all"
            >
              {chip.emoji} {chip.label}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your finances…"
          disabled={loading}
          className="flex-1 bg-[#0A0A0A] border border-[#1E1E1E] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#525252] outline-none focus:border-[#2A2A2A] transition-colors disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center disabled:opacity-40 transition-opacity hover:bg-primary/90"
        >
          <Send className="w-4 h-4 text-white" />
        </button>
      </form>
    </div>
  );
}
