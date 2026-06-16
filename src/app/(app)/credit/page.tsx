"use client";

import { useState, useEffect, useMemo } from "react";
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


// ─── Payment Calendar Sub-component ──────────────────────────────────────────
interface PaymentCalendarSectionProps {
  items: WalletItem[];
  loggedPayments: Record<string, boolean>;
  togglePayment: (id: string) => void;
  formatCurrency: (val: number) => string;
  monthlyExpenses: number;
  totalLimit: number;
  computedUtil: number;
}

function PaymentCalendarSection({ 
  items, 
  loggedPayments, 
  togglePayment, 
  formatCurrency, 
  monthlyExpenses, 
  totalLimit, 
  computedUtil 
}: PaymentCalendarSectionProps) {
  const days = Array.from({ length: 30 }, (_, i) => i + 1);

  const statementDays: Record<number, WalletItem[]> = {};
  const dueDays: Record<number, WalletItem[]> = {};

  const creditCards = items.filter(i => i.type === "credit");

  creditCards.forEach(card => {
    if (card.billingDate) {
      const bDay = Number(card.billingDate);
      if (!isNaN(bDay) && bDay >= 1 && bDay <= 30) {
        if (!statementDays[bDay]) statementDays[bDay] = [];
        statementDays[bDay].push(card);

        const dDay = ((bDay + 20 - 1) % 30) + 1;
        if (!dueDays[dDay]) dueDays[dDay] = [];
        dueDays[dDay].push(card);
      }
    }
  });

  return (
    <div className="space-y-8">
      {/* 30-Day Calendar Grid */}
      <Card className="border-primary/20 bg-card/60 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-emerald-400" /> Payment & Statement Calendar
          </CardTitle>
          <CardDescription>
            Highlighted calendar dates for statements (S) and payment due dates (D) for your credit cards.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="overflow-x-auto pb-4 -mx-2 px-2 sm:mx-0 sm:px-0">
            <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-2 min-w-[320px]">
            {days.map(day => {
              const statementCards = statementDays[day] || [];
              const dueCards = dueDays[day] || [];
              const hasEvent = statementCards.length > 0 || dueCards.length > 0;

              return (
                <div 
                  key={day} 
                  className={cn(
                    "flex flex-col items-center justify-between p-2 rounded-xl border min-h-[70px] transition-all",
                    hasEvent 
                      ? "border-emerald-500/20 bg-[#0f172a]" 
                      : "border-white/5 bg-slate-900/40"
                  )}
                >
                  <span className="text-xs font-bold text-slate-400 self-start">{day}</span>
                  
                  <div className="w-full space-y-1 mt-1">
                    {statementCards.map(c => (
                      <div 
                        key={c.id} 
                        className="text-[9px] px-1.5 py-0.5 rounded text-white font-bold truncate text-center"
                        style={{ background: CARD_COLORS[c.color].bg }}
                        title={`${c.name} Statement Date`}
                      >
                        S: {c.name.split(" ")[0]}
                      </div>
                    ))}
                    {dueCards.map(c => {
                      const isPaid = loggedPayments[c.id];
                      return (
                        <div 
                          key={c.id} 
                          className={cn(
                            "text-[9px] px-1.5 py-0.5 rounded font-bold truncate text-center border",
                            isPaid 
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                              : "bg-red-500/10 border-red-500/30 text-red-400 animate-pulse"
                          )}
                          title={`${c.name} Payment Due`}
                        >
                          D: {c.name.split(" ")[0]}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          </div>

          <div className="flex gap-4 text-xs font-semibold text-slate-400 justify-center flex-wrap pt-2">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-amber-500" />
              <span>S = Statement Generation Date</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-red-500" />
              <span>D = Payment Due Date</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Credit Cards Billing Details & Payment Log */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-card/60 backdrop-blur-xl border-white/5">
          <CardHeader>
            <CardTitle className="text-lg">Billing Schedules & Payment Tracker</CardTitle>
            <CardDescription>Track monthly outstanding dues and check off payments.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {creditCards.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No credit cards added to calculate schedules.</p>
            ) : (
              <div className="space-y-3">
                {creditCards.map(card => {
                  const isPaid = loggedPayments[card.id];
                  const bDay = Number(card.billingDate) || 15;
                  const dDay = ((bDay + 20 - 1) % 30) + 1;

                  return (
                    <div 
                      key={card.id} 
                      className="flex items-center justify-between gap-4 p-4 rounded-xl border border-white/5 bg-slate-900/60"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: TAG_COLORS[card.color] || "#8b5cf6" }} />
                          <h4 className="text-xs font-bold text-white truncate">{card.name}</h4>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">
                            •••• {card.number}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                          Statement: <strong className="text-white">{bDay}th</strong> • Due Date: <strong className="text-white">{dDay}th</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        {isPaid ? (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Paid
                            </span>
                            <button 
                              onClick={() => togglePayment(card.id)} 
                              className="text-[10px] text-slate-500 hover:text-slate-300 underline font-semibold ml-1.5 cursor-pointer"
                            >
                              Undo
                            </button>
                          </div>
                        ) : (
                          <Button 
                            size="sm" 
                            className="bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs py-1 px-3 h-8 rounded-lg cursor-pointer"
                            onClick={() => togglePayment(card.id)}
                          >
                            Mark Paid
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Credit Utilization Card */}
        <Card className="bg-card/60 backdrop-blur-xl border-white/5">
          <CardHeader>
            <CardTitle className="text-lg">Consolidated Credit Utilization</CardTitle>
            <CardDescription>Your current revolving debt ratio against total credit limits.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-6 p-4 rounded-xl bg-slate-900/60 border border-white/5">
              <div className="flex flex-col items-center sm:items-start gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Limit</span>
                <span className="text-xl font-bold text-white font-mono">{formatCurrency(totalLimit)}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Current Utilization</span>
                <span className="text-xl font-bold text-emerald-400 font-mono">
                  {formatCurrency(monthlyExpenses)} ({computedUtil}%)
                </span>
              </div>

              <div className="relative w-28 h-28 flex items-center justify-center">
                <svg width="112" height="112" viewBox="0 0 112 112" className="transform -rotate-90">
                  <circle cx="56" cy="56" r="46" stroke="#1e293b" strokeWidth="6" fill="none" />
                  <circle 
                    cx="56" cy="56" r="46" 
                    stroke={computedUtil > 30 ? "#ef4444" : "#10b981"} 
                    strokeWidth="8" fill="none"
                    strokeDasharray="290"
                    strokeDashoffset={290 - (290 * computedUtil) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-xl font-black text-white font-mono">{computedUtil}%</span>
                  <span className={cn("text-[8px] font-black tracking-wider uppercase", computedUtil > 30 ? "text-red-400" : "text-emerald-400")}>
                    {computedUtil > 30 ? "High Risk" : "Healthy"}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-400">Bureau Target Ratio</span>
                <span className="text-emerald-400">&lt; 30%</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                <div 
                  className={cn("h-full rounded-full transition-all duration-500", computedUtil > 30 ? "bg-red-500" : "bg-emerald-500")}
                  style={{ width: `${computedUtil}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 leading-normal">
                Keeping your revolving utilization below 30% acts as a critical signal to credit reporting bureaus, proving perfect repayment safety and boosting scores.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
interface CreditViewProps {
  monthlyIncome: number;
  monthlyExpenses: number;
  balance: number;
  transactions: any[];
  goals: any[];
  currentScore: string;
  setCurrentScore: (s: string) => void;
  utilization: string;
  setUtilization: (u: string) => void;
  simulationActive: boolean;
  setSimulationActive: (active: boolean) => void;
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  activeSegment: "wallet" | "score" | "calendar";
  setActiveSegment: (seg: "wallet" | "score" | "calendar") => void;
  loggedPayments: Record<string, boolean>;
  togglePayment: (cardId: string) => void;
  items: WalletItem[];
  selectedItem: WalletItem | null;
  setSelectedItem: (item: WalletItem | null) => void;
  filterTab: "all" | "credit" | "debit";
  setFilterTab: (tab: "all" | "credit" | "debit") => void;
  isPerksExpanded: boolean;
  setIsPerksExpanded: (expanded: boolean) => void;
  totalLimit: number;
  isDynamicUtil: boolean;
  computedUtil: number;
  scoreCategory: string;
  scoreColor: string;
  scoreColorHex: string;
  estimatedImprovement: number;
  newEstimatedScore: number;
  generatedInsights: string[];
  creditCards: WalletItem[];
  debitCards: WalletItem[];
  filteredItems: WalletItem[];
  benefits: BenefitScenario[];
  targetOffset: number;
  addWalletItem: (item: WalletItem) => void;
  deleteWalletItem: (id: string, e: React.MouseEvent) => void;
}

// ─── Mobile slide-up bottom drawer ──────────────────────────────────────────
function MobileAddCardDrawer({ onClose, onAdd }: { onClose: () => void; onAdd: (item: WalletItem) => void }) {
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
    <div className="mobile-bottom-sheet-overlay" onClick={onClose}>
      <motion.div
        className="mobile-bottom-sheet-content"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 260 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="mobile-bottom-sheet-handle" />
        <div className="flex justify-between items-center mb-5">
          <div>
            <h3 className="text-base font-bold text-white">Add Card to Wallet</h3>
            <p className="text-[11px] text-slate-400">Step {step} of 2 — {step === 1 ? "Select Card Type" : "Card Details"}</p>
          </div>
          <button className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white" onClick={onClose}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="modal-progress-track mb-5 mx-0 bg-slate-800">
          <div className="modal-progress-fill" style={{ width: step === 1 ? "50%" : "100%" }} />
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div key="mstep1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <label className="text-xs font-semibold text-white/70 block">What card type would you like to add?</label>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  className={cn("p-5 rounded-xl border flex flex-col items-center justify-center gap-2 cursor-pointer transition-all", 
                    form.type === "credit" ? "border-primary bg-primary/15 text-white" : "border-white/5 bg-slate-900/60 text-slate-400 hover:bg-slate-800"
                  )}
                  onClick={() => handle("type", "credit")}
                >
                  <CreditCard className="h-6 w-6" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Credit Card</span>
                </button>

                <button
                  className={cn("p-5 rounded-xl border flex flex-col items-center justify-center gap-2 cursor-pointer transition-all", 
                    form.type === "debit" ? "border-primary bg-primary/15 text-white" : "border-white/5 bg-slate-900/60 text-slate-400 hover:bg-slate-800"
                  )}
                  onClick={() => handle("type", "debit")}
                >
                  <Landmark className="h-6 w-6" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Debit Card</span>
                </button>
              </div>

              <div className="pt-2">
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Integrating your credit and debit cards allows Finora's **Rewards Optimizer** to automatically recommend the absolute best card to swipe at various stores.
                </p>
              </div>

              <Button className="w-full mt-4 cursor-pointer" onClick={() => setStep(2)}>
                Next: Enter Card Details →
              </Button>
            </motion.div>
          ) : (
            <motion.div key="mstep2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3.5">
              <div className="form-group">
                <label className="form-label text-[11px]">Card Name *</label>
                <Input placeholder="e.g. HDFC Regalia, SBI Platinum" value={form.name} onChange={e => handle("name", e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label text-[11px]">Bank / Issuer *</label>
                <Input placeholder="e.g. HDFC, SBI" value={form.bank} onChange={e => handle("bank", e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label text-[11px]">Last 4 Digits *</label>
                <Input 
                  placeholder="1234" 
                  maxLength={4} 
                  value={form.number} 
                  onChange={e => handle("number", e.target.value.replace(/\D/g, ""))} 
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label text-[11px]">Network</label>
                  <select className="form-select bg-slate-900 border-white/10" value={form.network} onChange={e => handle("network", e.target.value)}>
                    <option value="visa">Visa</option>
                    <option value="mastercard">Mastercard</option>
                    <option value="amex">Amex</option>
                    <option value="rupay">RuPay</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label text-[11px]">Card Color</label>
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
                    <label className="form-label text-[11px]">Credit Limit (₹)</label>
                    <Input placeholder="500000" type="number" value={form.limit} onChange={e => handle("limit", e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label text-[11px]">Billing Date (1–31)</label>
                    <Input placeholder="12" type="number" min={1} max={31} value={form.billingDate} onChange={e => handle("billingDate", e.target.value)} />
                  </div>
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label text-[11px]">Linked Account Code / Name</label>
                  <Input placeholder="e.g. Savings Account xx89" value={form.linkedAccount} onChange={e => handle("linkedAccount", e.target.value)} />
                </div>
              )}

              <div className="form-group">
                <label className="form-label text-[11px]">Card Perks / Benefits</label>
                <Input placeholder="e.g. lounge, hotel, dining, fuel, shopping, travel, cashback" value={form.perks} onChange={e => handle("perks", e.target.value)} />
                <p className="form-hint text-[10px] text-slate-500">Comma-separated keywords.</p>
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

              <div className="form-row pt-2">
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

// ─── Mobile Layout Component ───────────────────────────────────────────────
function MobileCreditView({
  monthlyIncome,
  monthlyExpenses,
  balance,
  transactions,
  goals,
  currentScore,
  setCurrentScore,
  utilization,
  setUtilization,
  simulationActive,
  setSimulationActive,
  showModal,
  setShowModal,
  activeSegment,
  setActiveSegment,
  loggedPayments,
  togglePayment,
  items,
  selectedItem,
  setSelectedItem,
  filterTab,
  setFilterTab,
  isPerksExpanded,
  setIsPerksExpanded,
  totalLimit,
  isDynamicUtil,
  computedUtil,
  scoreCategory,
  scoreColor,
  scoreColorHex,
  estimatedImprovement,
  newEstimatedScore,
  generatedInsights,
  creditCards,
  debitCards,
  filteredItems,
  benefits,
  targetOffset,
  addWalletItem,
  deleteWalletItem,
}: CreditViewProps) {
  // Mobile timeline calculations
  const daysWithEvents = useMemo(() => {
    const events: { day: number; type: "statement" | "due"; card: WalletItem }[] = [];
    creditCards.forEach(card => {
      if (card.billingDate) {
        const bDay = Number(card.billingDate);
        if (!isNaN(bDay) && bDay >= 1 && bDay <= 30) {
          events.push({ day: bDay, type: "statement", card });
          
          const dDay = ((bDay + 20 - 1) % 30) + 1;
          events.push({ day: dDay, type: "due", card });
        }
      }
    });
    return events.sort((a, b) => a.day - b.day);
  }, [creditCards]);

  // Card efficiency analyzer calculations
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

  let matchedCategories = 0;
  topCategories.forEach(([category]) => {
    const tip = CATEGORY_TIPS[category] ?? DEFAULT_TIP;
    const idealPerk = tip.idealPerk.toLowerCase();
    const hasPerkMatch = items.some(item => 
      item.perks.some(p => p.toLowerCase().includes(idealPerk))
    );
    if (hasPerkMatch) matchedCategories++;
  });

  const efficiencyScore = topCategories.length > 0 
    ? Math.round((matchedCategories / Math.min(topCategories.length, 5)) * 100)
    : 0;

  const scoreNum = Number(currentScore);

  return (
    <div className="space-y-6 pb-20 relative px-1">
      {/* Compact Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-1.5">
            <Wallet className="text-violet-400 h-6 w-6" /> Digital Wallet
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">Track limits, credit score &amp; routing perks</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="p-2.5 rounded-xl bg-violet-600/10 text-violet-400 border border-violet-500/25 active:scale-95 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Touch-Friendly Sticky Selector */}
      <div className="sticky top-0 z-30 flex bg-[#0c1328]/95 backdrop-blur-md p-1 rounded-xl border border-white/5 w-full gap-1 shadow-inner">
        <button
          onClick={() => setActiveSegment("wallet")}
          className={cn(
            "flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer",
            activeSegment === "wallet"
              ? "bg-violet-600/20 text-violet-300 border border-violet-500/30"
              : "text-slate-400 border border-transparent"
          )}
        >
          <CreditCard className="h-3.5 w-3.5" />
          Cards
        </button>
        <button
          onClick={() => setActiveSegment("score")}
          className={cn(
            "flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer",
            activeSegment === "score"
              ? "bg-blue-600/20 text-blue-300 border border-blue-500/30"
              : "text-slate-400 border border-transparent"
          )}
        >
          <TrendingUp className="h-3.5 w-3.5" />
          Score
        </button>
        <button
          onClick={() => setActiveSegment("calendar")}
          className={cn(
            "flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer",
            activeSegment === "calendar"
              ? "bg-emerald-600/20 text-emerald-300 border border-emerald-500/30"
              : "text-slate-400 border border-transparent"
          )}
        >
          <Coins className="h-3.5 w-3.5" />
          Calendar
        </button>
      </div>

      {/* ── Mobile Tab 1: Cards & Perks ── */}
      {activeSegment === "wallet" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header controls for Carousel */}
          <div className="flex justify-between items-center px-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Swipe Card Deck</span>
            
            <div className="flex gap-1 p-0.5 bg-slate-900 border border-slate-800 rounded-lg">
              {(["all", "credit", "debit"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setFilterTab(tab)}
                  className={cn("px-2 py-0.5 text-[9px] font-bold rounded capitalize transition cursor-pointer",
                    filterTab === tab ? "bg-violet-600 text-white" : "text-slate-500"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {items.length === 0 ? (
            <div className="empty-cards-state py-8 border border-dashed border-white/10" onClick={() => setShowModal(true)}>
              <div className="empty-cards-icon h-12 w-12 rounded-xl">
                <Wallet className="h-5 w-5 text-slate-400" />
              </div>
              <p className="text-slate-300 font-semibold text-sm">Your card wallet is empty</p>
              <p className="text-[10px] text-slate-400 max-w-[240px]">Add your cards to map points calculations and sync statement generating days.</p>
              <Button variant="outline" size="sm" className="mt-2 text-xs gap-1.5 cursor-pointer">
                <Plus className="h-3.5 w-3.5" /> Add Card
              </Button>
            </div>
          ) : (
            <>
              {/* Snap Horizontal Carousel */}
              <div className="mobile-snap-carousel no-scrollbar -mx-4">
                {filteredItems.map(item => (
                  <div 
                    key={item.id} 
                    className={cn("mobile-card-wrapper", selectedItem?.id !== item.id && "inactive")}
                  >
                    <WalletItemVisual 
                      item={item} 
                      selected={selectedItem?.id === item.id} 
                      onClick={() => setSelectedItem(item)}
                      onDelete={deleteWalletItem}
                    />
                  </div>
                ))}
                
                <div 
                  onClick={() => setShowModal(true)} 
                  className="mobile-add-card-slot"
                >
                  <Plus className="h-5 w-5 text-slate-400" />
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold">Add Card</span>
                </div>
              </div>

              {/* Perks details container */}
              {selectedItem && (
                <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-4 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-white/5">
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">{selectedItem.name} Perks</h4>
                      <p className="text-[9px] text-slate-400 mt-0.5">{selectedItem.bank}</p>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">
                      •••• {selectedItem.number}
                    </span>
                  </div>

                  <div className="mobile-perks-list">
                    {benefits.map((b, i) => {
                      const Icon = b.icon;
                      const color = TAG_COLORS[b.tagColor] ?? "#3b82f6";
                      return (
                        <div key={i} className="mobile-perk-row" style={{ borderColor: `${color}15` }}>
                          <div className="p-1.5 rounded-lg shrink-0" style={{ background: `${color}12`, color }}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center">
                              <h5 className="text-[11px] font-bold text-white">{b.category}</h5>
                              <span className="text-[8px] px-1.5 py-0.2 rounded font-extrabold uppercase tracking-wider" style={{ background: `${color}15`, color }}>
                                {b.tag}
                              </span>
                            </div>
                            <p className="text-[9px] text-slate-400 mt-0.5">{b.description}</p>
                            <div className="flex items-center gap-1 mt-1 text-[9px] font-bold" style={{ color }}>
                              <ChevronRight className="h-3 w-3 shrink-0" />
                              <span>{b.benefit}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {selectedItem.type === "credit" && selectedItem.billingDate && (
                    <div className="p-3 rounded-xl border border-blue-500/10 bg-blue-500/5 flex items-start gap-2.5">
                      <AlertCircle className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-slate-400 leading-normal">
                        Billing generated on the <strong>{selectedItem.billingDate}th</strong>. Clear outstanding dues 3 days before this date to lower dynamic reported utilization.
                      </p>
                    </div>
                  )}

                  {selectedItem.type === "debit" && selectedItem.linkedAccount && (
                    <div className="p-3 rounded-xl border border-teal-500/10 bg-teal-500/5 flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-slate-400 leading-normal">
                        Linked to <strong>{selectedItem.linkedAccount}</strong> account. Directly drafts from balances, ensuring zero interest charges.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Card Efficiency list optimized for mobile */}
              <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <BarChart3 className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">Spend Routing Optimizer</span>
                  </div>
                  <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-lg">{efficiencyScore}% Optimal</span>
                </div>

                <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden border border-white/5">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full" style={{ width: `${efficiencyScore}%` }} />
                </div>

                {topCategories.length === 0 ? (
                  <p className="text-[10px] text-slate-400 text-center py-2">Add transaction logs to populate recommendations.</p>
                ) : (
                  <div className="space-y-2 pt-1">
                    {topCategories.map(([category, amount]) => {
                      const tip = CATEGORY_TIPS[category] ?? DEFAULT_TIP;
                      const Icon = tip.icon;
                      const bestItem = findOptimalWalletItemForCategory(category, items);
                      
                      return (
                        <div key={category} className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950/40 border border-white/5">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg" style={{ background: `${tip.color}15`, color: tip.color }}>
                              <Icon className="h-3.5 w-3.5" />
                            </div>
                            <div>
                              <span className="text-[11px] font-bold text-white block">{tip.label}</span>
                              <span className="text-[9px] text-slate-400">{formatCurrency(amount)} spend</span>
                            </div>
                          </div>
                          {bestItem ? (
                            <div className="text-right">
                              <span className="text-[9px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white font-bold inline-flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full" style={{ background: CARD_COLORS[bestItem.color].bg }} />
                                {bestItem.name.split(" ")[0]}
                              </span>
                              <span className="text-[9px] block mt-0.5" style={{ color: tip.color }}>{tip.pointsMultiplier} points</span>
                            </div>
                          ) : (
                            <span className="text-[9px] text-slate-500">No cards</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Mobile Tab 2: Credit Score ── */}
      {activeSegment === "score" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Radial score card */}
          <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-4 flex flex-col items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Bureau Rating</span>
            
            <div className="score-circle-container py-4 flex flex-col items-center justify-center relative h-36 w-36">
              <svg width="140" height="140" viewBox="0 0 160 160" className="h-32 w-32 transform -rotate-90 overflow-visible">
                <circle cx="80" cy="80" r="70" stroke="rgba(255,255,255,0.05)" strokeWidth="6" fill="transparent" />
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
                <span className="text-3xl font-extrabold text-white tracking-tight">{scoreNum}</span>
                <span className={cn("text-[9px] font-bold mt-0.5 uppercase tracking-wider", scoreColor)}>{scoreCategory}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full mt-2 border-t border-white/5 pt-4">
              <div className="text-center">
                <span className="text-[9px] text-slate-400 block uppercase tracking-wider font-semibold">Bureau Target</span>
                <span className="text-base font-bold text-emerald-400">&lt; 30%</span>
              </div>
              <div className="text-center border-l border-white/5">
                <span className="text-[9px] text-slate-400 block uppercase tracking-wider font-semibold">Utilization</span>
                <span className="text-base font-bold text-white">{computedUtil}%</span>
              </div>
            </div>
          </div>

          {/* Simulator block */}
          <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Score Simulator</h4>
              <span className="text-[8px] px-1.5 py-0.5 rounded bg-violet-600/15 text-violet-300 font-extrabold uppercase border border-violet-500/25">Simulate</span>
            </div>
            
            <p className="text-[10px] text-slate-400 leading-normal">
              Revolving utilization ratio signals reliability. Lowering this below 30% acts as a major catalyst for credit growth.
            </p>

            <div className="space-y-2 pt-1">
              <div className="flex justify-between text-[10px] font-bold">
                <span className="text-slate-400">Target Ratio</span>
                <span className="text-violet-400">{simulationActive ? "10%" : `${computedUtil}%`}</span>
              </div>
              
              <input 
                type="range" 
                min="10" 
                max="100" 
                value={simulationActive ? 10 : computedUtil}
                onChange={(e) => {
                  if (Number(e.target.value) <= 15) {
                    setSimulationActive(true);
                  } else {
                    setSimulationActive(false);
                  }
                }}
                className="w-full accent-violet-600 cursor-pointer h-1 bg-slate-800 rounded-lg appearance-none"
              />
            </div>

            {simulationActive && computedUtil > 10 ? (
              <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 space-y-3 animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-[9px] text-slate-400 block uppercase font-semibold">Projected Boost</span>
                    <span className="text-lg font-bold text-emerald-400">+{estimatedImprovement} Points</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-slate-400 block uppercase font-semibold">New Estimated Score</span>
                    <span className="text-lg font-bold text-white">{newEstimatedScore}</span>
                  </div>
                </div>
                <div className="pt-2.5 border-t border-white/5">
                  <span className="text-[9px] font-bold text-white uppercase block">Action Plan:</span>
                  <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5">
                    Clear card outstanding balances 3 days before statements generate to report minimal balance usage to bureaus.
                  </p>
                </div>
              </div>
            ) : (
              <Button 
                onClick={() => setSimulationActive(true)}
                variant="outline" 
                className="w-full text-xs h-9 font-bold hover:bg-slate-800 transition cursor-pointer"
              >
                Simulate 10% Utilization
              </Button>
            )}
          </div>
        </div>
      )}

      {/* ── Mobile Tab 3: Calendar ── */}
      {activeSegment === "calendar" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Credit Utilization card */}
          <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-4 flex justify-between items-center gap-4">
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Total Cards Limit</span>
              <span className="text-lg font-bold text-white block mt-0.5">{formatCurrency(totalLimit)}</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mt-2">Dynamic Utilization</span>
              <span className="text-lg font-bold text-emerald-400 block mt-0.5">{formatCurrency(monthlyExpenses)} ({computedUtil}%)</span>
            </div>

            <div className="relative w-20 h-20 flex items-center justify-center">
              <svg width="80" height="80" viewBox="0 0 80 80" className="transform -rotate-90">
                <circle cx="40" cy="40" r="34" stroke="rgba(255,255,255,0.05)" strokeWidth="4" fill="none" />
                <circle 
                  cx="40" cy="40" r="34" 
                  stroke={computedUtil > 30 ? "#ef4444" : "#10b981"} 
                  strokeWidth="5" fill="none"
                  strokeDasharray="213"
                  strokeDashoffset={213 - (213 * computedUtil) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-sm font-black text-white">{computedUtil}%</span>
                <span className={cn("text-[7px] font-bold uppercase tracking-wider", computedUtil > 30 ? "text-red-400" : "text-emerald-400")}>
                  {computedUtil > 30 ? "High Risk" : "Healthy"}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive timeline instead of wide calendar grid */}
          <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-4 space-y-4">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
              <Coins className="h-4 w-4 text-emerald-400" /> Upcoming Card Schedules
            </h3>

            {daysWithEvents.length === 0 ? (
              <p className="text-[10px] text-slate-400 text-center py-4">No credit cards added to track statements.</p>
            ) : (
              <div className="space-y-1">
                {daysWithEvents.map((evt: any, idx: number) => {
                  const isStatement = evt.type === "statement";
                  return (
                    <div key={idx} className="mobile-timeline-item">
                      <div className="mobile-timeline-connector" />
                      <div 
                        className={cn(
                          "mobile-timeline-marker", 
                          isStatement ? "bg-amber-500/20 text-amber-400" : "bg-red-500/20 text-red-400"
                        )}
                      >
                        {isStatement ? "S" : "D"}
                      </div>
                      
                      <div className="mobile-timeline-content">
                        <div>
                          <h4 className="text-[11px] font-bold text-white leading-tight">{evt.card.name}</h4>
                          <p className="text-[9px] text-slate-400 mt-0.5">
                            {isStatement ? "Statement generation date" : "Payment due date"} on the <strong className="text-white">{evt.day}th</strong>
                          </p>
                        </div>
                        
                        {!isStatement && (
                          <div className="flex items-center">
                            {loggedPayments[evt.card.id] ? (
                              <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-lg font-bold flex items-center gap-0.5">
                                <CheckCircle2 className="h-3 w-3" /> Paid
                              </span>
                            ) : (
                              <Button 
                                size="sm" 
                                onClick={() => togglePayment(evt.card.id)}
                                className="bg-violet-600 hover:bg-violet-500 text-[9px] px-2 py-0.5 h-6 rounded-lg text-white font-extrabold cursor-pointer"
                              >
                                Mark Paid
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Slide up mobile bottom drawer */}
      <AnimatePresence>
        {showModal && <MobileAddCardDrawer onClose={() => setShowModal(false)} onAdd={addWalletItem} />}
      </AnimatePresence>
    </div>
  );
}

// ─── Desktop Layout Component ──────────────────────────────────────────────
function DesktopCreditView({
  monthlyIncome,
  monthlyExpenses,
  balance,
  transactions,
  goals,
  currentScore,
  setCurrentScore,
  utilization,
  setUtilization,
  simulationActive,
  setSimulationActive,
  showModal,
  setShowModal,
  activeSegment,
  setActiveSegment,
  loggedPayments,
  togglePayment,
  items,
  selectedItem,
  setSelectedItem,
  filterTab,
  setFilterTab,
  isPerksExpanded,
  setIsPerksExpanded,
  totalLimit,
  isDynamicUtil,
  computedUtil,
  scoreCategory,
  scoreColor,
  scoreColorHex,
  estimatedImprovement,
  newEstimatedScore,
  generatedInsights,
  creditCards,
  debitCards,
  filteredItems,
  benefits,
  targetOffset,
  addWalletItem,
  deleteWalletItem,
}: CreditViewProps) {
  const scoreNum = Number(currentScore);
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

      {/* Segmented Control Selector */}
      <div className="flex bg-slate-900/80 p-1.5 rounded-2xl border border-white/5 w-full sm:w-fit gap-1 shadow-inner backdrop-blur-md">
        <button
          onClick={() => setActiveSegment("wallet")}
          className={cn(
            "flex-1 sm:flex-initial px-5 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 relative cursor-pointer",
            activeSegment === "wallet"
              ? "bg-violet-600/20 border border-violet-500/30 text-violet-300 font-semibold shadow-md"
              : "text-slate-400 hover:text-slate-200 border border-transparent"
          )}
        >
          <CreditCard className="h-4 w-4" />
          Cards & Perks
        </button>
        <button
          onClick={() => setActiveSegment("score")}
          className={cn(
            "flex-1 sm:flex-initial px-5 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 relative cursor-pointer",
            activeSegment === "score"
              ? "bg-blue-600/20 border border-blue-500/30 text-blue-300 font-semibold shadow-md"
              : "text-slate-400 hover:text-slate-200 border border-transparent"
          )}
        >
          <TrendingUp className="h-4 w-4" />
          Credit Score
        </button>
        <button
          onClick={() => setActiveSegment("calendar")}
          className={cn(
            "flex-1 sm:flex-initial px-5 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 relative cursor-pointer",
            activeSegment === "calendar"
              ? "bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 font-semibold shadow-md"
              : "text-slate-400 hover:text-slate-200 border border-transparent"
          )}
        >
          <Coins className="h-4 w-4" />
          Payment Calendar
        </button>
      </div>

      {/* ── Tab 1: Cards & Perks ── */}
      {activeSegment === "wallet" && (
        <div className="space-y-8 animate-fadeIn">
          {/* Wallet Cards Section */}
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

          {/* Active Card Perks expander */}
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

          {/* Efficiency Optimizer */}
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

          {items.length > 0 && !selectedItem && (
            <div className="select-card-prompt text-muted-foreground">
              <Wallet className="h-5 w-5 opacity-40" />
              <p className="text-sm font-medium">Select a card above to view detailed perks, statement dates, and linked accounts.</p>
            </div>
          )}
        </div>
      )}

      {/* ── Tab 2: Credit Score ── */}
      {activeSegment === "score" && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 animate-fadeIn">
          {/* Radial score card */}
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

          {/* Simulator & improvements */}
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
      )}

      {/* ── Tab 3: Payment Calendar ── */}
      {activeSegment === "calendar" && (
        <div className="animate-fadeIn">
          <PaymentCalendarSection 
            items={items}
            loggedPayments={loggedPayments}
            togglePayment={togglePayment}
            formatCurrency={formatCurrency}
            monthlyExpenses={monthlyExpenses}
            totalLimit={totalLimit}
            computedUtil={computedUtil}
          />
        </div>
      )}

      {/* Add Card Modal */}
      <AnimatePresence>
        {showModal && <AddWalletItemModal onClose={() => setShowModal(false)} onAdd={addWalletItem} />}
      </AnimatePresence>
    </div>
  );
}

// ─── Exported Page Component ────────────────────────────────────────────────
export default function CreditPage() {
  const { monthlyIncome, monthlyExpenses, balance, transactions, goals } = useFinance();
  const [currentScore, setCurrentScore] = useState<string>("720");
  const [utilization, setUtilization] = useState<string>("30");
  const [simulationActive, setSimulationActive] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  // Segmented control tabs: "wallet", "score", "calendar"
  const [activeSegment, setActiveSegment] = useState<"wallet" | "score" | "calendar">("wallet");

  // Logged statement payments state
  const [loggedPayments, setLoggedPayments] = useState<Record<string, boolean>>({});

  const togglePayment = (cardId: string) => {
    setLoggedPayments(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

  // Wallet states
  const [items, setItems] = useState<WalletItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<WalletItem | null>(null);
  const [filterTab, setFilterTab] = useState<"all" | "credit" | "debit">("all");

  // Collapsible state for active card perks section
  const [isPerksExpanded, setIsPerksExpanded] = useState(true);

  // Mobile environment detection
  const [isMobileApp, setIsMobileApp] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const isCapacitor = typeof window !== "undefined" && !!(window as any).Capacitor;
      setIsMobileApp(isCapacitor || window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
    // Keep finora_credit_cards synced for AI Chat
    const creditOnly = defaultSeed.filter(i => i.type === "credit");
    localStorage.setItem("finora_credit_cards", JSON.stringify(creditOnly));
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
      // Keep finora_credit_cards synced for AI Chat
      const creditOnly = newItems.filter(i => i.type === "credit");
      localStorage.setItem("finora_credit_cards", JSON.stringify(creditOnly));
      return newItems;
    });
    setSelectedItem(item);
  };

  const deleteWalletItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setItems(prev => {
      const filtered = prev.filter(item => item.id !== id);
      localStorage.setItem("finora_wallet_items", JSON.stringify(filtered));
      // Keep finora_credit_cards synced for AI Chat
      const creditOnly = filtered.filter(i => i.type === "credit");
      localStorage.setItem("finora_credit_cards", JSON.stringify(creditOnly));
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

  const viewProps: CreditViewProps = {
    monthlyIncome,
    monthlyExpenses,
    balance,
    transactions,
    goals,
    currentScore,
    setCurrentScore,
    utilization,
    setUtilization,
    simulationActive,
    setSimulationActive,
    showModal,
    setShowModal,
    activeSegment,
    setActiveSegment,
    loggedPayments,
    togglePayment,
    items,
    selectedItem,
    setSelectedItem,
    filterTab,
    setFilterTab,
    isPerksExpanded,
    setIsPerksExpanded,
    totalLimit,
    isDynamicUtil,
    computedUtil,
    scoreCategory,
    scoreColor,
    scoreColorHex,
    estimatedImprovement,
    newEstimatedScore,
    generatedInsights,
    creditCards,
    debitCards,
    filteredItems,
    benefits,
    targetOffset,
    addWalletItem,
    deleteWalletItem,
  };

  if (isMobileApp) {
    return <MobileCreditView {...viewProps} />;
  }

  return <DesktopCreditView {...viewProps} />;
}
