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
  reviewTxIds: string[];
};

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "Food & Dining": ["swiggy", "zomato", "dining", "restaurant", "cafe", "starbucks", "mcdonald", "kfc", "pizza", "burger", "food", "chaayos", "bakery", "eats"],
  "Shopping": ["amazon", "flipkart", "shopping", "myntra", "nykaa", "meesho", "retail", "clothing", "groceries", "bigbasket", "blinkit", "zepto", "dmart", "d-mart"],
  "Transportation": ["uber", "ola", "rapido", "namma", "metro", "fuel", "petrol", "hpcl", "bpcl", "indian oil", "transport", "car", "auto"],
  "Entertainment": ["netflix", "spotify", "prime", "hotstar", "youtube", "ott", "bms", "bookmyshow", "pvr", "cinema", "movies", "entertainment"],
  "Travel": ["makemytrip", "goibibo", "irctc", "easemytrip", "booking", "hotel", "flight", "travel", "trip", "airbnb"],
  "Health": ["pharmacy", "hospital", "apollo", "1mg", "pharmeasy", "health", "medical", "doctor", "insurance"],
  "Income": ["salary", "payroll", "dividend", "interest", "credit", "refund", "cashback"],
  "Investment": ["mutual fund", "zerodha", "groww", "stock", "investment"]
};

function normalizeMerchantName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s*\|\|\s*.*/g, "") // strip " || category"
    .replace(/\(.*\)/g, "") // strip card details e.g. "(HDFC card)"
    .replace(/[^a-z0-9\s]/g, "") // remove punctuation
    .replace(/\s+/g, " ") // clean whitespace
    .trim();
}

function getBigrams(str: string): string[] {
  const bigrams = [];
  for (let i = 0; i < str.length - 1; i++) {
    bigrams.push(str.substring(i, i + 2));
  }
  return bigrams;
}

function getJaccardSimilarity(str1: string, str2: string): number {
  const s1 = getBigrams(str1);
  const s2 = getBigrams(str2);
  if (s1.length === 0 && s2.length === 0) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;
  
  const set1 = new Set(s1);
  const set2 = new Set(s2);
  
  let intersection = 0;
  for (const b of set1) {
    if (set2.has(b)) intersection++;
  }
  
  const union = set1.size + set2.size - intersection;
  return intersection / union;
}

// Core confidence-based transaction categorizer
function categorizeTransaction(
  name: string,
  type: "income" | "expense",
  activeCategories: string[],
  merchantMemory: Record<string, string>
): { category: string; confidence: number } {
  const normName = normalizeMerchantName(name);
  if (!normName) {
    const defaultCat = type === "income"
      ? (activeCategories.find(ac => ac.toLowerCase().includes("income")) || "Income")
      : (activeCategories.find(ac => ac.toLowerCase() === "other") || "Other");
    return { category: defaultCat, confidence: 30 };
  }

  // 1. Exact Match in merchant learning memory (100% confidence)
  for (const [memMerchant, cat] of Object.entries(merchantMemory)) {
    const normMem = normalizeMerchantName(memMerchant);
    if (normMem === normName && activeCategories.includes(cat)) {
      return { category: cat, confidence: 100 };
    }
  }

  // 2. Substring Match in merchant learning memory (95% confidence)
  for (const [memMerchant, cat] of Object.entries(merchantMemory)) {
    const normMem = normalizeMerchantName(memMerchant);
    if (activeCategories.includes(cat)) {
      if (normName.includes(normMem) && normMem.length >= 3) {
        return { category: cat, confidence: 95 };
      }
      if (normMem.includes(normName) && normName.length >= 3) {
        return { category: cat, confidence: 95 };
      }
    }
  }

  // 3. Jaccard Similarity with merchant learning memory (90% confidence)
  for (const [memMerchant, cat] of Object.entries(merchantMemory)) {
    const normMem = normalizeMerchantName(memMerchant);
    if (activeCategories.includes(cat)) {
      const sim = getJaccardSimilarity(normName, normMem);
      if (sim >= 0.7) {
        return { category: cat, confidence: 90 };
      }
    }
  }

  // 4. Exact/Substring match to active category names themselves (85% confidence)
  for (const catName of activeCategories) {
    const normCat = catName.toLowerCase().trim();
    if (normCat !== "other" && normCat !== "uncategorized") {
      if (normName.includes(normCat) && normCat.length >= 3) {
        return { category: catName, confidence: 85 };
      }
    }
  }

  // 5. Match against standard keywords (85% confidence)
  for (const [catName, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const activeCatMatch = activeCategories.find(ac => 
      ac.toLowerCase() === catName.toLowerCase() ||
      ac.toLowerCase().includes(catName.toLowerCase().split(" ")[0]) ||
      catName.toLowerCase().includes(ac.toLowerCase())
    );

    if (activeCatMatch) {
      for (const kw of keywords) {
        if (normName.includes(kw)) {
          return { category: activeCatMatch, confidence: 85 };
        }
      }
    }
  }

  // 6. Suggested Match: Jaccard similarity >= 0.5 with standard keywords (60% confidence)
  for (const [catName, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const activeCatMatch = activeCategories.find(ac => 
      ac.toLowerCase() === catName.toLowerCase() ||
      ac.toLowerCase().includes(catName.toLowerCase().split(" ")[0]) ||
      catName.toLowerCase().includes(ac.toLowerCase())
    );

    if (activeCatMatch) {
      for (const kw of keywords) {
        const sim = getJaccardSimilarity(normName, kw);
        if (sim >= 0.5) {
          return { category: activeCatMatch, confidence: 60 };
        }
      }
    }
  }

  // 7. Fallback: Default based on transaction type
  if (type === "income") {
    const incomeCat = activeCategories.find(ac => ac.toLowerCase().includes("income"));
    if (incomeCat) return { category: incomeCat, confidence: 60 };
  }

  const otherCat = activeCategories.find(ac => ac.toLowerCase() === "other") || "Other";
  return { category: otherCat, confidence: 30 };
}

function getActiveCategories(): string[] {
  if (typeof window === "undefined") return [];
  const budgetsSaved = localStorage.getItem("finora_budgets");
  let list: string[] = [];
  if (budgetsSaved) {
    try {
      list = JSON.parse(budgetsSaved).map((b: any) => b.name);
    } catch {}
  }
  if (list.length === 0) {
    list = ["Food & Dining", "Shopping", "Transportation", "Entertainment", "Health", "Travel", "Utilities", "Income", "Investment", "Other"];
  }
  return list;
}

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

  // Intelligent Categorization memory & review lists
  const [merchantCategories, setMerchantCategories] = useState<Record<string, string>>(() => {
    if (typeof window !== "undefined") {
      const savedMemory = localStorage.getItem("finora_merchant_categories");
      if (savedMemory) {
        try {
          return JSON.parse(savedMemory);
        } catch {}
      }
    }
    return {};
  });
  const [reviewTxIds, setReviewTxIds] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const savedReviews = localStorage.getItem("finora_review_tx_ids");
      if (savedReviews) {
        try {
          return JSON.parse(savedReviews);
        } catch {}
      }
    }
    return [];
  });

  // Stable references for realtime event closures
  const merchantCategoriesRef = useRef(merchantCategories);
  const reviewTxIdsRef = useRef(reviewTxIds);
  
  useEffect(() => {
    merchantCategoriesRef.current = merchantCategories;
  }, [merchantCategories]);

  useEffect(() => {
    reviewTxIdsRef.current = reviewTxIds;
  }, [reviewTxIds]);

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
        setTransactions(loadedTxs);
        if (goalsRes.data) setGoals(goalsRes.data);
        if (invRes.data) setInvestments(invRes.data);

        // Run smart categorization engine reprocessing
        reprocessUncategorizedTransactions(loadedTxs);
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

            const isUncat = newTx.category === "Uncategorized" || newTx.category === "Other" || newTx.category === "Other Merchant";
            if (isUncat && newTx.name !== "Starting Balance Adjustment") {
              const activeCategories = getActiveCategories();
              const { category: matchedCategory, confidence } = categorizeTransaction(
                newTx.name,
                newTx.type,
                activeCategories,
                merchantCategoriesRef.current
              );
              supabase
                .from("transactions")
                .update({ category: matchedCategory })
                .eq("id", newTx.id)
                .then(({ error }) => {
                  if (error) console.error("[FINORA realtime auto-categorize] error:", error);
                });

              if (confidence < 50) {
                setReviewTxIds(prev => {
                  if (prev.includes(newTx.id)) return prev;
                  const updated = [...prev, newTx.id];
                  localStorage.setItem("finora_review_tx_ids", JSON.stringify(updated));
                  return updated;
                });
              }
            }

            setTransactions((prev) => {
              const exists = prev.some((t) => t.id === newTx.id);
              if (exists) return prev;
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

  const reprocessUncategorizedTransactions = React.useCallback(async (txList: Transaction[]) => {
    const activeCategories = getActiveCategories();

    // Filter uncategorized transactions
    const uncatTxs = txList.filter(t => 
      (t.category === "Uncategorized" || t.category === "Other" || t.category === "Other Merchant") &&
      t.name !== "Starting Balance Adjustment"
    );

    if (uncatTxs.length === 0) return;

    console.log(`[FINORA] Reprocessing ${uncatTxs.length} uncategorized transactions...`);
    const updatedReviewIds = [...reviewTxIds];
    let reviewIdsChanged = false;
    let transactionsChanged = false;

    await Promise.all(uncatTxs.map(async (t) => {
      const { category: matchedCategory, confidence } = categorizeTransaction(t.name, t.type, activeCategories, merchantCategories);
      
      if (t.category !== matchedCategory) {
        transactionsChanged = true;
        await supabase
          .from("transactions")
          .update({ category: matchedCategory })
          .eq("id", t.id);
      }

      if (confidence >= 50) {
        const wasInReview = updatedReviewIds.includes(t.id);
        if (wasInReview) {
          const idx = updatedReviewIds.indexOf(t.id);
          updatedReviewIds.splice(idx, 1);
          reviewIdsChanged = true;
        }
      } else {
        const alreadyInReview = updatedReviewIds.includes(t.id);
        if (!alreadyInReview) {
          updatedReviewIds.push(t.id);
          reviewIdsChanged = true;
        }
      }
    }));

    if (reviewIdsChanged) {
      setReviewTxIds(updatedReviewIds);
      localStorage.setItem("finora_review_tx_ids", JSON.stringify(updatedReviewIds));
    }

    if (transactionsChanged) {
      const freshTxs = await supabase.from("transactions").select("*").order("date", { ascending: false });
      if (freshTxs.data) setTransactions(freshTxs.data);
    }
  }, [merchantCategories, reviewTxIds, supabase]);

  // Listen for budget updates to run auto-assignment of pending transactions
  useEffect(() => {
    const handleBudgetUpdate = () => {
      reprocessUncategorizedTransactions(transactions);
    };

    window.addEventListener("finora_budget_update", handleBudgetUpdate);
    return () => window.removeEventListener("finora_budget_update", handleBudgetUpdate);
  }, [reprocessUncategorizedTransactions, transactions]);

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

    let finalCategory = t.category;
    let needsReview = false;

    if (t.name !== "Starting Balance Adjustment") {
      const activeCategories = getActiveCategories();
      const { category: matchedCategory, confidence } = categorizeTransaction(
        t.name,
        t.type,
        activeCategories,
        merchantCategories
      );
      finalCategory = matchedCategory;
      if (confidence < 50) {
        needsReview = true;
      }
    }

    const { data, error } = await supabase.from("transactions").insert([{ ...t, category: finalCategory, user_id: userId }]).select().single();
    if (data && !error) {
      if (needsReview) {
        setReviewTxIds(prev => {
          const updated = [...prev, data.id];
          localStorage.setItem("finora_review_tx_ids", JSON.stringify(updated));
          return updated;
        });
      }
      setTransactions((prev) => [data, ...prev]);
    }
  };

  const bulkAddTransactions = async (txs: Omit<Transaction, "id">[]) => {
    if (!userId || txs.length === 0) return;

    const activeCategories = getActiveCategories();

    const payload = txs.map(t => {
      let finalCategory = t.category;
      let needsReview = false;
      if (t.name !== "Starting Balance Adjustment") {
        const { category: matchedCategory, confidence } = categorizeTransaction(
          t.name,
          t.type,
          activeCategories,
          merchantCategories
        );
        finalCategory = matchedCategory;
        if (confidence < 50) {
          needsReview = true;
        }
      }
      return { ...t, category: finalCategory, user_id: userId, _tempNeedsReview: needsReview };
    });

    const dbPayload = payload.map(({ _tempNeedsReview, ...rest }) => rest);

    const { data, error } = await supabase.from("transactions").insert(dbPayload).select();
    if (data && !error) {
      const updatedReviewIds = [...reviewTxIds];
      let reviewIdsChanged = false;

      payload.forEach((p, idx) => {
        if (p._tempNeedsReview) {
          const inserted = data[idx];
          if (inserted) {
            updatedReviewIds.push(inserted.id);
            reviewIdsChanged = true;
          }
        }
      });

      if (reviewIdsChanged) {
        setReviewTxIds(updatedReviewIds);
        localStorage.setItem("finora_review_tx_ids", JSON.stringify(updatedReviewIds));
      }

      setTransactions(prev => [...data, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }
  };
  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    const original = transactions.find(t => t.id === id);

    const { data, error } = await supabase.from("transactions").update(updates).eq("id", id).select().single();
    if (data && !error) {
      if (updates.category && updates.category !== "Uncategorized" && updates.category !== "Other" && original) {
        setMerchantCategories(prev => {
          const updated = { ...prev, [original.name]: updates.category! };
          localStorage.setItem("finora_merchant_categories", JSON.stringify(updated));
          return updated;
        });
      }

      if (reviewTxIds.includes(id)) {
        setReviewTxIds(prev => {
          const updated = prev.filter(tid => tid !== id);
          localStorage.setItem("finora_review_tx_ids", JSON.stringify(updated));
          return updated;
        });
      }

      setTransactions(prev => prev.map(t => t.id === id ? data : t));
    }
  };

  const deleteTransaction = async (id: string) => {
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (!error) {
      if (reviewTxIds.includes(id)) {
        setReviewTxIds(prev => {
          const updated = prev.filter(tid => tid !== id);
          localStorage.setItem("finora_review_tx_ids", JSON.stringify(updated));
          return updated;
        });
      }
      setTransactions(prev => prev.filter(t => t.id !== id));
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
    balance, monthlyIncome, monthlyExpenses, savingsRate, healthScore,
    reviewTxIds
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [isLoaded, userId, transactions, goals, investments, balance, monthlyIncome, monthlyExpenses, savingsRate, healthScore, reviewTxIds]);

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
