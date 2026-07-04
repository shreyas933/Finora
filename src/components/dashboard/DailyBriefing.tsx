"use client";

import { useMemo } from "react";
import { useFinance } from "@/context/FinanceContext";
import { useCurrency } from "@/context/CurrencyContext";
import { formatCurrency } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  CreditCard,
  Target,
  Sun,
  Zap,
  ShieldAlert,
} from "lucide-react";
import { getDaysInMonth, getDate, getMonth } from "date-fns";

type BriefingItem = {
  id: string;
  level: "red" | "amber" | "green";
  icon: React.ElementType;
  title: string;
  detail: string;
};

const LEVEL_STYLES = {
  red: {
    bg: "rgba(220,38,38,0.07)",
    border: "rgba(220,38,38,0.2)",
    icon: "text-red-500",
    badge: "bg-red-500/10 text-red-400 border-red-500/20",
  },
  amber: {
    bg: "rgba(251,191,36,0.07)",
    border: "rgba(251,191,36,0.2)",
    icon: "text-amber-400",
    badge: "bg-amber-400/10 text-amber-400 border-amber-400/20",
  },
  green: {
    bg: "rgba(16,185,129,0.08)",
    border: "rgba(16,185,129,0.2)",
    icon: "text-emerald-400",
    badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
};

const LEVEL_LABEL = { red: "Action Needed", amber: "Heads Up", green: "All Good" };

export function DailyBriefing() {
  const { balance, monthlyIncome, monthlyExpenses, transactions } = useFinance();
  const { currency } = useCurrency();

  const briefing = useMemo<BriefingItem[]>(() => {
    const items: BriefingItem[] = [];
    const now = new Date();
    const currentMonth = getMonth(now);
    const daysInMonth = getDaysInMonth(now);
    const dayOfMonth = getDate(now);
    const daysLeft = Math.max(1, daysInMonth - dayOfMonth + 1);

    // ── Budget checks ──────────────────────────────────────────────────────────
    const savedBudgets =
      typeof window !== "undefined" ? localStorage.getItem("finora_budgets") : null;
    if (savedBudgets) {
      try {
        const budgets = JSON.parse(savedBudgets);
        budgets.forEach((b: any) => {
          const limit = Number(b.budget || b.limit || 0);
          if (limit <= 0) return;

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

          const pct = (spent / limit) * 100;

          if (spent > limit) {
            items.push({
              id: `budget-over-${b.name}`,
              level: "red",
              icon: AlertTriangle,
              title: `${b.name} budget exceeded`,
              detail: `You're over by ${formatCurrency(spent - limit, currency)} (spent ${formatCurrency(spent, currency)} of ${formatCurrency(limit, currency)}).`,
            });
          } else if (pct >= 80) {
            items.push({
              id: `budget-warn-${b.name}`,
              level: "amber",
              icon: TrendingUp,
              title: `${b.name} at ${Math.round(pct)}%`,
              detail: `Only ${formatCurrency(limit - spent, currency)} left with ${daysLeft} day${daysLeft === 1 ? "" : "s"} to go.`,
            });
          }
        });
      } catch {}
    }

    // ── Credit card utilization ────────────────────────────────────────────────
    const savedCards =
      typeof window !== "undefined" ? localStorage.getItem("finora_wallet_items") : null;
    if (savedCards) {
      try {
        const cards = JSON.parse(savedCards);
        cards
          .filter((c: any) => c.type === "credit")
          .forEach((c: any) => {
            const limit = Number(c.creditLimit || 0);
            const used = Number(c.currentBalance || c.utilization || 0);
            if (limit <= 0) return;
            const utilPct = (used / limit) * 100;
            if (utilPct >= 75) {
              items.push({
                id: `util-${c.id || c.name}`,
                level: utilPct >= 90 ? "red" : "amber",
                icon: CreditCard,
                title: `${c.name || "Credit card"} at ${Math.round(utilPct)}% utilization`,
                detail: `High utilization hurts your credit score. Try to pay down before the billing cycle closes.`,
              });
            }
          });
      } catch {}
    }

    // ── Today's spend vs daily average ────────────────────────────────────────
    const todayStr = now.toDateString();
    const todaySpend = transactions
      .filter((t) => t.type === "expense" && new Date(t.date).toDateString() === todayStr)
      .reduce((acc, t) => acc + t.amount, 0);

    const avgDailySpend = monthlyExpenses > 0 ? monthlyExpenses / dayOfMonth : 0;

    if (todaySpend > 0 && avgDailySpend > 0 && todaySpend > avgDailySpend * 2.5) {
      items.push({
        id: "spend-spike",
        level: "amber",
        icon: Zap,
        title: `Spending spike today`,
        detail: `You've spent ${formatCurrency(todaySpend, currency)} today — ${Math.round(todaySpend / avgDailySpend)}× your daily average.`,
      });
    }

    // ── Savings rate warning ──────────────────────────────────────────────────
    const savingsRate =
      monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;
    if (monthlyIncome > 0 && savingsRate < 10) {
      items.push({
        id: "low-savings",
        level: "amber",
        icon: ShieldAlert,
        title: `Low savings rate: ${savingsRate.toFixed(0)}%`,
        detail: `Financial experts recommend saving at least 20% of income. You're saving ${formatCurrency(Math.max(0, monthlyIncome - monthlyExpenses), currency)} this month.`,
      });
    }

    // ── Goal progress nudge ────────────────────────────────────────────────────
    // (no goals data here — handled by AIInsights which has access to goals)

    // ── All clear ──────────────────────────────────────────────────────────────
    if (items.length === 0) {
      const hour = now.getHours();
      const timeGreet =
        hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
      items.push({
        id: "all-clear",
        level: "green",
        icon: CheckCircle2,
        title: `${timeGreet}! Finances look healthy`,
        detail:
          "No overdue budgets, no alerts. Keep it up — you're on track for a great month.",
      });
    }

    // Sort: red → amber → green
    return items.sort((a, b) => {
      const order = { red: 0, amber: 1, green: 2 };
      return order[a.level] - order[b.level];
    });
  }, [transactions, monthlyIncome, monthlyExpenses, currency]);

  return (
    <section className="flex flex-col gap-3 h-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <Sun className="h-4 w-4 text-amber-400" />
        <h3 className="text-sm font-semibold tracking-tight">Daily Briefing</h3>
        <span className="ml-auto text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
          {briefing.filter((b) => b.level === "red").length > 0
            ? `${briefing.filter((b) => b.level === "red").length} urgent`
            : briefing.filter((b) => b.level === "amber").length > 0
            ? `${briefing.filter((b) => b.level === "amber").length} warning${briefing.filter((b) => b.level === "amber").length > 1 ? "s" : ""}`
            : "All clear"}
        </span>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[340px] pr-0.5">
        {briefing.map((item, i) => {
          const styles = LEVEL_STYLES[item.level];
          const Icon = item.icon;
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.22, ease: "easeOut" }}
              className="flex items-start gap-3 rounded-xl px-4 py-3 border"
              style={{ background: styles.bg, borderColor: styles.border }}
            >
              <div className={`mt-0.5 shrink-0 ${styles.icon}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold leading-snug">{item.title}</p>
                  <span
                    className={`text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded-full border ${styles.badge}`}
                  >
                    {LEVEL_LABEL[item.level]}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  {item.detail}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
