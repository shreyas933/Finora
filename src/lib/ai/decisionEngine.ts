/**
 * FINORA Financial OS — Layer 4: Decision Engine
 * ─────────────────────────────────────────────────────────────────────────────
 * The computational brain. Runs intent-specific calculations and assembles a
 * structured reasoning payload BEFORE the LLM generates any text.
 *
 * The LLM's job is only to translate this payload into natural language.
 * It does NOT need to calculate anything — it just explains.
 */

import type { FinancialSnapshot } from "./financialContextBuilder";
import type { Intent } from "./intentDetector";
import type { KnowledgeRule } from "./knowledgeBase";
import { getIntentEmphasis } from "./intentDetector";
import { getRulesForIntent, formatRulesForPrompt } from "./knowledgeBase";
import { formatCurrency } from "@/lib/utils";

const fmt = (v: number | undefined | null) => {
  try {
    return formatCurrency(Number(v) || 0);
  } catch {
    return `₹${Number(v) || 0}`;
  }
};

// ── Decision Payload ──────────────────────────────────────────────────────────
export interface DecisionPayload {
  intent: Intent;
  snapshot: FinancialSnapshot;
  calculations: Record<string, any>;
  emphasizedSections: string[];
  rulesText: string;
  missingInfo: string[];
  intentLabel: string;
  promptInjection: string; // pre-built reasoning block for the system prompt
}

// ── Helper: extract amount from a user message ────────────────────────────────
function extractAmount(message: string): number | null {
  // Match patterns: ₹50000, ₹50,000, 50000, 50k, 50K, 5 lakh, 5L
  const patterns = [
    /₹\s?([0-9,]+(?:\.[0-9]+)?)\s*(lakh|l|k)?/i,
    /([0-9,]+(?:\.[0-9]+)?)\s*(lakh|l|k)\b/i,
    /rs\.?\s?([0-9,]+(?:\.[0-9]+)?)\s*(lakh|l|k)?/i,
    /\b([0-9,]{4,})\b/,
  ];

  for (const p of patterns) {
    const m = message.match(p);
    if (m) {
      let num = parseFloat(m[1].replace(/,/g, ""));
      const suffix = (m[2] || "").toLowerCase();
      if (suffix === "lakh" || suffix === "l") num *= 100000;
      if (suffix === "k") num *= 1000;
      if (num > 0) return num;
    }
  }
  return null;
}

// ── Helper: extract merchant/category hints from message ──────────────────────
function extractMerchantHint(message: string): string | null {
  const diningKeywords = ["swiggy", "zomato", "restaurant", "dining", "food", "cafe", "coffee"];
  const travelKeywords = ["flight", "hotel", "booking", "makemytrip", "irctc", "cleartrip", "travel"];
  const shoppingKeywords = ["amazon", "flipkart", "myntra", "shopping", "online", "mall"];
  const fuelKeywords = ["petrol", "fuel", "hpcl", "bpcl", "iocl", "gas station"];

  const msg = message.toLowerCase();
  if (diningKeywords.some(k => msg.includes(k))) return "dining";
  if (travelKeywords.some(k => msg.includes(k))) return "travel";
  if (shoppingKeywords.some(k => msg.includes(k))) return "shopping";
  if (fuelKeywords.some(k => msg.includes(k))) return "fuel";
  return null;
}



// ── Purchase Decision Calculations ───────────────────────────────────────────
function runPurchaseDecision(amount: number, snapshot: FinancialSnapshot): Record<string, any> {
  const s = snapshot;
  const dailySavingsCapacity = (s.monthlyIncome * (s.savingsRate / 100)) / 30;

  const safeToSpendFit = amount <= s.safeToSpend.dailyLimit;
  const safeToSpendPercent = s.safeToSpend.dailyLimit > 0
    ? Math.round((amount / s.safeToSpend.dailyLimit) * 100)
    : 999;

  // New savings rate after purchase
  const newMonthlySavings = Math.max(0, s.monthlyIncome - s.monthlyExpenses - amount);
  const newSavingsRate = s.monthlyIncome > 0
    ? Math.round((newMonthlySavings / s.monthlyIncome) * 100)
    : 0;
  const savingsRateDrop = s.savingsRate - newSavingsRate;

  // Goal delay per active goal
  const goalDelays = s.goals.active.map(g => ({
    goalName: g.goal.name,
    daysDelayed: dailySavingsCapacity > 0 ? Math.round(amount / dailySavingsCapacity) : null,
    monthsDelayed: dailySavingsCapacity > 0 ? Math.round(amount / (dailySavingsCapacity * 30) * 10) / 10 : null,
  }));

  // Emergency fund impact
  const emergencyTarget = s.monthlyExpenses * 3;
  const emergencyFunded = s.balance >= emergencyTarget;
  const balanceAfterPurchase = s.balance - amount;
  const newEmergencyStatus = balanceAfterPurchase >= emergencyTarget
    ? "Still funded"
    : `Short by ${fmt(emergencyTarget - balanceAfterPurchase)}`;

  // Credit card analysis
  const merchantHint = null; // no merchant in a generic purchase query
  const bestCardOverall = s.creditCards.bestCardGeneral;
  const cardPostUtilization = s.creditCards.cards.map(c => ({
    card: c.card.name,
    currentUtil: c.utilization,
    postUtil: c.limit > 0 ? Math.round(((c.outstanding + amount) / c.limit) * 100) : 0,
    safeToUse: c.limit > 0 && ((c.outstanding + amount) / c.limit) <= 0.30,
  }));

  // Investment opportunity cost
  const years1 = amount * Math.pow(1.12, 1);
  const years3 = amount * Math.pow(1.12, 3);
  const years5 = amount * Math.pow(1.12, 5);

  // Overall recommendation
  let verdict: string;
  let risk: "low" | "medium" | "high";
  if (safeToSpendFit && s.savingsRate > 20 && emergencyFunded) {
    verdict = "SAFE";
    risk = "low";
  } else if (amount > s.safeToSpend.remainingThisMonth) {
    verdict = "EXCEEDS_MONTHLY_BUDGET";
    risk = "high";
  } else if (savingsRateDrop > 10) {
    verdict = "SIGNIFICANT_SAVINGS_IMPACT";
    risk = "medium";
  } else {
    verdict = "PROCEED_WITH_CAUTION";
    risk = "medium";
  }

  return {
    purchaseAmount: amount,
    safeToSpendFit,
    safeToSpendPercent,
    currentDailyLimit: s.safeToSpend.dailyLimit,
    remainingMonthlyBudget: s.safeToSpend.remainingThisMonth,
    newSavingsRate,
    savingsRateDrop,
    dailySavingsCapacity,
    goalDelays,
    emergencyFunded,
    newEmergencyStatus,
    bestCard: bestCardOverall,
    cardPostUtilization,
    investmentOpportunityCost: { years1: Math.round(years1), years3: Math.round(years3), years5: Math.round(years5) },
    verdict,
    risk,
  };
}

// ── Credit Card Advice Calculations ──────────────────────────────────────────
function runCreditCardAdvice(
  message: string,
  amount: number | null,
  snapshot: FinancialSnapshot
): Record<string, any> {
  const merchantCategory = extractMerchantHint(message);
  const cards = snapshot.creditCards.cards;

  // Score each card
  const scored = cards.map(c => {
    let score = 0;
    const perks = c.rewardCategories.map(p => p.toLowerCase());

    // Reward match
    if (merchantCategory && perks.includes(merchantCategory)) score += 40;
    else if (merchantCategory && perks.some(p => p.includes(merchantCategory))) score += 20;

    // Utilization penalty
    if (c.utilization < 10) score += 30;
    else if (c.utilization < 30) score += 20;
    else if (c.utilization < 50) score += 5;
    else score -= 20;

    // Post-purchase utilization check (if amount known)
    if (amount && c.limit > 0) {
      const postUtil = ((c.outstanding + amount) / c.limit) * 100;
      if (postUtil > 50) score -= 30;
      if (postUtil > 70) score -= 50;
    }

    // Statement cycle bonus (> 15 days until statement = safe to charge)
    if (c.daysUntilStatement > 15) score += 10;

    return { ...c, score, merchantCategory };
  });

  scored.sort((a, b) => b.score - a.score);
  const bestCard = scored[0] ?? null;

  const useEMI = amount !== null &&
    snapshot.safeToSpend.remainingThisMonth > 0 &&
    amount > snapshot.safeToSpend.remainingThisMonth * 3;

  const useUPI = cards.length === 0 ||
    snapshot.creditCards.overallUtilization >= 50 ||
    (amount !== null && amount < 500);

  return {
    merchantCategory,
    purchaseAmount: amount,
    rankedCards: scored.map(c => ({
      name: c.card.name,
      network: c.card.network,
      utilization: c.utilization,
      utilizationLabel: c.utilizationLabel,
      perks: c.rewardCategories,
      score: c.score,
      daysUntilStatement: c.daysUntilStatement,
      daysUntilDue: c.daysUntilDue,
    })),
    topRecommendation: bestCard ? {
      cardName: bestCard.card.name,
      reason: merchantCategory
        ? `Best match for ${merchantCategory} spending with ${bestCard.utilizationLabel.toLowerCase()} utilization`
        : `Lowest utilization card (${bestCard.utilization}%) — maximizes credit health`,
      currentUtil: bestCard.utilization,
      safeToUse: bestCard.utilization < 30,
    } : null,
    alternativePayment: useUPI ? "UPI/Debit" : useEMI ? "No-cost EMI if available" : null,
    shouldUseEMI: useEMI,
    shouldUseUPI: useUPI,
  };
}

// ── What-If Simulation ────────────────────────────────────────────────────────
function runWhatIfSimulation(message: string, snapshot: FinancialSnapshot): Record<string, any> {
  const s = snapshot;
  const msg = message.toLowerCase();

  // Parse the scenario
  let scenario: string;
  let hypotheticalIncome = s.monthlyIncome;
  let hypotheticalExpenses = s.monthlyExpenses;

  if (msg.includes("salary") || msg.includes("income")) {
    const amountIncrease = extractAmount(message) || s.monthlyIncome * 0.2;
    hypotheticalIncome = s.monthlyIncome + amountIncrease;
    scenario = `Salary increase of ${fmt(amountIncrease)}/month`;
  } else if (msg.includes("lose") || msg.includes("laid off") || msg.includes("fired") || msg.includes("quit")) {
    hypotheticalIncome = 0;
    scenario = "Job loss — income drops to ₹0";
  } else {
    const amount = extractAmount(message);
    if (amount) {
      hypotheticalExpenses = s.monthlyExpenses + amount;
      scenario = `Additional monthly expense of ${fmt(amount)}`;
    } else {
      scenario = "Hypothetical scenario";
    }
  }

  const newSavingsRate = hypotheticalIncome > 0
    ? Math.max(0, ((hypotheticalIncome - hypotheticalExpenses) / hypotheticalIncome) * 100)
    : 0;

  const newMonthlySurplus = Math.max(0, hypotheticalIncome - hypotheticalExpenses);
  const newSafeToSpend = newMonthlySurplus > 0
    ? Math.round((newMonthlySurplus * 0.3) / 30)
    : 0;

  const newHealthScore = Math.min(100, Math.max(0,
    50 + (newSavingsRate * 0.5) + (s.balance > 100000 ? 10 : 0)
  ));

  // New goal timelines
  const newGoalTimelines = s.goals.active.map(g => {
    const newContribution = newMonthlySurplus / Math.max(1, s.goals.active.length);
    const newMonths = newContribution > 0
      ? Math.ceil(g.remaining / newContribution)
      : 999;
    const oldMonths = g.monthsToComplete;
    return {
      goalName: g.goal.name,
      oldMonthsToComplete: oldMonths,
      newMonthsToComplete: newMonths,
      change: newMonths - oldMonths,
      impact: newMonths < oldMonths ? "accelerated" : newMonths > oldMonths ? "delayed" : "unchanged",
    };
  });

  // Emergency fund runway
  const monthsOfRunway = s.monthlyExpenses > 0
    ? Math.round(s.balance / s.monthlyExpenses * 10) / 10
    : 0;

  return {
    scenario,
    originalIncome: s.monthlyIncome,
    hypotheticalIncome,
    originalExpenses: s.monthlyExpenses,
    hypotheticalExpenses,
    originalSavingsRate: s.savingsRate,
    newSavingsRate: Math.round(newSavingsRate * 10) / 10,
    originalHealthScore: s.healthScore,
    newHealthScore: Math.round(newHealthScore),
    originalSafeToSpend: s.safeToSpend.dailyLimit,
    newSafeToSpend,
    goalImpacts: newGoalTimelines,
    emergencyFundRunway: monthsOfRunway,
    canSustain: hypotheticalIncome > 0 && hypotheticalIncome >= hypotheticalExpenses,
  };
}

// ── Weekly Summary Calculations ───────────────────────────────────────────────
function runWeeklySummary(snapshot: FinancialSnapshot): Record<string, any> {
  const s = snapshot;
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const thisWeekTx = s.transactions.recent.filter(t => new Date(t.date) >= weekAgo);
  const lastWeekTx = s.transactions.recent.filter(t => {
    const d = new Date(t.date);
    return d >= twoWeeksAgo && d < weekAgo;
  });

  const thisWeekSpend = thisWeekTx.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
  const lastWeekSpend = lastWeekTx.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
  const weekChange = lastWeekSpend > 0 ? Math.round(((thisWeekSpend - lastWeekSpend) / lastWeekSpend) * 100) : 0;

  // Overspent this week
  const overspentThisWeek = s.budgets.overspentCategories;

  // Goal progress this week (based on new contributions)
  const goalProgress = s.goals.active.map(g => ({
    name: g.goal.name,
    percent: g.progressPercent,
    onTrack: g.isOnTrack,
  }));

  return {
    thisWeekSpend,
    lastWeekSpend,
    weekChange,
    thisWeekTransactionCount: thisWeekTx.length,
    overspentCategories: overspentThisWeek,
    goalProgress,
    savingsRate: s.savingsRate,
    healthScore: s.healthScore,
    upcomingObligations: s.upcomingObligations.filter(o => o.dueIn <= 7),
  };
}

// ── Goal Planning Calculations ────────────────────────────────────────────────
function runGoalPlanning(snapshot: FinancialSnapshot): Record<string, any> {
  const s = snapshot;
  const monthlySavings = s.monthlyIncome * (s.savingsRate / 100);

  return {
    monthlySavingsCapacity: monthlySavings,
    activeGoalCount: s.goals.active.length,
    totalRequired: s.goals.requiredMonthlySavings,
    hasSavingsConflict: s.goals.hasSavingsConflict,
    conflictAmount: s.goals.conflictAmount,
    goalBreakdown: s.goals.active.map(g => ({
      name: g.goal.name,
      progressPercent: g.progressPercent,
      remaining: g.remaining,
      monthsToComplete: g.monthsToComplete,
      required: g.requiredMonthlyContribution,
      onTrack: g.isOnTrack,
      daysUntilDeadline: g.daysUntilDeadline,
    })),
    priorityStack: [...s.goals.active]
      .sort((a, b) => {
        // Prioritize: soonest deadline first, then highest progress
        const dA = a.daysUntilDeadline ?? 9999;
        const dB = b.daysUntilDeadline ?? 9999;
        return dA !== dB ? dA - dB : b.progressPercent - a.progressPercent;
      })
      .map(g => g.goal.name),
  };
}

// ── Build the pre-reasoning prompt injection ──────────────────────────────────
function buildPromptInjection(
  intent: Intent,
  calculations: Record<string, any>,
  rulesText: string,
  missingInfo: string[]
): string {
  const lines: string[] = [
    "=== PRE-COMPUTED DECISION ENGINE OUTPUT ===",
    `Intent Detected: ${intent}`,
    "",
  ];

  if (Object.keys(calculations).length > 0) {
    lines.push("--- Calculated Results (use these numbers, do not recalculate) ---");
    lines.push(JSON.stringify(calculations, null, 2));
    lines.push("");
  }

  if (rulesText) {
    lines.push("--- Applicable Business Rules ---");
    lines.push(rulesText);
    lines.push("");
  }

  if (missingInfo.length > 0) {
    lines.push("--- Missing Information (ask for these if critical) ---");
    missingInfo.forEach(m => lines.push(`- ${m}`));
    lines.push("");
  }

  lines.push("=== END OF DECISION ENGINE OUTPUT ===");
  return lines.join("\n");
}

// ── Main engine ───────────────────────────────────────────────────────────────
/**
 * Run the decision engine for a given user message and snapshot.
 * Returns a DecisionPayload with pre-computed calculations.
 */
export function runDecisionEngine(
  userMessage: string,
  snapshot: FinancialSnapshot,
  intent: Intent
): DecisionPayload {
  const rules = getRulesForIntent(intent);
  const rulesText = formatRulesForPrompt(rules);
  const emphasizedSections = getIntentEmphasis(intent);
  const missingInfo: string[] = [];
  let calculations: Record<string, any> = {};

  const amount = extractAmount(userMessage);

  switch (intent) {
    case "PurchaseDecision":
    case "LargePurchase": {
      if (amount) {
        calculations = runPurchaseDecision(amount, snapshot);
      } else {
        missingInfo.push("Purchase amount not specified — ask: 'What is the purchase amount?'");
        missingInfo.push("Merchant or category — ask: 'What is this purchase for?'");
        missingInfo.push("Preferred payment method — ask: 'How do you plan to pay? Card / UPI / EMI?'");
      }
      break;
    }

    case "CreditCardAdvice":
    case "RewardOptimization": {
      calculations = runCreditCardAdvice(userMessage, amount, snapshot);
      if (!extractMerchantHint(userMessage) && !amount) {
        missingInfo.push("Merchant or spending category not clear — ask: 'What are you spending on? (dining, travel, shopping, fuel...)'");
        missingInfo.push("Purchase amount — ask: 'What is the amount?'");
      }
      break;
    }

    case "WhatIfSimulation":
    case "SalaryScenario": {
      calculations = runWhatIfSimulation(userMessage, snapshot);
      break;
    }

    case "WeeklySummary": {
      calculations = runWeeklySummary(snapshot);
      break;
    }

    case "GoalPlanning": {
      calculations = runGoalPlanning(snapshot);
      break;
    }

    case "SafeToSpend": {
      calculations = {
        dailyLimit: snapshot.safeToSpend.dailyLimit,
        remainingThisMonth: snapshot.safeToSpend.remainingThisMonth,
        daysLeft: snapshot.safeToSpend.daysLeft,
        discretionaryBudget: snapshot.safeToSpend.discretionaryBudgetTarget,
        discretionarySpent: snapshot.safeToSpend.discretionarySpentThisMonth,
      };
      break;
    }

    case "BudgetQuery": {
      calculations = {
        overspentCategories: snapshot.budgets.overspentCategories,
        approachingCategories: snapshot.budgets.approachingCategories,
        totalOverspent: snapshot.budgets.totalOverspent,
        categories: snapshot.budgets.items.map(b => ({
          name: b.category || b.name,
          spent: b.spent,
          limit: Number(b.budget || b.limit || 0),
          usedPercent: b.usedPercent,
          status: b.status,
        })),
        topCategories: snapshot.transactions.topCategories.slice(0, 5).map(c => ({
          category: c.category,
          thisMonth: c.thisMonth,
          lastMonth: c.lastMonth,
          delta: c.delta,
        })),
      };
      break;
    }

    case "InvestmentAdvice": {
      calculations = {
        totalInvested: snapshot.investments.totalInvested,
        totalCurrentValue: snapshot.investments.totalCurrentValue,
        totalGain: snapshot.investments.totalGain,
        totalGainPercent: snapshot.investments.totalGainPercent,
        allocationByType: snapshot.investments.allocationByType,
        monthlyInvestmentCapacity: snapshot.investments.monthlyInvestmentCapacity,
        additionalAmount: amount,
        projectedGrowth: amount ? {
          years1: Math.round(amount * Math.pow(1.12, 1)),
          years3: Math.round(amount * Math.pow(1.12, 3)),
          years5: Math.round(amount * Math.pow(1.12, 5)),
          years10: Math.round(amount * Math.pow(1.12, 10)),
        } : null,
      };
      break;
    }

    case "HealthScore": {
      calculations = {
        currentScore: snapshot.healthScore,
        savingsRate: snapshot.savingsRate,
        balance: snapshot.balance,
        overspentCategories: snapshot.budgets.overspentCategories,
        creditUtilization: snapshot.creditCards.overallUtilization,
        emergencyFundShortfall: Math.max(0, snapshot.monthlyExpenses * 3 - snapshot.balance),
        scoreBreakdown: {
          base: 50,
          savingsComponent: Math.round(snapshot.savingsRate * 0.5),
          balanceBonus: snapshot.balance > 100000 ? 10 : 0,
          total: snapshot.healthScore,
        },
      };
      break;
    }

    case "CashFlowAnalysis": {
      calculations = {
        monthlySurplus: snapshot.monthlyIncome - snapshot.monthlyExpenses,
        savingsRate: snapshot.savingsRate,
        emergencyFundTarget: snapshot.monthlyExpenses * 3,
        emergencyFundCurrent: snapshot.balance,
        emergencyFundStatus: snapshot.balance >= snapshot.monthlyExpenses * 3 ? "Funded" : "Underfunded",
        liquidityRisk: snapshot.balance < snapshot.monthlyExpenses,
        monthOverMonthChange: snapshot.transactions.monthOverMonthChange,
        upcomingObligations: snapshot.upcomingObligations,
        incomeSources: snapshot.transactions.recent.filter(t => t.type === "income").slice(0, 5),
      };
      break;
    }

    case "TravelPlanning": {
      const travelCard = snapshot.creditCards.bestCardForTravel;
      calculations = {
        currentBalance: snapshot.balance,
        safeToSpend: snapshot.safeToSpend.remainingThisMonth,
        travelBestCard: travelCard,
        creditUtilization: snapshot.creditCards.overallUtilization,
        goalImpact: snapshot.goals.active.map(g => ({
          name: g.goal.name,
          daysDelayed: amount && snapshot.monthlyIncome > 0
            ? Math.round(amount / ((snapshot.monthlyIncome * snapshot.savingsRate / 100) / 30))
            : null,
        })),
        purchaseAmount: amount,
        canAfford: amount !== null && snapshot.safeToSpend.remainingThisMonth >= (amount || 0),
      };
      if (!amount) {
        missingInfo.push("Travel budget not specified — ask: 'What is the estimated total trip cost?'");
      }
      break;
    }

    case "EmergencyFund": {
      const target3 = snapshot.monthlyExpenses * 3;
      const target6 = snapshot.monthlyExpenses * 6;
      calculations = {
        currentBalance: snapshot.balance,
        target3Months: target3,
        target6Months: target6,
        shortfall3: Math.max(0, target3 - snapshot.balance),
        shortfall6: Math.max(0, target6 - snapshot.balance),
        status3: snapshot.balance >= target3 ? "Funded" : "Underfunded",
        monthsToFund3: snapshot.monthlyIncome > 0
          ? Math.ceil(Math.max(0, target3 - snapshot.balance) / (snapshot.monthlyIncome * snapshot.savingsRate / 100))
          : null,
      };
      break;
    }

    default: {
      // General — include high-level summary
      calculations = {
        balance: snapshot.balance,
        savingsRate: snapshot.savingsRate,
        healthScore: snapshot.healthScore,
        safeToSpend: snapshot.safeToSpend.dailyLimit,
        topConcerns: [
          ...snapshot.budgets.overspentCategories.map(c => `Budget overspent: ${c}`),
          snapshot.creditCards.hasHighUtilization ? `Credit utilization at ${snapshot.creditCards.overallUtilization}%` : null,
          snapshot.goals.hasSavingsConflict ? `Savings conflict: short ${fmt(snapshot.goals.conflictAmount)}/month` : null,
        ].filter(Boolean),
      };
    }
  }

  const intentLabel = intent.replace(/([A-Z])/g, " $1").trim();
  const promptInjection = buildPromptInjection(intent, calculations, rulesText, missingInfo);

  return {
    intent,
    snapshot,
    calculations,
    emphasizedSections,
    rulesText,
    missingInfo,
    intentLabel,
    promptInjection,
  };
}
