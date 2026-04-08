"use client";

import { useFinance } from "@/context/FinanceContext";
import { formatCurrency, cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ArrowDownRight, ArrowUpRight, Wallet, Activity, AlertCircle, Plus } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import Link from "next/link";
import { format, subDays } from "date-fns";
import { motion } from "framer-motion";
import { AIInsights } from "@/components/dashboard/AIInsights";
import { useCurrency } from "@/context/CurrencyContext";

export default function DashboardPage() {
  const { balance, monthlyIncome, monthlyExpenses, healthScore, transactions } = useFinance();
  const { currency } = useCurrency();

  // Create some dummy chart data based on recent transactions or just mock trend
  const chartData = Array.from({ length: 7 }).map((_, i) => ({
    date: format(subDays(new Date(), 6 - i), "MMM dd"),
    balance: balance - (6 - i) * 5000 + Math.random() * 10000,
  }));

  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
          <p className="text-muted-foreground">Here&apos;s a summary of your financial health.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/transactions">
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Add Transaction
            </Button>
          </Link>
        </div>
      </div>

      {healthScore < 70 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl border border-destructive/50 bg-destructive/10 text-destructive-foreground flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <p className="text-sm font-medium">You might overspend by ₹12,000 this month based on your current trajectory. Consider reducing lifestyle expenses.</p>
        </motion.div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
