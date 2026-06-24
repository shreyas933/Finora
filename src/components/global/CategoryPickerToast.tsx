"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useFinance } from "@/context/FinanceContext";
import { formatCurrency } from "@/lib/utils";
import { useCurrency } from "@/context/CurrencyContext";
import { cn } from "@/lib/utils";
import {
  UtensilsCrossed, ShoppingCart, Car, Tv, Heart,
  Plane, Zap, Briefcase, TrendingUp, Wallet,
  X, ArrowUpRight, ArrowDownRight, Loader2, CheckCircle2,
} from "lucide-react";

// ── Category definitions (matches CATEGORIES in categorize/route.ts) ──────────
const CATEGORIES = [
  { name: "Food & Dining",    icon: <UtensilsCrossed className="h-3.5 w-3.5" /> },
  { name: "Shopping",         icon: <ShoppingCart    className="h-3.5 w-3.5" /> },
  { name: "Transportation",   icon: <Car             className="h-3.5 w-3.5" /> },
  { name: "Entertainment",    icon: <Tv              className="h-3.5 w-3.5" /> },
  { name: "Health",           icon: <Heart           className="h-3.5 w-3.5" /> },
  { name: "Travel",           icon: <Plane           className="h-3.5 w-3.5" /> },
  { name: "Utilities",        icon: <Zap             className="h-3.5 w-3.5" /> },
  { name: "Income",           icon: <Briefcase       className="h-3.5 w-3.5" /> },
  { name: "Investment",       icon: <TrendingUp      className="h-3.5 w-3.5" /> },
  { name: "Other",            icon: <Wallet          className="h-3.5 w-3.5" /> },
];

const AUTO_DISMISS_SECONDS = 30;

type PendingTx = {
  id: string;
  name: string;
  amount: number;
  type: "income" | "expense";
  category: string;
};

type ToastState = "shown" | "saving" | "success" | "idle";

export function CategoryPickerToast() {
  const { updateTransaction, transactions, isLoaded } = useFinance();
  const { currency } = useCurrency();

  // Queue of pending uncategorized transactions
  const [queue, setQueue] = useState<PendingTx[]>([]);
  const current = queue[0] ?? null;

  const [state, setState] = useState<ToastState>("idle");
  const [savedCategory, setSavedCategory] = useState<string>("");
  const [countdown, setCountdown] = useState(AUTO_DISMISS_SECONDS);
  const [visible, setVisible] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initializedRef = useRef(false);

  // ── Load existing recent uncategorized transactions on mount ───────────────
  useEffect(() => {
    if (!isLoaded || initializedRef.current) return;
    initializedRef.current = true;

    // Load seen IDs from localStorage
    const saved = localStorage.getItem("finora_seen_uncategorized_ids") ?? "";
    const seenIds = new Set(saved.split(",").filter(Boolean));

    // Find all recent (last 7 days) uncategorized transactions
    const now = new Date().getTime();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    const existingUncat = transactions
      .filter((tx) => {
        const isUncat = tx.category === "Uncategorized" || tx.category === "Other";
        if (tx.name === "Starting Balance Adjustment") return false;
        if (seenIds.has(tx.id)) return false;
        const txTime = new Date(tx.date).getTime();
        return isUncat && txTime >= sevenDaysAgo;
      })
      // Sort oldest-to-newest so they get processed chronologically
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((tx) => ({
        id: tx.id,
        name: tx.name,
        amount: tx.amount,
        type: tx.type,
        category: tx.category,
      }));

    if (existingUncat.length > 0) {
      setQueue((prev) => {
        const merged = [...prev];
        for (const item of existingUncat) {
          if (!merged.some((m) => m.id === item.id)) {
            merged.push(item);
          }
        }
        return merged;
      });
    }
  }, [transactions, isLoaded]);

  // ── Listen for new uncategorized transactions (real-time) ───────────────────
  useEffect(() => {
    const handler = (e: Event) => {
      const tx = (e as CustomEvent<PendingTx>).detail;
      if (!tx?.id) return;

      // Deduplication: skip if already seen/dismissed
      const saved = localStorage.getItem("finora_seen_uncategorized_ids") ?? "";
      const seenIds = new Set(saved.split(",").filter(Boolean));
      if (seenIds.has(tx.id)) return;

      setQueue((prev) => {
        // Avoid duplicate entries in queue
        if (prev.some((p) => p.id === tx.id)) return prev;
        return [...prev, tx];
      });
    };

    window.addEventListener("finora_uncategorized_tx", handler);
    return () => window.removeEventListener("finora_uncategorized_tx", handler);
  }, []);

  // ── Synchronize queue if a transaction's category is updated externally ─────
  useEffect(() => {
    if (!isLoaded || queue.length === 0) return;

    setQueue((prev) => {
      const updated = prev.filter((item) => {
        // Keep in queue only if it still exists and is still "Other" or "Uncategorized" in the main transactions list
        const tx = transactions.find((t) => t.id === item.id);
        if (!tx) return false; // deleted
        return tx.category === "Other" || tx.category === "Uncategorized";
      });
      return updated;
    });
  }, [transactions, isLoaded]);

  // ── Show toast when current changes ────────────────────────────────────────
  useEffect(() => {
    if (!current) {
      setVisible(false);
      setState("idle");
      return;
    }

    // Reset state for new toast
    setState("shown");
    setCountdown(AUTO_DISMISS_SECONDS);
    // Slight delay before animating in
    const t = setTimeout(() => setVisible(true), 50);

    // Start countdown
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          dismissCurrent();
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    return () => {
      clearTimeout(t);
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id]);

  // ── Dismiss helpers ─────────────────────────────────────────────────────────
  const markSeen = useCallback((id: string) => {
    const saved = localStorage.getItem("finora_seen_uncategorized_ids") ?? "";
    const seenIds = new Set(saved.split(",").filter(Boolean));
    seenIds.add(id);
    localStorage.setItem("finora_seen_uncategorized_ids", [...seenIds].join(","));
  }, []);

  const dismissCurrent = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setVisible(false);
    setTimeout(() => {
      setQueue((prev) => {
        if (prev[0]) markSeen(prev[0].id);
        return prev.slice(1);
      });
      setState("idle");
    }, 350); // wait for slide-out animation
  }, [markSeen]);

  // ── Handle category pick ────────────────────────────────────────────────────
  const handlePick = useCallback(async (category: string) => {
    if (!current || state !== "shown") return;
    if (timerRef.current) clearInterval(timerRef.current);

    setState("saving");
    try {
      await updateTransaction(current.id, { category });
      setSavedCategory(category);
      setState("success");

      markSeen(current.id);

      dismissTimerRef.current = setTimeout(() => {
        setVisible(false);
        setTimeout(() => {
          setQueue((prev) => prev.slice(1));
          setState("idle");
        }, 350);
      }, 1800);
    } catch {
      // On error, fall back to shown state
      setState("shown");
    }
  }, [current, state, updateTransaction, markSeen]);

  if (!current || !visible && state === "idle") return null;

  // ── Circumference for countdown ring ───────────────────────────────────────
  const radius = 10;
  const circ = 2 * Math.PI * radius;
  const ringOffset = circ * (1 - countdown / AUTO_DISMISS_SECONDS);

  return (
    <div
      className={cn(
        // Position: fixed top-right, above everything
        "fixed top-4 right-4 z-[9999] w-[340px] max-w-[calc(100vw-2rem)]",
        // Animation
        "transition-all duration-350 ease-out",
        visible ? "translate-x-0 opacity-100" : "translate-x-[120%] opacity-0"
      )}
    >
      <div className="bg-[#1E1A19] border border-white/10 rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.6)] overflow-hidden">

        {/* ── Header bar ── */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/5">
          <div className="flex items-center gap-2 min-w-0">
            {/* Transaction type indicator */}
            <div className={cn(
              "h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0",
              current.type === "income"
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-red-500/10 text-red-400"
            )}>
              {current.type === "income"
                ? <ArrowUpRight className="h-4 w-4" />
                : <ArrowDownRight className="h-4 w-4" />
              }
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">
                Uncategorized Transaction
              </p>
              <p className="text-sm font-bold text-white truncate">
                {current.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
            {/* Countdown ring */}
            {state === "shown" && (
              <div className="relative h-6 w-6">
                <svg className="rotate-[-90deg]" width="24" height="24" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2.5" />
                  <circle
                    cx="12" cy="12" r={radius}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2.5"
                    strokeDasharray={circ}
                    strokeDashoffset={ringOffset}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dashoffset 1s linear" }}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-slate-400">
                  {countdown}
                </span>
              </div>
            )}

            <button
              onClick={dismissCurrent}
              className="p-1 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── Amount ── */}
        <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">Amount</span>
          <span className={cn(
            "text-base font-bold font-mono",
            current.type === "income" ? "text-emerald-400" : "text-white"
          )}>
            {current.type === "income" ? "+" : "-"}
            {formatCurrency(current.amount, currency)}
          </span>
        </div>

        {/* ── Body: category pills or status ── */}
        <div className="p-4">
          {state === "saving" && (
            <div className="flex items-center justify-center gap-2 py-4 text-slate-400 text-sm">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              Saving category…
            </div>
          )}

          {state === "success" && (
            <div className="flex items-center justify-center gap-2 py-4 text-emerald-400 text-sm font-semibold">
              <CheckCircle2 className="h-5 w-5" />
              Categorized as {savedCategory}!
            </div>
          )}

          {state === "shown" && (
            <>
              <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mb-3">
                What was this transaction for?
              </p>

              {/* Pills grid — matches the screenshot's wrapping pill layout */}
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.name}
                    onClick={() => handlePick(cat.name)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold",
                      "bg-white/5 border border-white/10 text-slate-300",
                      "hover:bg-white/10 hover:border-white/20 hover:text-white",
                      "active:scale-95 transition-all duration-150 cursor-pointer"
                    )}
                  >
                    {cat.icon}
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Skip link */}
              <div className="mt-3 flex justify-end">
                <button
                  onClick={dismissCurrent}
                  className="text-[11px] text-slate-600 hover:text-slate-400 transition-colors font-medium"
                >
                  Skip for now →
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Queue indicator — shows if more are waiting */}
      {queue.length > 1 && (
        <div className="mt-2 text-center">
          <span className="text-[10px] text-slate-600 font-medium">
            +{queue.length - 1} more waiting
          </span>
        </div>
      )}
    </div>
  );
}
