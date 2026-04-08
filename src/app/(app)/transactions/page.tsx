"use client";

import { useState, useMemo } from "react";
import { useFinance, Transaction } from "@/context/FinanceContext";
import { formatCurrency, cn } from "@/lib/utils";
import { useCurrency } from "@/context/CurrencyContext";
import { format } from "date-fns";
import {
  Upload, Download, Plus, Filter, Pencil, Check, X,
  ShoppingCart, UtensilsCrossed, Car, Home, Tv, Heart,
  Briefcase, Wallet, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import { CsvImportModal } from "@/components/dashboard/CsvImportModal";

// ── Budget definitions ────────────────────────────────────────────────────────
type BudgetCategory = {
  name: string;
  budget: number;
  color: string;
  ringColor: string;
  txCategories: string[];
};

const BUDGET_CATEGORIES: BudgetCategory[] = [
  { name: "Groceries",       budget: 8000,  color: "#22c55e", ringColor: "#22c55e", txCategories: ["Food", "Groceries"] },
  { name: "Dining & Out",    budget: 5000,  color: "#f97316", ringColor: "#f97316", txCategories: ["Lifestyle", "Dining Out", "Entertainment"] },
  { name: "Transport",       budget: 3000,  color: "#a855f7", ringColor: "#a855f7", txCategories: ["Transport"] },
  { name: "Rent & Utilities",budget: 20000, color: "#3b82f6", ringColor: "#3b82f6", txCategories: ["Housing", "Utilities"] },
  { name: "Healthcare",      budget: 2000,  color: "#ef4444", ringColor: "#ef4444", txCategories: ["Healthcare", "Medical"] },
  { name: "Savings",         budget: 30000, color: "#eab308", ringColor: "#eab308", txCategories: ["Savings", "Investment"] },
];

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "Salary":     <Briefcase className="h-4 w-4" />,
  "Housing":    <Home className="h-4 w-4" />,
  "Food":       <ShoppingCart className="h-4 w-4" />,
  "Groceries":  <ShoppingCart className="h-4 w-4" />,
  "Transport":  <Car className="h-4 w-4" />,
  "Lifestyle":  <Tv className="h-4 w-4" />,
  "Dining Out": <UtensilsCrossed className="h-4 w-4" />,
  "Entertainment": <Tv className="h-4 w-4" />,
  "Healthcare": <Heart className="h-4 w-4" />,
  "Savings":    <Wallet className="h-4 w-4" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  "Salary":     "bg-emerald-500/20 text-emerald-400",
  "Housing":    "bg-blue-500/20 text-blue-400",
  "Food":       "bg-green-500/20 text-green-400",
  "Groceries":  "bg-green-500/20 text-green-400",
  "Transport":  "bg-purple-500/20 text-purple-400",
  "Lifestyle":  "bg-orange-500/20 text-orange-400",
  "Dining Out": "bg-orange-500/20 text-orange-400",
  "Entertainment": "bg-pink-500/20 text-pink-400",
  "Healthcare": "bg-red-500/20 text-red-400",
  "Savings":    "bg-yellow-500/20 text-yellow-400",
};

// ── Circular Progress Ring ────────────────────────────────────────────────────
function CircleRing({ percent, color, overBudget }: { percent: number; color: string; overBudget: boolean }) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const filled = Math.min(1, percent / 100);
  const strokeDashoffset = circumference * (1 - filled);
  const displayColor = overBudget ? "#ef4444" : color;

  return (
    <svg width="84" height="84" viewBox="0 0 84 84" className="rotate-[-90deg]">
      <circle cx="42" cy="42" r={radius} fill="none" stroke="#1e293b" strokeWidth="8" />
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
    <div className="flex items-center gap-4 bg-[#0f172a] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors">
      <div className="relative flex-shrink-0">
        <CircleRing percent={percent} color={cat.ringColor} overBudget={overBudget} />
        <span
          className={cn("absolute inset-0 flex items-center justify-center text-sm font-bold", overBudget ? "text-red-400" : "text-white")}
          style={{ transform: "rotate(90deg)" }}
        >
          {percent}%
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
            <span className="text-sm font-semibold text-white truncate">{cat.name}</span>
          </div>
          {editing ? (
            <div className="flex items-center gap-1">
              <input
                className="w-20 text-xs bg-[#1e293b] border border-border rounded px-1.5 py-0.5 text-white"
                value={draft}
                onChange={e => setDraft(e.target.value)}
                autoFocus
                onKeyDown={e => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setEditing(false); }}
              />
              <button onClick={handleSave} className="text-emerald-400 hover:text-emerald-300"><Check className="h-3.5 w-3.5" /></button>
              <button onClick={() => setEditing(false)} className="text-red-400 hover:text-red-300"><X className="h-3.5 w-3.5" /></button>
            </div>
          ) : (
            <button onClick={() => { setDraft(cat.budget.toString()); setEditing(true); }} className="text-slate-500 hover:text-slate-300 transition-colors">
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <p className="text-xs text-slate-300">{formatCurrency(spent, currency)} / {formatCurrency(cat.budget, currency)}</p>
        {overBudget ? (
          <p className="text-xs text-red-400 font-medium mt-0.5">Over by {formatCurrency(-remaining, currency)}</p>
        ) : (
          <p className="text-xs text-slate-500 mt-0.5">{formatCurrency(remaining, currency)} remaining</p>
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
  const [budgetOverrides, setBudgetOverrides] = useState<Record<string, number>>({});

  const [newTx, setNewTx] = useState({ name: "", amount: "", category: "Food", type: "expense" as "income" | "expense" });

  // Merge budget overrides
  const budgetCategories = BUDGET_CATEGORIES.map(cat => ({
    ...cat,
    budget: budgetOverrides[cat.name] ?? cat.budget,
  }));

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
          <p className="text-slate-400 text-sm mt-1">Track all your income and expenses</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button 
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
          >
            <Upload className="h-4 w-4" /> Import CSV
          </button>
          <button className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 transition-colors">
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
        <div className="grid sm:grid-cols-5 gap-3 bg-[#0f172a] border border-primary/30 rounded-xl p-4">
          <input
            className="sm:col-span-2 bg-[#1e293b] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-primary"
            placeholder="Description"
            value={newTx.name}
            onChange={e => setNewTx(p => ({ ...p, name: e.target.value }))}
          />
          <input
            type="number"
            className="bg-[#1e293b] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-primary"
            placeholder="Amount (₹)"
            value={newTx.amount}
            onChange={e => setNewTx(p => ({ ...p, amount: e.target.value }))}
          />
          <select
            className="bg-[#1e293b] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
            value={newTx.category}
            onChange={e => setNewTx(p => ({ ...p, category: e.target.value }))}
          >
            {["Salary","Housing","Food","Transport","Lifestyle","Dining Out","Entertainment","Healthcare","Savings"].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <select
              className="flex-1 bg-[#1e293b] border border-white/10 rounded-lg px-2 py-2 text-sm text-white focus:outline-none focus:border-primary"
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
        <div className="bg-[#0f172a] border border-white/5 rounded-xl p-5">
          <p className="text-sm text-slate-400 mb-2">Total Income</p>
          <p className="text-2xl font-bold text-emerald-400 font-mono">+{formatCurrency(monthlyIncome, currency)}</p>
        </div>
        <div className="bg-[#0f172a] border border-white/5 rounded-xl p-5">
          <p className="text-sm text-slate-400 mb-2">Total Expenses</p>
          <p className="text-2xl font-bold text-red-400 font-mono">-{formatCurrency(monthlyExpenses, currency)}</p>
        </div>
        <div className="bg-[#0f172a] border border-white/5 rounded-xl p-5">
          <p className="text-sm text-slate-400 mb-2">Net Balance</p>
          <p className={cn("text-2xl font-bold font-mono", balance >= 0 ? "text-emerald-400" : "text-red-400")}>
            {balance >= 0 ? "+" : ""}{formatCurrency(balance, currency)}
          </p>
        </div>
      </div>

      {/* ── Budget Tracker ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Budget Tracker</h3>
          <button className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
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
              onEditBudget={(name, val) => setBudgetOverrides(p => ({ ...p, [name]: val }))}
            />
          ))}
        </div>
      </div>

      {/* ── All Transactions ── */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h3 className="text-xl font-bold">All Transactions</h3>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-500" />
            <select
              className="bg-[#0f172a] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-primary"
              value={filterType}
              onChange={e => setFilterType(e.target.value as "all" | "income" | "expense")}
            >
              <option value="all">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            <select
              className="bg-[#0f172a] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-primary"
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
            >
              {categories.map(c => (
                <option key={c} value={c}>{c === "all" ? "All Categories" : c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-[#0f172a] border border-white/5 rounded-xl overflow-hidden">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-500">No transactions found.</div>
          ) : (
            <div className="divide-y divide-white/5">
              {filtered.map((tx: Transaction) => {
                const Icon = () => CATEGORY_ICONS[tx.category] ?? <Wallet className="h-4 w-4" />;
                const tagClass = CATEGORY_COLORS[tx.category] ?? "bg-slate-500/20 text-slate-400";
                return (
                  <div key={tx.id} className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors">
                    <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-full bg-[#1e293b] text-slate-300">
                      <Icon />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{tx.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={cn("text-xs px-2 py-0.5 rounded font-medium", tagClass)}>
                          {tx.category}
                        </span>
                        <span className="text-xs text-slate-500">
                          {format(new Date(tx.date), "MMM dd, yyyy")}
                        </span>
                      </div>
                    </div>
                    <div className={cn("text-base font-bold font-mono flex items-center gap-1", tx.type === "income" ? "text-emerald-400" : "text-white")}>
                      {tx.type === "income" ? (
                        <><ArrowUpRight className="h-4 w-4 text-emerald-400" />+{formatCurrency(tx.amount, currency)}</>
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

      {showImportModal && (
        <CsvImportModal 
          onClose={() => setShowImportModal(false)}
          onImport={(rows) => bulkAddTransactions(rows)}
        />
      )}
    </div>
  );
}
