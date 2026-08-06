"use client";

import { useFinance } from "@/context/FinanceContext";
import { useCurrency } from "@/context/CurrencyContext";
import { SalaryRiver } from "@/components/v2/ui/SalaryRiver";
import { TimelineRiver } from "@/components/v2/ui/TimelineRiver";
import { StatusChip } from "@/components/v2/ui/StatusChip";
import { formatCurrency } from "@/lib/utils";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";

const CATEGORIES = [
  { name: "Food & Dining", emoji: "🍔", color: "bg-amber-400" },
  { name: "Shopping", emoji: "🛍️", color: "bg-blue-400" },
  { name: "Transportation", emoji: "🚌", color: "bg-sky-400" },
  { name: "Entertainment", emoji: "🎮", color: "bg-purple-400" },
  { name: "Health", emoji: "💊", color: "bg-rose-400" },
  { name: "Utilities", emoji: "💡", color: "bg-yellow-400" },
];

export default function TransactionsV2() {
  const { transactions, monthlyIncome, monthlyExpenses } = useFinance();
  const { currency } = useCurrency();
  const [activeFilter, setActiveFilter] = useState<"all" | "income" | "expense">("all");

  // Build budgets from localStorage
  const budgets = useMemo(() => {
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem("finora_budgets");
    if (!saved) return [];
    try { return JSON.parse(saved); } catch { return []; }
  }, []);

  const fixedNeeds = useMemo(() => {
    const fixedCategories = ["Rent & Utilities", "Healthcare", "Savings", "Rent", "Housing", "Medical"];
    return budgets
      .filter((b: any) => fixedCategories.includes(b.name || b.category))
      .reduce((a: number, c: any) => a + Number(c.budget || c.limit || 0), 0);
  }, [budgets]);

  const currentMonth = new Date().getMonth();
  const currentMonthExpenses = useMemo(() =>
    transactions
      .filter(t => t.type === "expense" && new Date(t.date).getMonth() === currentMonth)
      .reduce((a, t) => a + t.amount, 0),
    [transactions, currentMonth]
  );

  // Category breakdown
  const catSpend = useMemo(() => {
    const map: Record<string, number> = {};
    CATEGORIES.forEach(c => { map[c.name] = 0; });
    transactions.forEach(t => {
      if (t.type !== "expense") return;
      if (new Date(t.date).getMonth() !== currentMonth) return;
      const cat = CATEGORIES.find(c =>
        t.category.toLowerCase().includes(c.name.toLowerCase().split(" ")[0])
      );
      if (cat) map[cat.name] = (map[cat.name] || 0) + t.amount;
    });
    return map;
  }, [transactions, currentMonth]);

  const filteredTxs = useMemo(() =>
    activeFilter === "all" ? transactions
      : transactions.filter(t => t.type === activeFilter),
    [transactions, activeFilter]
  );

  const now = new Date();
  const monthName = now.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  return (
    <div className="flex flex-col lg:flex-row gap-3 h-full">
      {/* LEFT PANEL — 40% */}
      <div className="lg:w-[40%] flex flex-col gap-3">
        {/* Header */}
        <div>
          <p className="text-[9px] uppercase tracking-widest text-[#525252] font-bold">Transactions & Budget</p>
          <h2 className="text-xl font-black tracking-tight text-white">{monthName}</h2>
        </div>

        {/* Salary river */}
        <div className="rounded-xl border border-[#1E1E1E] bg-[#0A0A0A] p-4">
          <SalaryRiver
            salary={monthlyIncome}
            fixedNeeds={fixedNeeds}
            spent={currentMonthExpenses}
            currency={currency}
          />
        </div>

        {/* Category spend list */}
        <div className="rounded-xl border border-[#1E1E1E] bg-[#0A0A0A] p-4 flex-1">
          <p className="text-[9px] uppercase tracking-widest text-[#525252] font-bold mb-3">
            Spending by Category
          </p>
          <div className="flex flex-col gap-2.5">
            {CATEGORIES.map((cat) => {
              const limit = budgets.find((b: any) =>
                (b.name || b.category)?.toLowerCase().includes(cat.name.toLowerCase().split(" ")[0])
              );
              const limitAmt = limit ? Number(limit.budget || limit.limit || 0) : 0;
              const spent = catSpend[cat.name] || 0;
              const pct = limitAmt > 0 ? Math.round((spent / limitAmt) * 100) : 0;
              const over = limitAmt > 0 && spent > limitAmt;

              return (
                <div key={cat.name} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{cat.emoji}</span>
                      <span className="text-xs font-semibold text-[#A3A3A3]">{cat.name}</span>
                    </div>
                    <StatusChip
                      label={over ? `${pct}% over` : limitAmt > 0 ? `${pct}%` : "no limit"}
                      variant={over ? "danger" : pct > 80 ? "warning" : "success"}
                    />
                  </div>
                  {limitAmt > 0 && (
                    <div className="h-1 bg-[#1E1E1E] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(pct, 100)}%` }}
                        transition={{ duration: 0.6 }}
                        className={`h-full rounded-full ${over ? "bg-primary" : pct > 80 ? "bg-amber-400" : "bg-emerald-500"}`}
                      />
                    </div>
                  )}
                  <div className="flex justify-between text-[9px] text-[#525252]">
                    <span>{formatCurrency(spent, currency)}</span>
                    {limitAmt > 0 && <span>of {formatCurrency(limitAmt, currency)}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL — 60% */}
      <div className="lg:flex-1 flex flex-col gap-3">
        {/* Filter tabs */}
        <div className="flex gap-2">
          {(["all", "income", "expense"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all border ${
                activeFilter === f
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : "bg-[#0A0A0A] border-[#1E1E1E] text-[#525252] hover:text-[#A3A3A3]"
              }`}
            >
              {f}
            </button>
          ))}
          <div className="ml-auto text-[10px] text-[#525252] flex items-center">
            {filteredTxs.length} transactions
          </div>
        </div>

        {/* Timeline river */}
        <div className="rounded-xl border border-[#1E1E1E] bg-[#0A0A0A] flex-1 overflow-y-auto p-4">
          <TimelineRiver transactions={filteredTxs} currency={currency} />
        </div>
      </div>
    </div>
  );
}
