"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

export type Transaction = {
  id: string;
  date: string;
  amount: number;
  category: string;
  type: "income" | "expense";
  name: string;
};

export type Goal = {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
};

export type Investment = {
  id: string;
  name: string;
  type: string;
  invested: number;
  current_value: number;
};

type FinanceContextType = {
  isLoaded: boolean;
  userId: string | null;
  transactions: Transaction[];
  addTransaction: (t: Omit<Transaction, "id">) => Promise<void>;
  bulkAddTransactions: (txs: Omit<Transaction, "id">[]) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  
  goals: Goal[];
  addGoal: (g: Omit<Goal, "id">) => Promise<void>;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;

  investments: Investment[];
  addInvestment: (i: Omit<Investment, "id">) => Promise<void>;
  updateInvestment: (id: string, updates: Partial<Investment>) => Promise<void>;
  deleteInvestment: (id: string) => Promise<void>;

  clearAllData: () => Promise<void>;
  seedInvestorDemo: (data: any) => Promise<void>;

  balance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
  healthScore: number;
};

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const supabase = createClient();

  // Load User Authentication & Initial Data
  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoaded(true);
        return;
      }
      setUserId(user.id);

      // Fetch all user active data in parallel
      const [txRes, goalsRes, invRes] = await Promise.all([
        supabase.from("transactions").select("*").order("date", { ascending: false }),
        supabase.from("goals").select("*").order("created_at", { ascending: false }),
        supabase.from("investments").select("*").order("created_at", { ascending: false }),
      ]);

      if (txRes.data) setTransactions(txRes.data);
      if (goalsRes.data) setGoals(goalsRes.data);
      if (invRes.data) setInvestments(invRes.data);
      setIsLoaded(true);
    }
    
    loadData();

    // Listen for auth changes (e.g. login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setUserId(null);
        setTransactions([]);
        setGoals([]);
        setInvestments([]);
      } else if (event === "SIGNED_IN") {
        loadData();
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // ── TRANSACTIONS ──
  const addTransaction = async (t: Omit<Transaction, "id">) => {
    if (!userId) return;
    const { data, error } = await supabase.from("transactions").insert([{ ...t, user_id: userId }]).select().single();
    if (data && !error) setTransactions((prev) => [data, ...prev]);
  };
  const bulkAddTransactions = async (txs: Omit<Transaction, "id">[]) => {
    if (!userId || txs.length === 0) return;
    const payload = txs.map(t => ({ ...t, user_id: userId }));
    const { data, error } = await supabase.from("transactions").insert(payload).select();
    if (data && !error) {
      setTransactions(prev => [...data, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }
  };
  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    const { data, error } = await supabase.from("transactions").update(updates).eq("id", id).select().single();
    if (data && !error) setTransactions(prev => prev.map(t => t.id === id ? data : t));
  };
  const deleteTransaction = async (id: string) => {
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (!error) setTransactions(prev => prev.filter(t => t.id !== id));
  };

  // ── GOALS ──
  const addGoal = async (g: Omit<Goal, "id">) => {
    if (!userId) return;
    const { data, error } = await supabase.from("goals").insert([{ ...g, user_id: userId }]).select().single();
    if (data && !error) setGoals((prev) => [data, ...prev]);
  };
  const updateGoal = async (id: string, updates: Partial<Goal>) => {
    const { data, error } = await supabase.from("goals").update(updates).eq("id", id).select().single();
    if (data && !error) setGoals(prev => prev.map(g => g.id === id ? data : g));
  };
  const deleteGoal = async (id: string) => {
    const { error } = await supabase.from("goals").delete().eq("id", id);
    if (!error) setGoals(prev => prev.filter(g => g.id !== id));
  };

  // ── INVESTMENTS ──
  const addInvestment = async (i: Omit<Investment, "id">) => {
    if (!userId) return;
    const { data, error } = await supabase.from("investments").insert([{ ...i, user_id: userId }]).select().single();
    if (data && !error) setInvestments((prev) => [data, ...prev]);
  };
  const updateInvestment = async (id: string, updates: Partial<Investment>) => {
    const { data, error } = await supabase.from("investments").update(updates).eq("id", id).select().single();
    if (data && !error) setInvestments(prev => prev.map(i => i.id === id ? data : i));
  };
  const deleteInvestment = async (id: string) => {
    const { error } = await supabase.from("investments").delete().eq("id", id);
    if (!error) setInvestments(prev => prev.filter(i => i.id !== id));
  };

  const clearAllData = async () => {
    if (!userId) return;
    await Promise.all([
      supabase.from("transactions").delete().eq("user_id", userId),
      supabase.from("goals").delete().eq("user_id", userId),
      supabase.from("investments").delete().eq("user_id", userId)
    ]);
    localStorage.removeItem("finora_credit_cards");
    localStorage.removeItem("finora_budgets");
    localStorage.removeItem("finora_onboarding_done");
    window.dispatchEvent(new Event("finora_budget_update"));
    setTransactions([]);
    setGoals([]);
    setInvestments([]);
  };

  const seedInvestorDemo = async (data: any) => {
    if (!userId) return;
    await clearAllData();

    // 1. Seed Transactions
    await bulkAddTransactions(data.transactions);

    // 2. Seed Goals
    const goalsPayload = data.goals.map((g: any) => ({ ...g, user_id: userId }));
    const { data: gData } = await supabase.from("goals").insert(goalsPayload).select();
    if (gData) setGoals(gData.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));

    // 3. Seed Investments
    const invPayload = data.investments.map((i: any) => ({ ...i, user_id: userId }));
    const { data: iData } = await supabase.from("investments").insert(invPayload).select();
    if (iData) setInvestments(iData.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));

    // 4. Seed LocalStorage Wealth & Budgets 
    localStorage.setItem("finora_wealth", JSON.stringify(data.wealthHistory));
    localStorage.setItem("finora_budgets", JSON.stringify(data.budgets));
    
    // Simulate credit cards for /credit view
    localStorage.setItem("finora_credit_cards", JSON.stringify([
      { id: "1", name: "Amex Platinum", balance: 2450, mappedTransactions: [data.transactions[0].id] },
      { id: "2", name: "Chase Sapphire Reserve", balance: 1200, mappedTransactions: [] }
    ]));
    
    // Trigger global UI re-renders for storage-based graphs
    window.dispatchEvent(new Event("finora_wealth_update"));
    window.dispatchEvent(new Event("finora_budget_update"));
  };

  // ── COMPUTED METRICS ──
  const monthlyIncome = transactions.filter(t => t.type === "income").reduce((acc, t) => acc + Number(t.amount), 0);
  const monthlyExpenses = transactions.filter(t => t.type === "expense").reduce((acc, t) => acc + Number(t.amount), 0);
  const balance = transactions.reduce((acc, t) => t.type === "income" ? acc + Number(t.amount) : acc - Number(t.amount), 0);
  const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;
  const healthScore = Math.min(100, Math.max(0, 50 + (savingsRate * 0.5) + (balance > 100000 ? 10 : 0)));

  return (
    <FinanceContext.Provider value={{
      isLoaded, userId,
      transactions, addTransaction, bulkAddTransactions, updateTransaction, deleteTransaction,
      goals, addGoal, updateGoal, deleteGoal,
      investments, addInvestment, updateInvestment, deleteInvestment,
      clearAllData, seedInvestorDemo,
      balance, monthlyIncome, monthlyExpenses, savingsRate, healthScore
    }}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error("useFinance must be used within a FinanceProvider");
  }
  return context;
}
