"use client";

import { useFinance } from "@/context/FinanceContext";
import { useCurrency } from "@/context/CurrencyContext";
import { formatCurrency } from "@/lib/utils";
import { BentoGrid, BentoCell } from "@/components/v2/ui/BentoGrid";
import { HealthRing } from "@/components/v2/ui/HealthRing";
import { SparkLine } from "@/components/v2/ui/SparkLine";
import { StatusChip } from "@/components/v2/ui/StatusChip";
import { useEffect, useState, useMemo } from "react";
import { getDaysInMonth } from "date-fns";
import { createClient } from "@/utils/supabase/client";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowUpRight, ArrowDownRight, TrendingUp, Zap, Eye, EyeOff,
  ChevronRight, Sparkles, Receipt, Target
} from "lucide-react";
import type { Transaction } from "@/context/FinanceContext";

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildSparkData(transactions: Transaction[]) {
  const now = new Date();
  const days: Record<string, number> = {};

  // last 30 days
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = `${d.getMonth() + 1}/${d.getDate()}`;
    days[key] = 0;
  }

  transactions.forEach((t) => {
    if (t.type !== "expense") return;
    const d = new Date(t.date);
    const key = `${d.getMonth() + 1}/${d.getDate()}`;
    if (key in days) days[key] += t.amount;
  });

  return Object.entries(days).map(([date, amount]) => ({ date, amount }));
}

function getSafeToSpend(transactions: Transaction[], monthlyIncome: number) {
  if (monthlyIncome <= 0) return 0;
  const saved = typeof window !== "undefined" ? localStorage.getItem("finora_budgets") : null;
  let target = monthlyIncome * 0.3;
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      const fixed = parsed.filter((b: any) =>
        ["Rent & Utilities", "Healthcare", "Savings", "Rent", "Housing", "Medical"].includes(b.name || b.category)
      );
      const fixedTarget = fixed.reduce((a: number, c: any) => a + Number(c.budget || c.limit || 0), 0);
      const discretionary = parsed.filter((b: any) =>
        !["Rent & Utilities", "Healthcare", "Savings", "Rent", "Housing", "Medical"].includes(b.name || b.category)
      );
      const discTarget = discretionary.reduce((a: number, c: any) => a + Number(c.budget || c.limit || 0), 0);
      target = Math.min(discTarget, Math.max(0, monthlyIncome - fixedTarget));
    } catch { /* ignore */ }
  }

  const currentMonth = new Date().getMonth();
  let spent = 0;
  transactions.forEach((t) => {
    if (t.type === "expense" && new Date(t.date).getMonth() === currentMonth) {
      const isFixed = ["Rent & Utilities", "Healthcare", "Savings", "Rent", "Housing", "Medical"].some((k) =>
        t.category.includes(k)
      );
      if (!isFixed) spent += t.amount;
    }
  });

  const remaining = Math.max(0, target - spent);
  const now = new Date();
  const daysLeft = Math.max(1, getDaysInMonth(now) - now.getDate() + 1);
  return Math.round(remaining / daysLeft);
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function DashboardV2() {
  const { balance, monthlyIncome, monthlyExpenses, healthScore, transactions, goals, savingsRate } = useFinance();
  const { currency } = useCurrency();
  const [profileName, setProfileName] = useState("");
  const [greetingText, setGreetingText] = useState("Welcome back");
  const [balanceHidden, setBalanceHidden] = useState(false);

  const safeToSpend = useMemo(() => getSafeToSpend(transactions, monthlyIncome), [transactions, monthlyIncome]);
  const sparkData = useMemo(() => buildSparkData(transactions), [transactions]);

  // Recent 4 transactions
  const recentTxs = useMemo(() =>
    [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 4),
    [transactions]
  );

  // Active goals
  const activeGoals = useMemo(() =>
    goals.filter((g) => g.current_amount < g.target_amount).slice(0, 2),
    [goals]
  );

  const monthSaved = monthlyIncome - monthlyExpenses;

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data: { user } }) => {
        if (user) setProfileName(user.user_metadata?.first_name ?? "");
      });

    const h = new Date().getHours();
    setGreetingText(h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");
  }, []);

  const fmt = (n: number) =>
    balanceHidden ? "₹ ••••" : formatCurrency(n, currency);

  // Spend budget burn % (of monthly income)
  const burnPct = monthlyIncome > 0 ? Math.round((monthlyExpenses / monthlyIncome) * 100) : 0;

  return (
    <div className="space-y-2.5">
      {/* Greeting row */}
      <div className="flex items-center justify-between mb-1">
        <div>
          <p className="text-[11px] text-[#525252] uppercase tracking-widest font-medium">
            {greetingText}
          </p>
          <h2 className="text-xl font-black tracking-tight text-white">
            {profileName ? `${profileName} 👋` : "Finora 👋"}
          </h2>
        </div>
        <button
          onClick={() => setBalanceHidden((v) => !v)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#1E1E1E] text-[#525252] hover:text-[#A3A3A3] text-[10px] font-medium transition-colors bg-[#0A0A0A]"
        >
          {balanceHidden ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          {balanceHidden ? "Show" : "Hide"}
        </button>
      </div>

      {/* ── BENTO GRID ROW 1 ─────────────────────────────── */}
      <BentoGrid className="auto-rows-[120px]">

        {/* HERO: Safe-to-Spend — 8 cols × 1 row */}
        <BentoCell colSpan={8} rowSpan={1} hero className="bg-gradient-to-br from-[#1A0000] via-[#0A0A0A] to-[#000]">
          <div className="absolute inset-0 bg-primary/5 rounded-xl" />
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          <div className="relative h-full flex items-center px-5 gap-6">
            <div>
              <p className="text-[9px] uppercase tracking-[0.15em] text-[#525252] font-bold mb-1">
                💡 Safe to Spend Today
              </p>
              <motion.p
                key={safeToSpend}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-mono text-4xl font-black text-white tracking-tighter leading-none"
              >
                {fmt(safeToSpend)}
              </motion.p>
              <p className="text-[10px] text-[#525252] mt-1.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                Resets at midnight
              </p>
            </div>

            {/* Month burn bar */}
            <div className="hidden sm:flex flex-col gap-1.5 flex-1 max-w-[200px]">
              <div className="flex justify-between text-[9px] text-[#525252]">
                <span>Month spent</span>
                <span className={burnPct > 80 ? "text-primary" : burnPct > 60 ? "text-amber-400" : "text-emerald-400"}>
                  {burnPct}%
                </span>
              </div>
              <div className="h-1 bg-[#1E1E1E] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(burnPct, 100)}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className={`h-full rounded-full ${
                    burnPct > 80 ? "bg-primary" : burnPct > 60 ? "bg-amber-400" : "bg-emerald-500"
                  }`}
                />
              </div>
              <p className="text-[9px] text-[#525252]">
                {fmt(monthlyExpenses)} of {fmt(monthlyIncome)}
              </p>
            </div>
          </div>
        </BentoCell>

        {/* Health Ring — 4 cols × 1 row */}
        <BentoCell colSpan={4} rowSpan={1} className="flex items-center justify-center">
          <HealthRing score={healthScore} size={80} />
        </BentoCell>
      </BentoGrid>

      {/* ── BENTO GRID ROW 2 ─────────────────────────────── */}
      <BentoGrid className="auto-rows-[100px]">
        {/* Balance — 3 cols */}
        <BentoCell colSpan={3}>
          <div className="p-4 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-[#525252] uppercase tracking-widest font-bold">Balance</span>
              <TrendingUp className="w-3 h-3 text-emerald-500" />
            </div>
            <div>
              <p className="font-mono text-lg font-bold text-emerald-400 leading-none">{fmt(balance)}</p>
              <p className="text-[9px] text-[#525252] mt-1">All time</p>
            </div>
          </div>
        </BentoCell>

        {/* Income — 3 cols */}
        <BentoCell colSpan={3}>
          <div className="p-4 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-[#525252] uppercase tracking-widest font-bold">Income</span>
              <ArrowUpRight className="w-3 h-3 text-emerald-500" />
            </div>
            <div>
              <p className="font-mono text-lg font-bold text-white leading-none">{fmt(monthlyIncome)}</p>
              <p className="text-[9px] text-[#525252] mt-1">This month</p>
            </div>
          </div>
        </BentoCell>

        {/* Spent — 3 cols */}
        <BentoCell colSpan={3}>
          <div className="p-4 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-[#525252] uppercase tracking-widest font-bold">Spent</span>
              <ArrowDownRight className="w-3 h-3 text-primary" />
            </div>
            <div>
              <p className="font-mono text-lg font-bold text-primary leading-none">{fmt(monthlyExpenses)}</p>
              <p className="text-[9px] text-[#525252] mt-1">This month</p>
            </div>
          </div>
        </BentoCell>

        {/* Saved — 3 cols */}
        <BentoCell colSpan={3}>
          <div className="p-4 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-[#525252] uppercase tracking-widest font-bold">Saved</span>
              <Zap className="w-3 h-3 text-amber-400" />
            </div>
            <div>
              <p className="font-mono text-lg font-bold text-amber-400 leading-none">{fmt(Math.max(0, monthSaved))}</p>
              <p className="text-[9px] text-[#525252] mt-1">{Math.round(savingsRate)}% rate</p>
            </div>
          </div>
        </BentoCell>
      </BentoGrid>

      {/* ── BENTO GRID ROW 3 — Sparkline + AI Insight strip ─ */}
      <BentoGrid className="auto-rows-[130px]">
        {/* Spend sparkline — 8 cols */}
        <BentoCell colSpan={8} className="overflow-hidden">
          <div className="p-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] text-[#525252] uppercase tracking-widest font-bold">30-day spend</span>
              <StatusChip
                label={burnPct > 80 ? "High" : burnPct > 60 ? "Moderate" : "Low"}
                variant={burnPct > 80 ? "danger" : burnPct > 60 ? "warning" : "success"}
              />
            </div>
            <div className="flex-1">
              <SparkLine data={sparkData} color="#810100" height={70} />
            </div>
          </div>
        </BentoCell>

        {/* AI Insight — 4 cols */}
        <BentoCell colSpan={4} className="flex flex-col">
          <Link href="/v2/chat" className="h-full p-4 flex flex-col justify-between group">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-primary" />
              </div>
              <span className="text-[9px] uppercase tracking-widest text-[#525252] font-bold">AI CFO</span>
            </div>
            <div>
              <p className="text-[11px] text-[#A3A3A3] leading-snug">
                {healthScore < 70
                  ? `Spending is ${burnPct}% of income. Your AI CFO has recommendations.`
                  : "Your finances are healthy. Ask AI for next-level tips."}
              </p>
              <div className="flex items-center gap-1 mt-2 text-primary text-[10px] font-bold group-hover:gap-2 transition-all">
                Ask Finora AI <ChevronRight className="w-3 h-3" />
              </div>
            </div>
          </Link>
        </BentoCell>
      </BentoGrid>

      {/* ── BENTO GRID ROW 4 — Transactions + Goals ─────── */}
      <BentoGrid className="auto-rows-[56px]">
        {/* Recent transactions — 7 cols × 5 rows */}
        <BentoCell colSpan={7} rowSpan={1} className="!row-span-5 !h-auto" style={{ gridRow: "span 5" }}>
          <div className="p-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-3.5 h-3.5 text-[#525252]" />
                <span className="text-[9px] uppercase tracking-widest text-[#525252] font-bold">Recent</span>
              </div>
              <Link href="/v2/transactions" className="text-[10px] text-primary hover:underline font-medium">
                View all →
              </Link>
            </div>

            {/* Timeline river */}
            <div className="flex flex-col gap-0 flex-1 relative">
              {/* Vertical connector line */}
              <div className="absolute left-[11px] top-4 bottom-4 w-px bg-[#1E1E1E]" />

              {recentTxs.length === 0 ? (
                <p className="text-[10px] text-[#525252] pl-6">No transactions yet</p>
              ) : (
                recentTxs.map((tx, i) => (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 py-2.5 group"
                  >
                    {/* Timeline dot */}
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 relative z-10 ${
                      tx.type === "income"
                        ? "border-emerald-500 bg-emerald-500/10"
                        : "border-[#2A2A2A] bg-[#111]"
                    }`}>
                      <span className={`text-[7px] font-bold ${
                        tx.type === "income" ? "text-emerald-400" : "text-[#525252]"
                      }`}>
                        {tx.type === "income" ? "↑" : "↓"}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex items-center justify-between min-w-0">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#A3A3A3] truncate group-hover:text-white transition-colors">
                          {tx.name}
                        </p>
                        <p className="text-[9px] text-[#525252]">
                          {new Date(tx.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · {tx.category}
                        </p>
                      </div>
                      <span className={`font-mono text-xs font-bold ml-2 shrink-0 ${
                        tx.type === "income" ? "text-emerald-400" : "text-primary"
                      }`}>
                        {tx.type === "income" ? "+" : "–"}{formatCurrency(tx.amount, currency)}
                      </span>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </BentoCell>

        {/* Goals — 5 cols × 5 rows */}
        <BentoCell colSpan={5} rowSpan={1} className="!row-span-5 !h-auto" style={{ gridRow: "span 5" }}>
          <div className="p-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-[#525252]" />
                <span className="text-[9px] uppercase tracking-widest text-[#525252] font-bold">Goals</span>
              </div>
              <Link href="/v2/goals" className="text-[10px] text-primary hover:underline font-medium">
                View all →
              </Link>
            </div>

            <div className="flex flex-col gap-3 flex-1">
              {activeGoals.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 gap-2">
                  <p className="text-[10px] text-[#525252]">No goals yet</p>
                  <Link href="/v2/goals" className="text-[10px] text-primary font-bold hover:underline">
                    + Add your first goal
                  </Link>
                </div>
              ) : (
                activeGoals.map((goal) => {
                  const pct = Math.round((goal.current_amount / goal.target_amount) * 100);
                  const isOnTrack = pct > 50;
                  return (
                    <div key={goal.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-[#A3A3A3] truncate">{goal.name}</p>
                        <StatusChip
                          label={isOnTrack ? "On Track" : "Off Track"}
                          variant={isOnTrack ? "success" : "warning"}
                        />
                      </div>
                      <div className="h-1 bg-[#1E1E1E] rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className={`h-full rounded-full ${isOnTrack ? "bg-emerald-500" : "bg-amber-400"}`}
                        />
                      </div>
                      <div className="flex justify-between text-[9px] text-[#525252]">
                        <span>{formatCurrency(goal.current_amount, currency)}</span>
                        <span>{pct}% of {formatCurrency(goal.target_amount, currency)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </BentoCell>
      </BentoGrid>
    </div>
  );
}
