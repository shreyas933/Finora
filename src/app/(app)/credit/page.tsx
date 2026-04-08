"use client";

import { useState, useEffect } from "react";
import { cn, formatCurrency } from "@/lib/utils";
import { useFinance } from "@/context/FinanceContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  CreditCard, TrendingUp, AlertCircle, ShieldCheck, Plus, X,
  Plane, Hotel, ShoppingBag, Utensils, Fuel, Wifi, Gift, Star,
  ChevronRight, Sparkles, Zap, TrendingDown, Home, Car, Dumbbell,
  Tv, Stethoscope, GraduationCap, BarChart3,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────
type CardNetwork = "visa" | "mastercard" | "amex" | "rupay";
type CardColor = "purple" | "blue" | "gold" | "graphite" | "green";

interface UserCard {
  id: string;
  name: string;       // e.g. "HDFC Regalia"
  bank: string;
  number: string;     // last 4 digits
  network: CardNetwork;
  color: CardColor;
  limit: string;
  perks: string[];    // user-entered perks
}

interface BenefitScenario {
  icon: React.ElementType;
  category: string;
  description: string;
  benefit: string;
  tag: string;
  tagColor: string;
}

// ─── Static benefit suggestions per card perk keywords ────────────────────────
const PERK_BENEFITS: Record<string, BenefitScenario[]> = {
  lounge: [
    { icon: Plane, category: "Airport Lounge", description: "Use before domestic/international flights", benefit: "Free lounge access for you + 1 guest", tag: "FREE", tagColor: "emerald" },
    { icon: Wifi, category: "Layover Comfort", description: "Long layover at major airports", benefit: "Unlimited visits — relax with food & wifi", tag: "UNLIMITED", tagColor: "blue" },
  ],
  hotel: [
    { icon: Hotel, category: "Hotel Booking", description: "Book partner hotels directly via card portal", benefit: "Free room upgrade + late checkout", tag: "UPGRADE", tagColor: "amber" },
    { icon: Gift, category: "Hotel Stay", description: "Stays at ITC, Marriott, Taj partner hotels", benefit: "Complimentary breakfast + welcome amenity", tag: "FREE MEAL", tagColor: "purple" },
  ],
  dining: [
    { icon: Utensils, category: "Restaurant Dining", description: "Swipe your card at partner restaurants", benefit: "Up to 20% off + 2x reward points", tag: "20% OFF", tagColor: "rose" },
    { icon: Utensils, category: "Food Delivery", description: "Use card on Swiggy / Zomato", benefit: "Extra cashback or reward points", tag: "CASHBACK", tagColor: "orange" },
  ],
  fuel: [
    { icon: Fuel, category: "Fuel Stations", description: "Swipe at HPCL / BPCL / Indian Oil", benefit: "1% fuel surcharge waiver + bonus points", tag: "WAIVER", tagColor: "yellow" },
  ],
  shopping: [
    { icon: ShoppingBag, category: "Online Shopping", description: "Use on Amazon, Flipkart, Myntra", benefit: "5x reward points or cashback", tag: "5X POINTS", tagColor: "blue" },
    { icon: ShoppingBag, category: "Retail Outlets", description: "Partner brand stores", benefit: "Exclusive discounts + reward acceleration", tag: "EXCLUSIVE", tagColor: "purple" },
  ],
  travel: [
    { icon: Plane, category: "Flight Booking", description: "Book via card travel portal or partner airlines", benefit: "Air miles / reward points acceleration", tag: "MILES", tagColor: "sky" },
  ],
  cashback: [
    { icon: Star, category: "Daily Spends", description: "Utilities, subscriptions, groceries", benefit: "Flat cashback on all eligible transactions", tag: "CASHBACK", tagColor: "emerald" },
  ],
};

const DEFAULT_BENEFITS: BenefitScenario[] = [
  { icon: ShoppingBag, category: "Online Shopping", description: "Use on major e-commerce platforms", benefit: "Earn reward points on every purchase", tag: "POINTS", tagColor: "blue" },
  { icon: Utensils, category: "Dining Out", description: "Restaurants and food delivery", benefit: "Accelerated rewards on food spends", tag: "2X", tagColor: "rose" },
  { icon: Fuel, category: "Fuel", description: "Petrol pumps across India", benefit: "Fuel surcharge waiver", tag: "WAIVER", tagColor: "amber" },
];

// ─── Card color themes ────────────────────────────────────────────────────────
const CARD_COLORS: Record<CardColor, { bg: string; text: string; shadow: string }> = {
  purple:   { bg: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)", text: "#fff", shadow: "0 8px 32px rgba(124,58,237,0.35)" },
  blue:     { bg: "linear-gradient(135deg, #1d4ed8 0%, #0ea5e9 100%)", text: "#fff", shadow: "0 8px 32px rgba(14,165,233,0.35)" },
  gold:     { bg: "linear-gradient(135deg, #92400e 0%, #d97706 100%)", text: "#fff", shadow: "0 8px 32px rgba(217,119,6,0.35)" },
  graphite: { bg: "linear-gradient(135deg, #1e293b 0%, #475569 100%)", text: "#fff", shadow: "0 8px 32px rgba(71,85,105,0.35)" },
  green:    { bg: "linear-gradient(135deg, #065f46 0%, #10b981 100%)", text: "#fff", shadow: "0 8px 32px rgba(16,185,129,0.35)" },
};

const TAG_COLORS: Record<string, string> = {
  emerald: "#10b981", blue: "#3b82f6", amber: "#f59e0b", purple: "#8b5cf6",
  rose: "#f43f5e", orange: "#f97316", yellow: "#eab308", sky: "#0ea5e9",
};

// ─── Category → Card tip mapping ─────────────────────────────────────────────
interface CategoryTip {
  icon: React.ElementType;
  color: string;
  label: string;         // display name
  perk: string;          // what perk applies
  pointsMultiplier: string; // e.g. "3x"
  platforms: string[];   // where specifically to pay
  idealPerk: string;     // card perk keyword that best matches
}

const CATEGORY_TIPS: Record<string, CategoryTip> = {
  Food: {
    icon: Utensils, color: "#f43f5e", label: "Food & Groceries",
    perk: "Dining & grocery reward acceleration",
    pointsMultiplier: "3x",
    platforms: ["Swiggy", "Zomato", "BigBasket", "Blinkit", "D-Mart"],
    idealPerk: "dining",
  },
  Lifestyle: {
    icon: ShoppingBag, color: "#8b5cf6", label: "Lifestyle & Shopping",
    perk: "5x reward points on lifestyle spends",
    pointsMultiplier: "5x",
    platforms: ["Amazon", "Flipkart", "Myntra", "Nykaa", "Meesho"],
    idealPerk: "shopping",
  },
  Transport: {
    icon: Car, color: "#3b82f6", label: "Transport & Fuel",
    perk: "Fuel surcharge waiver + bonus points",
    pointsMultiplier: "2x",
    platforms: ["HPCL", "BPCL", "Indian Oil", "Uber", "Ola"],
    idealPerk: "fuel",
  },
  Housing: {
    icon: Home, color: "#10b981", label: "Housing & Utilities",
    perk: "Utility bill cashback",
    pointsMultiplier: "1.5x",
    platforms: ["BESCOM", "BWSSB", "Gas bill", "PayTM", "BBPS"],
    idealPerk: "cashback",
  },
  Entertainment: {
    icon: Tv, color: "#f59e0b", label: "Entertainment & OTT",
    perk: "OTT subscription cashback + movie offers",
    pointsMultiplier: "2x",
    platforms: ["Netflix", "Prime", "BookMyShow", "Hotstar", "PVR"],
    idealPerk: "cashback",
  },
  Health: {
    icon: Stethoscope, color: "#06b6d4", label: "Health & Medical",
    perk: "Health insurance & pharmacy cashback",
    pointsMultiplier: "2x",
    platforms: ["PharmEasy", "1mg", "Apollo", "Netmeds", "HealthKart"],
    idealPerk: "cashback",
  },
  Education: {
    icon: GraduationCap, color: "#a78bfa", label: "Education & Courses",
    perk: "Ed-tech cashback + EMI offers",
    pointsMultiplier: "2x",
    platforms: ["Udemy", "Coursera", "Byju's", "Unacademy", "upGrad"],
    idealPerk: "cashback",
  },
  Fitness: {
    icon: Dumbbell, color: "#f97316", label: "Fitness & Wellness",
    perk: "Gym & wellness partner discounts",
    pointsMultiplier: "2x",
    platforms: ["Cult.fit", "Gold's Gym", "HealthifyMe", "StepSetGo"],
    idealPerk: "cashback",
  },
  Travel: {
    icon: Plane, color: "#0ea5e9", label: "Travel & Hotels",
    perk: "Air miles + lounge access + hotel upgrades",
    pointsMultiplier: "5x",
    platforms: ["MakeMyTrip", "Goibibo", "IRCTC", "EaseMyTrip", "Booking.com"],
    idealPerk: "travel",
  },
};

// Fallback for unknown categories
const DEFAULT_TIP: CategoryTip = {
  icon: Star, color: "#eab308", label: "General Spend",
  perk: "Earn reward points on every transaction",
  pointsMultiplier: "1x",
  platforms: ["Any merchant", "UPI", "POS terminals"],
  idealPerk: "cashback",
};

// ─── Spend Optimizer Component ─────────────────────────────────────────────────
function SpendOptimizer({ card }: { card: UserCard }) {
  const { transactions } = useFinance();

  // Aggregate expense spend by category
  const categorySpend: Record<string, number> = {};
  for (const tx of transactions) {
    if (tx.type === "expense") {
      categorySpend[tx.category] = (categorySpend[tx.category] ?? 0) + tx.amount;
    }
  }

  const totalSpend = Object.values(categorySpend).reduce((a, b) => a + b, 0);

  // Sort categories by spend descending, take top 5
  const topCategories = Object.entries(categorySpend)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  if (topCategories.length === 0) {
    return (
      <div className="spend-optimizer-empty">
        <BarChart3 className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">No transaction data yet. Add transactions to get personalized recommendations.</p>
      </div>
    );
  }

  // Check if card has perk keywords
  const cardPerks = card.perks.map(p => p.toLowerCase());
  const hasPerk = (perk: string) => cardPerks.some(p => p.includes(perk));

  return (
    <div className="spend-optimizer-list">
      {topCategories.map(([category, amount], i) => {
        const tip = CATEGORY_TIPS[category] ?? DEFAULT_TIP;
        const Icon = tip.icon;
        const pct = totalSpend > 0 ? (amount / totalSpend) * 100 : 0;
        const perkMatch = hasPerk(tip.idealPerk) || card.perks.length === 0;
        // Estimate monthly points (1 point per ₹1 as base, multiplied)
        const multiplier = parseFloat(tip.pointsMultiplier) || 1;
        const estimatedPoints = Math.round(amount * multiplier);

        return (
          <motion.div
            key={category}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: i * 0.07 }}
            className="spend-opt-row"
            style={{ borderColor: `${tip.color}20` }}
          >
            {/* Left icon + category */}
            <div className="spend-opt-left">
              <div className="spend-opt-icon" style={{ background: `${tip.color}18`, color: tip.color }}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="spend-opt-info">
                <div className="spend-opt-top-row">
                  <span className="spend-opt-label">{tip.label}</span>
                  {perkMatch && (
                    <span className="spend-opt-match-badge">
                      <Zap className="h-2.5 w-2.5" /> Match
                    </span>
                  )}
                </div>
                {/* Spend bar */}
                <div className="spend-bar-track">
                  <div className="spend-bar-fill" style={{ width: `${Math.min(100, pct)}%`, background: tip.color }} />
                </div>
                {/* Platforms */}
                <div className="spend-opt-platforms">
                  {tip.platforms.slice(0, 3).map(p => (
                    <span key={p} className="platform-chip">{p}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: amount + points tip */}
            <div className="spend-opt-right">
              <span className="spend-opt-amount">{formatCurrency(amount)}</span>
              <div className="spend-opt-points">
                <span className="points-multiplier" style={{ color: tip.color }}>{tip.pointsMultiplier}</span>
                <span className="points-label">≈ {estimatedPoints.toLocaleString("en-IN")} pts</span>
              </div>
              <span className="spend-opt-perk">{tip.perk}</span>
            </div>
          </motion.div>
        );
      })}

      {/* Footer summary */}
      <div className="spend-opt-footer">
        <TrendingDown className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
        <p className="text-xs text-muted-foreground">
          Routing these {topCategories.length} spend categories through your <strong>{card.name}</strong> could earn you
          {" "}<strong className="text-emerald-400">
            {topCategories.reduce(([, amt]) => {
              const m = parseFloat(CATEGORY_TIPS[topCategories[0][0]]?.pointsMultiplier ?? "1");
              return ["" , amt * m];
            }, ["", 0] as [string, number])[1].toLocaleString("en-IN")}+
          </strong>{" "}
          reward points monthly.
        </p>
      </div>
    </div>
  );
}

// ─── Helper: derive benefits from card perks keyword matching ─────────────────
function getBenefitsForCard(card: UserCard): BenefitScenario[] {
  const found: BenefitScenario[] = [];
  const seen = new Set<string>();

  for (const perk of card.perks) {
    const key = perk.toLowerCase();
    for (const [keyword, scenarios] of Object.entries(PERK_BENEFITS)) {
      if (key.includes(keyword)) {
        for (const s of scenarios) {
          if (!seen.has(s.category)) {
            found.push(s);
            seen.add(s.category);
          }
        }
      }
    }
  }

  if (found.length === 0) return DEFAULT_BENEFITS;
  return found.slice(0, 6);
}

// ─── Mini credit card visual ──────────────────────────────────────────────────
function CreditCardVisual({ card, selected, onClick }: { card: UserCard; selected: boolean; onClick: () => void }) {
  const theme = CARD_COLORS[card.color];
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.015 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn("credit-card-visual", selected && "selected")}
      style={{ background: theme.bg, boxShadow: selected ? theme.shadow : "0 4px 16px rgba(0,0,0,0.3)" }}
    >
      {/* Glow chip */}
      <div className="cc-chip" />
      {/* Network badge */}
      <div className="cc-network">{card.network.toUpperCase()}</div>
      {/* Card number */}
      <div className="cc-number">•••• •••• •••• {card.number}</div>
      {/* Bottom row */}
      <div className="cc-bottom">
        <div>
          <div className="cc-label">CARDHOLDER</div>
          <div className="cc-value">{card.bank}</div>
        </div>
        <div className="text-right">
          <div className="cc-label">CARD</div>
          <div className="cc-value">{card.name}</div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Add Card Modal ───────────────────────────────────────────────────────────
function AddCardModal({ onClose, onAdd }: { onClose: () => void; onAdd: (card: UserCard) => void }) {
  const [form, setForm] = useState({
    name: "", bank: "", number: "", network: "visa" as CardNetwork,
    color: "blue" as CardColor, limit: "", perks: "",
  });
  const [step, setStep] = useState(1);

  const handle = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = () => {
    if (!form.name || !form.bank || form.number.length < 4) return;
    const card: UserCard = {
      id: Date.now().toString(),
      name: form.name,
      bank: form.bank,
      number: form.number.slice(-4),
      network: form.network,
      color: form.color,
      limit: form.limit,
      perks: form.perks.split(",").map(p => p.trim()).filter(Boolean),
    };
    onAdd(card);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        className="modal-box"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Add Credit Card</h3>
            <p className="modal-subtitle">Step {step} of 2 — {step === 1 ? "Card Details" : "Perks & Limits"}</p>
          </div>
          <button className="modal-close" onClick={onClose}><X className="h-4 w-4" /></button>
        </div>

        {/* Progress bar */}
        <div className="modal-progress-track">
          <div className="modal-progress-fill" style={{ width: step === 1 ? "50%" : "100%" }} />
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="modal-body">
              <div className="form-group">
                <label className="form-label">Card Name *</label>
                <Input placeholder="e.g. HDFC Regalia, Axis Magnus" value={form.name} onChange={e => handle("name", e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Bank / Issuer *</label>
                <Input placeholder="e.g. HDFC, ICICI, SBI" value={form.bank} onChange={e => handle("bank", e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Last 4 Digits *</label>
                <Input placeholder="1234" maxLength={4} value={form.number} onChange={e => handle("number", e.target.value.replace(/\D/g, ""))} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Network</label>
                  <select className="form-select" value={form.network} onChange={e => handle("network", e.target.value)}>
                    <option value="visa">Visa</option>
                    <option value="mastercard">Mastercard</option>
                    <option value="amex">Amex</option>
                    <option value="rupay">RuPay</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Card Color</label>
                  <div className="color-picker">
                    {(Object.entries(CARD_COLORS) as [CardColor, { bg: string }][]).map(([c, t]) => (
                      <button
                        key={c}
                        className={cn("color-dot", form.color === c && "active")}
                        style={{ background: t.bg }}
                        onClick={() => handle("color", c)}
                        title={c}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <Button className="w-full mt-2" onClick={() => setStep(2)} disabled={!form.name || !form.bank || form.number.length < 4}>
                Next →
              </Button>
            </motion.div>
          ) : (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="modal-body">
              <div className="form-group">
                <label className="form-label">Credit Limit (₹)</label>
                <Input placeholder="e.g. 500000" type="number" value={form.limit} onChange={e => handle("limit", e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Card Perks / Benefits</label>
                <Input placeholder="e.g. lounge, hotel, dining, fuel, travel, cashback" value={form.perks} onChange={e => handle("perks", e.target.value)} />
                <p className="form-hint">Comma-separated keywords. Used to personalize your benefit suggestions.</p>
              </div>

              {/* Perk chip suggestions */}
              <div className="perk-chips">
                {["lounge", "hotel", "dining", "fuel", "shopping", "travel", "cashback"].map(p => (
                  <button
                    key={p}
                    className={cn("perk-chip", form.perks.toLowerCase().includes(p) && "active")}
                    onClick={() => {
                      const existing = form.perks ? form.perks.split(",").map(s => s.trim()) : [];
                      if (!existing.map(s => s.toLowerCase()).includes(p)) {
                        handle("perks", [...existing, p].join(", "));
                      }
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>

              {/* Card preview */}
              <div style={{ background: CARD_COLORS[form.color].bg, borderRadius: "0.75rem", padding: "1rem", boxShadow: CARD_COLORS[form.color].shadow }}>
                <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.7rem", letterSpacing: "0.1em" }}>PREVIEW</p>
                <p style={{ color: "#fff", fontWeight: 700, fontSize: "1rem", marginTop: "0.25rem" }}>{form.name || "Card Name"}</p>
                <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.8rem" }}>{form.bank || "Bank"} · •••• {form.number || "####"}</p>
              </div>

              <div className="form-row mt-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>← Back</Button>
                <Button className="flex-1" onClick={submit}>Add Card</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CreditPage() {
  const { monthlyIncome, monthlyExpenses, balance, transactions, goals } = useFinance();
  const [currentScore, setCurrentScore] = useState<string>("720");
  const [utilization, setUtilization] = useState<string>("45");
  const [simulationActive, setSimulationActive] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [cards, setCards] = useState<UserCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<UserCard | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("finora_credit_cards");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCards(parsed);
        if (parsed.length > 0) setSelectedCard(parsed[0]);
      } catch (e) {}
    }
  }, []);

  const scoreNum = Number(currentScore);
  const utilNum = Number(utilization);

  let scoreCategory = "Poor";
  let scoreColor = "text-destructive";
  if (scoreNum >= 750) { scoreCategory = "Excellent"; scoreColor = "text-emerald-500"; }
  else if (scoreNum >= 700) { scoreCategory = "Good"; scoreColor = "text-blue-500"; }
  else if (scoreNum >= 650) { scoreCategory = "Fair"; scoreColor = "text-amber-500"; }

  const targetUtil = 10;
  const utilDiff = Math.max(0, utilNum - targetUtil);
  const estimatedImprovement = Math.round(utilDiff * 1.5);
  const newEstimatedScore = Math.min(850, scoreNum + estimatedImprovement);

  // Dynamic Insights based on in-app data
  const monthlySurplus = monthlyIncome - monthlyExpenses;
  const generatedInsights = [];
  
  if (balance > 100000) {
    generatedInsights.push(`You have a healthy liquid balance of ${formatCurrency(balance)}. Consider making a lump-sum payment just before your statement generation date to instantly drop reported utilization.`);
  } else if (monthlySurplus > 0) {
    generatedInsights.push(`You have a monthly surplus of ${formatCurrency(monthlySurplus)}. Redirecting just 50% (${formatCurrency(monthlySurplus / 2)}) towards an extra mid-cycle card payment will naturally suppress your utilization.`);
  } else {
    generatedInsights.push(`Your budget is running tight. Shift everyday spending to debit or UPI instead of your credit card to naturally keep utilization below 10%.`);
  }

  // Spending insight
  const expensesByCategory = transactions
    .filter(t => t.type === "expense")
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const topCategory = Object.entries(expensesByCategory).sort(([, a], [, b]) => b - a)[0];
  if (topCategory && topCategory[1] > 2000) {
    generatedInsights.push(`Your highest expense is ${topCategory[0]} (${formatCurrency(topCategory[1])}). If you route this through your card to earn points, pay it off immediately in the banking app so it doesn't inflate your end-of-month utilization.`);
  }

  // Goals insight
  if (goals.length > 0 && newEstimatedScore > scoreNum) {
    const nextGoal = goals.sort((a, b) => new Date(a.target_date).getTime() - new Date(b.target_date).getTime())[0];
    if (nextGoal) {
      generatedInsights.push(`Boosting your score to ${newEstimatedScore} can help you secure significantly lower interest rates if you ever need a loan to achieve your "${nextGoal.name}" goal faster!`);
    }
  }

  generatedInsights.push(`Pro Tip: Keep the cash you would have spent in a liquid mutual fund earning 7% annual interest, then pay off the exact credit card bill 2 days before the due date. You earn interest on the bank's money!`);

  const addCard = (card: UserCard) => {
    setCards(prev => {
      const newCards = [...prev, card];
      localStorage.setItem("finora_credit_cards", JSON.stringify(newCards));
      return newCards;
    });
    setSelectedCard(card);
  };

  const benefits = selectedCard ? getBenefitsForCard(selectedCard) : [];

  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Credit Cards</h2>
          <p className="text-muted-foreground">Manage cards, score & unlock maximum benefits.</p>
        </div>
        <Button id="add-credit-card-btn" className="gap-2" onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4" /> Add Credit Card
        </Button>
      </div>

      {/* ── Credit Score + Simulator ─────────────────────────────────────────── */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-1 border-primary/20">
          <CardHeader>
            <CardTitle>Credit Score</CardTitle>
            <CardDescription>Enter your score for insights.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Credit Score (300–850)</label>
              <Input type="number" placeholder="720" value={currentScore}
                onChange={e => { setCurrentScore(e.target.value); setSimulationActive(false); }}
                min={300} max={850}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Credit Utilization (%)</label>
              <Input type="number" placeholder="45" value={utilization}
                onChange={e => { setUtilization(e.target.value); setSimulationActive(false); }}
                min={0} max={100}
              />
            </div>
            <div className="pt-4 flex flex-col items-center justify-center p-6 border rounded-xl bg-card/50">
              <span className="text-sm text-muted-foreground">Your Score</span>
              <span className={cn("text-5xl font-bold mt-2", scoreColor)}>{scoreNum}</span>
              <span className={cn("text-sm font-medium mt-1 uppercase tracking-wider", scoreColor)}>{scoreCategory}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" /> Improvement Simulator
            </CardTitle>
            <CardDescription>See how reducing utilization boosts your score.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {utilNum > 30 ? (
              <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive flex gap-3">
                <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold">High Utilization Alert</h4>
                  <p className="text-sm mt-1">Your utilization is {utilNum}%. Keep it below 30% for a healthier score.</p>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 flex gap-3">
                <ShieldCheck className="h-5 w-5 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold">Good Utilization</h4>
                  <p className="text-sm mt-1">Your utilization is {utilNum}%. Great for your credit score!</p>
                </div>
              </div>
            )}
            <Button onClick={() => setSimulationActive(true)} variant="outline" className="w-full">
              Simulate dropping utilization to 10%
            </Button>
            {simulationActive && utilNum > 10 && (
              <div className="p-6 rounded-xl border border-primary/20 bg-primary/5 space-y-4 animate-in fade-in zoom-in duration-300">
                <h4 className="font-semibold text-lg text-primary text-center">Simulation Results</h4>
                <div className="grid grid-cols-3 gap-4 text-center items-center">
                  <div>
                    <span className="text-sm text-muted-foreground block">Current</span>
                    <span className="text-2xl font-bold">{scoreNum}</span>
                  </div>
                  <div>
                    <span className="text-primary font-bold">+{estimatedImprovement} pts</span>
                    <hr className="border-t-2 border-primary/50 my-1 mx-4" />
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground block">Estimated</span>
                    <span className="text-3xl font-bold text-emerald-500">{newEstimatedScore}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-border space-y-3">
                  <h5 className="text-sm font-semibold flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-violet-400" /> 
                    How to hit 10% based on your data:
                  </h5>
                  <ul className="space-y-2">
                    {generatedInsights.map((insight, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <p className="text-xs text-center text-muted-foreground/60 pt-2 pb-1">
                  *Estimate only. Actual results depend on your credit bureau model.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── My Cards ─────────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">My Cards</h3>
          <button className="add-card-inline-btn" onClick={() => setShowModal(true)}>
            <Plus className="h-3.5 w-3.5" /> Add Card
          </button>
        </div>

        {cards.length === 0 ? (
          <div className="empty-cards-state" onClick={() => setShowModal(true)}>
            <div className="empty-cards-icon">
              <CreditCard className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground font-medium">No cards added yet</p>
            <p className="text-sm text-muted-foreground/70">Add your credit cards to unlock personalized benefit tips</p>
            <Button variant="outline" size="sm" className="mt-3 gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Add Your First Card
            </Button>
          </div>
        ) : (
          <div className="cards-grid">
            {cards.map(card => (
              <CreditCardVisual key={card.id} card={card} selected={selectedCard?.id === card.id} onClick={() => setSelectedCard(card)} />
            ))}
            {/* Add new card slot */}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => setShowModal(true)} className="add-card-slot">
              <Plus className="h-6 w-6 text-muted-foreground/50" />
              <span className="text-xs text-muted-foreground/60 mt-1">Add Card</span>
            </motion.div>
          </div>
        )}
      </div>

      {/* ── Smart Benefits Section ────────────────────────────────────────────── */}
      {selectedCard && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card className="border-primary/15">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-violet-400" />
                <CardTitle>Where to Use Your {selectedCard.name}</CardTitle>
              </div>
              <CardDescription>
                Smart tips to get maximum perks from your {selectedCard.bank} card.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="benefits-grid">
                {benefits.map((b, i) => {
                  const Icon = b.icon;
                  const color = TAG_COLORS[b.tagColor] ?? "#3b82f6";
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: i * 0.05 }}
                      className="benefit-card"
                      style={{ borderColor: `${color}22` }}
                    >
                      <div className="benefit-card-top">
                        <div className="benefit-icon-wrap" style={{ background: `${color}18`, color }}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="benefit-tag" style={{ background: `${color}20`, color }}>{b.tag}</span>
                      </div>
                      <h4 className="benefit-category">{b.category}</h4>
                      <p className="benefit-desc">{b.description}</p>
                      <div className="benefit-perk">
                        <ChevronRight className="h-3.5 w-3.5 shrink-0" style={{ color }} />
                        <span>{b.benefit}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Bottom tip */}
              <div className="benefit-footer-tip">
                <Star className="h-4 w-4 text-amber-400 shrink-0" />
                <p className="text-sm text-muted-foreground">
                  <span className="text-foreground font-medium">Pro Tip:</span> Always pay the full outstanding amount before the due date to avoid interest charges that negate your benefits.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ── Smart Spend Optimizer ─────────────────────────────────────────────── */}
      {selectedCard && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
          <Card className="border-emerald-500/15">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-emerald-400" />
                  <CardTitle>Smart Spend Optimizer</CardTitle>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Based on your budget
                </span>
              </div>
              <CardDescription>
                Where to swipe your <strong>{selectedCard.name}</strong> based on your real spending patterns — to earn maximum reward points &amp; unlock perks.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SpendOptimizer card={selectedCard} />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ── General Tips (no card selected but cards exist) ───────────────────── */}
      {cards.length > 0 && !selectedCard && (
        <div className="select-card-prompt">
          <CreditCard className="h-5 w-5 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Select a card above to see personalized benefit tips</p>
        </div>
      )}

      {/* ── Add Card Modal ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showModal && <AddCardModal onClose={() => setShowModal(false)} onAdd={addCard} />}
      </AnimatePresence>
    </div>
  );
}
