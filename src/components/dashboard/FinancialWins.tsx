"use client";

import { useMemo } from "react";
import { useFinance } from "@/context/FinanceContext";
import { useCurrency } from "@/context/CurrencyContext";
import { formatCurrency } from "@/lib/utils";
import { motion } from "framer-motion";
import { Trophy, Check, Star, Flame, TrendingUp, Smile } from "lucide-react";
import { getMonth, getYear } from "date-fns";

type Win = {
  id: string;
  label: string;
  icon: React.ElementType;
  highlight?: boolean;
};

export function FinancialWins() {
  const { monthlyIncome, monthlyExpenses, transactions } = useFinance();
  const { currency } = useCurrency();

  const wins = useMemo<Win[]>(() => {
    const result: Win[] = [];
    const now = new Date();
    const currentMonth = getMonth(now);
    const currentYear = getYear(now);

    // ── Win 1: Amount saved this month ──────────────────────────────────────
    const monthlySaved = monthlyIncome - monthlyExpenses;
    if (monthlyIncome > 0 && monthlySaved > 0) {
      result.push({
        id: "monthly-saved",
        label: `Saved ${formatCurrency(monthlySaved, currency)} this month`,
        icon: TrendingUp,
        highlight: true,
      });
    }

    // ── Win 2: Savings rate comparison across history ────────────────────────
    // Build per-month buckets from all transactions
    const monthMap: Record<string, { income: number; expenses: number }> = {};
    transactions.forEach((t) => {
      const d = new Date(t.date);
      const key = `${getYear(d)}-${getMonth(d)}`;
      if (!monthMap[key]) monthMap[key] = { income: 0, expenses: 0 };
      if (t.type === "income") monthMap[key].income += t.amount;
      else monthMap[key].expenses += t.amount;
    });

    const currentKey = `${currentYear}-${currentMonth}`;
    const historicalKeys = Object.keys(monthMap).filter((k) => k !== currentKey);

    if (historicalKeys.length >= 2 && monthlyIncome > 0) {
      const currentRate =
        monthlyIncome > 0 ? (monthlySaved / monthlyIncome) * 100 : 0;
      const historicalRates = historicalKeys.map((k) => {
        const m = monthMap[k];
        return m.income > 0 ? ((m.income - m.expenses) / m.income) * 100 : 0;
      });
      const allTimeBest = Math.max(...historicalRates);
      if (currentRate > 0 && currentRate >= allTimeBest) {
        result.push({
          id: "best-savings-rate",
          label: `Best savings rate in ${historicalKeys.length + 1} months`,
          icon: Star,
          highlight: true,
        });
      }
    }

    // ── Win 3: Budget categories stayed under limit ──────────────────────────
    const savedBudgets =
      typeof window !== "undefined" ? localStorage.getItem("finora_budgets") : null;
    let budgetsUnder = 0;
    let budgetTotal = 0;
    if (savedBudgets) {
      try {
        const budgets = JSON.parse(savedBudgets);
        budgets.forEach((b: any) => {
          const limit = Number(b.budget || b.limit || 0);
          if (limit <= 0) return;
          budgetTotal++;
          const cats: string[] = b.txCategories || [b.name];
          const spent = transactions
            .filter(
              (t) =>
                t.type === "expense" &&
                new Date(t.date).getMonth() === currentMonth &&
                cats.some(
                  (cat: string) =>
                    t.category.toLowerCase().includes(cat.toLowerCase()) ||
                    t.name.toLowerCase().includes(cat.toLowerCase())
                )
            )
            .reduce((acc, t) => acc + t.amount, 0);
          if (spent <= limit) budgetsUnder++;
        });

        if (budgetTotal > 0 && budgetsUnder === budgetTotal) {
          result.push({
            id: "all-budgets-under",
            label: `Stayed within all ${budgetTotal} budgets`,
            icon: Check,
          });
        } else if (budgetsUnder > 0 && budgetTotal > 0) {
          result.push({
            id: "some-budgets-under",
            label: `Stayed below ${budgetsUnder} of ${budgetTotal} budgets`,
            icon: Check,
          });
        }
      } catch {}
    }

    // ── Win 4: Most income month ever ────────────────────────────────────────
    if (monthlyIncome > 0 && historicalKeys.length >= 1) {
      const historicalIncomes = historicalKeys.map((k) => monthMap[k]?.income || 0);
      const prevBest = Math.max(...historicalIncomes);
      if (monthlyIncome > prevBest) {
        result.push({
          id: "best-income-month",
          label: `Highest income month ever recorded`,
          icon: Flame,
          highlight: true,
        });
      }
    }

    // ── Win 5: Zero spending days streak ────────────────────────────────────
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateStr = checkDate.toDateString();
      const daySpend = transactions
        .filter((t) => t.type === "expense" && new Date(t.date).toDateString() === dateStr)
        .reduce((acc, t) => acc + t.amount, 0);
      if (daySpend === 0) {
        streak++;
      } else {
        break;
      }
    }
    if (streak >= 2) {
      result.push({
        id: "no-spend-streak",
        label: `${streak}-day no-spend streak 🔥`,
        icon: Flame,
      });
    }

    return result;
  }, [transactions, monthlyIncome, monthlyExpenses, currency]);

  const monthName = new Date().toLocaleString("default", { month: "long" });

  return (
    <section className="flex flex-col gap-3 h-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <Trophy className="h-4 w-4 text-amber-400" />
        <h3 className="text-sm font-semibold tracking-tight">Financial Wins</h3>
        <span className="ml-auto text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
          🏆 {monthName}
        </span>
      </div>

      {wins.length === 0 ? (
        /* Empty state */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center gap-3 h-full py-10 text-center"
        >
          <Smile className="h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            Your wins will appear here as you log transactions and set budgets.
          </p>
        </motion.div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {wins.map((win, i) => {
            const Icon = win.icon;
            return (
              <motion.div
                key={win.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07, duration: 0.22, ease: "easeOut" }}
                className="flex items-center gap-3 rounded-xl px-4 py-3 border"
                style={{
                  background: win.highlight
                    ? "rgba(16,185,129,0.08)"
                    : "rgba(251,191,36,0.06)",
                  borderColor: win.highlight
                    ? "rgba(16,185,129,0.2)"
                    : "rgba(251,191,36,0.18)",
                }}
              >
                <div
                  className={`shrink-0 ${
                    win.highlight ? "text-emerald-400" : "text-amber-400"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-sm font-medium leading-snug">{win.label}</p>
              </motion.div>
            );
          })}
        </div>
      )}
    </section>
  );
}
