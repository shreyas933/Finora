"use client";

import { useState, useMemo, useEffect } from "react";
import { useFinance, Transaction } from "@/context/FinanceContext";
import { formatCurrency, cn } from "@/lib/utils";
import { useCurrency } from "@/context/CurrencyContext";
import { format } from "date-fns";
import {
  Upload, Download, Plus, Filter, Pencil, Check, X,
  ShoppingCart, UtensilsCrossed, Car, Home, Tv, Heart,
  Briefcase, Wallet, ArrowUpRight, ArrowDownRight,
  RefreshCw, AlertCircle
} from "lucide-react";
import { CsvImportModal } from "@/components/dashboard/CsvImportModal";
import { AiBudgetModal } from "@/components/dashboard/AiBudgetModal";
import { Sparkles } from "lucide-react";

// ── Budget definitions ────────────────────────────────────────────────────────
type BudgetCategory = {
  name: string;
  budget: number;
  color: string;
  ringColor: string;
  txCategories: string[];
};

const BUDGET_CATEGORIES: BudgetCategory[] = [
  { name: "Food & Dining", budget: 1200, color: "#22c55e", ringColor: "#22c55e", txCategories: ["Food & Dining", "Food", "Groceries", "Dining Out", "Dining"] },
  { name: "Shopping", budget: 800, color: "#f97316", ringColor: "#f97316", txCategories: ["Shopping", "Lifestyle"] },
  { name: "Entertainment", budget: 400, color: "#a855f7", ringColor: "#a855f7", txCategories: ["Entertainment"] },
  { name: "Transportation", budget: 300, color: "#3b82f6", ringColor: "#3b82f6", txCategories: ["Transportation", "Transport"] },
  { name: "Health", budget: 500, color: "#ef4444", ringColor: "#ef4444", txCategories: ["Health", "Healthcare", "Medical"] },
  { name: "Travel", budget: 2000, color: "#eab308", ringColor: "#eab308", txCategories: ["Travel"] },
];

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "Salary": <Briefcase className="h-4 w-4" />,
  "Housing": <Home className="h-4 w-4" />,
  "Food": <ShoppingCart className="h-4 w-4" />,
  "Groceries": <ShoppingCart className="h-4 w-4" />,
  "Transport": <Car className="h-4 w-4" />,
  "Lifestyle": <Tv className="h-4 w-4" />,
  "Dining Out": <UtensilsCrossed className="h-4 w-4" />,
  "Entertainment": <Tv className="h-4 w-4" />,
  "Healthcare": <Heart className="h-4 w-4" />,
  "Savings": <Wallet className="h-4 w-4" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  "Salary": "bg-emerald-50 text-emerald-700 border border-emerald-100",
  "Housing": "bg-blue-50 text-blue-700 border border-blue-100",
  "Food": "bg-green-50 text-green-700 border border-green-100",
  "Groceries": "bg-green-50 text-green-700 border border-green-100",
  "Transport": "bg-purple-50 text-purple-700 border border-purple-100",
  "Lifestyle": "bg-orange-50 text-orange-700 border border-orange-100",
  "Dining Out": "bg-orange-50 text-orange-700 border border-orange-100",
  "Entertainment": "bg-pink-50 text-pink-700 border border-pink-100",
  "Healthcare": "bg-red-50 text-red-700 border border-red-100",
  "Savings": "bg-yellow-50 text-yellow-700 border border-yellow-100",
};

// ── Circular Progress Ring ────────────────────────────────────────────────────
function CircleRing({ percent, color, overBudget }: { percent: number; color: string; overBudget: boolean }) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const filled = Math.min(1, percent / 100);
  const strokeDashoffset = circumference * (1 - filled);
  const displayColor = overBudget ? "#ba1a1a" : color;

  return (
    <svg width="84" height="84" viewBox="0 0 84 84" className="rotate-[-90deg]">
      <circle cx="42" cy="42" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="8" />
      <circle
        cx="42" cy="42" r={radius}
        fill="none"
        stroke={displayColor}
        strokeWidth="8"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
    </svg>
  );
}

// ── Budget Card ───────────────────────────────────────────────────────────────
function BudgetCard({ cat, spent, onEditBudget, currency }: { cat: BudgetCategory; spent: number; onEditBudget: (name: string, val: number) => void; currency: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(cat.budget.toString());
  const percent = cat.budget > 0 ? Math.round((spent / cat.budget) * 100) : 0;
  const overBudget = spent > cat.budget;
  const remaining = cat.budget - spent;

  const handleSave = () => {
    const val = Number(draft);
    if (!isNaN(val) && val > 0) onEditBudget(cat.name, val);
    setEditing(false);
  };

  return (
    <div className="flex items-center gap-4 bg-card border border-border rounded-xl p-4 shadow-level-1 hover:shadow-level-2 transition-all duration-200">
      <div className="relative flex-shrink-0">
        <CircleRing percent={percent} color={cat.ringColor} overBudget={overBudget} />
        <span
          className={cn("absolute inset-0 flex items-center justify-center text-sm font-bold", overBudget ? "text-red-600" : "text-foreground")}
          style={{ transform: "rotate(90deg)" }}
        >
          {percent}%
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
            <span className="text-sm font-semibold text-foreground truncate">{cat.name}</span>
          </div>
          {editing ? (
            <div className="flex items-center gap-1">
              <input
                className="w-20 text-xs bg-background border border-border rounded px-1.5 py-0.5 text-foreground"
                value={draft}
                onChange={e => setDraft(e.target.value)}
                autoFocus
                onKeyDown={e => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setEditing(false); }}
              />
              <button onClick={handleSave} className="text-emerald-600 hover:text-emerald-700"><Check className="h-3.5 w-3.5" /></button>
              <button onClick={() => setEditing(false)} className="text-red-600 hover:text-red-700"><X className="h-3.5 w-3.5" /></button>
            </div>
          ) : (
            <button onClick={() => { setDraft(cat.budget.toString()); setEditing(true); }} className="text-muted-foreground hover:text-foreground transition-colors">
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{formatCurrency(spent, currency)} / {formatCurrency(cat.budget, currency)}</p>
        {overBudget ? (
          <p className="text-xs text-red-600 font-medium mt-0.5">Over by {formatCurrency(-remaining, currency)}</p>
        ) : (
          <p className="text-xs text-muted-foreground/70 mt-0.5">{formatCurrency(remaining, currency)} remaining</p>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function TransactionsPage() {
  const { transactions, addTransaction, bulkAddTransactions, deleteTransaction, monthlyIncome, monthlyExpenses, balance } = useFinance();
  const { currency } = useCurrency();

  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [newTx, setNewTx] = useState({ name: "", amount: "", category: "Food", type: "expense" as "income" | "expense" });
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>(BUDGET_CATEGORIES);

  useEffect(() => {
    const loadBudgets = () => {
      const saved = localStorage.getItem("finora_budgets");
      if (saved) {
        try {
          const parsed: { name: string; limit?: number; budget?: number }[] = JSON.parse(saved);
          // Merge saved limits with canonical defaults so txCategories / colors always exist
          const merged = BUDGET_CATEGORIES.map(def => {
            const match = parsed.find(p => p.name === def.name);
            return match ? { ...def, budget: match.limit ?? match.budget ?? def.budget } : def;
          });
          setBudgetCategories(merged);
        } catch (e) {
          setBudgetCategories(BUDGET_CATEGORIES);
        }
      } else {
        setBudgetCategories(BUDGET_CATEGORIES);
      }
    };

    loadBudgets();
    window.addEventListener("finora_budget_update", loadBudgets);
    return () => window.removeEventListener("finora_budget_update", loadBudgets);
  }, []);

  const handleEditBudget = (name: string, val: number) => {
    setBudgetCategories(prev => {
      const updated = prev.map(c => c.name === name ? { ...c, budget: val } : c);
      localStorage.setItem("finora_budgets", JSON.stringify(updated));
      return updated;
    });
  };

  // Calculate spent per budget category
  const spentByBudgetCat = useMemo(() => {
    const map: Record<string, number> = {};
    budgetCategories.forEach(bc => {
      map[bc.name] = transactions
        .filter(t => t.type === "expense" && bc.txCategories.includes(t.category))
        .reduce((acc, t) => acc + t.amount, 0);
    });
    return map;
  }, [transactions, budgetCategories]);

  // Filtered transactions
  const categories = useMemo(() => {
    return ["all", ...Array.from(new Set(transactions.map(t => t.category)))];
  }, [transactions]);

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      if (filterType !== "all" && t.type !== filterType) return false;
      if (filterCategory !== "all" && t.category !== filterCategory) return false;
      return true;
    });
  }, [transactions, filterType, filterCategory]);

  const SUB_KEYWORDS = ["netflix", "amazon", "prime", "spotify", "hulu", "disney", "youtube", "apple", "gym", "membership", "internet", "dewa", "broadband", "mobile", "telecom", "utility", "insurance"];
  const upcomingBills = useMemo(() => {
    const expenses = transactions.filter(t => t.type === "expense");
    const grouped: Record<string, number[]> = {};
    expenses.forEach(e => {
      // Clean string and strip dates if present to group accurately
      const nm = e.name.toLowerCase().replace(/\d/g, '').trim();

      // Match against known subscription keywords deeply
      if (SUB_KEYWORDS.some(k => nm.includes(k))) {
        if (!grouped[nm]) grouped[nm] = [];
        grouped[nm].push(e.amount);
      }
    });

    // If it matched a known service, we guarantee it's a structural recurrence, so we pull its most recent value
    const recurring = Object.entries(grouped)
      .map(([name, amounts]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1) || "Unknown Provider",
        amount: amounts[0] // Using their most recent charge
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 4);

    return recurring;
  }, [transactions]);

  const handleAddTransaction = () => {
    if (!newTx.name || !newTx.amount) return;
    addTransaction({
      date: new Date().toISOString(),
      amount: Number(newTx.amount),
      category: newTx.category,
      type: newTx.type,
      name: newTx.name,
    });
    setNewTx({ name: "", amount: "", category: "Food", type: "expense" });
    setShowAddForm(false);
  };

  return (
    <div className="space-y-8 pb-10">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Transactions</h2>
          <p className="text-muted-foreground text-sm mt-1">Track all your income and expenses</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowAiModal(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 transition-colors"
          >
            <Sparkles className="h-4 w-4 text-emerald-600" /> AI Budget Profiler
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-border bg-card hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <Upload className="h-4 w-4" /> Import CSV
          </button>
          <button className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-border bg-card hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
            <Download className="h-4 w-4" /> Export CSV
          </button>
          <button
            onClick={() => setShowAddForm(v => !v)}
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors font-medium"
          >
            <Plus className="h-4 w-4" /> Add Transaction
          </button>
        </div>
      </div>


      {/* ── Add Transaction Form ── */}
      {showAddForm && (
        <div className="grid sm:grid-cols-5 gap-3 bg-card border border-border shadow-level-1 rounded-xl p-4">
          <input
            className="sm:col-span-2 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            placeholder="Description"
            value={newTx.name}
            onChange={e => setNewTx(p => ({ ...p, name: e.target.value }))}
          />
          <input
            type="number"
            className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            placeholder="Amount (₹)"
            value={newTx.amount}
            onChange={e => setNewTx(p => ({ ...p, amount: e.target.value }))}
          />
          <select
            className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
            value={newTx.category}
            onChange={e => setNewTx(p => ({ ...p, category: e.target.value }))}
          >
            {["Salary", "Housing", "Food", "Transport", "Lifestyle", "Dining Out", "Entertainment", "Healthcare", "Savings"].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <select
              className="flex-1 bg-background border border-border rounded-lg px-2 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
              value={newTx.type}
              onChange={e => setNewTx(p => ({ ...p, type: e.target.value as "income" | "expense" }))}
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
            <button onClick={handleAddTransaction} className="px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm">
              <Check className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-5 shadow-level-1">
          <p className="text-sm text-muted-foreground mb-2">Total Income</p>
          <p className="text-2xl font-bold text-emerald-600 font-mono">+{formatCurrency(monthlyIncome, currency)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 shadow-level-1">
          <p className="text-sm text-muted-foreground mb-2">Total Expenses</p>
          <p className="text-2xl font-bold text-red-600 font-mono">-{formatCurrency(monthlyExpenses, currency)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 shadow-level-1">
          <p className="text-sm text-muted-foreground mb-2">Net Balance</p>
          <p className={cn("text-2xl font-bold font-mono", balance >= 0 ? "text-emerald-600" : "text-red-600")}>
            {balance >= 0 ? "+" : ""}{formatCurrency(balance, currency)}
          </p>
        </div>
      </div>

      {/* ── Budget Tracker ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Budget Tracker</h3>
          <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <Filter className="h-4 w-4" /> Set Budgets
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {budgetCategories.map(cat => (
            <BudgetCard
              key={cat.name}
              cat={cat}
              spent={spentByBudgetCat[cat.name] ?? 0}
              currency={currency}
              onEditBudget={handleEditBudget}
            />
          ))}
        </div>
      </div>

      {/* ── All Transactions ── */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h3 className="text-xl font-bold">All Transactions</h3>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary"
              value={filterType}
              onChange={e => setFilterType(e.target.value as "all" | "income" | "expense")}
            >
              <option value="all">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            <select
              className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary"
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
            >
              {categories.map(c => (
                <option key={c} value={c}>{c === "all" ? "All Categories" : c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-level-1">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">No transactions found.</div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((tx: Transaction) => {
                const Icon = () => CATEGORY_ICONS[tx.category] ?? <Wallet className="h-4 w-4" />;
                const tagClass = CATEGORY_COLORS[tx.category] ?? "bg-secondary text-muted-foreground border border-border";
                return (
                  <div key={tx.id} className="flex items-center gap-4 px-5 py-4 hover:bg-secondary/40 transition-colors">
                    <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-full bg-secondary text-foreground">
                      <Icon />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{tx.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={cn("text-xs px-2 py-0.5 rounded font-medium", tagClass)}>
                          {tx.category}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(tx.date), "MMM dd, yyyy")}
                        </span>
                      </div>
                    </div>
                    <div className={cn("text-base font-bold font-mono flex items-center gap-1", tx.type === "income" ? "text-emerald-600" : "text-foreground")}>
                      {tx.type === "income" ? (
                        <><ArrowUpRight className="h-4 w-4 text-emerald-600" />+{formatCurrency(tx.amount, currency)}</>
                      ) : (
                        <>-{formatCurrency(tx.amount, currency)}</>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Feature 2: Predictive Bills Radar (Moved to Bottom) */}
      <div className="mt-12 bg-gradient-to-r from-violet-50/50 via-card to-violet-50/20 border border-violet-100 rounded-3xl p-8 relative overflow-hidden shadow-level-1">
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-200/10 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b border-border pb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-violet-100 rounded-lg">
                <RefreshCw className="h-5 w-5 text-violet-600" />
              </div>
              <h3 className="text-2xl font-bold text-foreground tracking-tight">Active Subscriptions</h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700 tracking-wider border border-violet-200 uppercase">Valid AI Target</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
              Targeted digital vendor analysis. Expect these static charges against your ongoing balance. By strictly tracing exact entities like Netflix or Amazon, we eliminate noise and calculate true recurring outlays.
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end bg-violet-50/50 p-4 rounded-xl border border-violet-200 min-w-[200px]">
            <span className="text-xs font-bold text-violet-600 uppercase tracking-widest flex items-center gap-1.5 mb-1">
              <AlertCircle className="h-3.5 w-3.5" /> Upcoming Draft
            </span>
            <span className="text-3xl font-bold font-mono text-violet-700 drop-shadow-sm">
              {formatCurrency(upcomingBills.reduce((acc, b) => acc + b.amount, 0), currency)}
            </span>
          </div>
        </div>

        {upcomingBills.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 relative z-10">
            {upcomingBills.map((bill, idx) => (
              <div key={idx} className="bg-card p-5 rounded-2xl border border-border flex flex-col justify-between hover:bg-secondary/30 transition-all hover:-translate-y-1 hover:shadow-level-2 hover:border-violet-300 group">
                <span className="text-sm font-semibold text-muted-foreground truncate mb-3 group-hover:text-foreground transition-colors">{bill.name}</span>
                <span className="text-xl font-bold font-mono text-violet-600">{formatCurrency(bill.amount, currency)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card border border-border p-8 rounded-2xl text-center relative z-10">
            <p className="text-base text-muted-foreground font-medium">Zero recognized subscription drafts.</p>
            <p className="text-sm text-muted-foreground/70 mt-2">Check back later or import more rich CSV data to reliably trace digital vendors.</p>
          </div>
        )}
      </div>

      {showImportModal && (
        <CsvImportModal
          onClose={() => setShowImportModal(false)}
          onImport={(rows) => bulkAddTransactions(rows)}
        />
      )}

      {showAiModal && (
        <AiBudgetModal
          onClose={() => setShowAiModal(false)}
          onBudgetSet={(budgets) => setBudgetCategories(budgets)}
        />
      )}
    </div>
  );
}
