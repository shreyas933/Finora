"use client";

import { useEffect, useState, useCallback } from "react";
import { useFinance } from "@/context/FinanceContext";
import { formatCurrency } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Lightbulb, AlertTriangle, Sparkles, X, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";

type InsightType = "warning" | "tip" | "alert";

interface Insight {
  id: string;
  type: InsightType;
  message: string;
  linkLabel?: string;
  linkHref?: string;
}

const insightMeta: Record<InsightType, { icon: React.ElementType; color: string; bg: string; border: string }> = {
  warning: {
    icon: TrendingUp,
    color: "text-amber-400",
    bg: "rgba(251,191,36,0.08)",
    border: "rgba(251,191,36,0.18)",
  },
  tip: {
    icon: Lightbulb,
    color: "text-emerald-400",
    bg: "rgba(16,185,129,0.08)",
    border: "rgba(16,185,129,0.18)",
  },
  alert: {
    icon: AlertTriangle,
    color: "text-primary", // Cherry Red
    bg: "rgba(129,1,0,0.08)",
    border: "rgba(129,1,0,0.18)",
  },
};

interface AIInsightsProps {
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  mode?: "overview" | "budget";
}

type BudgetCategory = {
  name: string;
  budget: number;
  txCategories: string[];
};

const BUDGET_CATEGORIES: BudgetCategory[] = [
  { name: "Food & Dining",    budget: 0, txCategories: ["Food & Dining", "Food", "Groceries", "Dining Out", "Dining"] },
  { name: "Shopping",         budget: 0, txCategories: ["Shopping", "Lifestyle"] },
  { name: "Entertainment",    budget: 0, txCategories: ["Entertainment"] },
  { name: "Transportation",   budget: 0, txCategories: ["Transportation", "Transport"] },
  { name: "Health",           budget: 0, txCategories: ["Health", "Healthcare", "Medical"] },
  { name: "Travel",           budget: 0, txCategories: ["Travel"] },
];

export function AIInsights({ collapsible = false, defaultCollapsed = false, mode = "overview" }: AIInsightsProps = {}) {
  const { balance, monthlyIncome, monthlyExpenses, savingsRate, goals, transactions } = useFinance();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const buildContext = useCallback(() => {
    if (mode === "budget") {
      const saved = typeof window !== "undefined" ? localStorage.getItem("finora_budgets") : null;
      let activeBudgets = BUDGET_CATEGORIES;
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          activeBudgets = BUDGET_CATEGORIES.map(def => {
            const match = parsed.find((p: any) => p.name === def.name);
            return match ? { ...def, budget: match.limit ?? match.budget ?? def.budget } : def;
          });
        } catch {}
      }

      const summary = activeBudgets.map(bc => {
        const spent = transactions
          .filter(t => t.type === "expense" && bc.txCategories.includes(t.category))
          .reduce((acc, t) => acc + t.amount, 0);
        const percent = bc.budget > 0 ? Math.round((spent / bc.budget) * 100) : 0;
        return `- ${bc.name}: Spent ${formatCurrency(spent)} / Limit ${formatCurrency(bc.budget)} (${percent}% used)`;
      }).join("\n");

      return `Budget Context:\n${summary}`;
    }

    const goalSummary = goals.map((g) => `${g.name} (${Math.round((g.current_amount / g.target_amount) * 100)}% done)`).join(", ");
    return [
      `Balance: ${formatCurrency(balance)}`,
      `Income: ${formatCurrency(monthlyIncome)}`,
      `Expenses: ${formatCurrency(monthlyExpenses)}`,
      `Savings Rate: ${savingsRate.toFixed(1)}%`,
      `Goals: ${goalSummary || "none set"}`,
    ].join("\n");
  }, [mode, balance, monthlyIncome, monthlyExpenses, savingsRate, goals, transactions]);

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    setError(false);
    setDismissed(new Set());
    try {
      const res = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          financialContext: buildContext(),
          mode: mode
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setInsights(data.insights ?? []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [buildContext, mode]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  const visibleInsights = insights.filter((i) => !dismissed.has(i.id));

  return (
    <section className="ai-insights-section">
      {/* Header */}
      <div className="ai-insights-header">
        <div className="ai-insights-title-group">
          <Sparkles className="ai-insights-sparkle" />
          <h3 className="ai-insights-title">AI Insights</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="ai-insights-refresh"
            onClick={fetchInsights}
            disabled={loading}
            className="ai-insights-refresh-btn"
            title="Refresh insights"
          >
            <RefreshCw className={`ai-insights-refresh-icon ${loading ? "spinning" : ""}`} />
          </button>
          {collapsible && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="ai-insights-refresh-btn"
              title={isCollapsed ? "Expand insights" : "Collapse insights"}
            >
              {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Cards */}
      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <div className="ai-insights-list pt-2">
              {loading ? (
                /* Skeleton */
                [1, 2, 3].map((i) => (
                  <div key={i} className="ai-insight-skeleton" />
                ))
              ) : error ? (
                <div className="ai-insight-error">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Could not load insights. <button onClick={fetchInsights} className="ai-insight-error-retry">Try again</button></span>
                </div>
              ) : visibleInsights.length === 0 ? (
                <div className="ai-insight-empty">All caught up! No new insights right now. ✨</div>
              ) : (
                <AnimatePresence initial={false}>
                  {visibleInsights.map((insight) => {
                    const meta = insightMeta[insight.type];
                    const Icon = meta.icon;
                    return (
                      <motion.div
                        key={insight.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 30, scale: 0.97 }}
                        transition={{ duration: 0.22, ease: "easeOut" }}
                        className="ai-insight-card"
                        style={{
                          background: meta.bg,
                          borderColor: meta.border,
                        }}
                      >
                        <div className="ai-insight-card-inner">
                          <Icon className={`ai-insight-icon ${meta.color}`} />
                          <div className="ai-insight-body">
                            <p className="ai-insight-message">{insight.message}</p>
                            {insight.linkLabel && insight.linkHref && (
                              <Link href={insight.linkHref} className="ai-insight-link">
                                {insight.linkLabel}
                              </Link>
                            )}
                          </div>
                          <button
                            onClick={() => setDismissed((prev) => new Set([...prev, insight.id]))}
                            className="ai-insight-dismiss"
                            title="Dismiss"
                            aria-label="Dismiss insight"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
