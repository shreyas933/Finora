"use client";

import { useFinance } from "@/context/FinanceContext";
import { formatCurrency, cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight, Wallet, Activity, Plus, CreditCard, ChevronRight, Pencil } from "lucide-react";
import Link from "next/link";
import { getDaysInMonth } from "date-fns";
import { motion } from "framer-motion";
import { AIInsights } from "@/components/dashboard/AIInsights";
import { DailyBriefing } from "@/components/dashboard/DailyBriefing";
import { FinancialWins } from "@/components/dashboard/FinancialWins";
import { StartingBalanceModal } from "@/components/dashboard/StartingBalanceModal";
import { useCurrency } from "@/context/CurrencyContext";
import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { NameSetupModal } from "@/components/dashboard/NameSetupModal";

export default function DashboardPage() {
  const { balance, monthlyIncome, monthlyExpenses, healthScore, transactions } = useFinance();
  const { currency } = useCurrency();
  const [safeToSpend, setSafeToSpend] = useState<number>(0);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [walletCardsCount, setWalletCardsCount] = useState({ credit: 0, debit: 0 });
  const [profileName, setProfileName] = useState<string>("");
  const [greetingText, setGreetingText] = useState<string>("Welcome back");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const firstName = user.user_metadata?.first_name;
        if (firstName) {
          setProfileName(firstName);
        } else {
          setShowNameModal(true);
        }
      }
    });

    const hour = new Date().getHours();
    if (hour < 12) setGreetingText("Good morning");
    else if (hour < 17) setGreetingText("Good afternoon");
    else setGreetingText("Good evening");
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("finora_wallet_items");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const credit = parsed.filter((c: any) => c.type === "credit").length;
        const debit = parsed.filter((c: any) => c.type === "debit").length;
        setWalletCardsCount({ credit, debit });
      } catch (e) { }
    }
  }, []);

  useEffect(() => {
    // If monthlyIncome is 0, safeToSpend should be 0
    if (monthlyIncome <= 0) {
      setSafeToSpend(0);
      return;
    }

    // Determine discretionary budget targets
    const saved = localStorage.getItem("finora_budgets");
    let target = 0;
    if (saved) {
      const parsed = JSON.parse(saved);
      const discretionary = parsed.filter((b: any) => !["Rent & Utilities", "Healthcare", "Savings", "Rent", "Housing", "Medical"].includes(b.name || b.category));
      const discretionaryTarget = discretionary.reduce((acc: number, curr: any) => acc + Number(curr.budget || curr.limit || 0), 0);

      const fixed = parsed.filter((b: any) => ["Rent & Utilities", "Healthcare", "Savings", "Rent", "Housing", "Medical"].includes(b.name || b.category));
      const fixedTarget = fixed.reduce((acc: number, curr: any) => acc + Number(curr.budget || curr.limit || 0), 0);

      const maxDiscretionary = Math.max(0, monthlyIncome - fixedTarget);
      target = Math.min(discretionaryTarget, maxDiscretionary);
    } else {
      target = monthlyIncome * 0.3;
    }

    // Tally current month discretionary spend
    const currentMonth = new Date().getMonth();
    let discretionarySpent = 0;
    transactions.forEach(t => {
      if (t.type === "expense") {
        const txDate = new Date(t.date);
        if (txDate.getMonth() === currentMonth) {
          const isFixed = ["Rent & Utilities", "Healthcare", "Savings", "Rent", "Housing", "Medical"].some(k => t.category.includes(k));
          if (!isFixed) discretionarySpent += t.amount;
        }
      }
    });

    const remaining = Math.max(0, target - discretionarySpent);
    const now = new Date();
    const daysInMonth = getDaysInMonth(now);
    const daysLeft = Math.max(1, daysInMonth - now.getDate() + 1);

    setSafeToSpend(Math.round(remaining / daysLeft));
  }, [transactions, monthlyIncome]);



  const totalOverspent = useMemo(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("finora_budgets") : null;
    if (!saved) return 0;
    try {
      const parsed = JSON.parse(saved);
      let overspent = 0;
      parsed.forEach((b: any) => {
        const spent = transactions
          .filter(t => t.type === "expense" && (b.txCategories || []).some((cat: string) => t.category.toLowerCase().includes(cat.toLowerCase()) || t.name.toLowerCase().includes(cat.toLowerCase())))
          .reduce((acc, t) => acc + t.amount, 0);
        if (spent > b.budget) {
          overspent += (spent - b.budget);
        }
      });
      return overspent;
    } catch {
      return 0;
    }
  }, [transactions]);

  const alertMessage = useMemo(() => {
    if (totalOverspent > 0) {
      return `You have exceeded your budget by ${formatCurrency(totalOverspent, currency)} this month. Consider reducing discretionary spending.`;
    }
    return `Your savings rate is lower than recommended this month. Consider reducing lifestyle expenses.`;
  }, [totalOverspent, currency]);

  return (
    <div className="space-y-5 pb-8">
      {showNameModal && (
        <NameSetupModal 
          onComplete={(firstName) => {
            setProfileName(firstName);
            setShowNameModal(false);
          }} 
        />
      )}

      {showBalanceModal && <StartingBalanceModal onClose={() => setShowBalanceModal(false)} />}

      {/* === Greeting === */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight" style={{letterSpacing: '-0.02em'}}>
            {greetingText}{profileName ? `, ${profileName}` : ""} 👋
          </h2>
          <p className="text-muted-foreground text-sm mt-0.5">Here&apos;s your financial snapshot.</p>
        </div>
      </div>

      {/* === Hero Balance Card === */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="hero-card p-6 md:p-8"
      >
        {/* Top row */}
        <div className="relative z-10 flex items-start justify-between mb-6">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest" style={{color: 'rgba(176, 196, 222, 0.6)'}}>Total Balance</span>
            <div className="text-4xl md:text-5xl font-bold mt-2 tracking-tight" style={{color: '#f0f4ff', letterSpacing: '-0.03em'}}>
              {formatCurrency(balance, currency)}
            </div>
          </div>
          <button
            onClick={() => setShowBalanceModal(true)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 hover:opacity-80"
            style={{background: 'rgba(255,255,255,0.08)', color: 'rgba(176,196,222,0.8)', border: '1px solid rgba(255,255,255,0.1)'}}
          >
            <Pencil className="h-3 w-3" /> Set
          </button>
        </div>

        {/* Income / Expense pills */}
        <div className="relative z-10 flex gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)'}}>
            <ArrowUpRight className="h-4 w-4 text-emerald-400" />
            <div>
              <p className="text-[10px] text-emerald-400/70 uppercase tracking-wider font-semibold">Income</p>
              <p className="text-sm font-bold text-emerald-400">{formatCurrency(monthlyIncome, currency)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)'}}>
            <ArrowDownRight className="h-4 w-4 text-red-400" />
            <div>
              <p className="text-[10px] text-red-400/70 uppercase tracking-wider font-semibold">Expenses</p>
              <p className="text-sm font-bold text-red-400">{formatCurrency(monthlyExpenses, currency)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{background: 'rgba(129,1,0,0.12)', border: '1px solid rgba(129,1,0,0.25)'}}>
            <Wallet className="h-4 w-4 text-red-300" />
            <div>
              <p className="text-[10px] text-red-300/70 uppercase tracking-wider font-semibold">Safe to spend</p>
              <p className="text-sm font-bold text-red-300">{formatCurrency(safeToSpend, currency)}/day</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* === Quick Action Tiles === */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar">
        {[
          { icon: <Plus className="h-5 w-5" />, label: 'Add Tx', href: '/transactions', color: '#22c55e' },
          { icon: <Activity className="h-5 w-5" />, label: 'CFO Chat', href: '/chat', color: '#810100' },
          { icon: <CreditCard className="h-5 w-5" />, label: 'Cards', href: '/credit', color: '#3b82f6' },
          { icon: <ChevronRight className="h-5 w-5" />, label: 'Goals', href: '/goals', color: '#a855f7' },
        ].map((item) => (
          <Link key={item.label} href={item.href} className="quick-pill flex-shrink-0">
            <div className="quick-pill-icon" style={{borderColor: `${item.color}30`, background: `${item.color}12`}}>
              <span style={{color: item.color}}>{item.icon}</span>
            </div>
            <span className="text-[11px] font-semibold text-muted-foreground">{item.label}</span>
          </Link>
        ))}
      </div>

      {/* === Stat Cards Row === */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Health Score */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="navy-card p-4"
        >
          <p className="text-xs text-muted-foreground font-medium mb-1">Health Score</p>
          <div className="text-2xl font-bold mb-2" style={{color: healthScore > 70 ? '#22c55e' : healthScore > 40 ? '#eab308' : '#ef4444'}}>
            {healthScore.toFixed(0)}<span className="text-sm text-muted-foreground font-normal">/100</span>
          </div>
          <div className="h-1.5 w-full rounded-full overflow-hidden" style={{background: 'rgba(30,42,58,0.8)'}}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${healthScore}%`, background: healthScore > 70 ? '#22c55e' : healthScore > 40 ? '#eab308' : '#ef4444' }}
            />
          </div>
        </motion.div>

        {/* Cards */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="navy-card p-4"
        >
          <Link href="/credit" className="block h-full">
            <p className="text-xs text-muted-foreground font-medium mb-1">Credit Wallet</p>
            <div className="text-2xl font-bold mb-1" style={{color: '#f0f4ff'}}>
              {walletCardsCount.credit + walletCardsCount.debit}
              <span className="text-sm text-muted-foreground font-normal"> cards</span>
            </div>
            <p className="text-xs text-primary font-semibold flex items-center gap-0.5">
              View perks <ChevronRight className="h-3 w-3" />
            </p>
          </Link>
        </motion.div>

        {/* Monthly Income */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="navy-card p-4"
        >
          <p className="text-xs text-muted-foreground font-medium mb-1">Monthly Income</p>
          <div className="text-2xl font-bold text-emerald-400">{formatCurrency(monthlyIncome, currency)}</div>
          <p className="text-xs text-emerald-400/60 mt-1">On track</p>
        </motion.div>

        {/* Monthly Expenses */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="navy-card p-4"
        >
          <p className="text-xs text-muted-foreground font-medium mb-1">Monthly Spend</p>
          <div className="text-2xl font-bold text-red-400">{formatCurrency(monthlyExpenses, currency)}</div>
          <p className="text-xs text-muted-foreground mt-1">This month</p>
        </motion.div>
      </div>

      {/* === AI Insights === */}
      <AIInsights />

      {/* === Recent Transactions === */}
      <div className="navy-card p-5">
        <div className="section-header">
          <p className="text-sm font-bold" style={{color: '#f0f4ff'}}>Recent Transactions</p>
          <Link href="/transactions" className="text-xs text-primary font-semibold flex items-center gap-0.5 hover:underline">
            View all <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        <div>
          {transactions.slice(0, 7).map((tx) => {
            const cleanName = tx.name.includes(" || ") ? tx.name.split(" || ")[0] : tx.name;
            const emoji = tx.type === 'income' ? '💰' : 
              tx.category?.toLowerCase().includes('food') ? '🍽️' :
              tx.category?.toLowerCase().includes('shop') ? '🛍️' :
              tx.category?.toLowerCase().includes('transport') ? '🚗' :
              tx.category?.toLowerCase().includes('health') ? '💊' :
              tx.category?.toLowerCase().includes('travel') ? '✈️' :
              tx.category?.toLowerCase().includes('entertain') ? '🎬' : '💳';
            return (
              <div key={tx.id} className="tx-row">
                <div className="tx-avatar" style={{background: tx.type === 'income' ? 'rgba(34,197,94,0.12)' : 'rgba(30,42,58,0.8)'}}>
                  {emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{color: '#f0f4ff'}}>{cleanName}</p>
                  <p className="text-xs text-muted-foreground truncate">{tx.category} · {tx.date}</p>
                </div>
                <div className={cn("text-sm font-bold flex-shrink-0", tx.type === 'income' ? 'text-emerald-400' : 'text-red-400')}>
                  {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, currency)}
                </div>
              </div>
            );
          })}
          {transactions.length === 0 && (
            <div className="py-8 text-center text-muted-foreground text-sm">No transactions yet</div>
          )}
        </div>
      </div>

      {/* === Daily Briefing + Financial Wins === */}
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="navy-card p-5 lg:col-span-3">
          <DailyBriefing />
        </div>
        <div className="navy-card p-5 lg:col-span-2">
          <FinancialWins />
        </div>
      </div>
    </div>
  );
}

