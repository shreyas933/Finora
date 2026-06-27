"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, ChevronDown, ChevronUp, Sparkles, CheckCircle2, X } from "lucide-react";
import { useFinance, type Transaction } from "@/context/FinanceContext";
import { extractUserCategories } from "@/lib/categorizationEngine";
import { formatCurrency } from "@/lib/utils";
import { useCurrency } from "@/context/CurrencyContext";

// ── Color palette for category chips ──
const CHIP_COLORS: Record<string, string> = {
  "Food & Dining": "bg-orange-500/15 text-orange-400 border-orange-500/25 hover:bg-orange-500/25",
  "Food": "bg-orange-500/15 text-orange-400 border-orange-500/25 hover:bg-orange-500/25",
  "Groceries": "bg-lime-500/15 text-lime-400 border-lime-500/25 hover:bg-lime-500/25",
  "Shopping": "bg-pink-500/15 text-pink-400 border-pink-500/25 hover:bg-pink-500/25",
  "Transportation": "bg-blue-500/15 text-blue-400 border-blue-500/25 hover:bg-blue-500/25",
  "Transport": "bg-blue-500/15 text-blue-400 border-blue-500/25 hover:bg-blue-500/25",
  "Entertainment": "bg-purple-500/15 text-purple-400 border-purple-500/25 hover:bg-purple-500/25",
  "Health": "bg-emerald-500/15 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/25",
  "Healthcare": "bg-emerald-500/15 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/25",
  "Travel": "bg-cyan-500/15 text-cyan-400 border-cyan-500/25 hover:bg-cyan-500/25",
  "Utilities": "bg-amber-500/15 text-amber-400 border-amber-500/25 hover:bg-amber-500/25",
  "Housing": "bg-stone-500/15 text-stone-400 border-stone-500/25 hover:bg-stone-500/25",
  "Insurance": "bg-teal-500/15 text-teal-400 border-teal-500/25 hover:bg-teal-500/25",
  "Investment": "bg-indigo-500/15 text-indigo-400 border-indigo-500/25 hover:bg-indigo-500/25",
  "Education": "bg-sky-500/15 text-sky-400 border-sky-500/25 hover:bg-sky-500/25",
  "Income": "bg-emerald-500/15 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/25",
  "Savings": "bg-green-500/15 text-green-400 border-green-500/25 hover:bg-green-500/25",
  "Lifestyle": "bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/25 hover:bg-fuchsia-500/25",
};

const DEFAULT_CHIP = "bg-slate-500/15 text-slate-400 border-slate-500/25 hover:bg-slate-500/25";

function getChipColor(category: string): string {
  return CHIP_COLORS[category] || DEFAULT_CHIP;
}

export function NeedsReviewBanner() {
  const { needsReviewTransactions, assignCategory } = useFinance();
  const { currency } = useCurrency();
  const [isExpanded, setIsExpanded] = useState(true);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const userCategories = extractUserCategories().filter(
    c => c !== "Uncategorized" && c !== "Other"
  );

  // Filter out dismissed transactions
  const visibleTransactions = needsReviewTransactions.filter(
    t => !dismissedIds.has(t.id)
  );

  if (visibleTransactions.length === 0) return null;

  const handleAssign = async (tx: Transaction, category: string) => {
    setAssigningId(tx.id);
    await assignCategory(tx.id, category, tx.name);
    setAssigningId(null);
  };

  const handleDismiss = (txId: string) => {
    setDismissedIds(prev => new Set([...prev, txId]));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-6"
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 bg-amber-500/10 border border-amber-500/20 rounded-t-xl hover:bg-amber-500/15 transition-colors cursor-pointer"
        style={!isExpanded ? { borderRadius: "0.75rem" } : {}}
      >
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-amber-500/20">
            <AlertCircle className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-amber-300">
              {visibleTransactions.length} transaction{visibleTransactions.length !== 1 ? "s" : ""} need{visibleTransactions.length === 1 ? "s" : ""} your review
            </p>
            <p className="text-xs text-amber-400/70 mt-0.5">
              Help FINORA learn by assigning categories to these transactions
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-[11px] font-bold text-amber-400">
            {visibleTransactions.length}
          </span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-amber-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-amber-400" />
          )}
        </div>
      </button>

      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border border-t-0 border-amber-500/20 rounded-b-xl bg-card"
          >
            <div className="divide-y divide-white/5 max-h-[400px] overflow-y-auto">
              {visibleTransactions.map(tx => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10, height: 0 }}
                  className="p-4 hover:bg-white/[0.02] transition-colors"
                >
                  {/* Transaction Info Row */}
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="h-4 w-4 text-amber-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                          {tx.name}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Couldn't auto-categorize • {new Date(tx.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-sm font-bold font-mono ${tx.type === "income" ? "text-emerald-400" : "text-white"}`}>
                        {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount, currency)}
                      </span>
                      <button
                        onClick={() => handleDismiss(tx.id)}
                        className="p-1 text-slate-500 hover:text-slate-300 hover:bg-white/5 rounded-lg transition-all"
                        title="Dismiss"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Category Chips */}
                  {assigningId === tx.id ? (
                    <div className="flex items-center gap-2 py-2">
                      <div className="h-4 w-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs text-amber-400 font-medium">Assigning category...</span>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {/* Show suggested category first if it exists */}
                      {tx.suggested_category && (
                        <button
                          onClick={() => handleAssign(tx, tx.suggested_category!)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-all active:scale-95 cursor-pointer ring-1 ring-amber-500/30 ${getChipColor(tx.suggested_category)}`}
                        >
                          <Sparkles className="h-3 w-3" />
                          {tx.suggested_category}
                          <span className="text-[9px] opacity-70 ml-0.5">suggested</span>
                        </button>
                      )}
                      {userCategories
                        .filter(c => c !== tx.suggested_category)
                        .slice(0, 8) // Show max 8 chips to avoid clutter
                        .map(cat => (
                          <button
                            key={cat}
                            onClick={() => handleAssign(tx, cat)}
                            className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-all active:scale-95 cursor-pointer ${getChipColor(cat)}`}
                          >
                            {cat}
                          </button>
                        ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Footer hint */}
            <div className="px-4 py-2.5 bg-muted/30 border-t border-white/5 flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <p className="text-[11px] text-slate-400 font-medium">
                FINORA remembers your choices and will auto-categorize similar transactions in the future.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
