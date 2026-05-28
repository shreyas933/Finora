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
  ChevronRight, ChevronDown, Sparkles, Zap, TrendingDown, Home, Car, Dumbbell,
  Tv, Stethoscope, GraduationCap, BarChart3, Wallet,
  Landmark, Coins, Trash2, CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────
type WalletItemType = "credit" | "debit";
type CardNetwork = "visa" | "mastercard" | "amex" | "rupay";
type CardColor = "purple" | "blue" | "gold" | "graphite" | "green" | "teal" | "orange";

interface WalletItem {
  id: string;
  type: WalletItemType;
  name: string;        // e.g. "HDFC Regalia", "SBI Platinum Debit"
  bank: string;        // e.g. "HDFC Bank", "SBI"
  number: string;      // Last 4 digits
  network: CardNetwork;
  color: CardColor;
  limit?: string;      // Only for credit cards
  perks: string[];     // e.g. lounge, dining, fuel
  billingDate?: string; // Statement date (e.g. "12")
  linkedAccount?: string; // For Debit Cards, e.g. "HDFC Savings Account"
}

interface BenefitScenario {
  icon: React.ElementType;
  category: string;
  description: string;
  benefit: string;
  tag: string;
  tagColor: string;
}



// ─── Static benefit suggestions per perk keywords ────────────────────────────
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
  debit: [
    { icon: Coins, category: "ATM & POS", description: "Direct bank withdrawals", benefit: "Direct bank debit, 0% debt creation", tag: "ZERO DEBT", tagColor: "emerald" },
  ]
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
  teal:     { bg: "linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)", text: "#fff", shadow: "0 8px 32px rgba(20,184,166,0.35)" },
  orange:   { bg: "linear-gradient(135deg, #c2410c 0%, #f97316 100%)", text: "#fff", shadow: "0 8px 32px rgba(249,115,22,0.35)" },
};

const TAG_COLORS: Record<string, string> = {
  emerald: "#10b981", blue: "#3b82f6", amber: "#f59e0b", purple: "#8b5cf6",
  rose: "#f43f5e", orange: "#f97316", yellow: "#eab308", sky: "#0ea5e9", teal: "#14b8a6",
};

// ─── Category → Tip Mapping ──────────────────────────────────────────────────
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

const DEFAULT_TIP: CategoryTip = {
  icon: Star, color: "#eab308", label: "General Spend",
  perk: "Earn reward points on every transaction",
  pointsMultiplier: "1x",
  platforms: ["Any merchant", "POS terminals"],
  idealPerk: "cashback",
};

// Helper to derive benefits for item
function getBenefitsForWalletItem(item: WalletItem): BenefitScenario[] {
  const found: BenefitScenario[] = [];
  const seen = new Set<string>();

  if (item.type === "debit" && PERK_BENEFITS.debit) {
    found.push(...PERK_BENEFITS.debit);
  }

  for (const perk of item.perks) {
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

// Helper to find best wallet card
function findOptimalWalletItemForCategory(category: string, items: WalletItem[]): WalletItem | null {
  if (items.length === 0) return null;
  const tip = CATEGORY_TIPS[category] ?? DEFAULT_TIP;
  const idealPerk = tip.idealPerk.toLowerCase();
  
  // 1. Search credit cards with matching perks first (max rewards)
  const matchCredit = items.find(i => i.type === "credit" && i.perks.some(p => p.toLowerCase().includes(idealPerk)));
  if (matchCredit) return matchCredit;
  
  // 2. Search debit cards with matching perks
  const matchDebit = items.find(i => i.type === "debit" && i.perks.some(p => p.toLowerCase().includes(idealPerk)));
  if (matchDebit) return matchDebit;

  // 3. Default to first credit card
  const firstCredit = items.find(i => i.type === "credit");
  if (firstCredit) return firstCredit;
  
  // 4. Fallback to first debit or anything else available
  const firstDebit = items.find(i => i.type === "debit");
  if (firstDebit) return firstDebit;

  return items[0];
}

// ─── Card Efficiency & Max Rewards Analyzer ──────────────────────────────────
function WalletEfficiencyAnalyzer({ items }: { items: WalletItem[] }) {
  const { transactions } = useFinance();

  const categorySpend: Record<string, number> = {};
  for (const tx of transactions) {
    if (tx.type === "expense") {
      categorySpend[tx.category] = (categorySpend[tx.category] ?? 0) + tx.amount;
    }
  }

  const totalSpend = Object.values(categorySpend).reduce((a, b) => a + b, 0);
  const topCategories = Object.entries(categorySpend)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  if (topCategories.length === 0 || items.length === 0) {
    return (
      <div className="spend-optimizer-empty">
        <BarChart3 className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">Add transaction data and wallet cards to generate your rewards optimizer report.</p>
      </div>
    );
  }

  let matchedCategories = 0;
  topCategories.forEach(([category]) => {
    const tip = CATEGORY_TIPS[category] ?? DEFAULT_TIP;
    const idealPerk = tip.idealPerk.toLowerCase();
    const hasPerkMatch = items.some(item => 
      item.perks.some(p => p.toLowerCase().includes(idealPerk))
    );
    if (hasPerkMatch) matchedCategories++;
  });

  const efficiencyScore = Math.round((matchedCategories / Math.min(topCategories.length, 5)) * 100);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center p-5 rounded-2xl bg-slate-900/60 border border-emerald-500/20 backdrop-blur-xl">
        <div className="flex flex-col items-center md:items-start text-center md:text-left gap-1">
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Card Efficiency</span>
          <span className="text-3xl font-extrabold text-white flex items-center gap-1.5">
            {efficiencyScore}% <span className="text-xs font-semibold text-emerald-400">Optimal</span>
          </span>
          <p className="text-xs text-muted-foreground">Rating how well you route spends to maximize perks.</p>
        </div>
        
        <div className="flex justify-center items-center py-2">
          <div className="w-full max-w-[200px] h-3 bg-slate-800 rounded-full overflow-hidden border border-white/5 relative">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${efficiencyScore}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
            />
          </div>
        </div>

        <div className="text-center md:text-right">
          <span className="text-xs text-muted-foreground block font-medium">Estimated Monthly Spends</span>
          <span className="text-2xl font-bold text-emerald-400">{formatCurrency(totalSpend)}</span>
          <span className="text-[10px] text-muted-foreground block">Mapped across {topCategories.length} main categories</span>
        </div>
      </div>

      <div className="spend-optimizer-list">
        {topCategories.map(([category, amount], i) => {
          const tip = CATEGORY_TIPS[category] ?? DEFAULT_TIP;
          const Icon = tip.icon;
          const pct = totalSpend > 0 ? (amount / totalSpend) * 100 : 0;
          
          const bestItem = findOptimalWalletItemForCategory(category, items);
          const hasIdealPerk = bestItem ? bestItem.perks.some(p => p.toLowerCase().includes(tip.idealPerk.toLowerCase())) : false;
          
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
              <div className="spend-opt-left">
                <div className="spend-opt-icon" style={{ background: `${tip.color}18`, color: tip.color }}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="spend-opt-info">
                  <div className="spend-opt-top-row">
                    <span className="spend-opt-label">{tip.label}</span>
                    {hasIdealPerk && (
                      <span className="spend-opt-match-badge">
                        <CheckCircle2 className="h-2.5 w-2.5" /> Best Route
                      </span>
                    )}
                  </div>
                  <div className="spend-bar-track">
                    <div className="spend-bar-fill" style={{ width: `${Math.min(100, pct)}%`, background: tip.color }} />
                  </div>
                  <div className="spend-opt-platforms">
                    {tip.platforms.slice(0, 3).map(p => (
                      <span key={p} className="platform-chip">{p}</span>
                    ))}
                  </div>
                </div>
              </div>

              {bestItem ? (
                <div className="spend-opt-right">
                  <span className="spend-opt-amount">{formatCurrency(amount)}</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-xs px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/90 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: CARD_COLORS[bestItem.color].bg }} />
                      {bestItem.name}
                    </span>
                  </div>
                  <div className="spend-opt-points mt-1">
                    <span className="points-multiplier" style={{ color: tip.color }}>{tip.pointsMultiplier}</span>
                    <span className="points-label">≈ {estimatedPoints.toLocaleString("en-IN")} pts</span>
                  </div>
                  <span className="spend-opt-perk font-medium text-[10px]" style={{ color: tip.color }}>
                    {hasIdealPerk ? `Unlocks: ${tip.perk}` : "Unlocks standard rewards"}
                  </span>
                </div>
              ) : (
                <div className="spend-opt-right text-muted-foreground/60 text-xs py-2">
                  No cards matched.
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="spend-opt-footer bg-slate-900/40 border border-slate-800">
        <TrendingUp className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-normal">
          <strong>Maximize Rewards Tip:</strong> Routing these top spending categories correctly can earn you up to <strong>{Math.round(totalSpend * 3).toLocaleString("en-IN")}</strong> extra reward points every billing cycle. Keep utilization low by clearing the credit outstanding immediately using bank balances!
        </p>
      </div>
    </div>
  );
}

// ─── Universal Card Visual Card ──────────────────────────────────────────────
interface WalletItemVisualProps {
  item: WalletItem;
  selected: boolean;
  onClick: () => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

function WalletItemVisual({ item, selected, onClick, onDelete }: WalletItemVisualProps) {
  const theme = CARD_COLORS[item.color];
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.015 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn("credit-card-visual", item.type, selected && "selected")}
      style={{ background: theme.bg, boxShadow: selected ? theme.shadow : "0 4px 16px rgba(0,0,0,0.3)" }}
    >
      <div className="flex justify-between items-center w-full">
        <div className="flex items-center gap-1.5">
          {item.type === "debit" ? (
            <Landmark className="h-5 w-5 text-white/90" />
          ) : (
            <div className="cc-chip" />
          )}
          <span className="text-[10px] font-bold tracking-widest text-white/70 uppercase">
            {item.type}
          </span>
        </div>
        <button
          onClick={(e) => onDelete(item.id, e)}
          className="p-1 rounded bg-black/20 hover:bg-red-500/20 hover:text-red-400 text-white/50 transition cursor-pointer"
          title={`Delete ${item.name}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="cc-network">
        {item.network.toUpperCase()}
      </div>

      <div className="cc-number">
        •••• •••• •••• {item.number}
      </div>

      <div className="cc-bottom">
        <div>
          <div className="cc-label">
            {item.type === "credit" ? "Issuer Bank" : "Debit Source"}
          </div>
          <div className="cc-value">{item.bank}</div>
        </div>
        <div className="text-right">
          <div className="cc-label">Card Name</div>
          <div className="cc-value">{item.name}</div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Universal Add Card Modal ────────────────────────────────────────────────
interface AddWalletItemModalProps {
  onClose: () => void;
  onAdd: (item: WalletItem) => void;
}

function AddWalletItemModal({ onClose, onAdd }: AddWalletItemModalProps) {
  const [form, setForm] = useState({
    type: "credit" as WalletItemType,
    name: "", bank: "", number: "", network: "visa" as CardNetwork,
    color: "blue" as CardColor, limit: "", perks: "", billingDate: "15",
    linkedAccount: ""
  });
  const [step, setStep] = useState(1);

  const handle = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = () => {
    if (!form.name || !form.bank) return;
    const item: WalletItem = {
      id: Date.now().toString(),
      type: form.type,
      name: form.name,
      bank: form.bank,
      number: form.number.slice(-4),
      network: form.network,
      color: form.color,
      limit: form.type === "credit" ? form.limit : undefined,
      perks: form.perks.split(",").map(p => p.trim()).filter(Boolean),
      billingDate: form.type === "credit" ? form.billingDate : undefined,
      linkedAccount: form.type === "debit" ? (form.linkedAccount || "Primary Account") : undefined
    };
    onAdd(item);
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
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Add Card to Wallet</h3>
            <p className="modal-subtitle">Step {step} of 2 — {step === 1 ? "Select Card Type" : "Enter Card Details"}</p>
          </div>
          <button className="modal-close" onClick={onClose}><X className="h-4 w-4" /></button>
        </div>

        <div className="modal-progress-track">
          <div className="modal-progress-fill" style={{ width: step === 1 ? "50%" : "100%" }} />
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="modal-body">
              <label className="form-label font-semibold text-white/90">What card type would you like to add?</label>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  className={cn("p-6 rounded-xl border flex flex-col items-center justify-center gap-3 cursor-pointer transition-all", 
                    form.type === "credit" ? "border-primary bg-primary/10 text-white" : "border-border bg-slate-900 text-muted-foreground hover:bg-slate-800"
                  )}
                  onClick={() => handle("type", "credit")}
                >
                  <CreditCard className="h-8 w-8" />
                  <span className="text-xs font-bold uppercase tracking-wider">Credit Card</span>
                </button>

                <button
                  className={cn("p-6 rounded-xl border flex flex-col items-center justify-center gap-3 cursor-pointer transition-all", 
                    form.type === "debit" ? "border-primary bg-primary/10 text-white" : "border-border bg-slate-900 text-muted-foreground hover:bg-slate-800"
                  )}
                  onClick={() => handle("type", "debit")}
                >
                  <Landmark className="h-8 w-8" />
                  <span className="text-xs font-bold uppercase tracking-wider">Debit Card</span>
                </button>
              </div>

              <div className="pt-3">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Integrating your credit and debit cards allows Finora's **Rewards Optimizer** to automatically recommend the absolute best card to swipe at various stores.
                </p>
              </div>

              <Button className="w-full mt-4 cursor-pointer" onClick={() => setStep(2)}>
                Next: Enter Card Details →
              </Button>
            </motion.div>
          ) : (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="modal-body">
              <div className="form-group">
                <label className="form-label">Card Name *</label>
                <Input placeholder="e.g. HDFC Regalia, Axis Magnus, SBI Platinum" value={form.name} onChange={e => handle("name", e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Bank / Issuer *</label>
                <Input placeholder="e.g. HDFC, ICICI, SBI" value={form.bank} onChange={e => handle("bank", e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Last 4 Digits *</label>
                <Input 
                  placeholder="1234" 
                  maxLength={4} 
                  value={form.number} 
                  onChange={e => handle("number", e.target.value.replace(/\D/g, ""))} 
                />
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
                        type="button"
                        className={cn("color-dot", form.color === c && "active")}
                        style={{ background: t.bg }}
                        onClick={() => handle("color", c)}
                        title={c}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {form.type === "credit" ? (
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Credit Limit (₹)</label>
                    <Input placeholder="500000" type="number" value={form.limit} onChange={e => handle("limit", e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Billing Date (1–31)</label>
                    <Input placeholder="12" type="number" min={1} max={31} value={form.billingDate} onChange={e => handle("billingDate", e.target.value)} />
                  </div>
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">Linked Account Code / Name</label>
                  <Input placeholder="e.g. Savings Account xx89" value={form.linkedAccount} onChange={e => handle("linkedAccount", e.target.value)} />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Card Perks / Benefits</label>
                <Input placeholder="e.g. lounge, hotel, dining, fuel, shopping, travel, cashback" value={form.perks} onChange={e => handle("perks", e.target.value)} />
                <p className="form-hint">Comma-separated keywords. Unlocks reward calculations.</p>
              </div>

              <div className="perk-chips">
                {["lounge", "hotel", "dining", "fuel", "shopping", "travel", "cashback"].map(p => (
                  <button
                    key={p}
                    type="button"
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

              <div className="form-row mt-4">
                <Button variant="outline" className="flex-1 cursor-pointer" onClick={() => setStep(1)}>← Back</Button>
                <Button className="flex-1 cursor-pointer" onClick={submit} disabled={!form.name || !form.bank}>Add Card</Button>
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
  const [utilization, setUtilization] = useState<string>("30");
  const [simulationActive, setSimulationActive] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  // Wallet states
  const [items, setItems] = useState<WalletItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<WalletItem | null>(null);
  const [filterTab, setFilterTab] = useState<"all" | "credit" | "debit">("all");

  // Collapsible state for active card perks section
  const [isPerksExpanded, setIsPerksExpanded] = useState(true);

  // Load and migrate state
  useEffect(() => {
    const savedWallet = localStorage.getItem("finora_wallet_items");
    if (savedWallet) {
      try {
        const parsed = JSON.parse(savedWallet);
        // Strictly filter Credit and Debit cards only
        const filtered = parsed.filter((item: any) => item.type === "credit" || item.type === "debit");
        setItems(filtered);
        if (filtered.length > 0) setSelectedItem(filtered[0]);
        return;
      } catch (e) {}
    }

    // Default Seed focusing purely on Credit and Debit Cards
    const defaultSeed: WalletItem[] = [
      {
        id: "card-1",
        type: "credit",
        name: "HDFC Regalia",
        bank: "HDFC Bank",
        number: "4321",
        network: "visa",
        color: "gold",
        limit: "500000",
        perks: ["lounge", "dining", "travel", "shopping"],
        billingDate: "12"
      },
      {
        id: "card-2",
        type: "debit",
        name: "SBI Platinum Debit",
        bank: "SBI",
        number: "9876",
        network: "mastercard",
        color: "blue",
        perks: ["cashback", "fuel", "dining"],
        linkedAccount: "SBI Savings Account"
      }
    ];

    setItems(defaultSeed);
    setSelectedItem(defaultSeed[0]);
    localStorage.setItem("finora_wallet_items", JSON.stringify(defaultSeed));
  }, []);

  const scoreNum = Number(currentScore);

  const totalLimit = items
    .filter(i => i.type === "credit" && i.limit)
    .reduce((acc, i) => acc + Number(i.limit), 0);

  const isDynamicUtil = totalLimit > 0;
  const computedUtil = isDynamicUtil 
    ? Math.min(100, Math.round((monthlyExpenses / totalLimit) * 100))
    : Number(utilization);

  let scoreCategory = "Poor";
  let scoreColor = "text-destructive";
  let scoreColorHex = "#ef4444";
  if (scoreNum >= 750) { 
    scoreCategory = "Excellent"; 
    scoreColor = "text-emerald-500"; 
    scoreColorHex = "#10b981";
  } else if (scoreNum >= 700) { 
    scoreCategory = "Good"; 
    scoreColor = "text-blue-500"; 
    scoreColorHex = "#3b82f6";
  } else if (scoreNum >= 650) { 
    scoreCategory = "Fair"; 
    scoreColor = "text-amber-500"; 
    scoreColorHex = "#f59e0b";
  }

  const targetUtil = 10;
  const utilDiff = Math.max(0, computedUtil - targetUtil);
  const estimatedImprovement = Math.round(utilDiff * 1.5);
  const newEstimatedScore = Math.min(850, scoreNum + estimatedImprovement);

  const monthlySurplus = monthlyIncome - monthlyExpenses;
  const generatedInsights = [];

  const creditCards = items.filter(i => i.type === "credit");
  const debitCards = items.filter(i => i.type === "debit");

  if (isDynamicUtil) {
    if (computedUtil > 30) {
      generatedInsights.push(`High Card Utilization: Your dynamic utilization is ${computedUtil}% (₹${monthlyExpenses.toLocaleString("en-IN")} spent against ₹${totalLimit.toLocaleString("en-IN")} limits). Shift minor expenses to your ${debitCards[0]?.name || "Debit Card"} to instantly drop this below 30%!`);
    } else {
      generatedInsights.push(`Good job! Your card utilization is at a healthy ${computedUtil}%. Keeping utilization below 30% acts as a major catalyst for credit growth.`);
    }
  } else {
    if (Number(utilization) > 30) {
      generatedInsights.push(`Your credit utilization is high (${utilization}%). Keeping card outstanding below 30% helps secure lower loan rates.`);
    }
  }

  const billingCards = creditCards.filter(c => c.billingDate);
  if (billingCards.length > 0) {
    const card = billingCards[0];
    const bDay = Number(card.billingDate);
    if (!isNaN(bDay)) {
      generatedInsights.push(`Your statement for ${card.name} is printed on the ${bDay}th of each month. Pay off outstanding dues 3 days before this generation date to lower bureaus' reported utilization!`);
    }
  }

  if (balance > 100000 && creditCards.length > 0) {
    generatedInsights.push(`Liquid Surplus: You have ${formatCurrency(balance)} in bank balance. Directing some of this surplus to a mid-cycle card payment before your due date instantly builds excellent payment records.`);
  } else if (monthlySurplus > 0) {
    generatedInsights.push(`Savings Rate: Your monthly surplus is ${formatCurrency(monthlySurplus)}. Redirecting ₹${(monthlySurplus / 2).toLocaleString("en-IN")} towards cards before bills hit shields your credit record.`);
  }

  if (transactions.length > 0 && creditCards.length > 0) {
    const expensesByCategory = transactions
      .filter(t => t.type === "expense")
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    const topCategory = Object.entries(expensesByCategory).sort(([, a], [, b]) => b - a)[0];
    if (topCategory && topCategory[1] > 2000) {
      const bestMatch = findOptimalWalletItemForCategory(topCategory[0], items);
      if (bestMatch && bestMatch.type === "credit") {
        generatedInsights.push(`Your highest expense is ${topCategory[0]} (${formatCurrency(topCategory[1])}). Route this specifically through your ${bestMatch.name} Credit Card to unlock premium rewards.`);
      }
    }
  }

  if (generatedInsights.length < 3) {
    generatedInsights.push("Pro Tip: Clearing balances before the statement generation date reports as a pristine 0% utilization, protecting your profile.");
    generatedInsights.push("Maintain old credit accounts active. A longer credit duration history signals reliability to financial agencies.");
  }



  const addWalletItem = (item: WalletItem) => {
    setItems(prev => {
      const newItems = [...prev, item];
      localStorage.setItem("finora_wallet_items", JSON.stringify(newItems));
      return newItems;
    });
    setSelectedItem(item);
  };

  const deleteWalletItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setItems(prev => {
      const filtered = prev.filter(item => item.id !== id);
      localStorage.setItem("finora_wallet_items", JSON.stringify(filtered));
      if (selectedItem?.id === id) {
        setSelectedItem(filtered.length > 0 ? filtered[0] : null);
      }
      return filtered;
    });
  };

  const filteredItems = items.filter(item => {
    if (filterTab === "all") return true;
    return item.type === filterTab;
  });

  const benefits = selectedItem ? getBenefitsForWalletItem(selectedItem) : [];
  const targetOffset = 440 - (440 * (scoreNum - 300)) / 550;

  return (
    <div className="space-y-8 pb-8 relative">

      {/* Header and Add Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Digital Wallet</h2>
          <p className="text-muted-foreground">Manage cards, track credit score, and optimize your reward efficiency.</p>
        </div>
        <Button id="add-wallet-item-btn" className="gap-2 cursor-pointer" onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4" /> Add Card
        </Button>
      </div>

      {/* ── Credit Score Radial Checker + Simulator ─────────────────────────── */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-1 border-primary/20 bg-card/60 backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Credit Profile</CardTitle>
            <CardDescription>Configure score for personalized analysis.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Credit Score (300–850)</label>
              <Input type="number" placeholder="720" value={currentScore}
                onChange={e => { setCurrentScore(e.target.value); setSimulationActive(false); }}
                min={300} max={850}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Credit Utilization (%) {isDynamicUtil && <span className="text-[10px] text-emerald-400 font-semibold">(Calculated)</span>}
              </label>
              <Input type="number" placeholder="30" value={computedUtil.toString()}
                onChange={e => { setUtilization(e.target.value); setSimulationActive(false); }}
                disabled={isDynamicUtil}
                className={cn(isDynamicUtil && "bg-slate-900 border-emerald-500/30 text-emerald-400 font-bold opacity-90 cursor-not-allowed")}
              />
              {isDynamicUtil && (
                <span className="text-[10px] text-muted-foreground block leading-tight">
                  Auto-calculated from total cards limit (₹{totalLimit.toLocaleString("en-IN")}) and monthly expenses (₹{monthlyExpenses.toLocaleString("en-IN")}).
                </span>
              )}
            </div>

            <div className="score-circle-container py-4 flex flex-col items-center justify-center relative">
              <svg width="160" height="160" viewBox="0 0 160 160" className="h-40 w-40 transform -rotate-90 overflow-visible">
                <circle cx="80" cy="80" r="70" stroke="var(--border)" strokeWidth="6" fill="transparent" />
                <motion.circle 
                  cx="80" cy="80" r="70" 
                  stroke={scoreColorHex} strokeWidth="8" fill="transparent"
                  strokeDasharray="440" 
                  initial={{ strokeDashoffset: 440 }}
                  animate={{ strokeDashoffset: targetOffset }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  strokeLinecap="round" 
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-4xl font-extrabold text-white tracking-tight">{scoreNum}</span>
                <span className={cn("text-[10px] font-bold mt-1 uppercase tracking-widest", scoreColor)}>{scoreCategory}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 bg-card/60 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" /> Profile Simulator & Improvements
            </CardTitle>
            <CardDescription>Understand how payment actions and utilization boost your profile.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {computedUtil > 30 ? (
              <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive flex gap-3">
                <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold">High Card Utilization Detected</h4>
                  <p className="text-xs mt-1">Your utilization of {computedUtil}% is above the recommended 30%. This flags credit bureaus of potential cash flow constraints and lowers your score.</p>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 flex gap-3">
                <ShieldCheck className="h-5 w-5 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold">Healthy Card Utilization</h4>
                  <p className="text-xs mt-1">Your card utilization is at {computedUtil}%. This pristine tier signals perfect cash flow stability to bureaus.</p>
                </div>
              </div>
            )}
            
            <Button onClick={() => setSimulationActive(true)} variant="outline" className="w-full cursor-pointer hover:bg-slate-800 transition">
              Simulate dropping utilization to 10%
            </Button>

            {simulationActive && computedUtil > 10 && (
              <div className="p-6 rounded-xl border border-primary/20 bg-primary/5 space-y-4 animate-in fade-in zoom-in duration-300">
                <h4 className="font-semibold text-lg text-primary text-center">Simulated Impact Summary</h4>
                <div className="grid grid-cols-3 gap-4 text-center items-center">
                  <div>
                    <span className="text-xs text-muted-foreground block">Current Score</span>
                    <span className="text-2xl font-bold">{scoreNum}</span>
                  </div>
                  <div>
                    <span className="text-primary font-bold">+{estimatedImprovement} pts</span>
                    <hr className="border-t-2 border-primary/50 my-1 mx-4" />
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Simulated Score</span>
                    <span className="text-3xl font-extrabold text-emerald-500">{newEstimatedScore}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-border space-y-3">
                  <h5 className="text-sm font-semibold flex items-center gap-2 text-white">
                    <Sparkles className="h-4 w-4 text-violet-400" /> 
                    Actionable Improvement Plan (Based on your financial data):
                  </h5>
                  <ul className="space-y-2.5">
                    {generatedInsights.map((insight, idx) => (
                      <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2.5">
                        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-primary mt-0.5" />
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <p className="text-[10px] text-center text-muted-foreground/60 pt-2 pb-1 italic">
                  *This simulator uses standard models. Actual score outputs are determined by credit bureaus based on consolidated files.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── My Wallet Slider & Grid ─────────────────────────────────────────── */}
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" /> Wallet Cards
          </h3>
          
          <div className="flex p-1 bg-slate-900 border border-slate-800 rounded-lg">
            {(["all", "credit", "debit"] as const).map(tab => (
              <button
                key={tab}
                className={cn("px-3 py-1 text-xs font-semibold rounded-md capitalize transition cursor-pointer",
                  filterTab === tab ? "bg-primary text-white" : "text-muted-foreground hover:text-white"
                )}
                onClick={() => setFilterTab(tab)}
              >
                {tab === "all" ? "All Cards" : `${tab} Cards`}
              </button>
            ))}
          </div>
        </div>

        {items.length === 0 ? (
          <div className="empty-cards-state" onClick={() => setShowModal(true)}>
            <div className="empty-cards-icon">
              <Wallet className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground font-medium">Your card wallet is empty</p>
            <p className="text-xs text-muted-foreground/70">Add your Credit Cards and Debit Cards to start optimizing transaction rewards.</p>
            <Button variant="outline" size="sm" className="mt-3 gap-1.5 cursor-pointer">
              <Plus className="h-3.5 w-3.5" /> Set Up Wallet
            </Button>
          </div>
        ) : (
          <div className="cards-grid">
            {filteredItems.map(item => (
              <WalletItemVisual 
                key={item.id} 
                item={item} 
                selected={selectedItem?.id === item.id} 
                onClick={() => setSelectedItem(item)}
                onDelete={deleteWalletItem}
              />
            ))}
            
            <motion.div 
              whileHover={{ scale: 1.02 }} 
              whileTap={{ scale: 0.97 }} 
              onClick={() => setShowModal(true)} 
              className="add-card-slot cursor-pointer"
            >
              <Plus className="h-6 w-6 text-muted-foreground/50" />
              <span className="text-xs text-muted-foreground/60 mt-1 font-semibold">Add Card</span>
            </motion.div>
          </div>
        )}
      </div>

      {/* ── Active Card Perks and Smart Suggestions ────────────────────────────── */}
      {selectedItem && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card className="border-primary/15 bg-card/60 backdrop-blur-xl overflow-hidden">
            <CardHeader 
              className="cursor-pointer select-none" 
              onClick={() => setIsPerksExpanded(!isPerksExpanded)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-violet-400" />
                  <CardTitle>Where to use your {selectedItem.name}</CardTitle>
                </div>
                <motion.div
                  animate={{ rotate: isPerksExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                </motion.div>
              </div>
              <CardDescription className="mt-1">
                Points multiplier mappings &amp; premium benefits associated with this {selectedItem.type === "credit" ? "Credit Card" : "Debit Card"}.
              </CardDescription>
            </CardHeader>
            <AnimatePresence initial={false}>
              {isPerksExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                >
                  <CardContent className="border-t border-white/5 pt-6">
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
                            <div className="benefit-perk font-semibold">
                              <ChevronRight className="h-3.5 w-3.5 shrink-0" style={{ color }} />
                              <span>{b.benefit}</span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>

                    {selectedItem.type === "credit" && selectedItem.billingDate && (
                      <div className="mt-4 p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                        <div>
                          <h5 className="text-xs font-bold text-white uppercase tracking-wider">Statement Schedule</h5>
                          <p className="text-xs text-muted-foreground mt-1">
                            This card's billing cycle closes on the <strong>{selectedItem.billingDate}th</strong> of the month. Clearing outstanding balances 3 days before safeguards utilization records sent to bureaus.
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedItem.type === "debit" && selectedItem.linkedAccount && (
                      <div className="mt-4 p-4 rounded-xl border border-teal-500/20 bg-teal-500/5 flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-teal-400 shrink-0 mt-0.5" />
                        <div>
                          <h5 className="text-xs font-bold text-white uppercase tracking-wider">Debit Source Status</h5>
                          <p className="text-xs text-muted-foreground mt-1">
                            Linked to account <strong>{selectedItem.linkedAccount}</strong>. Transactions using this card will draw directly from liquid capital, ensuring zero interest charges and keeping utilization ratios clean.
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>
      )}



      {/* ── Transaction-Based Card Efficiency Optimizer ───────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
        <Card className="border-emerald-500/15 bg-card/60 backdrop-blur-xl">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-emerald-400" />
                <CardTitle>Card Efficiency &amp; Max Rewards Analyzer</CardTitle>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold uppercase tracking-wider">
                Dynamic Transaction Audit
              </span>
            </div>
            <CardDescription>
              Scans your real spending patterns to recommend exactly which card in your wallet yields the highest points waiver.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WalletEfficiencyAnalyzer items={items} />
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick select prompt */}
      {items.length > 0 && !selectedItem && (
        <div className="select-card-prompt text-muted-foreground">
          <Wallet className="h-5 w-5 opacity-40" />
          <p className="text-sm font-medium">Select a card above to view detailed perks, statement dates, and linked accounts.</p>
        </div>
      )}

      {/* Add Card Modal */}
      <AnimatePresence>
        {showModal && <AddWalletItemModal onClose={() => setShowModal(false)} onAdd={addWalletItem} />}
      </AnimatePresence>
    </div>
  );
}
