/**
 * FINORA Financial OS — Layer 1: Financial Context Builder
 * ─────────────────────────────────────────────────────────────────────────────
 * Builds a comprehensive, strongly-typed FinancialSnapshot from all app data.
 * This is the SINGLE SOURCE OF TRUTH for all AI context.
 *
 * Reuses existing formulas from dashboard/page.tsx and FinanceContext.tsx
 * without reimplementing them.
 *
 * Usage (in chat page):
 *   const snapshot = buildFinancialSnapshot({ transactions, goals, investments, ... });
 *   const contextJson = JSON.stringify(snapshot);
 *   // Send contextJson to /api/chat
 */

import type { Transaction, Goal, Investment } from "@/context/FinanceContext";
import { formatCurrency } from "@/lib/utils";

// ── Wallet / Card types (matching credit/page.tsx) ────────────────────────────
export interface WalletCard {
  id: string;
  type: "credit" | "debit";
  name: string;
  bank: string;
  number: string;
  network: string;
  color: string;
  limit?: string;
  perks: string[];
  billingDate?: string;
  linkedAccount?: string;
}

// ── Budget type (matching localStorage finora_budgets) ────────────────────────
export interface BudgetItem {
  id?: string;
  category?: string;
  name?: string;
  budget?: number;
  limit?: number;
  spent?: number;
  txCategories?: string[];
}

// ── User Profile (from localStorage finora_user_profile) ─────────────────────
export interface UserProfile {
  firstName?: string;
  lastName?: string;
  email?: string;
  salary?: number;
  occupation?: string;
  riskPreference?: "Low" | "Moderate" | "Aggressive";
  financialPriority?: "Save More" | "Pay Off Debt" | "Grow Investments" | "Balance All";
  preferredRewards?: string[];
  spendingBehaviour?: string;
}

// ── Decision Memory (from localStorage finora_ai_memory) ─────────────────────
export interface MemoryItem {
  date: string;
  decision: string;
  outcome?: string;
}

// ── Computed sub-structures ───────────────────────────────────────────────────
export interface CategorySummary {
  category: string;
  totalSpent: number;
  transactionCount: number;
  thisMonth: number;
  lastMonth: number;
  delta: number; // % change month-over-month
}

export interface RecurringPayment {
  name: string;
  amount: number;
  frequency: "monthly" | "weekly" | "annual";
  lastDate: string;
  nextExpectedDate: string;
  category: string;
}

export interface CardAnalysis {
  card: WalletCard;
  outstanding: number;
  limit: number;
  utilization: number;        // 0–100
  utilizationLabel: string;   // "Safe" | "Warning" | "Critical"
  daysUntilStatement: number;
  daysUntilDue: number;
  availableCredit: number;
  rewardCategories: string[]; // from perks
}

export interface GoalAnalysis {
  goal: Goal;
  progressPercent: number;
  remaining: number;
  monthsToComplete: number;
  requiredMonthlyContribution: number;
  isOnTrack: boolean;
  daysUntilDeadline: number | null;
}

export interface UpcomingObligation {
  name: string;
  amount: number;
  dueIn: number; // days
  type: "emi" | "subscription" | "rent" | "utility" | "bill";
}

// ── Master snapshot ───────────────────────────────────────────────────────────
export interface FinancialSnapshot {
  generatedAt: string;

  // ── User Profile ──
  profile: UserProfile;

  // ── Core Metrics (from FinanceContext) ──
  balance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
  healthScore: number;
  netWorth: number; // balance + investments total value

  // ── Safe To Spend (same formula as dashboard/page.tsx) ──
  safeToSpend: {
    dailyLimit: number;
    remainingThisMonth: number;
    daysLeft: number;
    discretionaryBudgetTarget: number;
    discretionarySpentThisMonth: number;
  };

  // ── Transactions ──
  transactions: {
    recent: Transaction[];       // last 30
    topCategories: CategorySummary[];
    recurringPayments: RecurringPayment[];
    merchantFrequency: Record<string, number>; // merchant → count
    totalThisMonth: number;
    totalLastMonth: number;
    monthOverMonthChange: number; // %
  };

  // ── Budgets ──
  budgets: {
    items: Array<BudgetItem & {
      spent: number;
      remaining: number;
      usedPercent: number;
      status: "safe" | "approaching" | "overspent";
    }>;
    totalBudget: number;
    totalSpent: number;
    overspentCategories: string[];
    approachingCategories: string[];
    totalOverspent: number;
  };

  // ── Goals ──
  goals: {
    active: GoalAnalysis[];
    totalSaved: number;
    totalTarget: number;
    overallProgress: number; // %
    hasSavingsConflict: boolean;
    conflictAmount: number;  // how much short per month
    requiredMonthlySavings: number;
  };

  // ── Credit Cards ──
  creditCards: {
    cards: CardAnalysis[];
    totalLimit: number;
    totalOutstanding: number;
    overallUtilization: number;
    hasHighUtilization: boolean;
    bestCardForDining: string | null;
    bestCardForTravel: string | null;
    bestCardForShopping: string | null;
    bestCardGeneral: string | null;
  };

  // ── Investments ──
  investments: {
    holdings: Array<Investment & {
      gain: number;
      gainPercent: number;
    }>;
    totalInvested: number;
    totalCurrentValue: number;
    totalGain: number;
    totalGainPercent: number;
    monthlyInvestmentCapacity: number; // estimated how much can be invested
    allocationByType: Record<string, number>; // type → total current value
  };

  // ── Upcoming Obligations ──
  upcomingObligations: UpcomingObligation[];

  // ── Decision Memory ──
  memory: MemoryItem[];

  // ── Raw text (for backward compat with mock fallback) ──
  _legacyContextString: string;
}

// ── Raw data required to build the snapshot ──────────────────────────────────
export interface RawAppData {
  transactions: Transaction[];
  goals: Goal[];
  investments: Investment[];
  balance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
  healthScore: number;
  walletItems: WalletCard[];
  budgets: BudgetItem[];
  profile: UserProfile;
  memory: MemoryItem[];
  formatCurrency: (n: number) => string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getMonthYear(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function daysUntil(targetDateStr: string): number | null {
  if (!targetDateStr) return null;
  const target = new Date(targetDateStr);
  const now = new Date();
  const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

function detectRecurringPayments(transactions: Transaction[]): RecurringPayment[] {
  // Group expense transactions by normalized merchant name
  const merchantGroups: Record<string, Transaction[]> = {};
  transactions
    .filter(t => t.type === "expense")
    .forEach(t => {
      const key = t.name.toLowerCase().trim();
      if (!merchantGroups[key]) merchantGroups[key] = [];
      merchantGroups[key].push(t);
    });

  const recurring: RecurringPayment[] = [];
  const now = new Date();

  for (const [name, txs] of Object.entries(merchantGroups)) {
    if (txs.length < 2) continue;

    // Check if transactions appear in 2+ different months
    const months = new Set(txs.map(t => getMonthYear(new Date(t.date))));
    if (months.size < 2) continue;

    // Check if amounts are similar (within 20%)
    const amounts = txs.map(t => t.amount);
    const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const allSimilar = amounts.every(a => Math.abs(a - avg) / avg < 0.20);
    if (!allSimilar) continue;

    // Find most recent
    const sorted = [...txs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const last = sorted[0];
    const lastDate = new Date(last.date);

    // Estimate next date (monthly)
    const nextDate = new Date(lastDate);
    nextDate.setMonth(nextDate.getMonth() + 1);

    recurring.push({
      name: last.name,
      amount: avg,
      frequency: "monthly",
      lastDate: last.date,
      nextExpectedDate: nextDate.toISOString().split("T")[0],
      category: last.category,
    });
  }

  return recurring.slice(0, 15); // cap at 15
}

function buildCategoryBreakdown(transactions: Transaction[]): CategorySummary[] {
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
  const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

  const map: Record<string, CategorySummary> = {};

  transactions
    .filter(t => t.type === "expense")
    .forEach(t => {
      const cat = t.category || "Uncategorized";
      if (!map[cat]) {
        map[cat] = { category: cat, totalSpent: 0, transactionCount: 0, thisMonth: 0, lastMonth: 0, delta: 0 };
      }
      map[cat].totalSpent += t.amount;
      map[cat].transactionCount++;

      const d = new Date(t.date);
      if (d.getMonth() === thisMonth && d.getFullYear() === thisYear) {
        map[cat].thisMonth += t.amount;
      }
      if (d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear) {
        map[cat].lastMonth += t.amount;
      }
    });

  // Calculate delta
  Object.values(map).forEach(c => {
    if (c.lastMonth > 0) {
      c.delta = Math.round(((c.thisMonth - c.lastMonth) / c.lastMonth) * 100);
    } else if (c.thisMonth > 0) {
      c.delta = 100;
    }
  });

  return Object.values(map)
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 10);
}

function analyzeCards(cards: WalletCard[], transactions: Transaction[]): CardAnalysis[] {
  const now = new Date();

  return cards
    .filter(c => c.type === "credit")
    .map(card => {
      const limitNum = card.limit ? Number(card.limit.replace(/,/g, "")) : 0;

      // Calculate outstanding from transactions tagged to this card
      const cardTxs = transactions.filter(tx => {
        if (tx.type !== "expense") return false;
        const match = tx.name.match(/\((?:[^)]*?\s*)?([0-9]{4})\)$/);
        return match ? match[1] === card.number : false;
      });
      const outstanding = cardTxs.reduce((sum, tx) => sum + tx.amount, 0);
      const utilization = limitNum > 0 ? Math.min(100, Math.round((outstanding / limitNum) * 100)) : 0;

      let utilizationLabel: string;
      if (utilization < 10) utilizationLabel = "Excellent";
      else if (utilization < 30) utilizationLabel = "Safe";
      else if (utilization < 50) utilizationLabel = "Warning";
      else if (utilization < 70) utilizationLabel = "High Risk";
      else utilizationLabel = "Critical";

      // Statement date countdown
      const billingDay = parseInt(card.billingDate || "0", 10);
      let daysUntilStatement = 0;
      let daysUntilDue = 0;
      if (billingDay > 0) {
        const today = now.getDate();
        daysUntilStatement = billingDay > today ? billingDay - today : (new Date(now.getFullYear(), now.getMonth() + 1, billingDay).getDate() - today + 30);
        // Due date typically 20 days after statement
        daysUntilDue = daysUntilStatement + 20;
      }

      return {
        card,
        outstanding,
        limit: limitNum,
        utilization,
        utilizationLabel,
        daysUntilStatement,
        daysUntilDue,
        availableCredit: Math.max(0, limitNum - outstanding),
        rewardCategories: card.perks || [],
      };
    });
}

function findBestCardForCategory(cards: CardAnalysis[], category: string): string | null {
  if (cards.length === 0) return null;
  const matching = cards.filter(c => {
    const perks = c.rewardCategories.map(p => p.toLowerCase());
    return perks.some(p => p.includes(category.toLowerCase()) || category.toLowerCase().includes(p));
  });
  if (matching.length === 0) return cards[0]?.card.name ?? null;
  // Prefer lowest utilization among matching
  const sorted = matching.sort((a, b) => a.utilization - b.utilization);
  return sorted[0].card.name;
}

function analyzeGoals(goals: Goal[], monthlySavingsCapacity: number): GoalAnalysis[] {
  const activeGoals = goals.filter(g => g.current_amount < g.target_amount);
  const perGoalContribution = activeGoals.length > 0 ? monthlySavingsCapacity / activeGoals.length : 0;

  return activeGoals.map(goal => {
    const remaining = Math.max(0, goal.target_amount - goal.current_amount);
    const progressPercent = goal.target_amount > 0
      ? Math.round((goal.current_amount / goal.target_amount) * 100)
      : 0;

    const monthsToComplete = perGoalContribution > 0
      ? Math.ceil(remaining / perGoalContribution)
      : 999;

    const deadline = daysUntil(goal.target_date);

    return {
      goal,
      progressPercent,
      remaining,
      monthsToComplete,
      requiredMonthlyContribution: perGoalContribution,
      isOnTrack: deadline === null || monthsToComplete * 30 <= deadline,
      daysUntilDeadline: deadline,
    };
  });
}

function detectUpcomingObligations(
  recurringPayments: RecurringPayment[]
): UpcomingObligation[] {
  const now = new Date();
  return recurringPayments
    .map(rp => {
      const next = new Date(rp.nextExpectedDate);
      const dueIn = Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      let type: UpcomingObligation["type"] = "bill";
      const cat = rp.category.toLowerCase();
      if (cat.includes("rent") || cat.includes("housing")) type = "rent";
      else if (cat.includes("emi") || cat.includes("loan")) type = "emi";
      else if (cat.includes("subscription") || cat.includes("streaming") || cat.includes("ott")) type = "subscription";
      else if (cat.includes("utility") || cat.includes("electric") || cat.includes("internet") || cat.includes("gas")) type = "utility";

      return { name: rp.name, amount: rp.amount, dueIn, type };
    })
    .filter(o => o.dueIn >= 0 && o.dueIn <= 30)
    .sort((a, b) => a.dueIn - b.dueIn)
    .slice(0, 10);
}

// ── Main builder ──────────────────────────────────────────────────────────────
export function buildFinancialSnapshot(data: RawAppData): FinancialSnapshot {
  const {
    transactions, goals, investments, balance, monthlyIncome,
    monthlyExpenses, savingsRate, healthScore, walletItems, budgets,
    profile, memory, formatCurrency,
  } = data;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // ── Safe To Spend (verbatim formula from dashboard/page.tsx) ─────────────
  const FIXED_CATEGORIES = ["Rent & Utilities", "Healthcare", "Savings", "Rent", "Housing", "Medical"];
  let discretionaryBudgetTarget = 0;
  if (monthlyIncome > 0) {
    if (budgets.length > 0) {
      const discretionary = budgets.filter(b => !FIXED_CATEGORIES.includes(b.name || b.category || ""));
      const fixed = budgets.filter(b => FIXED_CATEGORIES.includes(b.name || b.category || ""));
      const discretionaryTotal = discretionary.reduce((acc, curr) => acc + Number(curr.budget || curr.limit || 0), 0);
      const fixedTotal = fixed.reduce((acc, curr) => acc + Number(curr.budget || curr.limit || 0), 0);
      const maxDiscretionary = Math.max(0, monthlyIncome - fixedTotal);
      discretionaryBudgetTarget = Math.min(discretionaryTotal, maxDiscretionary);
    } else {
      discretionaryBudgetTarget = monthlyIncome * 0.3;
    }
  }

  let discretionarySpentThisMonth = 0;
  transactions.forEach(t => {
    if (t.type === "expense") {
      const d = new Date(t.date);
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        const isFixed = FIXED_CATEGORIES.some(k => t.category.includes(k));
        if (!isFixed) discretionarySpentThisMonth += t.amount;
      }
    }
  });

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysLeft = Math.max(1, daysInMonth - now.getDate() + 1);
  const remainingThisMonth = Math.max(0, discretionaryBudgetTarget - discretionarySpentThisMonth);
  const dailyLimit = monthlyIncome > 0 ? Math.round(remainingThisMonth / daysLeft) : 0;

  // ── Monthly spending totals ───────────────────────────────────────────────
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  const totalThisMonth = transactions
    .filter(t => {
      const d = new Date(t.date);
      return t.type === "expense" && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const totalLastMonth = transactions
    .filter(t => {
      const d = new Date(t.date);
      return t.type === "expense" && d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const monthOverMonthChange = totalLastMonth > 0
    ? Math.round(((totalThisMonth - totalLastMonth) / totalLastMonth) * 100)
    : 0;

  // ── Merchant frequency ────────────────────────────────────────────────────
  const merchantFrequency: Record<string, number> = {};
  transactions.filter(t => t.type === "expense").forEach(t => {
    const key = t.name.toLowerCase().trim();
    merchantFrequency[key] = (merchantFrequency[key] || 0) + 1;
  });

  // ── Category breakdown ────────────────────────────────────────────────────
  const topCategories = buildCategoryBreakdown(transactions);

  // ── Recurring payments ────────────────────────────────────────────────────
  const recurringPayments = detectRecurringPayments(transactions);

  // ── Budget analysis ───────────────────────────────────────────────────────
  const enrichedBudgets = budgets.map(b => {
    // Match transactions to this budget category
    const txCategories: string[] = b.txCategories || [b.category || b.name || ""].filter(Boolean);
    const spent = transactions
      .filter(t => t.type === "expense" &&
        txCategories.some(cat =>
          t.category.toLowerCase().includes(cat.toLowerCase()) ||
          t.name.toLowerCase().includes(cat.toLowerCase())
        )
      )
      .reduce((acc, t) => acc + t.amount, 0);

    const limit = Number(b.budget || b.limit || 0);
    const remaining = Math.max(0, limit - spent);
    const usedPercent = limit > 0 ? Math.round((spent / limit) * 100) : 0;
    const status: "safe" | "approaching" | "overspent" =
      spent > limit ? "overspent" : usedPercent >= 80 ? "approaching" : "safe";

    return { ...b, spent, remaining, usedPercent, status };
  });

  const overspentCategories = enrichedBudgets.filter(b => b.status === "overspent").map(b => b.category || b.name || "Unknown");
  const approachingCategories = enrichedBudgets.filter(b => b.status === "approaching").map(b => b.category || b.name || "Unknown");
  const totalBudget = enrichedBudgets.reduce((sum, b) => sum + Number(b.budget || b.limit || 0), 0);
  const totalBudgetSpent = enrichedBudgets.reduce((sum, b) => sum + b.spent, 0);
  const totalOverspent = enrichedBudgets
    .filter(b => b.status === "overspent")
    .reduce((sum, b) => sum + (b.spent - Number(b.budget || b.limit || 0)), 0);

  // ── Goal analysis ─────────────────────────────────────────────────────────
  const monthlySavingsCapacity = monthlyIncome * (savingsRate / 100);
  const goalAnalyses = analyzeGoals(goals, monthlySavingsCapacity);
  const requiredMonthlySavings = goalAnalyses.reduce((sum, g) => sum + g.requiredMonthlyContribution, 0);
  const hasSavingsConflict = requiredMonthlySavings > monthlySavingsCapacity;
  const conflictAmount = hasSavingsConflict ? requiredMonthlySavings - monthlySavingsCapacity : 0;
  const totalGoalSaved = goals.reduce((sum, g) => sum + g.current_amount, 0);
  const totalGoalTarget = goals.reduce((sum, g) => sum + g.target_amount, 0);
  const overallGoalProgress = totalGoalTarget > 0 ? Math.round((totalGoalSaved / totalGoalTarget) * 100) : 0;

  // ── Credit card analysis ──────────────────────────────────────────────────
  const cardAnalyses = analyzeCards(walletItems, transactions);
  const totalLimit = cardAnalyses.reduce((sum, c) => sum + c.limit, 0);
  const totalOutstanding = cardAnalyses.reduce((sum, c) => sum + c.outstanding, 0);
  const overallUtilization = totalLimit > 0 ? Math.round((totalOutstanding / totalLimit) * 100) : 0;

  // ── Investment analysis ───────────────────────────────────────────────────
  const enrichedInvestments = investments.map(i => ({
    ...i,
    gain: i.current_value - i.invested,
    gainPercent: i.invested > 0 ? Math.round(((i.current_value - i.invested) / i.invested) * 100) : 0,
  }));

  const totalInvested = enrichedInvestments.reduce((sum, i) => sum + i.invested, 0);
  const totalCurrentValue = enrichedInvestments.reduce((sum, i) => sum + i.current_value, 0);
  const totalGain = totalCurrentValue - totalInvested;
  const totalGainPercent = totalInvested > 0 ? Math.round((totalGain / totalInvested) * 100) : 0;

  const allocationByType: Record<string, number> = {};
  enrichedInvestments.forEach(i => {
    allocationByType[i.type] = (allocationByType[i.type] || 0) + i.current_value;
  });

  const monthlyInvestmentCapacity = Math.max(0, monthlySavingsCapacity - requiredMonthlySavings);

  // ── Net Worth ─────────────────────────────────────────────────────────────
  const netWorth = balance + totalCurrentValue;

  // ── Upcoming obligations ──────────────────────────────────────────────────
  const upcomingObligations = detectUpcomingObligations(recurringPayments);

  // ── Best cards per category ───────────────────────────────────────────────
  const bestCardForDining = findBestCardForCategory(cardAnalyses, "dining");
  const bestCardForTravel = findBestCardForCategory(cardAnalyses, "travel");
  const bestCardForShopping = findBestCardForCategory(cardAnalyses, "shopping");
  const bestCardGeneral = cardAnalyses.length > 0
    ? [...cardAnalyses].sort((a, b) => a.utilization - b.utilization)[0].card.name
    : null;

  // ── Legacy context string (for mock fallback) ─────────────────────────────
  const fmt = (val: number | undefined | null) => {
    try {
      return formatCurrency(Number(val) || 0);
    } catch {
      return `₹${Number(val) || 0}`;
    }
  };
  const legacyContextString = `
User Financial Context:
- Balance: ${fmt(balance)}
- Monthly Income: ${fmt(monthlyIncome)}
- Monthly Expenses: ${fmt(monthlyExpenses)}
- Savings Rate: ${savingsRate.toFixed(2)}%
- Health Score: ${healthScore}
- Safe To Spend (daily): ${fmt(dailyLimit)}
- Net Worth: ${fmt(netWorth)}

Profile:
- Name: ${profile.firstName || "Not set"} ${profile.lastName || ""}
- Occupation: ${profile.occupation || "Not set"}
- Risk Preference: ${profile.riskPreference || "Not set"}
- Financial Priority: ${profile.financialPriority || "Not set"}

Budgets:
${enrichedBudgets.map(b => `- ${b.category || b.name}: Spent ${fmt(b.spent)} / Limit ${fmt(Number(b.budget || b.limit || 0))} (${b.usedPercent}% - ${b.status})`).join("\n") || "None set"}

Goals:
${goalAnalyses.map(g => `- ${g.goal.name}: ${g.progressPercent}% complete (${fmt(g.goal.current_amount)} of ${fmt(g.goal.target_amount)}) — ${g.monthsToComplete} months to complete`).join("\n") || "None"}

Credit Cards:
${cardAnalyses.map(c => `- ${c.card.name} (${c.card.network}): Outstanding ${fmt(c.outstanding)} / Limit ${fmt(c.limit)} (${c.utilization}% - ${c.utilizationLabel}), Statement in ${c.daysUntilStatement} days, Perks: ${c.rewardCategories.join(", ") || "None"}`).join("\n") || "None"}

Investments:
${enrichedInvestments.map(i => `- ${i.name} (${i.type}): ${fmt(i.current_value)} (Invested ${fmt(i.invested)}, Gain: ${i.gain >= 0 ? "+" : ""}${fmt(i.gain)} / ${i.gainPercent}%)`).join("\n") || "None"}

Top Spending Categories This Month:
${topCategories.filter(c => c.thisMonth > 0).map(c => `- ${c.category}: ${fmt(c.thisMonth)} (${c.delta > 0 ? "+" : ""}${c.delta}% vs last month)`).join("\n") || "No data"}

Recent Transactions:
${transactions.slice(0, 10).map(t => `${t.date}: ${t.name} — ${fmt(t.amount)} (${t.category}) [${t.type}]`).join("\n") || "None"}
  `.trim();

  return {
    generatedAt: now.toISOString(),
    profile,
    balance,
    monthlyIncome,
    monthlyExpenses,
    savingsRate,
    healthScore,
    netWorth,
    safeToSpend: {
      dailyLimit,
      remainingThisMonth,
      daysLeft,
      discretionaryBudgetTarget,
      discretionarySpentThisMonth,
    },
    transactions: {
      recent: transactions.slice(0, 30),
      topCategories,
      recurringPayments,
      merchantFrequency,
      totalThisMonth,
      totalLastMonth,
      monthOverMonthChange,
    },
    budgets: {
      items: enrichedBudgets,
      totalBudget,
      totalSpent: totalBudgetSpent,
      overspentCategories,
      approachingCategories,
      totalOverspent,
    },
    goals: {
      active: goalAnalyses,
      totalSaved: totalGoalSaved,
      totalTarget: totalGoalTarget,
      overallProgress: overallGoalProgress,
      hasSavingsConflict,
      conflictAmount,
      requiredMonthlySavings,
    },
    creditCards: {
      cards: cardAnalyses,
      totalLimit,
      totalOutstanding,
      overallUtilization,
      hasHighUtilization: overallUtilization >= 30,
      bestCardForDining,
      bestCardForTravel,
      bestCardForShopping,
      bestCardGeneral,
    },
    investments: {
      holdings: enrichedInvestments,
      totalInvested,
      totalCurrentValue,
      totalGain,
      totalGainPercent,
      monthlyInvestmentCapacity,
      allocationByType,
    },
    upcomingObligations,
    memory,
    _legacyContextString: legacyContextString,
  };
}

// ── Snapshot → Prompt string ──────────────────────────────────────────────────
/**
 * Converts a FinancialSnapshot into the structured text block injected
 * into the AI system prompt.
 */
export function snapshotToPromptString(
  snapshot: FinancialSnapshot,
  emphasize: string[] = []
): string {
  const s = snapshot;
  const fmt = (n: number) =>
    "₹" + Math.round(n).toLocaleString("en-IN");

  const sections: string[] = [];

  // ── User Profile ──
  const p = s.profile;
  sections.push(`=== USER PROFILE ===
Name: ${p.firstName || "Unknown"} ${p.lastName || ""}
Occupation: ${p.occupation || "Not specified"}
Risk Preference: ${p.riskPreference || "Not specified"}
Financial Priority: ${p.financialPriority || "Not specified"}
Preferred Rewards: ${p.preferredRewards?.join(", ") || "Not specified"}
Spending Behaviour: ${p.spendingBehaviour || "Not specified"}`);

  // ── Core Metrics ──
  sections.push(`=== CORE FINANCIAL METRICS ===
Current Balance: ${fmt(s.balance)}
Net Worth: ${fmt(s.netWorth)}
Monthly Income: ${fmt(s.monthlyIncome)}
Monthly Expenses: ${fmt(s.monthlyExpenses)}
Monthly Savings: ${fmt(Math.max(0, s.monthlyIncome - s.monthlyExpenses))}
Savings Rate: ${s.savingsRate.toFixed(1)}%
Financial Health Score: ${s.healthScore}/100`);

  // ── Safe To Spend ──
  if (emphasize.length === 0 || emphasize.includes("safeToSpend")) {
    sections.push(`=== SAFE TO SPEND ===
Daily Limit: ${fmt(s.safeToSpend.dailyLimit)}
Remaining This Month: ${fmt(s.safeToSpend.remainingThisMonth)}
Days Left in Month: ${s.safeToSpend.daysLeft}
Discretionary Budget: ${fmt(s.safeToSpend.discretionaryBudgetTarget)}
Discretionary Spent: ${fmt(s.safeToSpend.discretionarySpentThisMonth)}`);
  }

  // ── Transactions ──
  if (emphasize.length === 0 || emphasize.includes("transactions")) {
    sections.push(`=== SPENDING ACTIVITY ===
Total Spent This Month: ${fmt(s.transactions.totalThisMonth)}
Total Spent Last Month: ${fmt(s.transactions.totalLastMonth)}
Month-over-Month Change: ${s.transactions.monthOverMonthChange > 0 ? "+" : ""}${s.transactions.monthOverMonthChange}%

Top Spending Categories (This Month vs Last Month):
${s.transactions.topCategories.filter(c => c.thisMonth > 0).map(c =>
    `- ${c.category}: ${fmt(c.thisMonth)} this month (${c.delta > 0 ? "+" : ""}${c.delta}% vs last month, ${c.transactionCount} transactions)`
  ).join("\n") || "No data"}

Recurring Payments Detected:
${s.transactions.recurringPayments.map(r =>
    `- ${r.name}: ${fmt(r.amount)}/month (next due: ${r.nextExpectedDate})`
  ).join("\n") || "None detected"}

Recent Transactions (last 5):
${s.transactions.recent.slice(0, 5).map(t =>
    `${t.date}: ${t.name} — ${fmt(t.amount)} [${t.category}]`
  ).join("\n") || "None"}`);
  }

  // ── Budgets ──
  if (emphasize.length === 0 || emphasize.includes("budgets")) {
    sections.push(`=== BUDGETS ===
Total Budget: ${fmt(s.budgets.totalBudget)} | Total Spent: ${fmt(s.budgets.totalSpent)}
Overspent Categories: ${s.budgets.overspentCategories.join(", ") || "None"}
Approaching Limit: ${s.budgets.approachingCategories.join(", ") || "None"}
Total Overspent Amount: ${fmt(s.budgets.totalOverspent)}

Category Breakdown:
${s.budgets.items.map(b =>
    `- ${b.category || b.name}: Spent ${fmt(b.spent)} / Limit ${fmt(Number(b.budget || b.limit || 0))} (${b.usedPercent}%) — ${b.status.toUpperCase()}`
  ).join("\n") || "No budgets set"}`);
  }

  // ── Goals ──
  if (emphasize.length === 0 || emphasize.includes("goals")) {
    sections.push(`=== FINANCIAL GOALS ===
Overall Progress: ${s.goals.overallProgress}% (${fmt(s.goals.totalSaved)} saved of ${fmt(s.goals.totalTarget)})
Monthly Savings Capacity: ${fmt(s.monthlyIncome * s.savingsRate / 100)}
Required Monthly Savings (for all goals): ${fmt(s.goals.requiredMonthlySavings)}
Savings Conflict: ${s.goals.hasSavingsConflict ? `YES — short by ${fmt(s.goals.conflictAmount)}/month` : "No conflict"}

Active Goals:
${s.goals.active.map(g =>
    `- ${g.goal.name}: ${g.progressPercent}% complete | Saved ${fmt(g.goal.current_amount)} of ${fmt(g.goal.target_amount)} | ${g.monthsToComplete} months to complete | ${g.daysUntilDeadline !== null ? `Deadline in ${g.daysUntilDeadline} days` : "No deadline"} | ${g.isOnTrack ? "ON TRACK ✓" : "AT RISK ⚠️"}`
  ).join("\n") || "No active goals"}`);
  }

  // ── Credit Cards ──
  if (emphasize.length === 0 || emphasize.includes("creditCards")) {
    sections.push(`=== CREDIT CARDS ===
Overall Utilization: ${s.creditCards.overallUtilization}% (${s.creditCards.hasHighUtilization ? "⚠️ WARNING" : "✓ SAFE"})
Total Credit Limit: ${fmt(s.creditCards.totalLimit)}
Total Outstanding: ${fmt(s.creditCards.totalOutstanding)}
Best Card for Dining: ${s.creditCards.bestCardForDining || "None"}
Best Card for Travel: ${s.creditCards.bestCardForTravel || "None"}
Best Card for Shopping: ${s.creditCards.bestCardForShopping || "None"}

Individual Cards:
${s.creditCards.cards.map(c =>
    `- ${c.card.name} (${c.card.network}):
    Outstanding: ${fmt(c.outstanding)} / Limit: ${fmt(c.limit)} | Utilization: ${c.utilization}% (${c.utilizationLabel})
    Statement Date: ${c.card.billingDate}th | Days Until Statement: ${c.daysUntilStatement} | Days Until Due: ~${c.daysUntilDue}
    Available Credit: ${fmt(c.availableCredit)}
    Perks: ${c.rewardCategories.join(", ") || "None"}`
  ).join("\n\n") || "No credit cards added"}`);
  }

  // ── Investments ──
  if (emphasize.length === 0 || emphasize.includes("investments")) {
    sections.push(`=== INVESTMENTS ===
Total Invested: ${fmt(s.investments.totalInvested)}
Current Value: ${fmt(s.investments.totalCurrentValue)}
Total Gain/Loss: ${s.investments.totalGain >= 0 ? "+" : ""}${fmt(s.investments.totalGain)} (${s.investments.totalGainPercent >= 0 ? "+" : ""}${s.investments.totalGainPercent}%)
Monthly Investment Capacity: ${fmt(s.investments.monthlyInvestmentCapacity)}

Portfolio Allocation:
${Object.entries(s.investments.allocationByType).map(([type, value]) =>
    `- ${type}: ${fmt(value)} (${s.investments.totalCurrentValue > 0 ? Math.round((value / s.investments.totalCurrentValue) * 100) : 0}%)`
  ).join("\n") || "No investments"}

Holdings:
${s.investments.holdings.map(i =>
    `- ${i.name} (${i.type}): Value ${fmt(i.current_value)} | Invested ${fmt(i.invested)} | Gain ${i.gain >= 0 ? "+" : ""}${fmt(i.gain)} (${i.gainPercent >= 0 ? "+" : ""}${i.gainPercent}%)`
  ).join("\n") || "None"}`);
  }

  // ── Cash Flow ──
  if (emphasize.length === 0 || emphasize.includes("cashFlow")) {
    const emergencyTarget = s.monthlyExpenses * 3;
    const emergencyStatus = s.balance >= emergencyTarget ? "✓ Funded" : `⚠️ Short by ${fmt(emergencyTarget - s.balance)}`;
    sections.push(`=== CASH FLOW ===
Monthly Surplus/Deficit: ${s.monthlyIncome > s.monthlyExpenses ? "+" : ""}${fmt(s.monthlyIncome - s.monthlyExpenses)}
Emergency Fund Status: ${emergencyStatus} (3-month target: ${fmt(emergencyTarget)})
Liquidity Risk: ${s.balance < s.monthlyExpenses ? "⚠️ Balance below 1 month expenses" : "✓ Adequate"}`);
  }

  // ── Upcoming Obligations ──
  if (emphasize.length === 0 || emphasize.includes("upcomingObligations")) {
    if (s.upcomingObligations.length > 0) {
      sections.push(`=== UPCOMING OBLIGATIONS (Next 30 Days) ===
${s.upcomingObligations.map(o =>
    `- ${o.name} (${o.type}): ${fmt(o.amount)} due in ${o.dueIn} days`
  ).join("\n")}`);
    }
  }

  // ── Decision Memory ──
  if (s.memory.length > 0) {
    sections.push(`=== PAST FINANCIAL DECISIONS (Context) ===
${s.memory.map(m => `- [${m.date}] ${m.decision}${m.outcome ? ` → ${m.outcome}` : ""}`).join("\n")}`);
  }

  return sections.join("\n\n");
}
