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
  RefreshCw, AlertCircle, Camera, Loader2,
  BrainCircuit, CheckCircle2, Trash2,
  Music, Smartphone, Wifi, Shield, Zap, Sparkles, Gamepad2, Activity
} from "lucide-react";
import { CsvImportModal } from "@/components/dashboard/CsvImportModal";
import { AiBudgetModal } from "@/components/dashboard/AiBudgetModal";
import { AIInsights } from "@/components/dashboard/AIInsights";
import { NeedsReviewBanner } from "@/components/dashboard/NeedsReviewBanner";

// ── Budget definitions ────────────────────────────────────────────────────────
type BudgetCategory = {
  name: string;
  budget: number;
  color: string;
  ringColor: string;
  txCategories: string[];
};

const BUDGET_CATEGORIES: BudgetCategory[] = [
  { name: "Food & Dining", budget: 0, color: "#22c55e", ringColor: "#22c55e", txCategories: ["Food & Dining", "Food", "Groceries", "Dining Out", "Dining"] },
  { name: "Shopping", budget: 0, color: "#f97316", ringColor: "#f97316", txCategories: ["Shopping", "Lifestyle"] },
  { name: "Entertainment", budget: 0, color: "#a855f7", ringColor: "#a855f7", txCategories: ["Entertainment"] },
  { name: "Transportation", budget: 0, color: "#3b82f6", ringColor: "#3b82f6", txCategories: ["Transportation", "Transport"] },
  { name: "Health", budget: 0, color: "#ef4444", ringColor: "#ef4444", txCategories: ["Health", "Healthcare", "Medical"] },
  { name: "Travel", budget: 0, color: "#eab308", ringColor: "#eab308", txCategories: ["Travel"] },
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
  "Salary": "bg-emerald-500/20 text-emerald-400",
  "Housing": "bg-blue-500/20 text-blue-400",
  "Food": "bg-green-500/20 text-green-400",
  "Groceries": "bg-green-500/20 text-green-400",
  "Transport": "bg-primary/20 text-red-400",
  "Lifestyle": "bg-orange-500/20 text-orange-400",
  "Dining Out": "bg-orange-500/20 text-orange-400",
  "Entertainment": "bg-pink-500/20 text-pink-400",
  "Healthcare": "bg-red-500/20 text-red-400",
  "Savings": "bg-yellow-500/20 text-yellow-400",
};

// Helper to get visual theme for known subscription services
function getSubscriptionVisuals(name: string) {
  const nm = name.toLowerCase();

  if (/netflix|prime|youtube|hulu|disney|hbo|apple tv|video|twitch/.test(nm)) {
    return {
      icon: <Tv className="h-5 w-5" />,
      bgColor: "bg-red-500/10 text-red-400",
      borderColor: "border-red-500/20"
    };
  }
  if (/spotify|apple music|pandora|music|deezer|soundcloud/.test(nm)) {
    return {
      icon: <Music className="h-5 w-5" />,
      bgColor: "bg-emerald-500/10 text-emerald-400",
      borderColor: "border-emerald-500/20"
    };
  }
  if (/amazon|flipkart|shop|delivery|instamart|blinkit|swiggy|zomato/.test(nm)) {
    return {
      icon: <ShoppingCart className="h-5 w-5" />,
      bgColor: "bg-amber-500/10 text-amber-400",
      borderColor: "border-amber-500/20"
    };
  }
  if (/gym|membership|fitness|gold's|cult|workout|active|health/.test(nm)) {
    return {
      icon: <Activity className="h-5 w-5" />,
      bgColor: "bg-teal-500/10 text-teal-400",
      borderColor: "border-teal-500/20"
    };
  }
  if (/internet|dewa|broadband|wifi|cable/.test(nm)) {
    return {
      icon: <Wifi className="h-5 w-5" />,
      bgColor: "bg-sky-500/10 text-sky-400",
      borderColor: "border-sky-500/20"
    };
  }
  if (/mobile|phone|jio|airtel|vi|sim|telecom/.test(nm)) {
    return {
      icon: <Smartphone className="h-5 w-5" />,
      bgColor: "bg-indigo-500/10 text-indigo-400",
      borderColor: "border-indigo-500/20"
    };
  }
  if (/insurance|security|protect|shield/.test(nm)) {
    return {
      icon: <Shield className="h-5 w-5" />,
      bgColor: "bg-blue-500/10 text-blue-400",
      borderColor: "border-blue-500/20"
    };
  }
  if (/chatgpt|openai|copilot|midjourney|claude|github|cursor|notion|sparkles|ai/.test(nm)) {
    return {
      icon: <Sparkles className="h-5 w-5" />,
      bgColor: "bg-rose-500/10 text-rose-400",
      borderColor: "border-rose-500/20"
    };
  }
  if (/playstation|xbox|nintendo|steam|epic|game|ea|ubisoft/.test(nm)) {
    return {
      icon: <Gamepad2 className="h-5 w-5" />,
      bgColor: "bg-violet-500/10 text-violet-400",
      borderColor: "border-violet-500/20"
    };
  }

  return {
    icon: <Zap className="h-5 w-5" />,
    bgColor: "bg-primary/10 text-red-400",
    borderColor: "border-primary/20"
  };
}

// ── Circular Progress Ring ────────────────────────────────────────────────────
function CircleRing({ percent, color, overBudget }: { percent: number; color: string; overBudget: boolean }) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const filled = Math.min(1, percent / 100);
  const strokeDashoffset = circumference * (1 - filled);
  const displayColor = overBudget ? "#fbbf24" : color;

  return (
    <svg width="84" height="84" viewBox="0 0 84 84" className="rotate-[-90deg]">
      <circle cx="42" cy="42" r={radius} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="8" />
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
    <div className="flex items-center gap-4 bg-gradient-to-br from-primary to-secondary border border-transparent rounded-xl p-4 hover:brightness-105 transition-all text-white shadow-md">
      <div className="relative flex-shrink-0">
        <CircleRing percent={percent} color={cat.ringColor} overBudget={overBudget} />
        <span
          className={cn("absolute inset-0 flex items-center justify-center text-sm font-bold", overBudget ? "text-yellow-300" : "text-white")}
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
                className="w-20 text-xs bg-white/10 border border-white/20 rounded px-1.5 py-0.5 text-white"
                value={draft}
                onChange={e => setDraft(e.target.value)}
                autoFocus
                onKeyDown={e => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setEditing(false); }}
              />
              <button onClick={handleSave} className="text-emerald-300 hover:text-emerald-200"><Check className="h-3.5 w-3.5" /></button>
              <button onClick={() => setEditing(false)} className="text-yellow-300 hover:text-yellow-200"><X className="h-3.5 w-3.5" /></button>
            </div>
          ) : (
            <button onClick={() => { setDraft(cat.budget.toString()); setEditing(true); }} className="text-white/60 hover:text-white transition-colors">
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <p className="text-xs text-red-100">{formatCurrency(spent, currency)} / {formatCurrency(cat.budget, currency)}</p>
        {overBudget ? (
          <p className="text-xs text-yellow-300 font-bold mt-0.5">Over by {formatCurrency(-remaining, currency)}</p>
        ) : (
          <p className="text-xs text-red-200 mt-0.5">{formatCurrency(remaining, currency)} remaining</p>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function TransactionsPage() {
  const { transactions, addTransaction, bulkAddTransactions, deleteTransaction, monthlyIncome, monthlyExpenses, balance, needsReviewCount } = useFinance();
  const { currency } = useCurrency();

  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [newTx, setNewTx] = useState({ name: "", amount: "", category: "Food", type: "expense" as "income" | "expense" });
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>(BUDGET_CATEGORIES);

  const [scanning, setScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  // Custom subscription states
  const [customSubscriptions, setCustomSubscriptions] = useState<{ name: string; amount: number }[]>([]);
  const [dismissedSubscriptions, setDismissedSubscriptions] = useState<string[]>([]);
  const [showAddSubModal, setShowAddSubModal] = useState(false);
  const [subName, setSubName] = useState("");
  const [subAmount, setSubAmount] = useState("");

  const handleAddSubscription = () => {
    if (!subName.trim() || !subAmount.trim()) return;
    const amountNum = Number(subAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    const newSub = { name: subName.trim(), amount: amountNum };
    const updated = [...customSubscriptions, newSub];
    setCustomSubscriptions(updated);
    localStorage.setItem("finora_custom_subscriptions", JSON.stringify(updated));

    setSubName("");
    setSubAmount("");
    setShowAddSubModal(false);
  };

  const handleDeleteSubscription = (bill: { name: string; amount: number; isCustom: boolean }) => {
    if (bill.isCustom) {
      const updated = customSubscriptions.filter(s => s.name.toLowerCase() !== bill.name.toLowerCase());
      setCustomSubscriptions(updated);
      localStorage.setItem("finora_custom_subscriptions", JSON.stringify(updated));
    } else {
      const updated = [...dismissedSubscriptions, bill.name.toLowerCase()];
      setDismissedSubscriptions(updated);
      localStorage.setItem("finora_dismissed_subscriptions", JSON.stringify(updated));
    }
  };

  // Questionnaire Split Budget states
  const [showCustomBudgetModal, setShowCustomBudgetModal] = useState(false);
  const [hasCustomBudget, setHasCustomBudget] = useState(false);
  const [customSalary, setCustomSalary] = useState<number>(50000);
  const [customBudgetTab, setCustomBudgetTab] = useState<"needs" | "wants">("needs");
  const [customNeeds, setCustomNeeds] = useState<BudgetCategory[]>([
    { name: "Rent", budget: 15000, color: "#3b82f6", ringColor: "#3b82f6", txCategories: ["Rent", "Housing"] },
    { name: "Utilities", budget: 3000, color: "#22c55e", ringColor: "#22c55e", txCategories: ["Utilities"] },
    { name: "Groceries", budget: 5000, color: "#eab308", ringColor: "#eab308", txCategories: ["Groceries", "Food", "Food & Dining"] },
    { name: "Healthcare", budget: 2000, color: "#ef4444", ringColor: "#ef4444", txCategories: ["Healthcare", "Health", "Medical"] },
    { name: "Insurance", budget: 1500, color: "#a855f7", ringColor: "#a855f7", txCategories: ["Insurance"] },
    { name: "EMI", budget: 5000, color: "#ec4899", ringColor: "#ec4899", txCategories: ["EMI", "Debt"] },
  ]);
  const [customWants, setCustomWants] = useState<BudgetCategory[]>([
    { name: "Dining / Food", budget: 4000, color: "#22c55e", ringColor: "#22c55e", txCategories: ["Dining Out", "Dining", "Food", "Restaurant", "Cafe", "Zomato", "Swiggy", "Food & Dining"] },
    { name: "Shopping", budget: 8000, color: "#f97316", ringColor: "#f97316", txCategories: ["Shopping", "Lifestyle", "Amazon", "Flipkart", "Clothing", "Apparel"] },
    { name: "Entertainment", budget: 3000, color: "#a855f7", ringColor: "#a855f7", txCategories: ["Entertainment", "Movies", "Cinema", "Hobbies", "Booking", "Event"] },
    { name: "Travel", budget: 4000, color: "#eab308", ringColor: "#eab308", txCategories: ["Travel", "Flight", "Hotel", "Airbnb", "Trip"] },
    { name: "Subscriptions", budget: 1500, color: "#3b82f6", ringColor: "#3b82f6", txCategories: ["Subscription", "Netflix", "Spotify", "Prime", "Youtube Premium", "iCloud", "Google One"] },
    { name: "Fitness / Hobbies", budget: 2000, color: "#ec4899", ringColor: "#ec4899", txCategories: ["Gym", "Fitness", "Hobbies", "Club", "Sport", "Workout"] },
    { name: "Personal Care", budget: 1000, color: "#06b6d4", ringColor: "#06b6d4", txCategories: ["Personal Care", "Salon", "Spa", "Grooming", "Haircut", "Cosmetics"] }
  ]);

  // Calculate spent per custom Needs category
  const spentByCustomNeeds = useMemo(() => {
    const map: Record<string, number> = {};
    customNeeds.forEach(bc => {
      map[bc.name] = transactions
        .filter(t => t.type === "expense" && bc.txCategories.some(cat => t.category.toLowerCase().includes(cat.toLowerCase()) || t.name.toLowerCase().includes(cat.toLowerCase())))
        .reduce((acc, t) => acc + t.amount, 0);
    });
    return map;
  }, [transactions, customNeeds]);

  // Calculate spent per custom Wants category
  const spentByCustomWants = useMemo(() => {
    const map: Record<string, number> = {};
    customWants.forEach(bc => {
      map[bc.name] = transactions
        .filter(t => t.type === "expense" && bc.txCategories.some(cat => t.category.toLowerCase().includes(cat.toLowerCase()) || t.name.toLowerCase().includes(cat.toLowerCase())))
        .reduce((acc, t) => acc + t.amount, 0);
    });
    return map;
  }, [transactions, customWants]);

  // Compute Salary, Needs, and Remaining figures
  const salaryCredited = useMemo(() => {
    const salaryTxSum = transactions
      .filter(t => t.type === "income" && (t.category.toLowerCase().includes("salary") || t.name.toLowerCase().includes("salary")))
      .reduce((acc, t) => acc + t.amount, 0);
    return salaryTxSum > 0 ? salaryTxSum : customSalary;
  }, [transactions, customSalary]);

  const needsDeducted = useMemo(() => {
    return customNeeds.reduce((acc, c) => acc + c.budget, 0);
  }, [customNeeds]);

  const remainingSalary = useMemo(() => {
    return salaryCredited - needsDeducted;
  }, [salaryCredited, needsDeducted]);

  const handleBillUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanning(true);
    setScanMessage({ text: "Reading image file..." });

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      if (!base64) {
        setScanning(false);
        setScanMessage({ text: "Failed to read image file.", isError: true });
        setTimeout(() => setScanMessage(null), 4000);
        return;
      }

      setScanMessage({ text: "AI is parsing bill contents..." });
      try {
        const res = await fetch("/api/sync/scan-bill", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileData: base64, fileName: file.name }),
        });

        if (!res.ok) {
          throw new Error("Failed to scan receipt");
        }

        const data = await res.json();
        if (data.success && data.transaction) {
          const tx = data.transaction;

          addTransaction({
            date: new Date().toISOString(),
            amount: Number(tx.amount),
            category: tx.category,
            type: tx.type,
            name: tx.name,
          });

          setScanMessage({
            text: `✓ Auto-logged "${tx.name}" (${formatCurrency(tx.amount, currency)}) under ${tx.category}!`,
          });
        } else {
          throw new Error(data.error || "No transaction parsed");
        }
      } catch (err: any) {
        console.error("OCR scan failed:", err);
        setScanMessage({
          text: `Error: ${err?.message || "Failed to scan receipt. Verify image quality."}`,
          isError: true,
        });
      } finally {
        setScanning(false);
        setTimeout(() => setScanMessage(null), 5000);
        e.target.value = "";
      }
    };

    reader.onerror = () => {
      setScanning(false);
      setScanMessage({ text: "Error loading image file.", isError: true });
      setTimeout(() => setScanMessage(null), 4000);
    };

    reader.readAsDataURL(file);
  };

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

    const loadCustomBudgets = () => {
      const hasCustom = localStorage.getItem("finora_has_custom_budget");
      if (hasCustom === "true") {
        setHasCustomBudget(true);
        const storedSalary = localStorage.getItem("finora_custom_salary");
        if (storedSalary) setCustomSalary(Number(storedSalary));

        const storedNeeds = localStorage.getItem("finora_custom_needs");
        if (storedNeeds) {
          try { setCustomNeeds(JSON.parse(storedNeeds)); } catch (e) { console.error(e); }
        }
        const storedWants = localStorage.getItem("finora_custom_wants");
        if (storedWants) {
          try { setCustomWants(JSON.parse(storedWants)); } catch (e) { console.error(e); }
        }
      }
    };

    const loadCustomSubscriptions = () => {
      const savedSubs = localStorage.getItem("finora_custom_subscriptions");
      if (savedSubs) {
        try { setCustomSubscriptions(JSON.parse(savedSubs)); } catch (e) { console.error(e); }
      }
      const savedDismissed = localStorage.getItem("finora_dismissed_subscriptions");
      if (savedDismissed) {
        try { setDismissedSubscriptions(JSON.parse(savedDismissed)); } catch (e) { console.error(e); }
      }
    };

    loadBudgets();
    loadCustomBudgets();
    loadCustomSubscriptions();
    window.addEventListener("finora_budget_update", loadBudgets);
    return () => window.removeEventListener("finora_budget_update", loadBudgets);
  }, []);

  const handleEditBudget = (name: string, val: number) => {
    if (hasCustomBudget) {
      let updatedNeeds = [...customNeeds];
      let updatedWants = [...customWants];
      let updated = false;

      if (customNeeds.some(c => c.name === name)) {
        updatedNeeds = customNeeds.map(c => c.name === name ? { ...c, budget: val } : c);
        setCustomNeeds(updatedNeeds);
        localStorage.setItem("finora_custom_needs", JSON.stringify(updatedNeeds));
        updated = true;
      } else if (customWants.some(c => c.name === name)) {
        updatedWants = customWants.map(c => c.name === name ? { ...c, budget: val } : c);
        setCustomWants(updatedWants);
        localStorage.setItem("finora_custom_wants", JSON.stringify(updatedWants));
        updated = true;
      }

      if (updated) return;
    }

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
      if (t.name === "Starting Balance Adjustment") return false;
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
      const cleanName = e.name.includes(" || ") ? e.name.split(" || ")[0] : e.name;
      const nm = cleanName.toLowerCase().replace(/\d/g, '').trim();

      // Match against known subscription keywords deeply
      if (SUB_KEYWORDS.some(k => nm.includes(k))) {
        // Exclude if the subscription name is dismissed
        if (dismissedSubscriptions.some(ds => nm.toLowerCase() === ds.toLowerCase() || ds.toLowerCase().includes(nm) || nm.includes(ds.toLowerCase()))) return;
        if (!grouped[nm]) grouped[nm] = [];
        grouped[nm].push(e.amount);
      }
    });

    // If it matched a known service, we guarantee it's a structural recurrence, so we pull its most recent value
    const recurring = Object.entries(grouped)
      .map(([name, amounts]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1) || "Unknown Provider",
        amount: amounts[0], // Using their most recent charge
        isCustom: false
      }));

    // Merge with custom subscriptions
    const allBills = [...recurring];
    customSubscriptions.forEach(cs => {
      if (!allBills.some(b => b.name.toLowerCase() === cs.name.toLowerCase())) {
        allBills.push({
          name: cs.name,
          amount: cs.amount,
          isCustom: true
        });
      }
    });

    return allBills.sort((a, b) => b.amount - a.amount);
  }, [transactions, customSubscriptions, dismissedSubscriptions]);

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
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-white/5 pb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#EDEBDE]">Transactions</h2>
          <p className="text-slate-400 text-sm mt-1">Track all your income and expenses</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          {/* Secondary Actions Group (Import / Export) */}
          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-2">
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs md:text-sm rounded-xl border border-white/10 bg-[#24201F]/80 hover:bg-[#24201F] text-slate-300 hover:text-white transition-all active:scale-95 font-medium cursor-pointer"
            >
              <Upload className="h-4 w-4 text-slate-400" /> Import CSV
            </button>

            <button
              onClick={() => typeof window !== "undefined" && window.print()}
              className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs md:text-sm rounded-xl border border-white/10 bg-[#24201F]/80 hover:bg-[#24201F] text-slate-300 hover:text-white transition-all active:scale-95 font-medium cursor-pointer"
            >
              <Download className="h-4 w-4 text-slate-400" /> Export PDF
            </button>
          </div>

          {/* Primary Actions Group (Scan / Add) */}
          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-2">
            <input
              type="file"
              id="bill-image-upload"
              accept="image/*"
              className="hidden"
              onChange={handleBillUpload}
              disabled={scanning}
            />
            <button
              onClick={() => document.getElementById("bill-image-upload")?.click()}
              disabled={scanning}
              className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs md:text-sm rounded-xl border border-primary/20 bg-primary/10 hover:bg-primary/20 text-red-400 hover:text-red-300 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed font-semibold cursor-pointer"
            >
              {scanning ? (
                <Loader2 className="h-4 w-4 animate-spin text-red-400" />
              ) : (
                <Camera className="h-4 w-4 text-red-400" />
              )}
              Scan Bill
            </button>

            <button
              onClick={() => setShowAddForm(v => !v)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs md:text-sm rounded-xl bg-primary text-white hover:bg-red-700 transition-all active:scale-95 font-bold shadow-lg shadow-primary/10 cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Add Transaction
            </button>
          </div>
        </div>
      </div>

      {scanMessage && (
        <div className={cn(
          "flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-300",
          scanMessage.isError
            ? "border-red-500/20 bg-red-500/10 text-red-400"
            : scanMessage.text.startsWith("✓")
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
              : "border-primary/20 bg-primary/10 text-red-400 animate-pulse"
        )}>
          {scanning ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary flex-shrink-0" />
          ) : scanMessage.isError ? (
            <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
          ) : null}
          <span>{scanMessage.text}</span>
        </div>
      )}


      {/* ── Add Transaction Form ── */}
      {showAddForm && (
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 bg-card border border-primary/30 rounded-xl p-4">
          <input
            className="sm:col-span-2 bg-muted border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-primary"
            placeholder="Description"
            value={newTx.name}
            onChange={e => setNewTx(p => ({ ...p, name: e.target.value }))}
          />
          <input
            type="number"
            className="bg-muted border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-primary"
            placeholder="Amount (₹)"
            value={newTx.amount}
            onChange={e => setNewTx(p => ({ ...p, amount: e.target.value }))}
          />
          <select
            className="bg-muted border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
            value={newTx.category}
            onChange={e => setNewTx(p => ({ ...p, category: e.target.value }))}
          >
            {["Salary", "Housing", "Food", "Transport", "Lifestyle", "Dining Out", "Entertainment", "Healthcare", "Savings"].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <select
              className="flex-1 bg-muted border border-white/10 rounded-lg px-2 py-2 text-sm text-white focus:outline-none focus:border-primary"
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


      {/* ── Budget Tracker ── */}
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Budget Tracker</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAiModal(true)}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" /> AI Budget Profiler
            </button>
            <button
              onClick={() => setShowCustomBudgetModal(true)}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-primary/30 bg-primary/10 hover:bg-primary/20 text-red-400 transition-colors"
            >
              <Plus className="h-3.5 w-3.5 text-primary" /> Add Budget
            </button>
            {hasCustomBudget && (
              <button
                onClick={() => {
                  localStorage.removeItem("finora_has_custom_budget");
                  setHasCustomBudget(false);
                }}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-300 transition-colors"
              >
                <X className="h-3.5 w-3.5 text-red-400" /> Reset Custom
              </button>
            )}
          </div>
        </div>

        {hasCustomBudget ? (
          <div className="space-y-6 animate-fadeIn">
            {/* Topmost Salary, Needs & Remaining summary */}
            <div className="bg-gradient-to-br from-primary to-secondary border border-transparent rounded-2xl p-5 relative overflow-hidden shadow-lg text-white">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-[40px] rounded-full pointer-events-none"></div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
                <div className="flex flex-col space-y-1">
                  <span className="text-[10px] font-bold text-red-100 uppercase tracking-widest">Salary Credited</span>
                  <span className="text-2xl font-black text-white font-mono">{formatCurrency(salaryCredited, currency)}</span>
                </div>
                <div className="flex flex-col space-y-1 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6">
                  <span className="text-[10px] font-bold text-red-100 uppercase tracking-widest">Needs Deducted</span>
                  <span className="text-2xl font-black text-white font-mono">-{formatCurrency(needsDeducted, currency)}</span>
                </div>
                <div className="flex flex-col space-y-1 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6">
                  <span className="text-[10px] font-bold text-red-100 uppercase tracking-widest">Remaining Salary</span>
                  <span className="text-2xl font-black font-mono text-white">
                    {formatCurrency(remainingSalary, currency)}
                  </span>
                </div>
              </div>
            </div>

            {/* Clickable section tabs toggle */}
            <div className="flex bg-card/85 p-1.5 rounded-2xl border border-white/5 w-fit gap-1 shadow-inner backdrop-blur-md">
              <button
                onClick={() => setCustomBudgetTab("needs")}
                className={cn(
                  "px-5 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 relative",
                  customBudgetTab === "needs"
                    ? "bg-blue-600/20 border border-blue-500/30 text-blue-300 font-semibold shadow-md"
                    : "text-slate-400 hover:text-slate-200 border border-transparent"
                )}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                Essential Needs
              </button>
              <button
                onClick={() => setCustomBudgetTab("wants")}
                className={cn(
                  "px-5 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 relative",
                  customBudgetTab === "wants"
                    ? "bg-orange-600/20 border border-orange-500/30 text-orange-300 font-semibold shadow-md"
                    : "text-slate-400 hover:text-slate-200 border border-transparent"
                )}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                Flexible Wants
              </button>
            </div>

            {/* Selected category budget rings display */}
            {customBudgetTab === "needs" ? (
              <div className="space-y-4 animate-fadeIn">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {customNeeds.map(cat => (
                    <BudgetCard
                      key={cat.name}
                      cat={cat}
                      spent={spentByCustomNeeds[cat.name] ?? 0}
                      currency={currency}
                      onEditBudget={handleEditBudget}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-fadeIn">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {customWants.map(cat => (
                    <BudgetCard
                      key={cat.name}
                      cat={cat}
                      spent={spentByCustomWants[cat.name] ?? 0}
                      currency={currency}
                      onEditBudget={handleEditBudget}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
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
        )}
      </div>

      {/* ── AI Insights ── */}
      <AIInsights collapsible defaultCollapsed={false} mode="budget" />

      {/* ── Needs Review Banner ── */}
      <NeedsReviewBanner />

      {/* ── All Transactions ── */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h3 className="text-xl font-bold">All Transactions</h3>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-500" />
            <select
              className="bg-card border border-white/10 rounded-lg px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-primary"
              value={filterType}
              onChange={e => setFilterType(e.target.value as "all" | "income" | "expense")}
            >
              <option value="all">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            <select
              className="bg-card border border-white/10 rounded-lg px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-primary"
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
            >
              {categories.map(c => (
                <option key={c} value={c}>{c === "all" ? "All Categories" : c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-card border border-white/5 rounded-xl overflow-hidden">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-500">No transactions found.</div>
          ) : (
            <div className="divide-y divide-white/5">
              {filtered.map((tx: Transaction) => {
                const Icon = () => CATEGORY_ICONS[tx.category] ?? <Wallet className="h-4 w-4" />;
                const tagClass = CATEGORY_COLORS[tx.category] ?? "bg-slate-500/20 text-slate-400";
                return (
                  <div key={tx.id} className="flex items-center gap-3 md:gap-4 px-4 md:px-5 py-4 hover:bg-white/[0.02] transition-colors">
                    <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-full bg-muted text-slate-300">
                      <Icon />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate pr-2">
                        {tx.name.includes(" || ") ? tx.name.split(" || ")[0] : tx.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1 overflow-hidden">
                        <span className={cn("text-[10px] md:text-xs px-2 py-0.5 rounded font-medium whitespace-nowrap", tagClass)}>
                          {tx.category}
                        </span>
                        <span className="text-xs text-slate-500">
                          {format(new Date(tx.date), "MMM dd, yyyy")}
                        </span>
                      </div>
                    </div>
                    <div className={cn("text-sm md:text-base font-bold font-mono flex items-center gap-1 flex-shrink-0", tx.type === "income" ? "text-emerald-400" : "text-white")}>
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

      {/* Feature 2: Active Subscriptions Section */}
      <div className="mt-12 bg-gradient-to-br from-primary to-secondary rounded-3xl p-6 md:p-8 relative overflow-hidden backdrop-blur-xl shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 border-b border-white/5 pb-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="p-2 bg-black/20 border border-white/10 rounded-xl">
                <RefreshCw className="h-5 w-5 text-red-400" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-[#EDEBDE] tracking-tight">Active Subscriptions</h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-black/20 text-[#EDEBDE] border border-white/10 tracking-wider uppercase">
                {upcomingBills.length} detected
              </span>
              <button
                onClick={() => setShowAddSubModal(true)}
                className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.8 rounded-xl border border-white/25 bg-white/10 hover:bg-white/20 text-[#EDEBDE] transition-all active:scale-95 cursor-pointer ml-auto sm:ml-2"
              >
                <Plus className="h-3.5 w-3.5 text-white" /> Add Subscription
              </button>
            </div>
            <p className="text-xs md:text-sm text-foreground/80 max-w-xl leading-relaxed">
              Consolidated view of recurring commitments identified from bank ledgers and manual additions. Helps audit billing cycles and manage outlays.
            </p>
          </div>

          <div className="bg-black/40 p-4 md:p-5 rounded-2xl border border-white/10 min-w-[220px] flex flex-col self-start lg:self-auto">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
              <AlertCircle className="h-3.5 w-3.5 text-red-400" /> Total Monthly Outflow
            </span>
            <span className="text-2xl md:text-3xl font-bold font-mono text-[#EDEBDE] tracking-tight">
              {formatCurrency(upcomingBills.reduce((acc, b) => acc + b.amount, 0), currency)}
            </span>
          </div>
        </div>

        {upcomingBills.length > 0 ? (
          <div className="space-y-3 relative z-10">
            {upcomingBills.map((bill, idx) => {
              const visuals = getSubscriptionVisuals(bill.name);
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-4 p-4 bg-[#1B1716]/40 hover:bg-[#1B1716]/80 border border-white/5 hover:border-white/10 rounded-2xl transition-all"
                >
                  <div className="flex items-center gap-3 md:gap-4 min-w-0">
                    <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center shrink-0 border", visuals.bgColor, visuals.borderColor)}>
                      {visuals.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm md:text-base font-semibold text-[#EDEBDE] truncate">
                        {bill.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {bill.isCustom ? (
                          <span className="text-[9px] font-bold text-red-400 bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20 uppercase tracking-wider">
                            Custom
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/10 uppercase tracking-wider">
                            Auto-detected
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 md:gap-4 shrink-0">
                    <div className="text-right">
                      <p className="text-sm md:text-base font-bold font-mono text-[#EDEBDE]">
                        {formatCurrency(bill.amount, currency)}
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                        Renews monthly
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteSubscription(bill)}
                      className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all border border-transparent hover:border-red-500/20 active:scale-95 cursor-pointer"
                      title="Remove Subscription"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-[#1B1716]/40 border border-white/5 p-8 rounded-2xl text-center relative z-10">
            <p className="text-base text-slate-300 font-medium">Zero recognized subscription drafts.</p>
            <p className="text-sm text-slate-500 mt-2">Add custom subscriptions or sync account data to automatically list digital vendors.</p>
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
          currentSalary={customSalary}
          currentNeeds={customNeeds}
          currentWants={customWants}
          onSave={(sal, nds, wnts) => {
            setCustomSalary(sal);
            setCustomNeeds(nds);
            setCustomWants(wnts);
            setHasCustomBudget(true);
            localStorage.setItem("finora_custom_salary", sal.toString());
            localStorage.setItem("finora_custom_needs", JSON.stringify(nds));
            localStorage.setItem("finora_custom_wants", JSON.stringify(wnts));
            localStorage.setItem("finora_has_custom_budget", "true");
            setShowAiModal(false);
          }}
        />
      )}

      {showCustomBudgetModal && (
        <CustomBudgetModal
          onClose={() => setShowCustomBudgetModal(false)}
          currentSalary={customSalary}
          currentNeeds={customNeeds}
          currentWants={customWants}
          onSave={(sal, nds, wnts) => {
            setCustomSalary(sal);
            setCustomNeeds(nds);
            setCustomWants(wnts);
            setHasCustomBudget(true);
            localStorage.setItem("finora_custom_salary", sal.toString());
            localStorage.setItem("finora_custom_needs", JSON.stringify(nds));
            localStorage.setItem("finora_custom_wants", JSON.stringify(wnts));
            localStorage.setItem("finora_has_custom_budget", "true");
            setShowCustomBudgetModal(false);
          }}
        />
      )}

      {showAddSubModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-fadeIn" onClick={() => setShowAddSubModal(false)}>
          <div
            className="bg-[#24201F] w-full max-w-md rounded-2xl border border-white/10 shadow-[0_0_50px_rgba(129,1,0,0.2)] flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-white/5 bg-[#1B1716]/60">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2 text-[#EDEBDE]">
                  <Plus className="h-5 w-5 text-red-400" /> Add Custom Subscription
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-medium">
                  Manually track recurring services
                </p>
              </div>
              <button
                onClick={() => setShowAddSubModal(false)}
                className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 bg-[#24201F]">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Subscription Name</label>
                <input
                  type="text"
                  className="w-full bg-[#1B1716] border border-white/10 rounded-xl px-4 py-3 text-sm text-[#EDEBDE] placeholder:text-slate-500 font-semibold focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 transition-all"
                  placeholder="e.g. Netflix, Spotify, Gym"
                  value={subName}
                  onChange={e => setSubName(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Monthly Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-slate-400 font-semibold text-base">₹</span>
                  <input
                    type="number"
                    className="w-full bg-[#1B1716] border border-white/10 rounded-xl pl-9 pr-4 py-3 text-sm text-[#EDEBDE] placeholder:text-slate-500 font-semibold focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 transition-all font-mono"
                    placeholder="e.g. 199"
                    value={subAmount}
                    onChange={e => setSubAmount(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter") handleAddSubscription();
                    }}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowAddSubModal(false)}
                  className="flex-1 h-12 border border-white/10 text-slate-300 hover:bg-white/5 rounded-xl font-semibold transition-all active:scale-95 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddSubscription}
                  className="flex-1 h-12 bg-primary hover:bg-red-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-primary/10 active:scale-95 cursor-pointer"
                >
                  <Check className="h-4 w-4" /> Add Subscription
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Custom Budget Modal Questionnaire ─────────────────────────────────────────
interface CustomBudgetModalProps {
  onClose: () => void;
  currentSalary: number;
  currentNeeds: BudgetCategory[];
  currentWants: BudgetCategory[];
  onSave: (salary: number, needs: BudgetCategory[], wants: BudgetCategory[]) => void;
}

function CustomBudgetModal({ onClose, currentSalary, currentNeeds, currentWants, onSave }: CustomBudgetModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [salaryInput, setSalaryInput] = useState(currentSalary.toString());
  const [needsList, setNeedsList] = useState<BudgetCategory[]>(currentNeeds);
  const [wantsList, setWantsList] = useState<BudgetCategory[]>(currentWants);

  const handleNeedChange = (index: number, val: string) => {
    const updated = [...needsList];
    updated[index] = { ...updated[index], budget: Number(val) || 0 };
    setNeedsList(updated);
  };

  const handleWantChange = (index: number, val: string) => {
    const updated = [...wantsList];
    updated[index] = { ...updated[index], budget: Number(val) || 0 };
    setWantsList(updated);
  };

  // Custom Needs / Wants additions state
  const [newNeedName, setNewNeedName] = useState("");
  const [newNeedAmount, setNewNeedAmount] = useState("");
  const [newWantName, setNewWantName] = useState("");
  const [newWantAmount, setNewWantAmount] = useState("");

  const addNeed = () => {
    if (!newNeedName.trim()) return;
    const name = newNeedName.trim();
    if (needsList.some(n => n.name.toLowerCase() === name.toLowerCase())) {
      alert("A Need category with this name already exists.");
      return;
    }
    const budget = Number(newNeedAmount) || 0;
    const colors = ["#3b82f6", "#22c55e", "#eab308", "#ef4444", "#a855f7", "#ec4899", "#06b6d4"];
    const randomColor = colors[needsList.length % colors.length];
    setNeedsList(prev => [...prev, {
      name,
      budget,
      color: randomColor,
      ringColor: randomColor,
      txCategories: [name.toLowerCase()]
    }]);
    setNewNeedName("");
    setNewNeedAmount("");
  };

  const removeNeed = (index: number) => {
    setNeedsList(prev => prev.filter((_, i) => i !== index));
  };

  const addWant = () => {
    if (!newWantName.trim()) return;
    const name = newWantName.trim();
    if (wantsList.some(w => w.name.toLowerCase() === name.toLowerCase())) {
      alert("A Want category with this name already exists.");
      return;
    }
    const budget = Number(newWantAmount) || 0;
    const colors = ["#3b82f6", "#22c55e", "#eab308", "#ef4444", "#a855f7", "#ec4899", "#06b6d4"];
    const randomColor = colors[wantsList.length % colors.length];
    setWantsList(prev => [...prev, {
      name,
      budget,
      color: randomColor,
      ringColor: randomColor,
      txCategories: [name.toLowerCase()]
    }]);
    setNewWantName("");
    setNewWantAmount("");
  };

  const removeWant = (index: number) => {
    setWantsList(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-fadeIn" onClick={onClose}>
      <div
        className="bg-card w-full max-w-lg rounded-2xl border border-white/10 shadow-[0_0_50px_rgba(139,92,246,0.15)] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-muted/50">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2 text-white">
              <BrainCircuit className="h-5 w-5 text-primary" /> Budget Setup
            </h3>
            <p className="text-xs text-slate-400 mt-1 font-semibold">
              {step === 1 ? "Step 1: Set Income" : step === 2 ? "Step 2: Commit Needs" : "Step 3: Setup Wants"}
            </p>
          </div>
          <button onClick={onClose}><X className="h-5 w-5 text-slate-400 hover:text-white" /></button>
        </div>

        <div className="p-6 space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-white mb-2 uppercase tracking-wider">What is your Monthly Income / Salary?</h4>
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  We use this baseline to track your automatic committed needs deductions and determine remaining flexible budgets.
                </p>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-slate-400 font-semibold text-lg">₹</span>
                  <input
                    type="number"
                    className="w-full bg-muted border border-white/10 rounded-xl pl-9 pr-4 py-3 text-lg text-white placeholder:text-slate-500 font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="e.g. 50000"
                    value={salaryInput}
                    onChange={e => setSalaryInput(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full h-12 bg-primary hover:bg-primary text-white rounded-xl font-bold transition-all mt-4 shadow-lg shadow-primary/10"
              >
                Continue to Needs
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-white mb-2 uppercase tracking-wider">Configure Your Essential Needs</h4>
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  Enter estimated monthly limits for essential costs. These are automatically deducted from your salary baseline.
                </p>
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1.5 custom-scrollbar">
                {needsList.map((need, idx) => (
                  <div key={need.name} className="flex items-center justify-between gap-4 bg-muted/40 border border-white/5 rounded-xl px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => removeNeed(idx)}
                        className="text-red-400 hover:text-red-300 p-1 hover:bg-white/5 rounded transition cursor-pointer"
                        title="Remove Category"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <span className="text-xs font-semibold text-white truncate max-w-[140px]">{need.name}</span>
                    </div>
                    <div className="relative w-32">
                      <span className="absolute left-3 top-1.5 text-xs text-slate-400">₹</span>
                      <input
                        type="number"
                        className="w-full bg-muted/60 border border-white/10 rounded-lg pl-6 pr-2 py-1 text-xs text-white text-right font-mono focus:outline-none focus:border-primary"
                        value={need.budget}
                        onChange={e => handleNeedChange(idx, e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Custom Need Inline Form */}
              <div className="flex items-center gap-2 p-2 bg-muted/20 border border-white/5 rounded-xl">
                <input
                  type="text"
                  placeholder="Custom Need Name"
                  value={newNeedName}
                  onChange={e => setNewNeedName(e.target.value)}
                  className="flex-1 bg-muted border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-primary"
                />
                <div className="relative w-24">
                  <span className="absolute left-2 top-1 text-xs text-slate-400">₹</span>
                  <input
                    type="number"
                    placeholder="Amt"
                    value={newNeedAmount}
                    onChange={e => setNewNeedAmount(e.target.value)}
                    className="w-full bg-muted border border-white/10 rounded-lg pl-5 pr-2 py-1 text-xs text-white focus:outline-none focus:border-primary"
                  />
                </div>
                <button
                  type="button"
                  onClick={addNeed}
                  disabled={!newNeedName.trim()}
                  className="px-2.5 py-1 bg-primary hover:bg-primary disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                >
                  Add
                </button>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 h-12 border border-white/10 text-slate-300 hover:bg-white/5 rounded-xl font-semibold transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 h-12 bg-primary hover:bg-primary text-white rounded-xl font-bold transition-colors shadow-lg shadow-primary/10"
                >
                  Continue to Wants
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-white mb-2 uppercase tracking-wider">Configure Your Flexible Wants</h4>
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  Setup limits for shopping, travel, or dining budgets. These represent flexible lifestyle caps.
                </p>
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1.5 custom-scrollbar">
                {wantsList.map((want, idx) => (
                  <div key={want.name} className="flex items-center justify-between gap-4 bg-muted/40 border border-white/5 rounded-xl px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => removeWant(idx)}
                        className="text-red-400 hover:text-red-300 p-1 hover:bg-white/5 rounded transition cursor-pointer"
                        title="Remove Category"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: want.color }} />
                      <span className="text-xs font-semibold text-white truncate max-w-[120px]">{want.name}</span>
                    </div>
                    <div className="relative w-32">
                      <span className="absolute left-3 top-1.5 text-xs text-slate-400">₹</span>
                      <input
                        type="number"
                        className="w-full bg-muted/60 border border-white/10 rounded-lg pl-6 pr-2 py-1 text-xs text-white text-right font-mono focus:outline-none focus:border-primary"
                        value={want.budget}
                        onChange={e => handleWantChange(idx, e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Custom Want Inline Form */}
              <div className="flex items-center gap-2 p-2 bg-muted/20 border border-white/5 rounded-xl">
                <input
                  type="text"
                  placeholder="Custom Want Name"
                  value={newWantName}
                  onChange={e => setNewWantName(e.target.value)}
                  className="flex-1 bg-muted border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-primary"
                />
                <div className="relative w-24">
                  <span className="absolute left-2 top-1 text-xs text-slate-400">₹</span>
                  <input
                    type="number"
                    placeholder="Amt"
                    value={newWantAmount}
                    onChange={e => setNewWantAmount(e.target.value)}
                    className="w-full bg-muted border border-white/10 rounded-lg pl-5 pr-2 py-1 text-xs text-white focus:outline-none focus:border-primary"
                  />
                </div>
                <button
                  type="button"
                  onClick={addWant}
                  disabled={!newWantName.trim()}
                  className="px-2.5 py-1 bg-primary hover:bg-primary disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                >
                  Add
                </button>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 h-12 border border-white/10 text-slate-300 hover:bg-white/5 rounded-xl font-semibold transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => onSave(Number(salaryInput) || 50000, needsList, wantsList)}
                  className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/15"
                >
                  <CheckCircle2 className="h-4 w-4" /> Save Budget Splits
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
