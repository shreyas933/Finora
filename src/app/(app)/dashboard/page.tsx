"use client";

import { useFinance } from "@/context/FinanceContext";
import { formatCurrency, cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ArrowDownRight, ArrowUpRight, Wallet, Activity, AlertCircle, Plus, CreditCard, ChevronRight, Pencil } from "lucide-react";
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
    <div className="space-y-6 md:space-y-8 pb-8">
      {showNameModal && (
        <NameSetupModal
          onComplete={(firstName) => {
            setProfileName(firstName);
            setShowNameModal(false);
          }}
        />
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            {greetingText}{profileName ? `, ${profileName}` : ""} 👋
          </h2>
          <p className="text-muted-foreground text-sm md:text-base mt-1">Here&apos;s a summary of your financial health.</p>
        </div>

      </div>

      {showBalanceModal && <StartingBalanceModal onClose={() => setShowBalanceModal(false)} />}

      {healthScore < 70 && transactions.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-2xl border border-red-500/15 bg-red-50 text-red-600 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-sm font-medium">{alertMessage}</p>
        </motion.div>
      )}

      {/* Feature 1: Safe-To-Spend Pacer */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full relative overflow-hidden bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-[#1a2744] rounded-2xl p-6 md:p-8 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between"
      >
        {/* Decorative elements */}
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary/20 blur-[80px] rounded-full"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/20 blur-[60px] rounded-full"></div>

        <div className="relative z-10 max-w-xl">
          <span className="px-3 py-1 text-[10px] uppercase font-bold tracking-widest bg-primary/20 text-primary-foreground rounded-full border border-primary/30 block w-max mb-3 mt-2 md:mt-0">
            Daily CFO Pacer
          </span>
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">Safe-To-Spend Today</h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            Based on your rigid math boundaries and days left in the month, if you spend exactly this much today, you will flawlessly land on your budget goals. Zero guesswork.
          </p>
        </div>
        <div className="relative z-10 mt-6 md:mt-0 flex flex-col items-start md:items-end w-full md:w-auto border-t md:border-t-0 border-white/[0.06] pt-4 md:pt-0">
          <div className="text-5xl md:text-6xl font-mono font-bold text-gradient-lime tracking-tighter drop-shadow-sm break-all">
            {formatCurrency(safeToSpend, currency)}
          </div>
          <p className="text-xs font-semibold text-slate-400 mt-2 uppercase tracking-widest">Resets at midnight</p>
        </div>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="relative overflow-hidden bg-gradient-to-br from-[#1E293B]/90 via-[#0F172A]/90 to-[#1a2744]/90 backdrop-blur-xl border-white/10 text-white shadow-card hover:border-white/20 transition-all">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 blur-[40px] rounded-full"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <div className="flex items-center gap-1.5">
              <CardTitle className="text-sm font-medium text-slate-400">Total Balance</CardTitle>
              <button
                onClick={() => setShowBalanceModal(true)}
                className="text-slate-500 hover:text-primary p-0.5 rounded transition-colors"
                title="Adjust balance"
              >
                <Pencil className="h-3 w-3" />
              </button>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <Wallet className="h-4 w-4 text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="text-2xl font-bold text-emerald-400">{formatCurrency(balance, currency)}</div>
              <button
                onClick={() => setShowBalanceModal(true)}
                className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
              >
                <Plus className="h-3 w-3" /> Set Balance
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1.5">
              +2.5% from last month
            </p>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden bg-gradient-to-br from-[#1E293B]/90 via-[#0F172A]/90 to-[#1a2744]/90 backdrop-blur-xl border-white/10 text-white shadow-card hover:border-white/20 transition-all">
          <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-emerald-500/10 blur-[30px] rounded-full"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-slate-400">Monthly Income</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <ArrowUpRight className="h-4 w-4 text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl font-bold text-emerald-400">{formatCurrency(monthlyIncome, currency)}</div>
            <p className="text-xs text-emerald-400/80 mt-1.5">
              On track
            </p>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden bg-gradient-to-br from-[#1E293B]/90 via-[#0F172A]/90 to-[#1a2744]/90 backdrop-blur-xl border-white/10 text-white shadow-card hover:border-white/20 transition-all">
          <div className="absolute -top-8 -left-8 w-24 h-24 bg-red-500/10 blur-[30px] rounded-full"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-slate-400">Monthly Expenses</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
              <ArrowDownRight className="h-4 w-4 text-red-400" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl font-bold text-red-400">{formatCurrency(monthlyExpenses, currency)}</div>
            <p className="text-xs text-red-400/80 mt-1.5">
              +12% higher than usual
            </p>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden bg-gradient-to-br from-[#1E293B]/90 via-[#0F172A]/90 to-[#1a2744]/90 backdrop-blur-xl border-white/10 text-white shadow-card hover:border-white/20 transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Activity className="w-24 h-24 text-primary" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-slate-400">Health Score</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Activity className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl font-bold text-white">{healthScore.toFixed(0)} / 100</div>
            <div className="mt-2.5 h-1.5 w-full bg-white/10 rounded-full overflow-hidden border border-white/5">
              <div
                className={cn("h-full transition-all rounded-full", healthScore > 70 ? "bg-emerald-500" : healthScore > 40 ? "bg-amber-400" : "bg-red-500")}
                style={{ width: `${healthScore}%` }}
              />
            </div>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden bg-gradient-to-br from-[#1E293B]/90 via-[#0F172A]/90 to-[#1a2744]/90 backdrop-blur-xl border-white/10 text-white shadow-card hover:border-primary/50 transition-all group">
          <Link href="/credit" className="block h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-slate-400">Credit Wallet</CardTitle>
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <CreditCard className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-bold font-mono text-white">
                {walletCardsCount.credit} Credit / {walletCardsCount.debit} Debit
              </div>
              <p className="text-xs text-slate-500 mt-1.5 flex items-center justify-between">
                <span className="text-primary font-semibold group-hover:underline">View Perks & Score</span>
                <ChevronRight className="h-3.5 w-3.5 text-primary group-hover:translate-x-0.5 transition-transform" />
              </p>
            </CardContent>
          </Link>
        </Card>
      </div>

      {/* ── AI Insights ── */}
      <AIInsights />

      {/* ── Daily Briefing + Financial Wins ── */}
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardContent className="pt-5 pb-5">
            <DailyBriefing />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardContent className="pt-5 pb-5">
            <FinancialWins />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
