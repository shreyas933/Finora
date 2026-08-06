/**
 * FINORA Financial OS — Layer 3: Knowledge Base
 * ─────────────────────────────────────────────────────────────────────────────
 * An editable library of business rules, formulas, and thresholds.
 * The AI uses these rules instead of guessing.
 * To update a rule, edit this file — no prompt changes needed.
 */

import type { Intent } from "./intentDetector";

export interface KnowledgeRule {
  id: string;
  title: string;
  rule: string;
  formula?: string;
  example?: string;
}

// ── Safe To Spend Rules ───────────────────────────────────────────────────────
const SAFE_TO_SPEND_RULES: KnowledgeRule[] = [
  {
    id: "sts_formula",
    title: "Safe To Spend Formula",
    rule: "Daily safe-to-spend = remaining discretionary budget ÷ days left in month. Discretionary budget excludes Rent, Housing, Healthcare, Savings, Medical.",
    formula: "safeToSpend = max(0, discretionaryBudget - discretionarySpent) / daysLeftInMonth",
    example: "If discretionary budget is ₹30,000, spent ₹12,000, and 12 days left → ₹1,500/day",
  },
  {
    id: "sts_no_budget",
    title: "No Budget Set Fallback",
    rule: "If no budgets are configured, default discretionary budget = 30% of monthly income.",
    formula: "discretionaryBudget = monthlyIncome * 0.30",
  },
  {
    id: "sts_month_end",
    title: "Month End Buffer",
    rule: "In the last 3 days of the month, flag a caution: end-of-month obligations (rent, EMI) may be due. Reduce safe-to-spend recommendation by 20%.",
  },
  {
    id: "sts_zero_income",
    title: "Zero Income Case",
    rule: "If monthly income is ₹0, safe-to-spend is ₹0. Advise the user to add income transactions first.",
  },
];

// ── Health Score Rules ────────────────────────────────────────────────────────
const HEALTH_SCORE_RULES: KnowledgeRule[] = [
  {
    id: "hs_formula",
    title: "Health Score Formula",
    rule: "Health Score = 50 + (savingsRate × 0.5) + balanceBonus. Balance bonus = +10 if balance > ₹1,00,000.",
    formula: "healthScore = min(100, max(0, 50 + savingsRate × 0.5 + (balance > 100000 ? 10 : 0)))",
  },
  {
    id: "hs_bands",
    title: "Score Interpretation Bands",
    rule: "0–39: Critical (financial emergency). 40–59: Needs work (high risk). 60–79: Stable (manageable). 80–89: Good (healthy). 90–100: Excellent (financially fit).",
  },
  {
    id: "hs_drivers",
    title: "Key Health Score Drivers",
    rule: "Primary driver: savings rate. Secondary: balance buffer. Negative drivers: budget overspending, high credit utilization, zero emergency fund.",
  },
  {
    id: "hs_improvement",
    title: "Score Improvement Actions",
    rule: "Each 1% improvement in savings rate improves score by 0.5 points. Reaching ₹1,00,000 balance adds 10 points instantly.",
  },
];

// ── Credit Card Rules ─────────────────────────────────────────────────────────
const CREDIT_CARD_RULES: KnowledgeRule[] = [
  {
    id: "cc_utilization",
    title: "Credit Utilization Thresholds",
    rule: "< 10%: Excellent (credit score boost). 10–30%: Safe zone. 30–50%: Warning — credit score may dip. 50–70%: High risk. > 70%: Critical — avoid new charges.",
  },
  {
    id: "cc_statement_cycle",
    title: "Statement Date Payment Strategy",
    rule: "Pay off the balance 3 days before the statement date (not due date) to report 0% utilization to credit bureaus. This is the single highest-impact credit optimization move.",
    example: "Statement prints on 12th → clear balance by 9th to report ₹0 outstanding.",
  },
  {
    id: "cc_reward_stacking",
    title: "Reward Stacking Rule",
    rule: "Match purchase category to card perk. Dining spends → dining reward card. Travel bookings → miles card. Shopping → cashback/5x card. Always use the card with the highest multiplier for the category.",
  },
  {
    id: "cc_emi_threshold",
    title: "EMI Decision Threshold",
    rule: "Use EMI only if: (1) purchase amount > 3× monthly safe-to-spend AND (2) no-cost EMI is available. Avoid interest-bearing EMI unless cash flow cannot cover the expense in 2 billing cycles.",
    formula: "UseEMI = (amount > 3 × safeToSpend) AND (emiInterestRate === 0 OR cashShortfall > 0)",
  },
  {
    id: "cc_debit_vs_credit",
    title: "Debit vs Credit Decision",
    rule: "Use debit when: (1) credit utilization is already above 30%, or (2) cash flow is tight this month, or (3) no reward benefit exists. Use credit when: rewards > 0 AND utilization stays below 30% post-purchase.",
  },
  {
    id: "cc_upi_rule",
    title: "UPI vs Card Rule",
    rule: "UPI is optimal for: merchants that do not accept cards, small amounts < ₹500, or when you want to avoid any credit utilization. Cards are better when rewards or interest-free credit period applies.",
  },
];

// ── Budget Rules ──────────────────────────────────────────────────────────────
const BUDGET_RULES: KnowledgeRule[] = [
  {
    id: "bud_50_30_20",
    title: "50/30/20 Benchmark",
    rule: "Needs (rent, utilities, healthcare): ≤50% of income. Wants (dining, entertainment, shopping): ≤30%. Savings/investments: ≥20%.",
  },
  {
    id: "bud_overspend_explain",
    title: "Overspend Explanation Template",
    rule: "When a category is overspent, do not just report the number. Explain the behavioural driver: weekend patterns, frequency increase, single large spike, or lifestyle inflation.",
  },
  {
    id: "bud_reallocation",
    title: "Budget Reallocation Logic",
    rule: "If one category is overspent, identify an underspent category where the surplus can absorb the overflow. Prefer moving from Wants categories before touching Needs.",
  },
  {
    id: "bud_warning_threshold",
    title: "Budget Warning Threshold",
    rule: "Flag a budget category as 'approaching limit' when spent ≥ 80% of limit. Flag as 'overspent' when spent > 100%.",
    formula: "approaching = spent/limit >= 0.80; overspent = spent > limit",
  },
];

// ── Goal Rules ────────────────────────────────────────────────────────────────
const GOAL_RULES: KnowledgeRule[] = [
  {
    id: "goal_delay_formula",
    title: "Goal Delay Calculation",
    rule: "When a purchase is considered, calculate exactly how many days each active goal is delayed.",
    formula: "dailySavingsCapacity = (monthlyIncome × savingsRate/100) / 30; daysDelayed = purchaseAmount / dailySavingsCapacity",
    example: "Income ₹1,50,000, savings rate 30%, daily capacity = ₹1,500. ₹15,000 purchase → delays goals by 10 days.",
  },
  {
    id: "goal_completion",
    title: "Goal Completion Projection",
    rule: "Months to complete = (targetAmount - currentAmount) / monthlyContributionCapacity. Contribution capacity = monthly savings ÷ number of active goals (equal split unless priority set).",
    formula: "monthsLeft = (target - saved) / (monthlyIncome × savingsRate/100 / activeGoals)",
  },
  {
    id: "goal_savings_conflict",
    title: "Savings Conflict Detection",
    rule: "If total monthly required contributions across all goals > monthly savings capacity, declare a Savings Conflict. Recommend priority stack: Emergency Fund → Highest Priority Goal → Others.",
    formula: "conflict = sum(requiredMonthlyContributions) > monthlyIncome × savingsRate/100",
  },
  {
    id: "goal_acceleration",
    title: "Goal Acceleration Opportunity",
    rule: "When the user has an unusually high surplus month, flag it as an acceleration opportunity: a one-time top-up can move the goal completion date forward by N months.",
    formula: "monthsAdvanced = oneTimeSurplus / monthlyContribution",
  },
];

// ── EMI Rules ─────────────────────────────────────────────────────────────────
const EMI_RULES: KnowledgeRule[] = [
  {
    id: "emi_interest_cost",
    title: "EMI Interest Cost Calculation",
    rule: "Total interest on an EMI = (Principal × Rate × Tenure) / 100. For a 12-month EMI at 24% p.a.: interest = principal × 0.24. Always show the true total cost.",
    formula: "totalInterest = principal × (annualRate/100) × (tenureMonths/12)",
    example: "₹60,000 at 24% for 12 months = ₹14,400 interest. Total cost = ₹74,400.",
  },
  {
    id: "emi_opportunity_cost",
    title: "EMI Opportunity Cost",
    rule: "If the user can afford to pay in full and invest the difference, compare EMI interest cost vs potential investment return. If investment return > EMI interest, recommend investing.",
    formula: "invest = investmentReturn > emiInterestRate",
  },
];

// ── Cash Flow Rules ───────────────────────────────────────────────────────────
const CASH_FLOW_RULES: KnowledgeRule[] = [
  {
    id: "cf_emergency_fund",
    title: "Emergency Fund Minimum",
    rule: "Emergency fund should be 3–6 months of monthly expenses (not income). 3 months for stable employment, 6 months for freelancers or variable income.",
    formula: "emergencyTarget = monthlyExpenses × (stable ? 3 : 6)",
  },
  {
    id: "cf_liquidity",
    title: "Liquidity Threshold",
    rule: "Always keep a minimum of 1 month's expenses as liquid cash (not in investments). If balance < monthlyExpenses, flag a liquidity warning.",
    formula: "liquidityRisk = balance < monthlyExpenses",
  },
  {
    id: "cf_income_sources",
    title: "Income Diversification",
    rule: "If > 90% of income comes from a single source, flag income concentration risk. Recommend diversification through investments (dividends, interest) or side income.",
  },
];

// ── Reward Rules ──────────────────────────────────────────────────────────────
const REWARD_RULES: KnowledgeRule[] = [
  {
    id: "rew_category_match",
    title: "Category-to-Card Matching",
    rule: "For each purchase category, identify the card in the user's wallet with the highest reward multiplier. Priority: category-specific perks > general cashback > no reward.",
  },
  {
    id: "rew_travel_valuation",
    title: "Travel Point Valuation",
    rule: "1 travel mile/point ≈ ₹0.50–₹1.00 in flight redemption value. Cashback is always worth face value. Compare: points × ₹0.75 vs cashback rate × purchase amount.",
    formula: "pointsValue = points × 0.75; cashbackValue = amount × cashbackRate",
  },
  {
    id: "rew_never_optimize_only",
    title: "Never Optimize Rewards Alone",
    rule: "Always optimize: Rewards AND Risk AND Budget AND Financial Health AND Future Cash Flow. Never recommend a card only for rewards if it increases utilization above 30% or puts cash flow at risk.",
  },
];

// ── Investment Rules ──────────────────────────────────────────────────────────
const INVESTMENT_RULES: KnowledgeRule[] = [
  {
    id: "inv_rebalance",
    title: "Rebalancing Trigger",
    rule: "Recommend rebalancing when any asset class deviates > 10% from target allocation. Flag over-concentration in equity if equity > 70% of portfolio for conservative risk profiles.",
  },
  {
    id: "inv_opportunity_cost",
    title: "Investment Opportunity Cost",
    rule: "When evaluating a purchase, show what the same amount would grow to if invested at 12% p.a. (equity) over 1, 3, and 5 years using compound interest.",
    formula: "futureValue = amount × (1 + 0.12)^years",
    example: "₹50,000 invested today → ₹56,000 in 1yr, ₹70,093 in 3yr, ₹88,117 in 5yr",
  },
  {
    id: "inv_sip_efficiency",
    title: "SIP Efficiency Rule",
    rule: "A SIP (systematic investment plan) of even ₹1,000/month at 12% p.a. compounds to ₹23,003 in 18 months and ₹1,00,417 in 5 years. Always show the power of small recurring investments.",
  },
];

// ── Payment Decision Rules ────────────────────────────────────────────────────
const PAYMENT_DECISION_RULES: KnowledgeRule[] = [
  {
    id: "pay_decision_tree",
    title: "Payment Method Decision Tree",
    rule: "Step 1: Can the purchase be covered without exceeding safe-to-spend? Step 2: Does any card offer rewards? Step 3: Is credit utilization < 30% post-purchase? Step 4: Is no-cost EMI available for large amounts? → Select highest-ranking option that satisfies all.",
  },
  {
    id: "pay_single_recommendation",
    title: "Single Best Option Rule",
    rule: "Always conclude with ONE best payment method after analyzing all options. Never leave the user with ambiguity. Rank: no-cost EMI on high-reward card > full payment on reward card > UPI/debit > interest-bearing EMI.",
  },
];

// ── Rule registry ─────────────────────────────────────────────────────────────
const ALL_RULES: Record<string, KnowledgeRule[]> = {
  safeToSpend:    SAFE_TO_SPEND_RULES,
  healthScore:    HEALTH_SCORE_RULES,
  creditCards:    CREDIT_CARD_RULES,
  budget:         BUDGET_RULES,
  goals:          GOAL_RULES,
  emi:            EMI_RULES,
  cashFlow:       CASH_FLOW_RULES,
  rewards:        REWARD_RULES,
  investments:    INVESTMENT_RULES,
  payment:        PAYMENT_DECISION_RULES,
};

// Intent → rule groups mapping
const INTENT_RULE_GROUPS: Record<string, string[]> = {
  PurchaseDecision:      ["safeToSpend", "budget", "goals", "creditCards", "rewards", "payment", "investments"],
  CreditCardAdvice:      ["creditCards", "rewards", "payment"],
  RewardOptimization:    ["rewards", "creditCards"],
  BudgetQuery:           ["budget", "safeToSpend"],
  GoalPlanning:          ["goals", "cashFlow"],
  SafeToSpend:           ["safeToSpend", "budget"],
  DebtManagement:        ["creditCards", "cashFlow"],
  InvestmentAdvice:      ["investments", "cashFlow"],
  EmergencyFund:         ["cashFlow", "goals"],
  CashFlowAnalysis:      ["cashFlow", "budget"],
  HealthScore:           ["healthScore", "budget", "cashFlow"],
  SubscriptionAudit:     ["budget", "cashFlow"],
  BillPayment:           ["cashFlow", "payment"],
  TravelPlanning:        ["rewards", "creditCards", "goals", "safeToSpend"],
  LargePurchase:         ["safeToSpend", "budget", "goals", "creditCards", "payment", "emi", "investments"],
  LoanQuery:             ["emi", "cashFlow"],
  LifestyleChange:       ["budget", "cashFlow", "goals"],
  SalaryScenario:        ["cashFlow", "goals", "investments", "safeToSpend"],
  WhatIfSimulation:      ["cashFlow", "goals", "budget", "investments", "safeToSpend", "healthScore"],
  WeeklySummary:         ["budget", "goals", "cashFlow"],
  GeneralFinancialAdvice:["healthScore", "budget", "cashFlow", "goals"],
};

/**
 * Get all relevant rules for a given intent.
 * Rules are deduplicated and returned in a flat array.
 */
export function getRulesForIntent(intent: Intent): KnowledgeRule[] {
  const groups = INTENT_RULE_GROUPS[intent] ?? ["healthScore", "budget"];
  const seen = new Set<string>();
  const result: KnowledgeRule[] = [];
  for (const group of groups) {
    for (const rule of (ALL_RULES[group] ?? [])) {
      if (!seen.has(rule.id)) {
        seen.add(rule.id);
        result.push(rule);
      }
    }
  }
  return result;
}

/**
 * Get all rules organized by group (for display/editing).
 */
export function getAllRules(): Record<string, KnowledgeRule[]> {
  return ALL_RULES;
}

/**
 * Format rules as a compact prompt-ready string.
 */
export function formatRulesForPrompt(rules: KnowledgeRule[]): string {
  return rules.map(r => {
    let text = `[RULE: ${r.title}] ${r.rule}`;
    if (r.formula) text += ` Formula: ${r.formula}`;
    if (r.example) text += ` Example: ${r.example}`;
    return text;
  }).join("\n");
}
