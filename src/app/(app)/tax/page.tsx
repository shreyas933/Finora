"use client";

import { useState } from "react";
import { useFinance } from "@/context/FinanceContext";
import { useCurrency } from "@/context/CurrencyContext";
import { formatCurrency, cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Calculator, Sparkles, X, CreditCard, ShieldCheck,
  CheckCircle2, Lock, Loader2, Globe, BrainCircuit, Play
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ──
type PayStep = "form" | "processing" | "success";

interface AiLoophole {
  id: string;
  title: string;
  description: string;
  inputKey: string;
  optimalAmount: number;
  feasibility: string;
  isSupreme: boolean;
}

// ─── Pay Tax Modal ──
function PayTaxModal({ taxAmount, currency, onClose }: { taxAmount: number; currency: string; onClose: () => void }) {
  const [step, setStep] = useState<PayStep>("form");
  const [otpSent, setOtpSent] = useState(false);
  const [form, setForm] = useState({ idInput: "", otp: "" });

  const pay = () => {
    setStep("processing");
    setTimeout(() => setStep("success"), 2800);
  };

  const cCode = currency.toUpperCase();
  const idLabel = cCode === "USD" ? "SSN / ITIN" : cCode === "GBP" ? "National Insurance No." : cCode === "INR" ? "PAN Number" : "Tax ID Number";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md" onClick={onClose}>
      {/* Code for PayTaxModal remains unaffected */}
      <motion.div
        className="bg-[#0f172a] w-full max-w-md rounded-2xl border border-white/10 shadow-[0_0_50px_rgba(16,185,129,0.15)] flex flex-col overflow-hidden"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        onClick={e => e.stopPropagation()}
      >
        <AnimatePresence mode="wait">
          {step === "form" && (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex items-center justify-between p-5 border-b border-white/10 bg-[#1e293b]/50">
                <div>
                  <h3 className="text-xl font-bold text-white">Tax Remittance</h3>
                  <p className="text-xs text-slate-400 mt-1">Direct Government Gateway Routing</p>
                </div>
                <button onClick={onClose}><X className="h-5 w-5 text-slate-400 hover:text-white" /></button>
              </div>

              <div className="bg-emerald-500/10 border-b border-emerald-500/20 p-6 text-center">
                <p className="text-sm text-emerald-400/80 mb-1 font-medium tracking-wide">TOTAL LIABILITY</p>
                <div className="text-5xl font-mono font-bold text-emerald-400">{formatCurrency(taxAmount, currency)}</div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">{idLabel} *</label>
                  <Input 
                    placeholder={`Enter your ${idLabel}`} 
                    className="bg-[#1e293b] border-white/10 text-white" 
                    value={form.idInput} 
                    onChange={e => setForm(p => ({ ...p, idInput: e.target.value }))} 
                  />
                </div>
                
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Verification Code</label>
                    <Input placeholder="Enter Auth Code" className="bg-[#1e293b] border-white/10 text-white" value={form.otp} onChange={e => setForm(p => ({ ...p, otp: e.target.value }))} disabled={!otpSent} />
                  </div>
                  <Button variant="outline" className="border-white/10 text-white" onClick={() => setOtpSent(true)}>Send</Button>
                </div>
                {otpSent && <p className="text-xs text-emerald-500 font-medium tracking-wide">Tip: Use 123456</p>}

                <Button className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white gap-2 font-bold mt-2" onClick={pay} disabled={!form.idInput || form.otp !== "123456"}>
                  <Lock className="h-4 w-4" /> Remit {formatCurrency(taxAmount, currency)}
                </Button>
              </div>
            </motion.div>
          )}

          {step === "processing" && (
            <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-12 flex flex-col items-center text-center">
              <Loader2 className="h-12 w-12 text-emerald-500 animate-spin mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Connecting to Gateway...</h3>
              <p className="text-sm text-slate-400">Encrypting tax footprint & routing...</p>
            </motion.div>
          )}

          {step === "success" && (
            <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-10 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Settlement Successful!</h3>
              <Button className="w-full mt-4" onClick={onClose}>Close Portal</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// ─── Main Page ──
export default function TaxOptimizationPage() {
  const { monthlyIncome, transactions, balance } = useFinance();
  const { currency } = useCurrency();
  
  const [annualIncome, setAnnualIncome] = useState<string>((monthlyIncome * 12).toString());
  // Regional Inputs
  const [ind80C, setInd80C] = useState<string>("0");
  const [indHRA, setIndHRA] = useState<string>("0");
  const [usPreTax, setUsPreTax] = useState<string>("0");
  const [ukPension, setUkPension] = useState<string>("0");
  const [genDeductions, setGenDeductions] = useState<string>("0");
  
  const [calculated, setCalculated] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);

  // ── AI LLM State ──
  const [aiLoopholes, setAiLoopholes] = useState<AiLoophole[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const _inc = Number(annualIncome) || 0;
  let taxOwed = 0;
  let taxSavings = 0;
  let regimeDetails = "";
  
  // Basic boolean checks
  const isINR = currency === "INR";
  const isUSD = currency === "USD";
  const isAED = currency === "AED";
  const isGBP = currency === "GBP";

  // Calculator Logic
  if (isINR) {
    const oldD = Math.min(150000, Number(ind80C)) + Number(indHRA) + 50000;
    const oldT = Math.max(0, _inc - oldD);
    let oTax = 0;
    if (oldT > 1000000) oTax = (oldT - 1000000) * 0.3 + 112500;
    else if (oldT > 500000) oTax = (oldT - 500000) * 0.2 + 12500;
    else if (oldT > 250000) oTax = (oldT - 250000) * 0.05;

    const newT = Math.max(0, _inc - 75000); 
    let nTax = 0;
    if (newT > 1500000) nTax = (newT - 1500000) * 0.3 + 150000;
    else if (newT > 1200000) nTax = (newT - 1200000) * 0.2 + 90000;
    else if (newT > 900000) nTax = (newT - 900000) * 0.15 + 45000;
    else if (newT > 300000) nTax = (newT - 300000) * 0.05;

    taxOwed = Math.min(oTax, nTax);
    taxSavings = Math.abs(oTax - nTax);
    regimeDetails = oTax <= nTax ? "Old Regime Base" : "New Regime Baseline";
  } 
  else if (isUSD) {
    const stdDeduction = 14600; 
    const preTax = Number(usPreTax);
    const taxable = Math.max(0, _inc - stdDeduction - preTax);
    if (taxable > 609350) taxOwed += (taxable - 609350) * 0.37 + 186601.5;
    else if (taxable > 243725) taxOwed += (taxable - 243725) * 0.35 + 58632.5;
    else if (taxable > 191950) taxOwed += (taxable - 191950) * 0.32 + 42065;
    else if (taxable > 100525) taxOwed += (taxable - 100525) * 0.24 + 20123;
    else if (taxable > 47150) taxOwed += (taxable - 47150) * 0.22 + 5383.5;
    else if (taxable > 11600) taxOwed += (taxable - 11600) * 0.12 + 1160;
    else taxOwed += taxable * 0.10;

    taxSavings = preTax * 0.22;
    regimeDetails = "Federal Standard Bracket";
  }
  else if (isGBP) {
    const target = Math.max(0, _inc - Number(ukPension));
    const pAllow = target > 100000 ? Math.max(0, 12570 - (target - 100000)/2) : 12570;
    const taxable = Math.max(0, target - pAllow);
    
    if (taxable > 125140) taxOwed = (taxable - 125140) * 0.45 + 50056 + 7540;
    else if (taxable > 37700) taxOwed = (taxable - 37700) * 0.40 + 7540;
    else taxOwed = taxable * 0.20;

    taxSavings = Number(ukPension) * 0.4;
    regimeDetails = "HMRC Progressive Tracker";
  }
  else if (isAED) {
    taxOwed = 0;
    taxSavings = _inc * 0.2; 
    regimeDetails = "UAE Federal Protocol: 0% Tax";
  }
  else {
    const target = Math.max(0, _inc - Number(genDeductions));
    const exemption = 10000;
    const taxable = Math.max(0, target - exemption);
    
    if (taxable > 100000) taxOwed = (taxable - 100000) * 0.3 + 18000;
    else if (taxable > 40000) taxOwed = (taxable - 40000) * 0.2 + 6000;
    else taxOwed = taxable * 0.15;
    
    taxSavings = Number(genDeductions) * 0.2;
    regimeDetails = "Global Standardized Assessment";
  }

  // Generate Strategy
  const runAiStrategy = async () => {
    setIsGenerating(true);
    
    // Create a very rapid aggregation of user expenses
    const agg: Record<string, number> = {};
    let totalExp = 0;
    transactions.forEach(t => {
      if (t.type === "expense") {
        totalExp += t.amount;
        agg[t.category] = (agg[t.category] || 0) + t.amount;
      }
    });

    const payload = {
      currency,
      monthlyIncome,
      balance,
      expenses: totalExp,
      txSummary: agg
    };

    try {
      const res = await fetch("/api/tax-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload })
      });
      if (!res.ok) throw new Error("AI Failed");
      const data = await res.json();
      setAiLoopholes(data.loopholes || []);
      setCalculated(true);
    } catch(e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  // Implement Method Auto-Optimizer
  const applyLoophole = (hole: AiLoophole) => {
    const val = hole.optimalAmount.toString();
    if (hole.inputKey === "ind80C") setInd80C(val);
    else if (hole.inputKey === "indHRA") setIndHRA(val);
    else if (hole.inputKey === "usPreTax") setUsPreTax(val);
    else if (hole.inputKey === "ukPension") setUkPension(val);
    else setGenDeductions(val);
    
    // Force recalculation flash
    setCalculated(false);
    setTimeout(() => {
      setCalculated(true);
    }, 50);
  };

  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">AI Tax Optimization</h2>
          <p className="text-muted-foreground">Localized calculations & generative loophole strategy for {currency}.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-12">
        {/* ── Input Card ── */}
        <Card className="md:col-span-1 border-primary/20 lg:col-span-4 bg-[#0f172a]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Globe className="h-4 w-4 text-emerald-400" /> Assessment Profile </CardTitle>
            <CardDescription>Targeting {currency} jurisdictional bounds.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Annual Gross Income</label>
              <Input type="number" className="bg-[#1e293b] border-white/10" value={annualIncome} onChange={e => { setAnnualIncome(e.target.value); setCalculated(false); }} />
            </div>

            {isINR && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">80C Investments</label>
                  <Input type="number" className="bg-[#1e293b] border-emerald-500/30 transition-colors" value={ind80C} onChange={e => { setInd80C(e.target.value); setCalculated(false); }} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">HRA Claim</label>
                  <Input type="number" className="bg-[#1e293b] border-emerald-500/30 transition-colors" value={indHRA} onChange={e => { setIndHRA(e.target.value); setCalculated(false); }} />
                </div>
              </>
            )}
            {isUSD && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Pre-Tax Deductions (401k/HSA)</label>
                <Input type="number" className="bg-[#1e293b] border-emerald-500/30" value={usPreTax} onChange={e => { setUsPreTax(e.target.value); setCalculated(false); }} />
              </div>
            )}
            {isGBP && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Pension / Salary Sacrifice</label>
                <Input type="number" className="bg-[#1e293b] border-emerald-500/30" value={ukPension} onChange={e => { setUkPension(e.target.value); setCalculated(false); }} />
              </div>
            )}
            {isAED && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <p className="text-sm text-emerald-400">Personal income is fully exempt in the UAE.</p>
              </div>
            )}
            {!isINR && !isUSD && !isGBP && !isAED && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Allowable Deductions</label>
                <Input type="number" className="bg-[#1e293b] border-emerald-500/30" value={genDeductions} onChange={e => { setGenDeductions(e.target.value); setCalculated(false); }} />
              </div>
            )}

            <Button className="w-full gap-2 mt-4 bg-primary text-white font-bold" onClick={() => setCalculated(true)}>
              <Calculator className="h-4 w-4" /> Run Calculation
            </Button>
          </CardContent>
        </Card>

        {/* ── Results Card ── */}
        <Card className="md:col-span-1 lg:col-span-8 bg-[#0f172a]/50">
          <CardHeader>
            <CardTitle className="text-slate-200">Computation Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.div 
                animate={calculated ? { scale: [0.95, 1] } : {}}
                className="p-6 rounded-2xl bg-[#0f172a] border border-white/5 relative overflow-hidden flex flex-col justify-center"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 blur-3xl opacity-50 rounded-full"></div>
                <span className="text-sm text-slate-400 font-medium mb-1 z-10">Total Assessed Tax</span>
                <span className="text-4xl font-bold font-mono text-white tracking-widest z-10">{formatCurrency(taxOwed, currency)}</span>
                <span className="text-xs text-rose-400/80 mt-2 z-10">Effective Rate: {(_inc > 0 ? (taxOwed / _inc * 100).toFixed(1) : "0")}%</span>
              </motion.div>
              
              <motion.div 
                animate={calculated ? { scale: [0.95, 1] } : {}}
                className="p-6 rounded-2xl bg-emerald-900/10 border border-emerald-500/20 relative overflow-hidden flex flex-col justify-center"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl opacity-50 rounded-full"></div>
                <span className="text-sm text-emerald-500/80 font-medium mb-1 z-10">{isAED ? "Tax Saved by Residency" : "Optimized Savings Tracker"}</span>
                <span className="text-4xl font-bold font-mono text-emerald-400 tracking-widest z-10">{formatCurrency(taxSavings, currency)}</span>
                <span className="text-xs text-emerald-500 mt-2 z-10">{regimeDetails} applied.</span>
              </motion.div>
            </div>

            {/* AI Generator Trigger */}
            <div className="mt-8 border-t border-white/5 pt-6">
               {!aiLoopholes.length ? (
                  <Button 
                    className="w-full h-14 bg-violet-600 hover:bg-violet-500 text-white font-bold gap-3 rounded-xl border border-violet-400/30 shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all"
                    onClick={runAiStrategy}
                    disabled={isGenerating}
                  >
                    {isGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <BrainCircuit className="h-5 w-5" />}
                    {isGenerating ? "Executing AI CFO Assessment..." : "Generate AI Loophole Strategy"}
                  </Button>
               ) : (
                  <div className="flex items-center justify-between bg-violet-500/10 px-4 py-3 rounded-lg border border-violet-500/20">
                     <span className="text-sm text-violet-300 font-medium"><Sparkles className="h-4 w-4 inline mr-2" /> CFO Active Strategies Deployed</span>
                     <Button variant="ghost" size="sm" onClick={() => setAiLoopholes([])} className="h-8 text-slate-400 hover:text-white">Clear</Button>
                  </div>
               )}
            </div>
            
          </CardContent>
        </Card>
      </div>

      {/* AI Strategies View */}
      <AnimatePresence>
        {aiLoopholes.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card className="border-violet-500/30 bg-[#0f172a] overflow-hidden shadow-[0_0_40px_rgba(139,92,246,0.1)]">
              <CardHeader className="bg-violet-500/5">
                <CardTitle className="text-slate-200">Data-Driven Generative Loopholes</CardTitle>
                <CardDescription>
                  These specific avenues were mathematically derived by analyzing your bank velocity & exact cash surplus limit.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 grid gap-6">
                {aiLoopholes.map((hole) => (
                  <div 
                    key={hole.id}
                    className={cn(
                      "p-6 rounded-2xl border transition-all flex flex-col md:flex-row gap-6 items-start md:items-center justify-between",
                      hole.isSupreme ? "bg-violet-900/20 border-violet-500/50" : "bg-[#1e293b]/50 border-white/5"
                    )}
                  >
                    <div className="flex-1 space-y-2">
                       <div className="flex items-center gap-3">
                         {hole.isSupreme && (
                           <span className="px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider bg-violet-500 text-white rounded-md flex items-center gap-1">
                             <Sparkles className="h-3 w-3" /> CFO Recommended
                           </span>
                         )}
                         <h4 className="font-bold text-lg text-white">{hole.title}</h4>
                       </div>
                       <p className="text-sm text-slate-300/80">{hole.description}</p>
                       <div className="flex items-center gap-4 pt-2">
                          <div className="px-3 py-1.5 rounded bg-black/30 border border-white/5">
                            <span className="text-xs text-slate-400 block mb-0.5">Optimal Execution</span>
                            <span className="font-mono font-bold text-emerald-400">{formatCurrency(hole.optimalAmount, currency)}</span>
                          </div>
                          <div className="px-3 py-1.5 rounded bg-black/30 border border-white/5">
                            <span className="text-xs text-slate-400 block mb-0.5">Surplus Feasibility</span>
                            <span className="text-sm text-violet-300">{hole.feasibility}</span>
                          </div>
                       </div>
                    </div>
                    
                    <Button 
                      className={cn(
                        "h-12 px-6 shrink-0 gap-2 font-bold transition-all shadow-xl",
                        hole.isSupreme ? "bg-emerald-600 hover:bg-emerald-500 text-white" : "bg-white/10 hover:bg-white/20 text-white"
                      )}
                      onClick={() => applyLoophole(hole)}
                    >
                      <Play className="h-4 w-4 fill-current" /> Auto-Optimize & Apply
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Final Target Value Post-Optimization */}
            <Card className="bg-[#0f172a] border-emerald-500/30 overflow-hidden relative shadow-[0_0_30px_rgba(16,185,129,0.1)]">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-3xl opacity-50 rounded-full"></div>
              <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                <div>
                  <p className="text-sm text-emerald-400 font-medium tracking-wide uppercase mb-1">Final Assessed Liability</p>
                  <p className="text-5xl font-mono font-bold text-white tracking-wider">{formatCurrency(taxOwed, currency)}</p>
                  <p className="text-sm text-slate-400 mt-2">All AI strategies successfully applied to engine.</p>
                </div>
                {calculated && taxOwed > 0 && !isAED && (
                  <Button 
                    className="h-16 px-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold gap-3 text-lg shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all flex items-center" 
                    onClick={() => setShowPayModal(true)}
                  >
                    <CreditCard className="h-6 w-6" /> Extract & Remit Tax
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPayModal && <PayTaxModal taxAmount={taxOwed} currency={currency} onClose={() => setShowPayModal(false)} />}
      </AnimatePresence>
    </div>
  );
}
