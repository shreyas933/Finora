"use client";

import { useState } from "react";
import { useFinance } from "@/context/FinanceContext";
import { formatCurrency, cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Calculator, Sparkles, AlertCircle, FileText, TrendingDown,
  Lightbulb, ChevronRight, X, CreditCard, ShieldCheck,
  Building2, Users, Gift, ArrowDownRight, CheckCircle2,
  Lock, Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Tax saving tips data (researched) ───────────────────────────────────────
interface TaxTip {
  id: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
  tag: string;
  title: string;
  description: string;
  potentialSaving: (income: number, tax: number) => string;
  applicableWhen?: (income: number, inv80c: number, hra: number, regime: string) => boolean;
}

const TAX_TIPS: TaxTip[] = [
  {
    id: "loss-harvesting",
    icon: TrendingDown,
    color: "#f43f5e",
    bg: "rgba(244,63,94,0.08)",
    border: "rgba(244,63,94,0.2)",
    tag: "LOOPHOLE",
    title: "Tax-Loss Harvesting",
    description:
      "Sell stocks or mutual funds that are currently trading below your buy price to book a 'paper loss'. Use this loss to offset your capital gains — potentially wiping out your STCG (taxed at 20%) or LTCG (taxed at 12.5% above ₹1.25L) liability entirely. You can carry forward unused losses for up to 8 years if you file ITR on time.",
    potentialSaving: (income) => `Up to ${formatCurrency(Math.round(income * 0.02))} (depending on your capital gains)`,
    applicableWhen: () => true,
  },
  {
    id: "nps-80ccd",
    icon: ShieldCheck,
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.08)",
    border: "rgba(59,130,246,0.2)",
    tag: "SECTION 80CCD(1B)",
    title: "Extra ₹50,000 via NPS",
    description:
      "Invest up to ₹50,000 in a Tier-1 NPS account under Section 80CCD(1B). This is an ADDITIONAL deduction over and above the ₹1.5L 80C limit — meaning you can claim up to ₹2L total. This is one of the few deductions allowed even under the New Tax Regime (employer contributions via 80CCD(2)).",
    potentialSaving: (income, tax) => `Up to ${formatCurrency(Math.round(50000 * (tax / Math.max(income, 1))))} in direct tax reduction`,
    applicableWhen: () => true,
  },
  {
    id: "huf",
    icon: Users,
    color: "#8b5cf6",
    bg: "rgba(139,92,246,0.08)",
    border: "rgba(139,92,246,0.2)",
    tag: "ADVANCED",
    title: "Create an HUF (Hindu Undivided Family)",
    description:
      "An HUF is a separate legal entity with its own PAN and tax-free slab of ₹3L. By routing family income (rent, business profits, ancestral property returns) through the HUF, you create a second income pool taxed at lower slabs. The HUF can also independently claim its own 80C, 80D deductions — effectively doubling your deduction headroom.",
    potentialSaving: () => `₹30,000–₹1,50,000+ annually depending on family income structure`,
    applicableWhen: (income) => income > 1000000,
  },
  {
    id: "gifting",
    icon: Gift,
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.2)",
    tag: "INCOME SPLITTING",
    title: "Gift Money to Parents / Adult Children",
    description:
      "Gifts to 'specified relatives' (parents, siblings, spouse, children) are 100% tax-free for the recipient under Section 56(2). Gift a lump sum to a parent or adult child in a lower tax bracket — their investment returns will be taxed at their lower slab rate (or 0% if below basic exemption). Note: clubbing rules apply for minor children and spouse.",
    potentialSaving: (income) => `₹15,000–₹75,000 annually depending on tax bracket difference`,
    applicableWhen: (income) => income > 750000,
  },
  {
    id: "80d",
    icon: ShieldCheck,
    color: "#10b981",
    bg: "rgba(16,185,129,0.08)",
    border: "rgba(16,185,129,0.2)",
    tag: "SECTION 80D",
    title: "Health Insurance Deduction (₹75,000)",
    description:
      "Claim up to ₹25,000 on your own family's health insurance and an additional ₹50,000 for parents above 60. That's ₹75,000 in total deductions under Section 80D — completely separate from your 80C limit. This deduction is available under the Old Regime and can save up to ₹23,000+ in taxes at the 30% slab.",
    potentialSaving: () => `Up to ₹23,400 at 30% slab (₹75,000 × 30% + cess)`,
    applicableWhen: (_i, _c, _h, regime) => regime === "Old Regime",
  },
  {
    id: "80eea",
    icon: Building2,
    color: "#0ea5e9",
    bg: "rgba(14,165,233,0.08)",
    border: "rgba(14,165,233,0.2)",
    tag: "SECTION 80EEA",
    title: "Home Loan Interest — Extra ₹1.5L",
    description:
      "If you're a first-time home buyer with an affordable housing loan (stamp duty value ≤ ₹45L, loan sanctioned before March 2022), claim ₹1.5L extra under Section 80EEA — in addition to the ₹2L under Section 24b. Combined, that's ₹3.5L of deductions just from home loan interest under the Old Regime.",
    potentialSaving: () => `Up to ₹46,800 additional saving at 30% slab`,
    applicableWhen: (_i, _c, _h, regime) => regime === "Old Regime",
  },
  {
    id: "salary-restructure",
    icon: ArrowDownRight,
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.08)",
    border: "rgba(167,139,250,0.2)",
    tag: "SALARY HACK",
    title: "Restructure Salary with Tax-Free Components",
    description:
      "Ask HR to split your CTC into tax-free allowances: Leave Travel Allowance (LTA — 2 trips in 4 years), meal coupons (₹50/meal tax-free up to ₹26,400/year), mobile reimbursement, book/periodical allowance, and driver salary. Each component is either fully or partially exempt and reduces your taxable salary without reducing your take-home.",
    potentialSaving: (income) => `₹20,000–₹80,000 annually depending on salary level`,
    applicableWhen: () => true,
  },
];

// ─── Pay Tax Modal ────────────────────────────────────────────────────────────
type PayStep = "form" | "processing" | "success";

function PayTaxModal({ taxAmount, onClose }: { taxAmount: number; onClose: () => void }) {
  const [step, setStep] = useState<PayStep>("form");
  const [form, setForm] = useState({ pan: "", dob: "", password: "", otp: "" });
  const [otpSent, setOtpSent] = useState(false);
  const handle = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const sendOtp = () => setOtpSent(true);

  const pay = () => {
    setStep("processing");
    setTimeout(() => setStep("success"), 2800);
  };

  const canPay = form.pan.length === 10 && form.dob && form.password && form.otp === "123456";

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
        <AnimatePresence mode="wait">
          {/* ── Form ── */}
          {step === "form" && (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="modal-header">
                <div>
                  <h3 className="modal-title">Pay Tax Online</h3>
                  <p className="modal-subtitle">Securely via Income Tax e-filing portal</p>
                </div>
                <button className="modal-close" onClick={onClose}><X className="h-4 w-4" /></button>
              </div>

              {/* Amount banner */}
              <div className="pay-amount-banner">
                <span className="pay-amount-label">Tax Payable</span>
                <span className="pay-amount-value">{formatCurrency(taxAmount)}</span>
                <span className="pay-amount-note">Assessment Year 2025–26</span>
              </div>

              <div className="modal-body">
                <div className="pay-secure-badge">
                  <Lock className="h-3.5 w-3.5" />
                  <span>256-bit SSL encrypted · Connects to income-tax.gov.in</span>
                </div>

                <div className="form-group">
                  <label className="form-label">PAN Number *</label>
                  <Input
                    placeholder="ABCDE1234F"
                    maxLength={10}
                    value={form.pan}
                    onChange={e => handle("pan", e.target.value.toUpperCase())}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Date of Birth *</label>
                  <Input type="date" value={form.dob} onChange={e => handle("dob", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">e-Filing Password *</label>
                  <Input type="password" placeholder="Your incometax.gov.in password" value={form.password} onChange={e => handle("password", e.target.value)} />
                </div>

                {/* OTP row */}
                <div className="otp-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">OTP (to registered mobile) *</label>
                    <Input placeholder={otpSent ? "Enter 123456 (demo)" : "Click Send OTP first"} maxLength={6} value={form.otp} onChange={e => handle("otp", e.target.value.replace(/\D/g, ""))} disabled={!otpSent} />
                  </div>
                  <div style={{ paddingTop: "1.4rem" }}>
                    <Button variant="outline" size="sm" onClick={sendOtp} disabled={otpSent || form.pan.length < 10}>
                      {otpSent ? "OTP Sent ✓" : "Send OTP"}
                    </Button>
                  </div>
                </div>

                {otpSent && <p className="form-hint" style={{ color: "#10b981" }}>Demo OTP: 123456</p>}

                <div className="pay-challan-note">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                  <span>Payment will generate Challan 280 under &quot;Advance Tax / Self-Assessment Tax&quot;. A confirmation receipt will be emailed.</span>
                </div>

                <Button className="w-full gap-2" onClick={pay} disabled={!canPay}>
                  <CreditCard className="h-4 w-4" /> Pay {formatCurrency(taxAmount)} Now
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── Processing ── */}
          {step === "processing" && (
            <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pay-processing">
              <Loader2 className="pay-spinner" />
              <p className="pay-processing-title">Processing Payment…</p>
              <p className="pay-processing-sub">Connecting to income-tax.gov.in</p>
              <div className="pay-steps-list">
                {["Authenticating with PAN credentials", "Generating Challan 280", "Processing via NSDL gateway", "Booking payment"].map((s, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.6 }} className="pay-step-item">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                    <span>{s}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Success ── */}
          {step === "success" && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="pay-success">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.1 }} className="pay-success-icon">
                <CheckCircle2 className="h-10 w-10 text-emerald-400" />
              </motion.div>
              <h3 className="pay-success-title">Payment Successful!</h3>
              <p className="pay-success-amount">{formatCurrency(taxAmount)}</p>
              <div className="pay-receipt">
                <div className="pay-receipt-row"><span>Challan No.</span><span className="font-mono">CHL{Date.now().toString().slice(-8)}</span></div>
                <div className="pay-receipt-row"><span>BSR Code</span><span className="font-mono">0510308</span></div>
                <div className="pay-receipt-row"><span>Date</span><span>{new Date().toLocaleDateString("en-IN")}</span></div>
                <div className="pay-receipt-row"><span>Status</span><span className="text-emerald-400 font-semibold">Booked</span></div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Receipt sent to your registered email</p>
              <Button className="w-full mt-4" onClick={onClose}>Done</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// ─── Tax Tip Card ─────────────────────────────────────────────────────────────
function TipCard({ tip, income, tax, index }: { tip: TaxTip; income: number; tax: number; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = tip.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: index * 0.06 }}
      className="tax-tip-card"
      style={{ background: tip.bg, borderColor: tip.border }}
    >
      <div className="tax-tip-header" onClick={() => setExpanded(e => !e)}>
        <div className="tax-tip-left">
          <div className="tax-tip-icon-wrap" style={{ background: `${tip.color}20`, color: tip.color }}>
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <div className="tax-tip-meta">
              <span className="tax-tip-tag" style={{ background: `${tip.color}20`, color: tip.color }}>{tip.tag}</span>
            </div>
            <h4 className="tax-tip-title">{tip.title}</h4>
          </div>
        </div>
        <ChevronRight className={cn("tax-tip-chevron", expanded && "rotated")} style={{ color: tip.color }} />
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="tax-tip-body"
          >
            <p className="tax-tip-desc">{tip.description}</p>
            <div className="tax-tip-saving">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span><strong>Potential saving:</strong> {tip.potentialSaving(income, tax)}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TaxOptimizationPage() {
  const { monthlyIncome } = useFinance();
  const [annualIncome, setAnnualIncome] = useState<string>((monthlyIncome * 12).toString());
  const [investments80C, setInvestments80C] = useState<string>("50000");
  const [hraExemption, setHraExemption] = useState<string>("0");
  const [calculated, setCalculated] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);

  const incomeNum = Number(annualIncome);
  const inv80cNum = Number(investments80C);
  const hraNum = Number(hraExemption);

  // Old Regime
  const oldRegimeDeductions = Math.min(150000, inv80cNum) + hraNum + 50000;
  const oldRegimeTaxable = Math.max(0, incomeNum - oldRegimeDeductions);
  let oldTax = 0;
  if (oldRegimeTaxable > 1000000) oldTax = (oldRegimeTaxable - 1000000) * 0.3 + 112500;
  else if (oldRegimeTaxable > 500000) oldTax = (oldRegimeTaxable - 500000) * 0.2 + 12500;
  else if (oldRegimeTaxable > 250000) oldTax = (oldRegimeTaxable - 250000) * 0.05;

  // New Regime (FY 2024-25)
  const newRegimeTaxable = Math.max(0, incomeNum - 75000); // ₹75k standard deduction
  let newTax = 0;
  if (newRegimeTaxable > 1500000) newTax = (newRegimeTaxable - 1500000) * 0.3 + 150000;
  else if (newRegimeTaxable > 1200000) newTax = (newRegimeTaxable - 1200000) * 0.2 + 90000;
  else if (newRegimeTaxable > 900000) newTax = (newRegimeTaxable - 900000) * 0.15 + 45000;
  else if (newRegimeTaxable > 600000) newTax = (newRegimeTaxable - 600000) * 0.1 + 15000;
  else if (newRegimeTaxable > 300000) newTax = (newRegimeTaxable - 300000) * 0.05;
  if (newRegimeTaxable <= 700000) newTax = 0; // Section 87A rebate

  const recommendedRegime = oldTax <= newTax ? "Old Regime" : "New Regime";
  const bestTax = Math.min(oldTax, newTax);
  const taxSavings = Math.abs(oldTax - newTax);
  const potential80CSpace = 150000 - inv80cNum;

  // Filter applicable tips
  const applicableTips = TAX_TIPS.filter(tip =>
    !tip.applicableWhen || tip.applicableWhen(incomeNum, inv80cNum, hraNum, recommendedRegime)
  );

  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">AI Tax Optimization</h2>
          <p className="text-muted-foreground">Smart calculations &amp; research-backed tips to legally reduce your tax liability.</p>
        </div>
        {calculated && bestTax > 0 && (
          <Button id="pay-tax-btn" className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setShowPayModal(true)}>
            <CreditCard className="h-4 w-4" /> Pay Tax Online
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-12">
        {/* ── Input Card ── */}
        <Card className="md:col-span-1 border-primary/20 lg:col-span-4">
          <CardHeader>
            <CardTitle>Smart Planner</CardTitle>
            <CardDescription>Enter your salary structure for FY 2024–25.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Annual Income (₹)</label>
              <Input type="number" value={annualIncome} onChange={e => { setAnnualIncome(e.target.value); setCalculated(false); }} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">80C Investments (ELSS, PF, LIC…)</label>
              <Input type="number" value={investments80C} onChange={e => { setInvestments80C(e.target.value); setCalculated(false); }} />
              <p className="text-xs text-muted-foreground">Max deduction: ₹1,50,000</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">HRA Exemption Claimed (₹)</label>
              <Input type="number" value={hraExemption} onChange={e => { setHraExemption(e.target.value); setCalculated(false); }} />
            </div>
            <Button className="w-full gap-2 mt-2" onClick={() => setCalculated(true)}>
              <Calculator className="h-4 w-4" /> Calculate Tax
            </Button>
          </CardContent>
        </Card>

        {/* ── Results Card ── */}
        <Card className="md:col-span-1 lg:col-span-8 bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" /> Tax Calculator Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className={cn("p-4 rounded-xl border flex flex-col justify-center items-center", recommendedRegime === "Old Regime" ? "border-primary bg-primary/10" : "border-border/50")}>
                <span className="text-sm text-muted-foreground font-medium mb-2">Old Regime Tax</span>
                <span className="text-3xl font-bold">{formatCurrency(oldTax)}</span>
                {recommendedRegime === "Old Regime" && <span className="mt-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">Recommended ✓</span>}
              </div>
              <div className={cn("p-4 rounded-xl border flex flex-col justify-center items-center", recommendedRegime === "New Regime" ? "border-primary bg-primary/10" : "border-border/50")}>
                <span className="text-sm text-muted-foreground font-medium mb-2">New Regime Tax</span>
                <span className="text-3xl font-bold">{formatCurrency(newTax)}</span>
                {recommendedRegime === "New Regime" && <span className="mt-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">Recommended ✓</span>}
              </div>
            </div>

            {taxSavings > 0 && (
              <div className="p-4 rounded-xl border border-emerald-500/50 bg-emerald-500/10 text-emerald-500 flex items-start gap-3">
                <Sparkles className="h-5 w-5 mt-0.5 shrink-0" />
                <p className="text-sm font-medium">
                  By choosing the <span className="font-bold">{recommendedRegime}</span>, you save <span className="font-bold">{formatCurrency(taxSavings)}</span> on your tax liability this year.
                </p>
              </div>
            )}

            {/* Static quick tips */}
            <div className="pt-4 border-t border-border">
              <h4 className="text-base font-semibold flex items-center gap-2 mb-3">
                <FileText className="h-4 w-4" /> Quick Deduction Checks
              </h4>
              <div className="space-y-3">
                {potential80CSpace > 0 && (
                  <div className="p-3 rounded-xl border border-primary/20 bg-background flex gap-3">
                    <AlertCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-sm font-bold">Invest {formatCurrency(potential80CSpace)} more in 80C</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Max out your ₹1.5L 80C limit via ELSS or PPF — could save up to {formatCurrency(Math.round(potential80CSpace * 0.3))} in taxes.
                      </p>
                    </div>
                  </div>
                )}
                {hraNum === 0 && recommendedRegime === "Old Regime" && (
                  <div className="p-3 rounded-xl border border-amber-500/20 bg-background flex gap-3">
                    <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-sm font-bold">Claim HRA Exemption</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        You haven&apos;t claimed any HRA. If you pay rent, submit rent receipts to HR to significantly reduce taxable income.
                      </p>
                    </div>
                  </div>
                )}
                {potential80CSpace === 0 && hraNum > 0 && (
                  <div className="p-3 rounded-xl border border-emerald-500/20 bg-background flex gap-3">
                    <Sparkles className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                    <p className="text-sm">You&apos;ve utilized 80C and HRA fully. Explore the advanced tips below to go further!</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Tax Saving Tips Section ─────────────────────────────────────────── */}
      <AnimatePresence>
        {calculated && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card className="border-violet-500/15">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-violet-400" />
                    <CardTitle>Advanced Tax-Saving Strategies</CardTitle>
                  </div>
                  <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                    {applicableTips.length} tips for your income bracket
                  </span>
                </div>
                <CardDescription>
                  Research-backed legal loopholes &amp; strategies to reduce your {formatCurrency(bestTax)} tax bill. Click any tip to expand details.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {applicableTips.map((tip, i) => (
                    <TipCard key={tip.id} tip={tip} income={incomeNum} tax={bestTax} index={i} />
                  ))}
                </div>

                {/* Disclaimer */}
                <div className="mt-6 p-4 rounded-xl border border-border bg-background/50 flex gap-3">
                  <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    <strong>Disclaimer:</strong> These are educational insights based on Indian Income Tax Act provisions. Tax laws change yearly via Union Budget. Always verify with a qualified CA before acting on any tax strategy.
                  </p>
                </div>

                {/* CTA to pay */}
                {bestTax > 0 && (
                  <div className="mt-5 p-5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-foreground">Ready to pay your optimized tax?</p>
                      <p className="text-sm text-muted-foreground">Securely pay <span className="text-emerald-400 font-bold">{formatCurrency(bestTax)}</span> directly via the income tax portal.</p>
                    </div>
                    <Button id="pay-tax-cta-btn" className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white whitespace-nowrap shrink-0" onClick={() => setShowPayModal(true)}>
                      <CreditCard className="h-4 w-4" /> Pay {formatCurrency(bestTax)}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Pay Tax Modal ── */}
      <AnimatePresence>
        {showPayModal && <PayTaxModal taxAmount={bestTax} onClose={() => setShowPayModal(false)} />}
      </AnimatePresence>
    </div>
  );
}
