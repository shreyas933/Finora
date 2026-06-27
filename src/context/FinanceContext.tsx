"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  categorizeTransaction,
  applyCategorizationResult,
  normalizeMerchant,
  extractUserCategories,
  type MerchantMapping,
  type CategorizeResult,
} from "@/lib/categorizationEngine";

export type Transaction = {
  id: string;
  date: string;
  amount: number;
  category: string;
  type: "income" | "expense";
  name: string;
  needs_review?: boolean;
  suggested_category?: string | null;
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

  // ── Categorization Engine ──
  merchantMappings: MerchantMapping[];
  needsReviewCount: number;
  needsReviewTransactions: Transaction[];
  assignCategory: (txId: string, category: string, merchantName: string) => Promise<void>;
  reprocessUncategorized: () => Promise<void>;
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
  const [merchantMappings, setMerchantMappings] = useState<MerchantMapping[]>([]);
  const supabase = stableSupabase;

  // ── Helper: Run categorization engine on a single transaction ──
  const categorizeSingle = useCallback((
    tx: Omit<Transaction, "id">,
    mappings: MerchantMapping[],
  ): Omit<Transaction, "id"> => {
    // If the transaction already has a meaningful category, respect it
    if (tx.category && tx.category !== "Uncategorized" && tx.category !== "Other") {
      return { ...tx, needs_review: false, suggested_category: null };
    }

    const userCategories = extractUserCategories();
    const result = categorizeTransaction(tx.name, tx.type, mappings, userCategories);
    const applied = applyCategorizationResult(result, tx.category);

    return {
      ...tx,
      category: applied.category,
      needs_review: applied.needs_review,
      suggested_category: applied.suggested_category,
    };
  }, []);

  // ── Migrate legacy "name || category" format ──
  const migrateLegacyTransaction = useCallback((tx: any): any => {
    if (tx.name && tx.name.includes(" || ")) {
      const parts = tx.name.split(" || ");
      return {
        ...tx,
        name: parts[0].trim(),
        // Keep category as-is if it's already been assigned; otherwise use the encoded one
        category: tx.category === "Uncategorized" ? parts[1]?.trim() || tx.category : tx.category,
      };
    }
    return tx;
  }, []);

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

        // Fetch all user data in parallel (including merchant mappings)
        const [txRes, goalsRes, invRes, mappingsRes] = await Promise.all([
          supabase.from("transactions").select("*").order("date", { ascending: false }),
          supabase.from("goals").select("*").order("created_at", { ascending: false }),
          supabase.from("investments").select("*").order("created_at", { ascending: false }),
          supabase.from("merchant_mappings").select("*").order("updated_at", { ascending: false }),
        ]);

        let loadedMappings: MerchantMapping[] = mappingsRes.data || [];
        setMerchantMappings(loadedMappings);

        let loadedTxs: Transaction[] = (txRes.data || []).map(migrateLegacyTransaction);

        // Auto-migrate any legacy "name || category" transactions in the database
        const legacyTxs = (txRes.data || []).filter((t: any) => t.name?.includes(" || "));
        if (legacyTxs.length > 0) {
          console.log(`[FINORA] Migrating ${legacyTxs.length} legacy "||" transactions.`);
          await Promise.all(
            legacyTxs.map(async (t: any) => {
              const parts = t.name.split(" || ");
              const cleanName = parts[0].trim();
              const designatedCategory = parts[1]?.trim() || t.category;
              await supabase
                .from("transactions")
                .update({ name: cleanName, category: designatedCategory })
                .eq("id", t.id);
            })
          );
        }

        // Run categorization engine on uncategorized transactions
        const userCategories = extractUserCategories();
        const uncategorized = loadedTxs.filter(
          t => t.category === "Uncategorized" || t.category === "Other"
        );

        if (uncategorized.length > 0 && (loadedMappings.length > 0 || userCategories.length > 0)) {
          console.log(`[FINORA] Auto-categorizing ${uncategorized.length} uncategorized transactions on load.`);
          const updates: { id: string; category: string; needs_review: boolean; suggested_category: string | null }[] = [];

          for (const tx of uncategorized) {
            const result = categorizeTransaction(tx.name, tx.type, loadedMappings, userCategories);
            const applied = applyCategorizationResult(result);

            if (applied.category !== "Uncategorized") {
              updates.push({
                id: tx.id,
                category: applied.category,
                needs_review: applied.needs_review,
                suggested_category: applied.suggested_category,
              });
            } else if (applied.needs_review && !tx.needs_review) {
              updates.push({
                id: tx.id,
                category: tx.category,
                needs_review: true,
                suggested_category: applied.suggested_category,
              });
            }
          }

          // Batch update in DB
          if (updates.length > 0) {
            await Promise.all(
              updates.map(u =>
                supabase.from("transactions").update({
                  category: u.category,
                  needs_review: u.needs_review,
                  suggested_category: u.suggested_category,
                }).eq("id", u.id)
              )
            );

            // Apply updates to local state
            loadedTxs = loadedTxs.map(tx => {
              const update = updates.find(u => u.id === tx.id);
              return update ? { ...tx, ...update } : tx;
            });
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
        setMerchantMappings([]);
      } else if (event === "SIGNED_IN") {
        loadData();
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for category/budget changes to reprocess uncategorized transactions
  useEffect(() => {
    const handleCategoriesChanged = () => {
      reprocessUncategorized();
    };

    window.addEventListener("finora_categories_changed", handleCategoriesChanged);
    window.addEventListener("finora_budget_update", handleCategoriesChanged);
    return () => {
      window.removeEventListener("finora_categories_changed", handleCategoriesChanged);
      window.removeEventListener("finora_budget_update", handleCategoriesChanged);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, merchantMappings]);

  // ── TRANSACTIONS ──
  const addTransaction = async (t: Omit<Transaction, "id">) => {
    if (!userId) return;

    // Run categorization engine
    const categorized = categorizeSingle(t, merchantMappings);

    const { data, error } = await supabase.from("transactions").insert([{
      ...categorized,
      user_id: userId,
    }]).select().single();

    if (data && !error) setTransactions((prev) => [data, ...prev]);
  };

  const bulkAddTransactions = async (txs: Omit<Transaction, "id">[]) => {
    if (!userId || txs.length === 0) return;

    // Run categorization engine on each transaction
    const categorized = txs.map(tx => categorizeSingle(tx, merchantMappings));

    const payload = categorized.map(t => ({ ...t, user_id: userId }));
    const { data, error } = await supabase.from("transactions").insert(payload).select();
    if (data && !error) {
      setTransactions(prev => [...data, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    const { data, error } = await supabase.from("transactions").update(updates).eq("id", id).select().single();
    if (data && !error) {
      setTransactions(prev => prev.map(t => t.id === id ? data : t));
    }
  };

  const deleteTransaction = async (id: string) => {
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (!error) {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  // ── CATEGORIZATION ENGINE METHODS ──

  /**
   * Assign a category to a transaction and save the merchant→category mapping
   * for future auto-categorization (the learning system).
   */
  const assignCategory = async (txId: string, category: string, merchantName: string) => {
    if (!userId) return;

    // 1. Update the transaction
    const { data, error } = await supabase.from("transactions").update({
      category,
      needs_review: false,
      suggested_category: null,
    }).eq("id", txId).select().single();

    if (data && !error) {
      setTransactions(prev => prev.map(t => t.id === txId ? data : t));
    }

    // 2. Upsert the merchant mapping for learning
    const merchantKey = normalizeMerchant(merchantName);
    if (merchantKey) {
      const { data: mappingData, error: mappingError } = await supabase
        .from("merchant_mappings")
        .upsert({
          user_id: userId,
          merchant_key: merchantKey,
          category,
          confidence: 1.0,
          source: "user",
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id,merchant_key" })
        .select()
        .single();

      if (mappingData && !mappingError) {
        setMerchantMappings(prev => {
          const filtered = prev.filter(m => m.merchant_key !== merchantKey);
          return [mappingData, ...filtered];
        });
      }
    }

    // 3. Auto-categorize other uncategorized transactions from the same merchant
    const uncategorizedSameMerchant = transactions.filter(
      t => t.id !== txId &&
        (t.category === "Uncategorized" || t.needs_review) &&
        normalizeMerchant(t.name) === merchantKey
    );

    if (uncategorizedSameMerchant.length > 0) {
      console.log(`[FINORA] Auto-assigning ${uncategorizedSameMerchant.length} more transactions from "${merchantKey}" → ${category}`);
      await Promise.all(
        uncategorizedSameMerchant.map(t =>
          supabase.from("transactions").update({
            category,
            needs_review: false,
            suggested_category: null,
          }).eq("id", t.id)
        )
      );

      setTransactions(prev => prev.map(t => {
        if (uncategorizedSameMerchant.some(u => u.id === t.id)) {
          return { ...t, category, needs_review: false, suggested_category: null };
        }
        return t;
      }));
    }
  };

  /**
   * Reprocess all uncategorized and needs_review transactions through the engine.
   * Called when categories are created/edited/deleted.
   */
  const reprocessUncategorized = async () => {
    if (!userId || transactions.length === 0) return;

    const userCategories = extractUserCategories();
    const toReprocess = transactions.filter(
      t => t.category === "Uncategorized" || t.category === "Other" || t.needs_review
    );

    if (toReprocess.length === 0) return;

    console.log(`[FINORA] Reprocessing ${toReprocess.length} uncategorized transactions.`);
    const updates: { id: string; category: string; needs_review: boolean; suggested_category: string | null }[] = [];

    for (const tx of toReprocess) {
      const result = categorizeTransaction(tx.name, tx.type, merchantMappings, userCategories);
      const applied = applyCategorizationResult(result);

      if (applied.category !== tx.category || applied.needs_review !== tx.needs_review) {
        updates.push({
          id: tx.id,
          category: applied.category,
          needs_review: applied.needs_review,
          suggested_category: applied.suggested_category,
        });
      }
    }

    if (updates.length > 0) {
      console.log(`[FINORA] Updating ${updates.length} transactions after reprocessing.`);
      await Promise.all(
        updates.map(u =>
          supabase.from("transactions").update({
            category: u.category,
            needs_review: u.needs_review,
            suggested_category: u.suggested_category,
          }).eq("id", u.id)
        )
      );

      setTransactions(prev => prev.map(tx => {
        const update = updates.find(u => u.id === tx.id);
        return update ? { ...tx, ...update } : tx;
      }));
    }
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
      supabase.from("investments").delete().eq("user_id", userId),
      supabase.from("merchant_mappings").delete().eq("user_id", userId),
    ]);
    localStorage.removeItem("finora_credit_cards");
    localStorage.removeItem("finora_wallet_items");
    localStorage.removeItem("finora_budgets");
    localStorage.removeItem("finora_onboarding_done");
    window.dispatchEvent(new Event("finora_budget_update"));
    setTransactions([]);
    setGoals([]);
    setInvestments([]);
    setMerchantMappings([]);
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
  const { monthlyIncome, monthlyExpenses, balance, savingsRate, healthScore } = useMemo(() => {
    const mIncome = transactions.filter(t => t.type === "income").reduce((acc, t) => acc + Number(t.amount), 0);
    const mExpenses = transactions.filter(t => t.type === "expense").reduce((acc, t) => acc + Number(t.amount), 0);
    const bal = transactions.reduce((acc, t) => t.type === "income" ? acc + Number(t.amount) : acc - Number(t.amount), 0);
    const sRate = mIncome > 0 ? ((mIncome - mExpenses) / mIncome) * 100 : 0;
    const hScore = transactions.length === 0
      ? 100
      : Math.min(100, Math.max(0, 50 + (sRate * 0.5) + (bal > 100000 ? 10 : 0)));
    return { monthlyIncome: mIncome, monthlyExpenses: mExpenses, balance: bal, savingsRate: sRate, healthScore: hScore };
  }, [transactions]);

  // ── Needs Review Computations ──
  const needsReviewTransactions = useMemo(() =>
    transactions.filter(t => t.needs_review === true),
    [transactions]
  );
  const needsReviewCount = needsReviewTransactions.length;

  const contextValue = useMemo(() => ({
    isLoaded, userId,
    transactions, addTransaction, bulkAddTransactions, updateTransaction, deleteTransaction,
    goals, addGoal, updateGoal, deleteGoal,
    investments, addInvestment, updateInvestment, deleteInvestment,
    clearAllData, seedInvestorDemo,
    balance, monthlyIncome, monthlyExpenses, savingsRate, healthScore,
    merchantMappings, needsReviewCount, needsReviewTransactions,
    assignCategory, reprocessUncategorized,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [isLoaded, userId, transactions, goals, investments, balance, monthlyIncome, monthlyExpenses, savingsRate, healthScore, merchantMappings, needsReviewCount, needsReviewTransactions]);

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
