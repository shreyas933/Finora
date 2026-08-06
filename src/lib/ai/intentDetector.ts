/**
 * FINORA Financial OS — Layer 2: Intent Detector
 * ─────────────────────────────────────────────────────────────────────────────
 * Pure keyword + pattern matching classifier.
 * Zero latency — no LLM call.
 * Classifies the user's message into one of 22 intent types so the Decision
 * Engine and Response Generator know which calculations to emphasise.
 */

export type Intent =
  | "PurchaseDecision"
  | "CreditCardAdvice"
  | "RewardOptimization"
  | "BudgetQuery"
  | "GoalPlanning"
  | "SafeToSpend"
  | "DebtManagement"
  | "InvestmentAdvice"
  | "EmergencyFund"
  | "CashFlowAnalysis"
  | "HealthScore"
  | "SubscriptionAudit"
  | "BillPayment"
  | "TravelPlanning"
  | "LargePurchase"
  | "LoanQuery"
  | "LifestyleChange"
  | "SalaryScenario"
  | "WhatIfSimulation"
  | "WeeklySummary"
  | "GeneralFinancialAdvice"
  | "IdentityQuery"
  | "Greeting"
  | "OutOfDomain"
  | "VagueHelp";

// ── Snapshot sections that should be emphasised per intent ────────────────────
const INTENT_EMPHASIS: Record<Intent, string[]> = {
  PurchaseDecision:     ["safeToSpend", "budgets", "goals", "creditCards", "cashFlow", "investments"],
  CreditCardAdvice:     ["creditCards", "transactions", "budgets", "cashFlow"],
  RewardOptimization:   ["creditCards", "transactions"],
  BudgetQuery:          ["budgets", "transactions", "cashFlow"],
  GoalPlanning:         ["goals", "cashFlow", "transactions", "budgets"],
  SafeToSpend:          ["safeToSpend", "budgets", "transactions", "cashFlow"],
  DebtManagement:       ["creditCards", "loans", "cashFlow", "budgets"],
  InvestmentAdvice:     ["investments", "cashFlow", "goals", "riskProfile"],
  EmergencyFund:        ["cashFlow", "transactions", "goals", "budgets"],
  CashFlowAnalysis:     ["cashFlow", "transactions", "budgets", "upcomingObligations"],
  HealthScore:          ["healthScore", "budgets", "goals", "creditCards", "investments"],
  SubscriptionAudit:    ["transactions", "budgets", "cashFlow"],
  BillPayment:          ["upcomingObligations", "cashFlow", "creditCards"],
  TravelPlanning:       ["creditCards", "goals", "safeToSpend", "budgets", "cashFlow"],
  LargePurchase:        ["safeToSpend", "budgets", "goals", "creditCards", "investments", "cashFlow"],
  LoanQuery:            ["cashFlow", "creditCards", "budgets", "goals"],
  LifestyleChange:      ["budgets", "cashFlow", "goals", "safeToSpend"],
  SalaryScenario:       ["cashFlow", "goals", "budgets", "investments", "safeToSpend"],
  WhatIfSimulation:     ["cashFlow", "goals", "budgets", "investments", "safeToSpend", "healthScore"],
  WeeklySummary:        ["transactions", "budgets", "goals", "creditCards", "cashFlow"],
  GeneralFinancialAdvice: ["cashFlow", "budgets", "goals", "healthScore"],
  IdentityQuery:        [],
  Greeting:             ["safeToSpend", "healthScore"],
  OutOfDomain:          [],
  VagueHelp:            ["safeToSpend", "budgets", "goals", "healthScore"],
};

// ── Keyword rule table ────────────────────────────────────────────────────────
interface IntentRule {
  intent: Intent;
  patterns: RegExp[];
  priority: number; // higher = checked first
}

const INTENT_RULES: IntentRule[] = [
  // ── Edge Case: Identity & Capability (typo-tolerant) ──
  {
    intent: "IdentityQuery",
    priority: 200,
    patterns: [
      /who\s*(r|are)\s*(u|you)/i,
      /what\s*(r|are)\s*(u|you)/i,
      /what\s*(can|cam|cqn|cna|does)\s*(u|you|it)\s*(do)?/i,
      /what\s+do\s+(u|you)\s+do/i,
      /what\s+is\s+(finora|this\s+app|the\s+cfo)/i,
      /who\s+(created|built|made)\s+(u|you)/i,
      /your\s+(capability|capabilities|features|functions)/i,
      /how\s+do\s+(u|you)\s+work/i,
      /are\s+you\s+(chatgpt|ai|a\s+bot|cfo)/i,
    ],
  },

  // ── Edge Case: Greetings & Small Talk ──
  {
    intent: "Greeting",
    priority: 190,
    patterns: [
      /^(hi|hello|hey|heyya|greetings|good\s+(morning|afternoon|evening))\b/i,
      /^(thanks|thank\s+you|thx|cheers|awesome|great|cool)\b/i,
      /^(bye|goodbye|see\s+ya)\b/i,
    ],
  },

  // ── Edge Case: Out of Domain / Non-Financial ──
  {
    intent: "OutOfDomain",
    priority: 180,
    patterns: [
      /tell\s+me\s+a\s+(joke|story|poem|fact)/i,
      /what('s|\s+is)\s+the\s+(weather|capital|meaning|temperature|population|date|time)/i,
      /capital\s+of/i,
      /who\s+(is|was)\s+(the\s+)?(president|prime\s+minister|pm|king|queen|actor|author|inventor)/i,
      /where\s+is\s+(india|delhi|mumbai|paris|london|tokyo|china|america|usa|france|japan)/i,
      /who\s+won\s+the\s+(match|game|world\s+cup|ipl|fifa)/i,
      /write\s+a\s+(poem|essay|code|script|python|javascript|letter)/i,
      /recipe\s+for|how\s+to\s+cook|how\s+to\s+make\s+(pizza|tea|coffee|cake|pasta)/i,
      /translate\s+/i,
    ],
  },

  // ── Edge Case: Vague / Help ──
  {
    intent: "VagueHelp",
    priority: 175,
    patterns: [
      /^help$/i,
      /^money$/i,
      /^finances$/i,
      /what\s+should\s+i\s+do/i,
      /where\s+do\s+i\s+start/i,
      /guide\s+me/i,
    ],
  },
  // ── What-if simulation (catch before purchase/salary) ──
  {
    intent: "WhatIfSimulation",
    priority: 100,
    patterns: [
      /what\s*if/i,
      /suppose\s+i/i,
      /hypothetically/i,
      /scenario/i,
      /simulate/i,
      /if\s+i\s+(lose|quit|leave|get\s+fired|got\s+laid\s+off)/i,
    ],
  },

  // ── Weekly summary ──
  {
    intent: "WeeklySummary",
    priority: 95,
    patterns: [
      /weekly\s+(summary|review|report|briefing)/i,
      /this\s+week('?s)?\s+(spending|summary|review|performance)/i,
      /how\s+did\s+i\s+do\s+this\s+week/i,
      /cfo\s+report/i,
      /financial\s+briefing/i,
    ],
  },

  // ── Salary scenario ──
  {
    intent: "SalaryScenario",
    priority: 90,
    patterns: [
      /salary\s+(increase|hike|raise|jump|goes?\s+up|grew?)/i,
      /if\s+i\s+(get|earn|make|receive)\s+more/i,
      /increment/i,
      /promotion\s+and\s+salary/i,
      /appraisal/i,
    ],
  },

  // ── Travel planning ──
  {
    intent: "TravelPlanning",
    priority: 85,
    patterns: [
      /\b(trip|vacation|holiday|travel|flight|hotel|lounge|miles|points\s+for\s+travel|air\s+miles)\b/i,
      /going\s+to\s+[a-z]+\s+(city|country)?/i,
      /book(ing)?\s+(flight|ticket|hotel)/i,
      /\bgoa\b|\bdubai\b|\bbali\b|\beurope\b|\bthailand\b/i,
    ],
  },

  // ── Credit card advice (high priority) ──
  {
    intent: "CreditCardAdvice",
    priority: 170,
    patterns: [
      /what\s+all\s+.*(card|cards)/i,
      /what\s+.*(card|cards)\s+(do\s+i\s+have|i\s+have|in\s+my)/i,
      /which\s+card/i,
      /best\s+card\s+for/i,
      /my\s+credit\s+card(s)?/i,
      /credit\s+(score|cibil|limit|utiliz|utilisation|statement)/i,
      /destroying\s+(my\s+)?credit/i,
      /use\s+(my\s+)?(hdfc|sbi|axis|icici|amex|chase|citi|kotak|credit)\s+card/i,
      /emi\s+(or|vs\.?|versus)/i,
      /should\s+i\s+use\s+(emi|debit|upi|credit)/i,
      /card\s+(utilization|utilisation|limit|due|statement)/i,
      /billing\s+(cycle|date|statement)/i,
      /pay\s+(off\s+)?(my\s+)?card/i,
    ],
  },

  // ── Reward & Shopping Optimization (high priority) ──
  {
    intent: "RewardOptimization",
    priority: 180,
    patterns: [
      /optimi[sz]e|optmise|optmizer?/i,
      /optimi[sz]e\s+(my\s+)?(purchase|buy|shopping|spend|spending|order|deal|discount)/i,
      /how\s+(can|do)\s+i\s+(optimi[sz]e|optmise)/i,
      /(amazon|flipkart|myntra|swiggy|zomato|store|e-?commerce)\s+(purchase|buy|shopping|discount|cashback|offer|points|optimization|order)/i,
      /best\s+(way|card|method)\s+to\s+(pay|buy|purchase|order)\s+(on|at|from)/i,
      /\breward(s)?\b/i,
      /cashback/i,
      /maximize\s+(points|rewards|cashback|miles)/i,
      /best\s+reward/i,
      /which\s+card\s+(gives?|earns?|offers?)/i,
      /travel\s+points/i,
      /lounge\s+access/i,
    ],
  },

  // ── Large purchase (explicit amount) ──
  {
    intent: "LargePurchase",
    priority: 75,
    patterns: [
      /[₹$]\s?[0-9,]+\s*(lakh|k|thousand|crore)?/i,
      /\b(iphone|macbook|laptop|tv|car|bike|scooter|motorcycle|gold|jewellery|jewelry|refrigerator|washing\s+machine|ac|air\s+conditioner)\b/i,
    ],
  },

  // ── Purchase / can I afford ──
  {
    intent: "PurchaseDecision",
    priority: 70,
    patterns: [
      /can\s+i\s+(afford|buy|purchase|get|splurge|spend\s+on)/i,
      /should\s+i\s+(buy|purchase|get|order)/i,
      /worth\s+(buying|it|purchasing)/i,
      /is\s+it\s+(safe|okay|ok|fine)\s+to\s+(buy|spend|purchase)/i,
      /afford\s+(a|an|the)/i,
    ],
  },

  // ── Loan query ──
  {
    intent: "LoanQuery",
    priority: 65,
    patterns: [
      /\b(loan|emi|mortgage|home\s+loan|personal\s+loan|auto\s+loan|car\s+loan)\b/i,
      /borrow(ing)?/i,
      /interest\s+rate/i,
    ],
  },

  // ── Debt management ──
  {
    intent: "DebtManagement",
    priority: 62,
    patterns: [
      /debt/i,
      /pay\s+off\s+(my\s+)?(debt|loan|balance|dues)/i,
      /outstanding\s+(balance|dues)/i,
      /debt\s+free/i,
    ],
  },

  // ── Investment advice ──
  {
    intent: "InvestmentAdvice",
    priority: 60,
    patterns: [
      /invest(ment|ing)?/i,
      /mutual\s+fund/i,
      /stock(s)?|equity|index\s+fund/i,
      /sip/i,
      /portfolio\s+(review|balance|rebalanc)/i,
      /should\s+i\s+invest/i,
    ],
  },

  // ── Goal planning ──
  {
    intent: "GoalPlanning",
    priority: 55,
    patterns: [
      /goal(s)?/i,
      /saving\s+(for|towards)\s+/i,
      /target\s+(date|amount)/i,
      /on\s+track\s+(for|to)/i,
      /how\s+(long|many\s+months)\s+(to|until|before)\s+(i\s+reach|i\s+hit)/i,
      /emergency\s+fund\s+goal/i,
    ],
  },

  // ── Emergency fund ──
  {
    intent: "EmergencyFund",
    priority: 52,
    patterns: [
      /emergency\s+fund/i,
      /rainy\s+day\s+fund/i,
      /liquid\s+(savings|reserve|cushion)/i,
      /3\s+months?\s+(of\s+)?(expenses|living)/i,
      /6\s+months?\s+(of\s+)?(expenses|living)/i,
    ],
  },

  // ── Budget query ──
  {
    intent: "BudgetQuery",
    priority: 50,
    patterns: [
      /budget/i,
      /overspent|over\s*budget|exceeded/i,
      /how\s+much\s+(have\s+i\s+)?(spent|spending)/i,
      /category\s+spending/i,
      /dining|food\s+delivery|entertainment|groceries|shopping\s+budget/i,
    ],
  },

  // ── Safe to spend ──
  {
    intent: "SafeToSpend",
    priority: 48,
    patterns: [
      /safe\s+to\s+spend/i,
      /how\s+much\s+can\s+i\s+spend\s+(today|this\s+week|right\s+now)/i,
      /daily\s+(limit|allowance|budget)/i,
      /spending\s+limit/i,
    ],
  },

  // ── Health score ──
  {
    intent: "HealthScore",
    priority: 45,
    patterns: [
      /health\s+score/i,
      /financial\s+(health|fitness|score|grade|rating)/i,
      /how\s+(healthy|good)\s+(is\s+my|are\s+my)\s+finances/i,
      /financial\s+standing/i,
    ],
  },

  // ── Cash flow analysis ──
  {
    intent: "CashFlowAnalysis",
    priority: 42,
    patterns: [
      /cash\s+flow/i,
      /income\s+vs\s+expenses/i,
      /net\s+(income|savings|cash)/i,
      /where\s+(is\s+my|does\s+my)\s+money\s+(going|go)/i,
      /money\s+management/i,
    ],
  },

  // ── Subscription audit ──
  {
    intent: "SubscriptionAudit",
    priority: 40,
    patterns: [
      /subscription(s)?/i,
      /netflix|spotify|amazon\s+prime|hotstar|zee5|sonyliv|disney/i,
      /ott\s+(platforms?|services?)/i,
      /recurring\s+(charge|payment|bill)/i,
      /cancel\s+(subscription|service|plan)/i,
    ],
  },

  // ── Bill payment ──
  {
    intent: "BillPayment",
    priority: 38,
    patterns: [
      /bill(s)?\s+(due|payment|pay)/i,
      /when\s+(is|are)\s+(my\s+)?(rent|electricity|internet|gas|insurance|emi)\s+due/i,
      /upcoming\s+(payment|bill|emi|expense)/i,
      /due\s+(date|soon|this\s+month)/i,
    ],
  },

  // ── Lifestyle change ──
  {
    intent: "LifestyleChange",
    priority: 35,
    patterns: [
      /moving\s+(to\s+a\s+)?new\s+(city|apartment|house|home)/i,
      /increase\s+(my\s+)?rent/i,
      /change\s+(job|career)|new\s+job/i,
      /lifestyle\s+(upgrade|change|downgrade)/i,
      /relocat/i,
      /starting\s+a\s+(family|business)/i,
    ],
  },

  // ── General financial advice (catch-all) ──
  {
    intent: "GeneralFinancialAdvice",
    priority: 0,
    patterns: [/.*/],
  },
];

// ── Main classifier ───────────────────────────────────────────────────────────
/**
 * Classify a user message into one of 22 financial intents.
 * Sorted by priority so high-confidence intents are tested first.
 */
export function detectIntent(userMessage: string): Intent {
  const sorted = [...INTENT_RULES].sort((a, b) => b.priority - a.priority);
  for (const rule of sorted) {
    for (const pattern of rule.patterns) {
      if (pattern.test(userMessage)) {
        return rule.intent;
      }
    }
  }

  // Check if message lacks any financial keywords
  const financialKeywords = /money|pay|buy|spend|card|budget|goal|invest|rupee|rs|₹|\$|balance|credit|bank|salary|rent|bill|cost|price|tax|interest|loan|cfo|finora|saving|save|worth|afford|points|cashback|reward|sip|fund|stock|debt|emi|hike|appraisal|income|expense/i;
  
  if (!financialKeywords.test(userMessage) && userMessage.trim().length > 3) {
    return "OutOfDomain";
  }

  return "GeneralFinancialAdvice";
}

/**
 * Returns the list of snapshot field names that should be emphasised
 * in the system prompt for a given intent.
 */
export function getIntentEmphasis(intent: Intent): string[] {
  return INTENT_EMPHASIS[intent] ?? INTENT_EMPHASIS.GeneralFinancialAdvice;
}

/**
 * Human-readable label + emoji for UI display (e.g., status pill).
 */
export function getIntentLabel(intent: Intent): string {
  const labels: Record<Intent, string> = {
    PurchaseDecision:      "🛍️ Purchase Decision",
    CreditCardAdvice:      "💳 Credit Card Analysis",
    RewardOptimization:    "✨ Reward Optimization",
    BudgetQuery:           "📊 Budget Analysis",
    GoalPlanning:          "🎯 Goal Planning",
    SafeToSpend:           "✅ Safe To Spend",
    DebtManagement:        "📉 Debt Management",
    InvestmentAdvice:      "📈 Investment Analysis",
    EmergencyFund:         "🛡️ Emergency Fund",
    CashFlowAnalysis:      "💰 Cash Flow Analysis",
    HealthScore:           "❤️ Financial Health",
    SubscriptionAudit:     "🔄 Subscription Audit",
    BillPayment:           "📅 Bill & Payment",
    TravelPlanning:        "✈️ Travel Planning",
    LargePurchase:         "🏷️ Large Purchase",
    LoanQuery:             "🏦 Loan Analysis",
    LifestyleChange:       "🏠 Lifestyle Change",
    SalaryScenario:        "💼 Salary Scenario",
    WhatIfSimulation:      "🔮 Scenario Simulation",
    WeeklySummary:         "📋 Weekly CFO Summary",
    GeneralFinancialAdvice:"👨‍💼 CFO Analysis",
    IdentityQuery:        "🤖 CFO Persona & Capabilities",
    Greeting:             "👋 CFO Greeting",
    OutOfDomain:          "💡 Financial Assistant Focus",
    VagueHelp:            "🩺 Financial Overview & Options",
  };
  return labels[intent] ?? "👨‍💼 CFO Analysis";
}
