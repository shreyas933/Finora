"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from "react";
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

// Create a single stable supabase client instance outside the component
const stableSupabase = createClient();

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const supabase = stableSupabase;

  // Load User Authentication & Initial Data
  useEffect(() => {
    async function loadData() {
      try {
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

        let loadedTxs = txRes.data || [];
        const savedBudgets = localStorage.getItem("finora_budgets");
        if (savedBudgets && loadedTxs.length > 0) {
          const txsToAssign = loadedTxs.filter((t: any) => t.category === "Uncategorized" && t.name.includes(" || "));
          if (txsToAssign.length > 0) {
            console.log(`[FINORA] Auto-assigning ${txsToAssign.length} pending transactions on initial load.`);
            await Promise.all(
              txsToAssign.map(async (t: any) => {
                const parts = t.name.split(" || ");
                const cleanName = parts[0];
                const designatedCategory = parts[1];
                await supabase
                  .from("transactions")
                  .update({ name: cleanName, category: designatedCategory })
                  .eq("id", t.id);
              })
            );
            // Re-fetch transactions
            const freshTxs = await supabase.from("transactions").select("*").order("date", { ascending: false });
            if (freshTxs.data) loadedTxs = freshTxs.data;
          }
        }

        setTransactions(loadedTxs);
        if (goalsRes.data) setGoals(goalsRes.data);
        if (invRes.data) setInvestments(invRes.data);
      } catch (err) {
        console.error("[FINORA] Error loading data:", err);
      } finally {
        setIsLoaded(true);
      }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Real-Time Supabase Database Synchronization ─────────────────────────────
  // Listen for realtime insert, update, and delete events on the transactions table
  // for the authenticated user, keeping the local UI completely in sync.
  useEffect(() => {
    if (!userId) return;

    console.log(`[FINORA] Subscribing to realtime transactions for user: ${userId}`);

    const channel = supabase
      .channel(`public:transactions:user_id=eq.${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("[FINORA] Realtime transaction change:", payload);

          if (payload.eventType === "INSERT") {
            const newTx = payload.new as Transaction;
            setTransactions((prev) => {
              const exists = prev.some((t) => t.id === newTx.id);
              if (exists) return prev;
              // Sort chronologically descending
              const updatedList = [newTx, ...prev];
              return updatedList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            });
          } else if (payload.eventType === "UPDATE") {
            const updatedTx = payload.new as Transaction;
            setTransactions((prev) =>
              prev.map((t) => (t.id === updatedTx.id ? updatedTx : t))
            );
          } else if (payload.eventType === "DELETE") {
            const deletedId = payload.old.id;
            setTransactions((prev) => prev.filter((t) => t.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      console.log(`[FINORA] Unsubscribing from realtime transactions for user: ${userId}`);
      supabase.removeChannel(channel);
    };
  }, [userId, supabase]);

  // Listen for budget updates to run auto-assignment of pending transactions
  useEffect(() => {
    const handleBudgetUpdate = async () => {
      const savedBudgets = localStorage.getItem("finora_budgets");
      if (!savedBudgets || transactions.length === 0) return;

      const txsToAssign = transactions.filter((t) => t.category === "Uncategorized" && t.name.includes(" || "));
      if (txsToAssign.length > 0) {
        console.log(`[FINORA] Budget update event triggered. Auto-assigning ${txsToAssign.length} pending transactions.`);
        await Promise.all(
          txsToAssign.map(async (t) => {
            const parts = t.name.split(" || ");
            const cleanName = parts[0];
            const designatedCategory = parts[1];
            await supabase
              .from("transactions")
              .update({ name: cleanName, category: designatedCategory })
              .eq("id", t.id);
          })
        );
        // Re-fetch transactions
        const freshTxs = await supabase.from("transactions").select("*").order("date", { ascending: false });
        if (freshTxs.data) setTransactions(freshTxs.data);
      }
    };

    window.addEventListener("finora_budget_update", handleBudgetUpdate);
    return () => window.removeEventListener("finora_budget_update", handleBudgetUpdate);
  }, [transactions, supabase]);

  // ── Watch for newly-logged uncategorized transactions ──────────────────────
  // When the SMS parser can't identify the category, the transaction lands as
  // "Other" or "Uncategorized". We fire a custom event so CategoryPickerToast
  // can prompt the user to pick a category immediately.
  const seenTxIdsRef = useRef<Set<string>>(new Set());
  const initialLoadDoneRef = useRef(false);

  useEffect(() => {
    // Skip the initial data load (we only want to react to NEW arrivals)
    if (!isLoaded) return;

    if (!initialLoadDoneRef.current) {
      // First time isLoaded flips to true: record existing tx IDs without firing toast
      initialLoadDoneRef.current = true;
      seenTxIdsRef.current = new Set(transactions.map((t) => t.id));
      return;
    }

    // Identify genuinely new transaction arrivals (IDs not in our seen set)
    const newArrivals: Transaction[] = [];
    for (const tx of transactions) {
      if (!seenTxIdsRef.current.has(tx.id)) {
        newArrivals.push(tx);
        seenTxIdsRef.current.add(tx.id);
      }
    }

    // Process new arrivals (exclude Starting Balance Adjustment)
    for (const newest of newArrivals) {
      if (newest.name === "Starting Balance Adjustment") continue;

      const needsCategorization =
        newest.category === "Other" || newest.category === "Uncategorized";

      if (needsCategorization) {
        console.log("[FINORA] Broadcasting newly arrived uncategorized transaction:", newest);
        window.dispatchEvent(
          new CustomEvent("finora_uncategorized_tx", { detail: newest })
        );
      }
    }
  }, [transactions, isLoaded]);

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
      setTransactions(prev => [...data, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
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
    localStorage.removeItem("finora_wallet_items");
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
    if (gData) setGoals(gData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));

    // 3. Seed Investments
    const invPayload = data.investments.map((i: any) => ({ ...i, user_id: userId }));
    const { data: iData } = await supabase.from("investments").insert(invPayload).select();
    if (iData) setInvestments(iData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));

    // 4. Seed LocalStorage Wealth & Budgets 
    localStorage.setItem("finora_wealth", JSON.stringify(data.wealthHistory));
    localStorage.setItem("finora_budgets", JSON.stringify(data.budgets));

    // Simulate credit cards for /credit view
    const simulatedCards = [
      {
        id: "card-demo-1",
        type: "credit",
        name: "Amex Platinum",
        bank: "American Express",
        number: "1007",
        network: "amex",
        color: "graphite",
        limit: "1000000",
        perks: ["lounge", "hotel", "travel", "dining"],
        billingDate: "15"
      },
      {
        id: "card-demo-2",
        type: "credit",
        name: "Chase Sapphire Reserve",
        bank: "Chase Bank",
        number: "4420",
        network: "visa",
        color: "blue",
        limit: "800000",
        perks: ["lounge", "dining", "travel", "shopping"],
        billingDate: "20"
      }
    ];
    localStorage.setItem("finora_credit_cards", JSON.stringify([
      { id: "1", name: "Amex Platinum", balance: 2450, mappedTransactions: [data.transactions[0].id] },
      { id: "2", name: "Chase Sapphire Reserve", balance: 1200, mappedTransactions: [] }
    ]));
    localStorage.setItem("finora_wallet_items", JSON.stringify(simulatedCards));

    // Trigger global UI re-renders for storage-based graphs
    window.dispatchEvent(new Event("finora_wealth_update"));
    window.dispatchEvent(new Event("finora_budget_update"));
  };

  // ── COMPUTED METRICS ──
  const monthlyIncome = transactions.filter(t => t.type === "income").reduce((acc, t) => acc + Number(t.amount), 0);
  const monthlyExpenses = transactions.filter(t => t.type === "expense").reduce((acc, t) => acc + Number(t.amount), 0);
  const balance = transactions.reduce((acc, t) => t.type === "income" ? acc + Number(t.amount) : acc - Number(t.amount), 0);
  const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;
  const healthScore = transactions.length === 0
    ? 100
    : Math.min(100, Math.max(0, 50 + (savingsRate * 0.5) + (balance > 100000 ? 10 : 0)));

  const contextValue = useMemo(() => ({
    isLoaded, userId,
    transactions, addTransaction, bulkAddTransactions, updateTransaction, deleteTransaction,
    goals, addGoal, updateGoal, deleteGoal,
    investments, addInvestment, updateInvestment, deleteInvestment,
    clearAllData, seedInvestorDemo,
    balance, monthlyIncome, monthlyExpenses, savingsRate, healthScore
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [isLoaded, userId, transactions, goals, investments, balance, monthlyIncome, monthlyExpenses, savingsRate, healthScore]);

  return (
    <FinanceContext.Provider value={contextValue}>
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
