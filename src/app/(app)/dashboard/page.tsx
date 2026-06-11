"use client";

import { useFinance } from "@/context/FinanceContext";
import { formatCurrency, cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ArrowDownRight, ArrowUpRight, Wallet, Activity, AlertCircle, Plus, Download, CreditCard, ChevronRight } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import Link from "next/link";
import { format, subDays, getDaysInMonth } from "date-fns";
import { motion } from "framer-motion";
import { AIInsights } from "@/components/dashboard/AIInsights";
import { PaymentSyncModal } from "@/components/dashboard/PaymentSyncModal";
import { useCurrency } from "@/context/CurrencyContext";
import { useEffect, useState, useMemo } from "react";

export default function DashboardPage() {
  const { balance, monthlyIncome, monthlyExpenses, healthScore, transactions } = useFinance();
  const { currency } = useCurrency();
  const [safeToSpend, setSafeToSpend] = useState<number>(0);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [walletCardsCount, setWalletCardsCount] = useState({ credit: 0, debit: 0 });

  useEffect(() => {
    const saved = localStorage.getItem("finora_wallet_items");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const credit = parsed.filter((c: any) => c.type === "credit").length;
        const debit = parsed.filter((c: any) => c.type === "debit").length;
        setWalletCardsCount({ credit, debit });
      } catch (e) {}
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

  // Calculate balance trend based on actual transactions over the last 7 days
  const chartData = useMemo(() => {
    const dates = Array.from({ length: 7 }).map((_, i) => subDays(new Date(), 6 - i));
    
    return dates.map(date => {
      const boundaryTime = new Date(date);
      boundaryTime.setHours(23, 59, 59, 999);
      
      const dayBalance = transactions
        .filter(t => new Date(t.date).getTime() <= boundaryTime.getTime())
        .reduce((acc, t) => {
          return t.type === "income" ? acc + t.amount : acc - t.amount;
        }, 0);

      return {
        date: format(date, "MMM dd"),
        balance: Math.round(dayBalance * 100) / 100,
      };
    });
  }, [transactions]);

  const recentTransactions = transactions.slice(0, 5);

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Overview</h2>
          <p className="text-muted-foreground text-sm md:text-base mt-1">Here&apos;s a summary of your financial health.</p>
        </div>
        <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
          <button
            onClick={() => setShowSyncModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 border"
            style={{
              background: "linear-gradient(135deg, rgba(139,92,246,0.08), rgba(99,102,241,0.08))",
              borderColor: "rgba(139,92,246,0.25)",
              color: "#6d28d9",
            }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500" />
            </span>
            Connect
          </button>
          <button
            onClick={() => typeof window !== "undefined" && window.print()}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300"
          >
            <Download className="h-4 w-4 text-slate-400" />
            Export PDF
          </button>
          <Link href="/transactions">
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Add Transaction
            </Button>
          </Link>
        </div>
      </div>

      {showSyncModal && <PaymentSyncModal onClose={() => setShowSyncModal(false)} />}

      {healthScore < 70 && transactions.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl border border-destructive/20 bg-destructive/5 text-destructive flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <p className="text-sm font-medium">{alertMessage}</p>
        </motion.div>
      )}

      {/* Feature 1: Safe-To-Spend Pacer */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full relative overflow-hidden bg-gradient-to-r from-emerald-50/60 via-card to-emerald-50 border border-emerald-200/60 rounded-2xl p-6 md:p-8 shadow-level-1 flex flex-col md:flex-row items-start md:items-center justify-between"
      >
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/5 blur-3xl rounded-full"></div>
        <div className="relative z-10 max-w-xl">
          <span className="px-3 py-1 text-[10px] uppercase font-bold tracking-widest bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 block w-max mb-3 mt-2 md:mt-0">
            Daily CFO Pacer
          </span>
          <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Safe-To-Spend Today</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Based on your rigid math boundaries and days left in the month, if you spend exactly this much today, you will flawlessly land on your budget goals. Zero guesswork.
          </p>
        </div>
        <div className="relative z-10 mt-6 md:mt-0 flex flex-col items-start md:items-end w-full md:w-auto border-t md:border-t-0 border-emerald-200/40 pt-4 md:pt-0">
          <div className="text-5xl md:text-6xl font-mono font-bold text-emerald-600 tracking-tighter drop-shadow-sm break-all">
            {formatCurrency(safeToSpend, currency)}
          </div>
          <p className="text-xs font-semibold text-emerald-600 mt-2 uppercase tracking-widest">Resets at midnight</p>
        </div>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(balance, currency)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              +2.5% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(monthlyIncome, currency)}</div>
            <p className="text-xs text-muted-foreground mt-1 text-emerald-500">
              On track
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(monthlyExpenses, currency)}</div>
            <p className="text-xs text-muted-foreground mt-1 text-destructive">
              +12% higher than usual
            </p>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Activity className="w-24 h-24" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Score</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{healthScore.toFixed(0)} / 100</div>
            <div className="mt-2 h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div
                className={cn("h-full transition-all", healthScore > 70 ? "bg-emerald-500" : healthScore > 40 ? "bg-amber-500" : "bg-destructive")}
                style={{ width: `${healthScore}%` }}
              />
            </div>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden hover:border-primary/30 transition-colors">
          <Link href="/credit" className="block h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Credit Wallet</CardTitle>
              <CreditCard className="h-4 w-4 text-violet-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">
                {walletCardsCount.credit} Credit / {walletCardsCount.debit} Debit
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center justify-between">
                <span className="text-violet-400 font-semibold hover:underline">View Perks & Score</span>
                <ChevronRight className="h-3.5 w-3.5 text-violet-400" />
              </p>
            </CardContent>
          </Link>
        </Card>
      </div>

      {/* ── AI Insights ── */}
      <AIInsights />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Balance Trend</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-10" />
                  <XAxis
                    dataKey="date"
                    stroke="currentColor"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    className="opacity-50"
                  />
                  <YAxis
                    stroke="currentColor"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `₹${value / 1000}k`}
                    className="opacity-50"
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', borderRadius: '8px' }}
                    itemStyle={{ color: 'var(--color-foreground)' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="balance"
                    stroke="var(--color-primary)"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 6, fill: "var(--color-primary)" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 overflow-hidden flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>
                You have {recentTransactions.length} recent transactions
              </CardDescription>
            </div>
            <Link href="/transactions">
              <Button variant="ghost" size="sm" className="text-xs">View All</Button>
            </Link>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto pr-2">
            <div className="space-y-6">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full",
                      tx.type === "income" ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive"
                    )}>
                      {tx.type === "income" ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{tx.name}</p>
                      <p className="text-xs text-muted-foreground">{tx.category}</p>
                    </div>
                  </div>
                  <div className="text-sm font-medium">
                    {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount, currency)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
