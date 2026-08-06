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
    supabase.auth.getUser().then((res: any) => {
      const user = res?.data?.user;
      if (user) {
        const firstName = user.user_metadata?.first_name;
        if (firstName) {
          setProfileName(firstName);
        } else {
          setShowNameModal(true);
        }
      }
    }).catch(() => {});

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
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            {greetingText}{profileName ? `, ${profileName}` : ""}
          </h2>
          <p className="text-muted-foreground text-sm md:text-base mt-1">Here&apos;s a summary of your financial health.</p>
        </div>

      </div>

      {showBalanceModal && <StartingBalanceModal onClose={() => setShowBalanceModal(false)} />}

      {healthScore < 70 && transactions.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl border border-destructive/20 bg-destructive/5 text-destructive flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <p className="text-sm font-medium">{alertMessage}</p>
        </motion.div>
      )}

      {/* Feature 1: Safe-To-Spend Pacer Focal Point with Dynamic Glow */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "w-full relative overflow-hidden rounded-2xl p-6 md:p-8 border transition-all duration-300 flex flex-col md:flex-row items-start md:items-center justify-between group",
          safeToSpend > 300
            ? "bg-gradient-to-br from-emerald-950/80 via-primary/80 to-secondary border-emerald-500/30 shadow-[0_0_35px_rgba(16,185,129,0.22)]"
            : safeToSpend > 0
            ? "bg-gradient-to-br from-amber-950/70 via-primary/80 to-secondary border-amber-500/30 shadow-[0_0_35px_rgba(245,158,11,0.22)]"
            : "bg-gradient-to-br from-red-950/80 via-primary/80 to-secondary border-red-500/40 shadow-[0_0_35px_rgba(239,68,68,0.25)]"
        )}
      >
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 blur-3xl rounded-full group-hover:scale-125 transition-transform duration-700 pointer-events-none"></div>
        <div className="relative z-10 max-w-xl">
          <span className="px-3 py-1 text-[10px] uppercase font-bold tracking-widest bg-black/40 text-red-300 rounded-full border border-primary/40 block w-max mb-3 mt-2 md:mt-0 shadow-inner">
            Daily CFO Pacer
          </span>
          <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Safe-To-Spend Today</h3>
          <p className="text-sm text-foreground/80 leading-relaxed">
            Based on your rigid math boundaries and days left in the month, if you spend exactly this much today, you will flawlessly land on your budget goals. Zero guesswork.
          </p>
        </div>
        <div className="relative z-10 mt-6 md:mt-0 flex flex-col items-start md:items-end w-full md:w-auto border-t md:border-t-0 border-white/10 pt-4 md:pt-0">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
            className={cn(
              "text-5xl md:text-6xl font-mono font-bold tracking-tighter drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] break-all transition-colors duration-300",
              safeToSpend > 300 ? "text-emerald-300" : safeToSpend > 0 ? "text-amber-300" : "text-red-400"
            )}
          >
            {formatCurrency(safeToSpend, currency)}
          </motion.div>
          <p className="text-xs font-semibold text-foreground/70 mt-2 uppercase tracking-widest flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", safeToSpend > 0 ? "bg-emerald-400" : "bg-red-400")}></span>
              <span className={cn("relative inline-flex rounded-full h-2 w-2", safeToSpend > 0 ? "bg-emerald-500" : "bg-red-500")}></span>
            </span>
            Resets at midnight
          </p>
        </div>
      </motion.div>

      {/* KPI Cards Grid with Staggered Entrance & Subtle Hover Glows */}
      <motion.div 
        initial="hidden"
        animate="show"
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: {
              staggerChildren: 0.08
            }
          }
        }}
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-5"
      >
        <motion.div variants={{ hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } }}>
          <Card className="hover:border-emerald-500/40 transition-all duration-300 hover:shadow-[0_0_20px_rgba(16,185,129,0.18)] hover:-translate-y-0.5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-1.5">
                <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
                <button
                  onClick={() => setShowBalanceModal(true)}
                  className="text-muted-foreground hover:text-primary p-0.5 rounded transition-colors"
                  title="Adjust balance"
                >
                  <Pencil className="h-3 w-3" />
                </button>
              </div>
              <Wallet className="h-4 w-4 text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="text-2xl font-bold text-emerald-500">{formatCurrency(balance, currency)}</div>
                <button
                  onClick={() => setShowBalanceModal(true)}
                  className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="h-3 w-3" /> Set Balance
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                +2.5% from last month
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={{ hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } }}>
          <Card className="hover:border-emerald-500/40 transition-all duration-300 hover:shadow-[0_0_20px_rgba(16,185,129,0.18)] hover:-translate-y-0.5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-500">{formatCurrency(monthlyIncome, currency)}</div>
              <p className="text-xs text-emerald-500 mt-1">
                On track
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={{ hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } }}>
          <Card className="hover:border-red-500/40 transition-all duration-300 hover:shadow-[0_0_20px_rgba(239,68,68,0.18)] hover:-translate-y-0.5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
              <ArrowDownRight className="h-4 w-4 text-destructive drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{formatCurrency(monthlyExpenses, currency)}</div>
              <p className="text-xs text-destructive mt-1">
                +12% higher than usual
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={{ hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } }}>
          <Card className="relative overflow-hidden hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(129,1,0,0.25)] hover:-translate-y-0.5">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Activity className="w-24 h-24 text-primary animate-pulse" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Health Score</CardTitle>
              <Activity className="h-4 w-4 text-primary drop-shadow-[0_0_8px_rgba(129,1,0,0.5)]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{healthScore.toFixed(0)} / 100</div>
              <div className="mt-2 h-2 w-full bg-secondary rounded-full overflow-hidden bar-ambient-shine">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${healthScore}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className={cn(
                    "h-full rounded-full transition-all duration-300",
                    healthScore > 70
                      ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                      : healthScore > 40
                      ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                      : "bg-destructive shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                  )}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={{ hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } }}>
          <Card className="relative overflow-hidden hover:border-gold-500/40 transition-all duration-300 hover:shadow-[0_0_20px_rgba(234,179,8,0.18)] hover:-translate-y-0.5 group">
            <Link href="/credit" className="block h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Credit Wallet</CardTitle>
                <CreditCard className="h-4 w-4 text-primary group-hover:scale-110 transition-transform drop-shadow-[0_0_8px_rgba(129,1,0,0.4)]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono">
                  {walletCardsCount.credit} Credit / {walletCardsCount.debit} Debit
                </div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center justify-between">
                  <span className="text-primary font-semibold hover:underline">View Perks & Score</span>
                  <ChevronRight className="h-3.5 w-3.5 text-primary group-hover:translate-x-1 transition-transform" />
                </p>
              </CardContent>
            </Link>
          </Card>
        </motion.div>
      </motion.div>

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
