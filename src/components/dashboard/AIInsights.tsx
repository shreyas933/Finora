"use client";

import { useEffect, useState, useCallback } from "react";
import { useFinance } from "@/context/FinanceContext";
import { formatCurrency } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Lightbulb, AlertTriangle, Sparkles, X, RefreshCw } from "lucide-react";
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
    color: "text-violet-400",
    bg: "rgba(139,92,246,0.08)",
    border: "rgba(139,92,246,0.18)",
  },
  tip: {
    icon: Lightbulb,
    color: "text-blue-400",
    bg: "rgba(59,130,246,0.08)",
    border: "rgba(59,130,246,0.18)",
  },
  alert: {
    icon: AlertTriangle,
    color: "text-amber-400",
    bg: "rgba(251,191,36,0.08)",
    border: "rgba(251,191,36,0.18)",
  },
};

export function AIInsights() {
  const { balance, monthlyIncome, monthlyExpenses, savingsRate, goals } = useFinance();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const buildContext = useCallback(() => {
    const goalSummary = goals.map((g) => `${g.name} (${Math.round((g.current_amount / g.target_amount) * 100)}% done)`).join(", ");
    return [
      `Balance: ${formatCurrency(balance)}`,
      `Income: ${formatCurrency(monthlyIncome)}`,
      `Expenses: ${formatCurrency(monthlyExpenses)}`,
      `Savings Rate: ${savingsRate.toFixed(1)}%`,
      `Goals: ${goalSummary || "none set"}`,
    ].join("\n");
  }, [balance, monthlyIncome, monthlyExpenses, savingsRate, goals]);

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    setError(false);
    setDismissed(new Set());
    try {
      const res = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ financialContext: buildContext() }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setInsights(data.insights ?? []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [buildContext]);

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
        <button
          id="ai-insights-refresh"
          onClick={fetchInsights}
          disabled={loading}
          className="ai-insights-refresh-btn"
          title="Refresh insights"
        >
          <RefreshCw className={`ai-insights-refresh-icon ${loading ? "spinning" : ""}`} />
        </button>
      </div>

      {/* Cards */}
      <div className="ai-insights-list">
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
    </section>
  );
}
