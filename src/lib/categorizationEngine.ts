// ── FINORA Intelligent Transaction Categorization Engine ──────────────────────
// Pure TypeScript — no React dependencies. Can be used server-side or client-side.

// ─── Types ───────────────────────────────────────────────────────────────────

export type MerchantMapping = {
  id: string;
  user_id: string;
  merchant_key: string;   // normalized lowercase merchant name
  category: string;
  confidence: number;     // 1.0 = user-confirmed
  source: string;         // 'user' | 'auto' | 'rule'
  created_at: string;
  updated_at: string;
};

export type CategorizeResult = {
  category: string;
  confidence: number;     // 0–1
  source: "user_mapping" | "rule" | "none";
  needsReview: boolean;
  suggestedCategory: string | null;
};

// ─── Confidence Thresholds ───────────────────────────────────────────────────

export const CONFIDENCE_AUTO_ASSIGN = 0.80;
export const CONFIDENCE_SUGGEST = 0.50;

// ─── Built-in Keyword Rules ─────────────────────────────────────────────────
// These provide baseline categorization when no user mapping exists.
// Organized by specificity — more specific patterns first.

type CategoryRule = {
  keywords: string[];
  category: string;
  type?: "income" | "expense";
};

const BUILTIN_RULES: CategoryRule[] = [
  // ── Food & Dining ──
  {
    keywords: [
      "swiggy", "zomato", "mcdonald", "mcdonalds", "burger king", "kfc",
      "pizza hut", "dominos", "domino's", "pizza", "subway", "starbucks",
      "cafe", "coffee", "bakery", "restaurant", "biryani", "chaayos",
      "dunkin", "baskin", "ice cream", "haldiram", "barbeque nation",
      "food", "dining", "eat", "meal", "lunch", "dinner", "breakfast",
      "talabat", "deliveroo", "ubereats", "uber eats", "doordash",
    ],
    category: "Food & Dining",
    type: "expense",
  },
  // ── Groceries ──
  {
    keywords: [
      "bigbasket", "blinkit", "zepto", "instamart", "dmart", "d-mart",
      "more supermarket", "reliance fresh", "star bazaar", "nature's basket",
      "lulu", "hypermarket", "carrefour", "geant", "spinneys", "waitrose",
      "union coop", "grocery", "groceries", "supermarket", "provision",
    ],
    category: "Groceries",
    type: "expense",
  },
  // ── Shopping ──
  {
    keywords: [
      "amazon", "flipkart", "myntra", "ajio", "nykaa", "meesho",
      "snapdeal", "noon", "namshi", "tatacliq", "croma", "reliance digital",
      "shoppers stop", "lifestyle", "h&m", "zara", "uniqlo", "decathlon",
      "ikea", "shopping", "retail", "mall", "store", "mart",
      "clothing", "apparel", "fashion", "shoes", "footwear",
    ],
    category: "Shopping",
    type: "expense",
  },
  // ── Transportation ──
  {
    keywords: [
      "uber", "ola", "rapido", "namma yatri", "metro", "bus",
      "fuel", "petrol", "diesel", "hpcl", "bpcl", "indian oil", "iocl",
      "shell", "reliance petrol", "essar", "toll", "fastag", "salik",
      "parking", "auto", "cab", "taxi", "ride", "car wash",
      "transport", "transportation",
    ],
    category: "Transportation",
    type: "expense",
  },
  // ── Travel ──
  {
    keywords: [
      "makemytrip", "goibibo", "irctc", "easemytrip", "cleartrip",
      "booking.com", "airbnb", "oyo", "trivago", "yatra", "ixigo",
      "hotel", "flight", "airline", "air india", "indigo", "spicejet",
      "vistara", "emirates", "etihad", "flydubai", "qatar airways",
      "travel", "trip", "resort", "lounge", "airport",
    ],
    category: "Travel",
    type: "expense",
  },
  // ── Entertainment ──
  {
    keywords: [
      "netflix", "spotify", "prime video", "hotstar", "disney",
      "youtube premium", "youtube", "apple tv", "hbo", "hulu",
      "zee5", "sony liv", "jiocinema", "mubi", "crunchyroll",
      "pvr", "inox", "bookmyshow", "cinema", "movie", "concert",
      "event", "amusement", "entertainment", "gaming", "steam",
      "playstation", "xbox", "nintendo", "epic games",
    ],
    category: "Entertainment",
    type: "expense",
  },
  // ── Health & Medical ──
  {
    keywords: [
      "apollo", "pharmacy", "pharmeasy", "1mg", "netmeds", "medplus",
      "hospital", "clinic", "doctor", "medical", "health", "healthcare",
      "pathology", "lab", "diagnostic", "dentist", "optical", "eye",
      "aster", "mediclinic", "fortis", "max hospital", "aiims",
      "gym", "fitness", "cult", "cure.fit", "yoga",
    ],
    category: "Health",
    type: "expense",
  },
  // ── Utilities & Bills ──
  {
    keywords: [
      "electricity", "water", "gas", "dewa", "addc", "bescom",
      "msedcl", "tata power", "torrent power", "bses",
      "jio", "airtel", "vi", "vodafone", "bsnl", "act fibernet",
      "broadband", "internet", "wifi", "cable", "dth",
      "du telecom", "etisalat", "utility", "utilities", "bill",
      "mobile", "telecom", "recharge", "postpaid", "prepaid",
    ],
    category: "Utilities",
    type: "expense",
  },
  // ── Housing & Rent ──
  {
    keywords: [
      "rent", "lease", "landlord", "housing", "maintenance",
      "society", "flat", "apartment", "mortgage", "emi",
      "home loan", "property tax",
    ],
    category: "Housing",
    type: "expense",
  },
  // ── Insurance ──
  {
    keywords: [
      "insurance", "lic", "icici prudential", "hdfc life",
      "max life", "sbi life", "bajaj allianz", "star health",
      "policy", "premium", "term plan", "health insurance",
    ],
    category: "Insurance",
    type: "expense",
  },
  // ── Investment ──
  {
    keywords: [
      "mutual fund", "sip", "zerodha", "groww", "upstox", "kuvera",
      "coin", "investment", "nps", "ppf", "fixed deposit", "fd",
      "stock", "shares", "demat", "nifty", "sensex", "ipo",
    ],
    category: "Investment",
    type: "expense",
  },
  // ── Education ──
  {
    keywords: [
      "school", "college", "university", "tuition", "course",
      "udemy", "coursera", "unacademy", "byjus", "byju's",
      "education", "coaching", "training", "exam", "fee",
    ],
    category: "Education",
    type: "expense",
  },
  // ── Income ──
  {
    keywords: [
      "salary", "payroll", "wages", "credit interest",
      "dividend", "refund", "cashback", "reward",
      "payment received", "neft-in", "imps-in",
    ],
    category: "Income",
    type: "income",
  },
  // ── Banking ──
  {
    keywords: [
      "bank charge", "service charge", "annual fee", "late fee",
      "atm", "withdrawal", "transfer fee", "bank fee",
    ],
    category: "Banking Fees",
    type: "expense",
  },
];

// ─── Merchant Name Normalization ─────────────────────────────────────────────

/**
 * Normalize a merchant/transaction name for consistent matching.
 * Strips noise like UPI references, card numbers, dates, special chars.
 */
export function normalizeMerchant(name: string): string {
  let normalized = name.toLowerCase().trim();

  // Remove text after " || " (legacy FINORA encoding)
  if (normalized.includes(" || ")) {
    normalized = normalized.split(" || ")[0].trim();
  }

  // Remove card info in parentheses e.g. "(HDFC Bank 4321)"
  normalized = normalized.replace(/\([^)]*(?:bank|card|a\/c|ending)[^)]*\)/gi, "");

  // Remove UPI references
  normalized = normalized.replace(/upi\/?\d+\/[^\s]*/gi, "");
  normalized = normalized.replace(/ref[:.]\s*\d+/gi, "");

  // Remove dates
  normalized = normalized.replace(/\d{4}[-/]\d{2}[-/]\d{2}/g, "");
  normalized = normalized.replace(/\d{2}[-/]\d{2}[-/]\d{4}/g, "");

  // Remove amount references
  normalized = normalized.replace(/(?:rs\.?|₹|inr)\s*[\d,.]+/gi, "");

  // Remove special chars but keep spaces, letters, digits
  normalized = normalized.replace(/[^a-z0-9\s]/g, " ");

  // Collapse whitespace
  normalized = normalized.replace(/\s+/g, " ").trim();

  return normalized;
}

// ─── Core Categorization Function ────────────────────────────────────────────

/**
 * Categorize a transaction based on:
 * 1. User's merchant_mappings (highest priority)
 * 2. Builtin keyword rules
 * 3. Fallback to "Uncategorized" with needs_review flag
 *
 * @param name        Raw transaction description / merchant name
 * @param txType      "income" | "expense" (helps disambiguate)
 * @param mappings    User's saved merchant→category mappings
 * @param userCategories  List of category names the user has created
 */
export function categorizeTransaction(
  name: string,
  txType: "income" | "expense",
  mappings: MerchantMapping[],
  userCategories: string[] = [],
): CategorizeResult {
  const merchantKey = normalizeMerchant(name);

  if (!merchantKey) {
    return {
      category: "Uncategorized",
      confidence: 0,
      source: "none",
      needsReview: true,
      suggestedCategory: null,
    };
  }

  // ── 1. Exact match in user merchant mappings ──
  const exactMapping = mappings.find(m => m.merchant_key === merchantKey);
  if (exactMapping) {
    return {
      category: exactMapping.category,
      confidence: 1.0,
      source: "user_mapping",
      needsReview: false,
      suggestedCategory: null,
    };
  }

  // ── 2. Fuzzy match in user mappings (partial/substring) ──
  const fuzzyMapping = mappings.find(m =>
    merchantKey.includes(m.merchant_key) || m.merchant_key.includes(merchantKey)
  );
  if (fuzzyMapping) {
    return {
      category: fuzzyMapping.category,
      confidence: 0.85,
      source: "user_mapping",
      needsReview: false,
      suggestedCategory: null,
    };
  }

  // ── 3. Builtin keyword rules ──
  for (const rule of BUILTIN_RULES) {
    // If rule has a type constraint, check it
    if (rule.type && rule.type !== txType) continue;

    const matched = rule.keywords.some(kw => merchantKey.includes(kw));
    if (matched) {
      // If the rule's category is in the user's category list, it's a strong match
      const categoryExists = userCategories.length === 0 ||
        userCategories.some(uc => uc.toLowerCase() === rule.category.toLowerCase());

      return {
        category: rule.category,
        confidence: categoryExists ? 0.75 : 0.60,
        source: "rule",
        needsReview: false,
        suggestedCategory: null,
      };
    }
  }

  // ── 4. No match — attempt to suggest if user has categories ──
  // Try matching any user category name against the merchant key
  if (userCategories.length > 0) {
    for (const cat of userCategories) {
      const catKey = cat.toLowerCase();
      if (merchantKey.includes(catKey) || catKey.includes(merchantKey)) {
        return {
          category: cat,
          confidence: 0.55,
          source: "rule",
          needsReview: false,
          suggestedCategory: cat,
        };
      }
    }
  }

  // ── 5. Complete unknown — needs review ──
  return {
    category: "Uncategorized",
    confidence: 0,
    source: "none",
    needsReview: true,
    suggestedCategory: null,
  };
}

// ─── Apply Categorization Result to Transaction ──────────────────────────────

/**
 * Given a CategorizeResult, determine the final category and flags.
 */
export function applyCategorizationResult(
  result: CategorizeResult,
  existingCategory?: string,
): {
  category: string;
  needs_review: boolean;
  suggested_category: string | null;
} {
  // If the transaction already has a non-Uncategorized category, respect it
  if (existingCategory && existingCategory !== "Uncategorized" && existingCategory !== "Other") {
    return {
      category: existingCategory,
      needs_review: false,
      suggested_category: null,
    };
  }

  if (result.confidence >= CONFIDENCE_AUTO_ASSIGN) {
    // Auto-assign with full confidence
    return {
      category: result.category,
      needs_review: false,
      suggested_category: null,
    };
  }

  if (result.confidence >= CONFIDENCE_SUGGEST) {
    // Assign the suggested category but allow easy correction
    return {
      category: result.category,
      needs_review: false,
      suggested_category: result.category,
    };
  }

  // Low confidence — needs review
  return {
    category: "Uncategorized",
    needs_review: true,
    suggested_category: result.suggestedCategory || result.category !== "Uncategorized" ? result.category : null,
  };
}

// ─── Bulk Categorization Helper ──────────────────────────────────────────────

/**
 * Categorize an array of transactions. Returns transactions with
 * updated category, needs_review, and suggested_category fields.
 */
export function categorizeTransactionBatch(
  transactions: Array<{
    name: string;
    type: "income" | "expense";
    category?: string;
  }>,
  mappings: MerchantMapping[],
  userCategories: string[] = [],
): Array<{
  name: string;
  type: "income" | "expense";
  category: string;
  needs_review: boolean;
  suggested_category: string | null;
}> {
  return transactions.map(tx => {
    const result = categorizeTransaction(tx.name, tx.type, mappings, userCategories);
    const applied = applyCategorizationResult(result, tx.category);

    return {
      name: tx.name,
      type: tx.type,
      category: applied.category,
      needs_review: applied.needs_review,
      suggested_category: applied.suggested_category,
    };
  });
}

// ─── Extract User Categories from Budget Data ────────────────────────────────

/**
 * Extracts unique category names from the user's budget configuration
 * stored in localStorage.
 */
export function extractUserCategories(): string[] {
  if (typeof window === "undefined") return [];

  const categories = new Set<string>();

  // From budget categories
  const budgets = localStorage.getItem("finora_budgets");
  if (budgets) {
    try {
      const parsed = JSON.parse(budgets);
      parsed.forEach((b: any) => {
        if (b.name) categories.add(b.name);
        if (b.txCategories) {
          (b.txCategories as string[]).forEach(c => categories.add(c));
        }
      });
    } catch (e) { /* ignore */ }
  }

  // From custom needs
  const needs = localStorage.getItem("finora_custom_needs");
  if (needs) {
    try {
      const parsed = JSON.parse(needs);
      parsed.forEach((n: any) => {
        if (n.name) categories.add(n.name);
        if (n.txCategories) {
          (n.txCategories as string[]).forEach(c => categories.add(c));
        }
      });
    } catch (e) { /* ignore */ }
  }

  // From custom wants
  const wants = localStorage.getItem("finora_custom_wants");
  if (wants) {
    try {
      const parsed = JSON.parse(wants);
      parsed.forEach((w: any) => {
        if (w.name) categories.add(w.name);
        if (w.txCategories) {
          (w.txCategories as string[]).forEach(c => categories.add(c));
        }
      });
    } catch (e) { /* ignore */ }
  }

  // Also add the hardcoded fallback categories
  [
    "Food & Dining", "Food", "Groceries", "Shopping", "Transportation",
    "Transport", "Entertainment", "Health", "Healthcare", "Travel",
    "Utilities", "Housing", "Insurance", "Investment", "Education",
    "Income", "Savings", "Banking Fees", "Lifestyle", "Dining Out",
    "Salary",
  ].forEach(c => categories.add(c));

  return Array.from(categories);
}
