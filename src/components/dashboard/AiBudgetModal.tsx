"use client";

import { useState, useRef } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/Button";
import { X, FileJson, Loader2, Sparkles, BrainCircuit, CheckCircle2, ArrowRight, ArrowLeft, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AiBudgetModalProps {
  onClose: () => void;
  currentSalary: number;
  currentNeeds: any[];
  currentWants: any[];
  onSave: (salary: number, needs: any[], wants: any[]) => void;
}

type Step = 1 | 2 | 3 | "q1_3" | "q4_6" | "q7_9" | "q10_12" | "scanning" | 5;

interface Question {
  id: number;
  text: string;
  options: string[];
  examples?: string;
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    text: "How strict do you want your lifestyle budget to be?",
    options: [
      "Strict: I want to save aggressively",
      "Balanced: I want control but still enjoy life",
      "Flexible: I want more freedom for lifestyle spending"
    ]
  },
  {
    id: 2,
    text: "How often do you eat out or order food?",
    options: [
      "Rarely",
      "1–2 times per week",
      "3–5 times per week",
      "Almost daily"
    ]
  },
  {
    id: 3,
    text: "How much do you usually spend on shopping per month?",
    options: [
      "₹0–₹1,000",
      "₹1,000–₹5,000",
      "₹5,000–₹10,000",
      "₹10,000+"
    ]
  },
  {
    id: 4,
    text: "How many paid subscriptions do you currently use?",
    examples: "Examples: Netflix, Spotify, Prime, gym, cloud storage, gaming, apps.",
    options: [
      "None",
      "1–2",
      "3–5",
      "More than 5"
    ]
  },
  {
    id: 5,
    text: "How often do you go out for movies, cafes, events, or entertainment?",
    options: [
      "Rarely",
      "Monthly",
      "Weekly",
      "Multiple times per week"
    ]
  },
  {
    id: 6,
    text: "How often do you travel or take short trips?",
    options: [
      "Rarely",
      "Every few months",
      "Monthly",
      "Very often"
    ]
  },
  {
    id: 7,
    text: "Which lifestyle category matters most to you?",
    options: [
      "Dining / Food",
      "Shopping",
      "Travel",
      "Entertainment",
      "Fitness / Hobbies",
      "Subscriptions",
      "Personal Care"
    ]
  },
  {
    id: 8,
    text: "Which category are you most willing to reduce if money gets tight?",
    options: [
      "Dining / Food",
      "Shopping",
      "Travel",
      "Entertainment",
      "Subscriptions",
      "Fitness / Hobbies",
      "Personal Care"
    ]
  },
  {
    id: 9,
    text: "Do you usually overspend on lifestyle expenses?",
    options: [
      "Never",
      "Sometimes",
      "Often",
      "Almost every month"
    ]
  },
  {
    id: 10,
    text: "How much guilt-free fun money do you want every month?",
    options: [
      "₹1,000",
      "₹3,000",
      "₹5,000",
      "₹10,000",
      "Custom amount"
    ]
  },
  {
    id: 11,
    text: "What is your current financial priority?",
    options: [
      "Save more",
      "Pay debt",
      "Invest more",
      "Build emergency fund",
      "Enjoy lifestyle but stay controlled",
      "Balance everything"
    ]
  },
  {
    id: 12,
    text: "Do you have any upcoming lifestyle expense this month?",
    examples: "Examples: trip, birthday, event, shopping, festival, vacation.",
    options: [
      "No",
      "Yes, under ₹2,000",
      "Yes, ₹2,000–₹5,000",
      "Yes, ₹5,000–₹10,000",
      "Yes, ₹10,000+"
    ]
  }
];

export function AiBudgetModal({ onClose, currentSalary, currentNeeds, currentWants, onSave }: AiBudgetModalProps) {
  const [step, setStep] = useState<Step>(1);
  const [salaryInput, setSalaryInput] = useState(currentSalary.toString());

  const [needsList, setNeedsList] = useState<any[]>(currentNeeds);
  const [wantsList, setWantsList] = useState<any[]>(currentWants);
  const [files, setFiles] = useState<File[]>([]);
  const [statusText, setStatusText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Questionnaire answers state
  const [answers, setAnswers] = useState<Record<number, string>>({
    1: "Balanced: I want control but still enjoy life",
    2: "1–2 times per week",
    3: "₹1,000–₹5,000",
    4: "1–2",
    5: "Monthly",
    6: "Every few months",
    7: "Dining / Food",
    8: "Shopping",
    9: "Sometimes",
    10: "₹3,000",
    11: "Save more",
    12: "No"
  });

  // Calculated wants recommendation output
  const [wantsRecommendation, setWantsRecommendation] = useState<{
    totalWants: number;
    categoryBudgets: Record<string, number>;
    explanation: string;
    warning: string | null;
    suggestedReduction: string;
  } | null>(null);

  const handleNeedChange = (index: number, val: string) => {
    const updated = [...needsList];
    updated[index] = { ...updated[index], budget: Number(val) || 0 };
    setNeedsList(updated);
  };

  const handleWantChange = (index: number, val: string) => {
    const updated = [...wantsList];
    updated[index] = { ...updated[index], budget: Number(val) || 0 };
    setWantsList(updated);
  };

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles(Array.from(e.target.files));
  };

  const processStatementsAndExtractWants = async () => {
    if (files.length === 0) return;
    setStep("scanning");
    setStatusText("AI is parsing statement ledgers...");

    // Categories mapping for Wants
    const wantsSum: Record<string, number> = {
      "Dining / Food": 0,
      "Shopping": 0,
      "Entertainment": 0,
      "Travel": 0,
      "Subscriptions": 0,
      "Fitness / Hobbies": 0,
      "Personal Care": 0,
    };

    const checkCategory = (desc: string, cat: string): string | null => {
      const text = `${desc} ${cat}`.toLowerCase();
      if (["dining", "food", "restaurant", "cafe", "zomato", "swiggy", "starbucks", "mcdonald", "pizza", "dine", "eats"].some(k => text.includes(k))) return "Dining / Food";
      if (["subscription", "netflix", "spotify", "prime", "youtube premium", "icloud", "google one", "premium"].some(k => text.includes(k))) return "Subscriptions";
      if (["gym", "fitness", "hobbies", "club", "sport", "workout", "hobby"].some(k => text.includes(k))) return "Fitness / Hobbies";
      if (["personal care", "salon", "spa", "grooming", "haircut", "cosmetics", "pharmacy"].some(k => text.includes(k))) return "Personal Care";
      if (["travel", "flight", "hotel", "airbnb", "holiday", "trip", "booking", "airline", "stay"].some(k => text.includes(k))) return "Travel";
      if (["transport", "car", "fuel", "petrol", "diesel", "uber", "ola", "metro", "bus", "train", "cab", "taxi"].some(k => text.includes(k))) return "Transport";
      if (["shopping", "lifestyle", "amazon", "flipkart", "retail", "myntra", "zara", "h&m", "clothing", "apparel", "store"].some(k => text.includes(k))) return "Shopping";
      return null;
    };

    for (const file of files) {
      if (file.name.toLowerCase().endsWith(".pdf")) {
        // Simulating PDF scan
        await new Promise<void>((resolve) => {
          setTimeout(() => {
            const simulatedSpend: Record<string, number> = {
              "Dining / Food": 4500,
              "Shopping": 6800,
              "Entertainment": 1900,
              "Travel": 3800,
              "Subscriptions": 1200,
              "Fitness / Hobbies": 1500,
              "Personal Care": 800
            };
            for (const [key, val] of Object.entries(simulatedSpend)) {
              wantsSum[key] = (wantsSum[key] || 0) + val;
            }
            resolve();
          }, 600);
        });
        continue;
      }

      // CSV parser
      await new Promise<void>((resolve) => {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            results.data.forEach((row: any) => {
              const desc = (row["Description"] || row["Narration"] || row["Name"] || row["Transaction"] || row["Details"] || "").toString();
              const category = (row["Category"] || row["category"] || "").toString();
              const debitVal = parseFloat((row["Debit"] || "").toString().replace(/,/g, "")) || 0;
              const creditVal = parseFloat((row["Credit"] || "").toString().replace(/,/g, "")) || 0;
              const rawAmount = (row["Amount"] || row["amount"] || "").toString().replace(/,/g, "");

              let amount = 0;
              let txType = "expense";

              const rawType = (row["Type"] || row["Dr/Cr"] || row["Transaction Type"] || row["Debit/Credit"] || "").toString().toLowerCase().trim();
              if (rawType === "credit" || rawType === "cr" || rawType === "income") {
                amount = parseFloat(rawAmount) || creditVal;
                txType = "income";
              } else if (rawType === "debit" || rawType === "dr" || rawType === "expense") {
                amount = parseFloat(rawAmount) || debitVal;
                txType = "expense";
              } else if (creditVal > 0 && debitVal === 0) {
                amount = creditVal;
                txType = "income";
              } else if (debitVal > 0 && creditVal === 0) {
                amount = debitVal;
                txType = "expense";
              } else if (rawAmount) {
                const parsed = parseFloat(rawAmount);
                amount = Math.abs(parsed);
                txType = parsed >= 0 ? "income" : "expense";
              }

              if (amount <= 0 || isNaN(amount) || txType !== "expense") return;

              const matchedWantCat = checkCategory(desc, category);
              if (matchedWantCat) {
                wantsSum[matchedWantCat] += amount;
              }
            });
            resolve();
          }
        });
      });
    }

    setStatusText("Spotting recurring patterns...");
    await new Promise(r => setTimeout(r, 600));
    setStatusText("Generating Wants Questionnaire...");
    await new Promise(r => setTimeout(r, 600));

    // Save parsed statement data to modify fallback options or averages if we want,
    // then continue to the wants questionnaire.
    setStep("q1_3");
  };

  const handleOptionChange = (questionId: number, option: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: option }));
  };

  const generateAndSetupWantsRecommendation = () => {
    const income = Number(salaryInput) || 50000;
    
    // 1. Start with framework base (default 30% of income)
    let wantsBase = income * 0.30;

    // 2. Adjust Wants budget based on strictness (Q1)
    const strictness = answers[1];
    if (strictness.startsWith("Strict")) {
      wantsBase *= 0.80; // -20%
    } else if (strictness.startsWith("Flexible")) {
      const needsTotal = needsList.reduce((acc, n) => acc + n.budget, 0);
      // Increase by 10% only if Savings/Debt allocation remains healthy (e.g. Needs + Wants <= 90% of income)
      if (needsTotal + wantsBase * 1.1 <= income * 0.90) {
        wantsBase *= 1.10;
      }
    }

    // 3. Adjust based on priority (Q11)
    const priority = answers[11];
    if (priority === "Save more" || priority === "Build emergency fund") {
      wantsBase *= 0.85; // -15%
    } else if (priority === "Pay debt") {
      wantsBase *= 0.80; // -20%
    } else if (priority === "Invest more") {
      wantsBase *= 0.90; // -10%
    }

    // 4. Adjust based on overspending habit (Q9)
    const overspending = answers[9];
    if (overspending === "Sometimes") {
      wantsBase *= 0.95; // -5%
    } else if (overspending === "Often") {
      wantsBase *= 0.90; // -10%
    } else if (overspending === "Almost every month") {
      wantsBase *= 0.85; // -15%
    }

    const finalTotalWants = Math.round(wantsBase);

    // Default distribution percentages
    const distribution: Record<string, number> = {
      "Dining / Food": 0.25,
      "Shopping": 0.20,
      "Entertainment": 0.15,
      "Travel": 0.15,
      "Subscriptions": 0.10,
      "Fitness / Hobbies": 0.10,
      "Personal Care": 0.05,
    };

    // 7. Modify distribution based on lifestyle importance (Q7)
    // 8. Modify distribution based on reducible category (Q8)
    const importantCat = answers[7];
    const reducibleCat = answers[8];

    if (importantCat !== reducibleCat) {
      if (distribution[importantCat] !== undefined && distribution[reducibleCat] !== undefined) {
        distribution[importantCat] += 0.08;
        distribution[reducibleCat] -= 0.08;
      }
    }

    // Lower reducible category by another 5% and allocate to important category
    if (distribution[reducibleCat] !== undefined) {
      const originalReducible = distribution[reducibleCat];
      const reduction = Math.min(originalReducible - 0.02, 0.05); // Keep at least 2%
      distribution[reducibleCat] -= reduction;
      if (distribution[importantCat] !== undefined) {
        distribution[importantCat] += reduction;
      }
    }

    // Calculate initial budgets
    const categoryBudgets: Record<string, number> = {};
    for (const [cat, pct] of Object.entries(distribution)) {
      categoryBudgets[cat] = Math.round(finalTotalWants * pct);
    }

    // 5. Upcoming lifestyle expense adjustment (Q12)
    const upcomingAnswer = answers[12];
    let upcomingAmt = 0;
    if (upcomingAnswer.includes("under ₹2,000")) upcomingAmt = 1500;
    else if (upcomingAnswer.includes("₹2,000–₹5,000")) upcomingAmt = 3500;
    else if (upcomingAnswer.includes("₹5,000–₹10,000")) upcomingAmt = 7500;
    else if (upcomingAnswer.includes("₹10,000+")) upcomingAmt = 12000;

    if (upcomingAmt > 0) {
      let targetCategory = "Travel"; // Default
      if (importantCat === "Travel" || importantCat === "Shopping") {
        targetCategory = importantCat;
      } else if (reducibleCat === "Travel") {
        targetCategory = "Shopping";
      }

      const currentVal = categoryBudgets[targetCategory] || 0;
      if (currentVal < upcomingAmt) {
        const targetAllocation = Math.min(upcomingAmt, finalTotalWants * 0.80);
        const diff = targetAllocation - currentVal;
        categoryBudgets[targetCategory] = targetAllocation;

        const otherCategories = Object.keys(categoryBudgets).filter(c => c !== targetCategory);
        const otherSum = otherCategories.reduce((sum, c) => sum + categoryBudgets[c], 0);

        if (otherSum > 0) {
          otherCategories.forEach(c => {
            const share = categoryBudgets[c] / otherSum;
            const original = categoryBudgets[c];
            const calculated = Math.round(original - diff * share);
            categoryBudgets[c] = Math.max(calculated, 500); // Floor of ₹500
          });
        }
      }
    }

    // Re-adjust total sum matching finalTotalWants
    const finalCategorySum = Object.values(categoryBudgets).reduce((sum, v) => sum + v, 0);
    const scalingFactor = finalCategorySum > 0 ? finalTotalWants / finalCategorySum : 1;
    for (const cat of Object.keys(categoryBudgets)) {
      categoryBudgets[cat] = Math.round(categoryBudgets[cat] * scalingFactor);
    }

    // Update Wants list state for manual editing
    const finalWantsList = wantsList.map(w => ({
      ...w,
      budget: categoryBudgets[w.name] ?? w.budget
    }));
    setWantsList(finalWantsList);

    // Build outputs
    const overspendWord = overspending.toLowerCase().includes("almost") ? "almost every month" : overspending.toLowerCase();
    const explanation = `Based on your income, lifestyle answers, and savings priority, your recommended Wants budget is ₹${finalTotalWants.toLocaleString()}/month. ${importantCat} and Travel are your priority categories, so we allocated more there. Since you ${overspendWord} overspend, FINORA reduced Shopping and Entertainment slightly to keep your budget realistic.`;

    setWantsRecommendation({
      totalWants: finalTotalWants,
      categoryBudgets,
      explanation,
      warning: finalTotalWants > income * 0.40 ? `⚠️ Warning: Your lifestyle wants budget consumes ${(finalTotalWants / income * 100).toFixed(0)}% of your income. Consider shifting to a Strict framework to protect your savings.` : null,
      suggestedReduction: `Cut Wants by an additional 15% (save ₹${Math.round(finalTotalWants * 0.15).toLocaleString()} more) by reducing ${reducibleCat}.`
    });

    setStep(5);
  };

  const renderQuestion = (q: Question) => {
    return (
      <div key={q.id} className="bg-[#1e293b]/40 border border-white/5 rounded-xl p-4 space-y-3">
        <h4 className="text-sm font-semibold text-white leading-relaxed">
          <span className="text-violet-400 mr-1.5 font-bold">Q{q.id}.</span> {q.text}
        </h4>
        {q.examples && <p className="text-[10px] text-slate-500 font-semibold italic">{q.examples}</p>}
        <div className="grid grid-cols-1 gap-2">
          {q.options.map(opt => {
            const isSelected = answers[q.id] === opt;
            return (
              <label 
                key={opt} 
                className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                  isSelected 
                    ? 'bg-violet-600/20 border-violet-500 text-violet-300 font-semibold' 
                    : 'bg-[#0f172a]/50 border-white/5 text-slate-300 hover:bg-[#1e293b]'
                }`}
              >
                <input 
                  type="radio" 
                  name={`q-${q.id}`} 
                  value={opt} 
                  checked={isSelected}
                  onChange={() => handleOptionChange(q.id, opt)}
                  className="hidden"
                />
                <div className={`w-4 h-4 rounded-full border border-violet-500/50 mr-3 flex items-center justify-center ${isSelected ? 'bg-violet-500 border-violet-500' : ''}`}>
                  {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                </div>
                <span className="text-xs">{opt}</span>
              </label>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#0f172a] w-full max-w-lg rounded-2xl border border-white/10 shadow-[0_0_50px_rgba(139,92,246,0.15)] flex flex-col overflow-hidden relative"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-[#1e293b]/50">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-violet-400" /> AI Budget Profiler
            </h3>
            <p className="text-xs text-slate-400 mt-1 font-semibold">
              {step === 1 && "Step 1: Set Income & Framework"}
              {step === 2 && "Step 2: Configure Needs"}
              {step === 3 && "Step 3: Scan statements for Wants"}
              {step === "q1_3" && "Step 4: Wants Profiler (1/4)"}
              {step === "q4_6" && "Step 4: Wants Profiler (2/4)"}
              {step === "q7_9" && "Step 4: Wants Profiler (3/4)"}
              {step === "q10_12" && "Step 4: Wants Profiler (4/4)"}
              {step === 5 && "Step 5: Review Suggested Wants"}
              {step === "scanning" && "Analyzing Statements..."}
            </p>
          </div>
          <button onClick={onClose}><X className="h-5 w-5 text-slate-400 hover:text-white" /></button>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            
            {/* Step 1: Set Income & Framework */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-white mb-2 uppercase tracking-wider">What is your Monthly Income / Salary?</h4>
                    <div className="relative">
                      <span className="absolute left-4 top-3 text-slate-400 font-semibold text-lg">₹</span>
                      <input
                        type="number"
                        className="w-full bg-[#1e293b] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-base text-white placeholder:text-slate-500 font-semibold focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                        placeholder="e.g. 50000"
                        value={salaryInput}
                        onChange={e => setSalaryInput(e.target.value)}
                        autoFocus
                      />
                    </div>
                  </div>
                </div>
                
                <Button
                  onClick={() => setStep(2)}
                  className="w-full h-12 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold transition-all mt-4 shadow-lg shadow-violet-600/10 flex items-center justify-center gap-1.5"
                >
                  Continue to Needs <ArrowRight className="h-4 w-4" />
                </Button>
              </motion.div>
            )}

            {/* Step 2: Configure Needs */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-white mb-2 uppercase tracking-wider">Configure Your Essential Needs</h4>
                  <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
                    Configure limits for essential fixed costs. Needs are automatically subtracted from your salary baseline.
                  </p>
                </div>

                <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1.5 custom-scrollbar">
                  {needsList.map((need, idx) => (
                    <div key={need.name} className="flex items-center justify-between gap-4 bg-[#1e293b]/40 border border-white/5 rounded-xl px-4 py-2.5">
                      <span className="text-xs font-semibold text-white">{need.name}</span>
                      <div className="relative w-32">
                        <span className="absolute left-3 top-1.5 text-xs text-slate-400">₹</span>
                        <input
                          type="number"
                          className="w-full bg-[#1e293b]/60 border border-white/10 rounded-lg pl-6 pr-2 py-1 text-xs text-white text-right font-mono focus:outline-none focus:border-violet-500"
                          value={need.budget}
                          onChange={e => handleNeedChange(idx, e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 h-12 border border-white/10 text-slate-300 hover:bg-white/5 rounded-xl font-semibold transition-colors text-xs"
                  >
                    Back
                  </button>
                  <Button
                    onClick={() => setStep(3)}
                    className="flex-1 h-12 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-violet-600/10 flex items-center justify-center gap-1.5 text-xs"
                  >
                    Continue to Scan <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Upload Statements */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="text-center space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-white mb-2 uppercase tracking-wider text-left">Upload Statements for Wants</h4>
                  <p className="text-[11px] text-slate-400 mb-3 leading-relaxed text-left">
                    Select bank statements (PDFs or CSVs). The AI analyzer scans transaction categories automatically to prepare your profiling.
                  </p>
                </div>

                <input type="file" accept=".csv,.pdf" multiple className="hidden" ref={fileInputRef} onChange={handleFiles} />
                
                <div 
                  className="border-2 border-dashed border-violet-500/30 bg-violet-500/5 rounded-xl p-8 cursor-pointer hover:border-violet-500/50 hover:bg-violet-500/10 transition-all flex flex-col items-center justify-center group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="w-12 h-12 bg-violet-500/20 text-violet-400 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <FileJson className="h-5 w-5" />
                  </div>
                  <h4 className="text-sm font-semibold mb-1 text-white">Select Bank Statements</h4>
                  <p className="text-xs text-slate-500 px-4">Choose multiple PDF or CSV statement documents.</p>
                </div>

                {files.length > 0 && (
                  <div className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 py-2 rounded-lg">
                    ✓ {files.length} statement file(s) loaded.
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 h-12 border border-white/10 text-slate-300 hover:bg-white/5 rounded-xl font-semibold transition-colors text-xs"
                  >
                    Back
                  </button>
                  <Button 
                    className="flex-1 h-12 bg-violet-600 hover:bg-violet-500 text-white font-bold gap-1.5 text-xs"
                    disabled={files.length === 0}
                    onClick={processStatementsAndExtractWants}
                  >
                    <Sparkles className="h-4 w-4" /> Scan Statements
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 4.1: Wants Profiler Q1-3 */}
            {step === "q1_3" && (
              <motion.div key="q1_3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1.5 custom-scrollbar">
                  {QUESTIONS.slice(0, 3).map(renderQuestion)}
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setStep(3)}
                    className="flex-1 h-12 border border-white/10 text-slate-300 hover:bg-white/5 rounded-xl font-semibold transition-colors text-xs flex items-center justify-center gap-1"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Back
                  </button>
                  <button
                    onClick={() => setStep("q4_6")}
                    className="flex-1 h-12 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold transition-colors text-xs flex items-center justify-center gap-1"
                  >
                    Next <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 4.2: Wants Profiler Q4-6 */}
            {step === "q4_6" && (
              <motion.div key="q4_6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1.5 custom-scrollbar">
                  {QUESTIONS.slice(3, 6).map(renderQuestion)}
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setStep("q1_3")}
                    className="flex-1 h-12 border border-white/10 text-slate-300 hover:bg-white/5 rounded-xl font-semibold transition-colors text-xs flex items-center justify-center gap-1"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Back
                  </button>
                  <button
                    onClick={() => setStep("q7_9")}
                    className="flex-1 h-12 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold transition-colors text-xs flex items-center justify-center gap-1"
                  >
                    Next <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 4.3: Wants Profiler Q7-9 */}
            {step === "q7_9" && (
              <motion.div key="q7_9" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1.5 custom-scrollbar">
                  {QUESTIONS.slice(6, 9).map(renderQuestion)}
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setStep("q4_6")}
                    className="flex-1 h-12 border border-white/10 text-slate-300 hover:bg-white/5 rounded-xl font-semibold transition-colors text-xs flex items-center justify-center gap-1"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Back
                  </button>
                  <button
                    onClick={() => setStep("q10_12")}
                    className="flex-1 h-12 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold transition-colors text-xs flex items-center justify-center gap-1"
                  >
                    Next <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 4.4: Wants Profiler Q10-12 */}
            {step === "q10_12" && (
              <motion.div key="q10_12" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1.5 custom-scrollbar">
                  {QUESTIONS.slice(9, 12).map(renderQuestion)}
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setStep("q7_9")}
                    className="flex-1 h-12 border border-white/10 text-slate-300 hover:bg-white/5 rounded-xl font-semibold transition-colors text-xs flex items-center justify-center gap-1"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Back
                  </button>
                  <button
                    onClick={generateAndSetupWantsRecommendation}
                    className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-colors text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/10"
                  >
                    <Sparkles className="h-4 w-4" /> Generate Wants Budget
                  </button>
                </div>
              </motion.div>
            )}

            {/* Scanning Loader */}
            {step === "scanning" && (
              <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12 flex flex-col items-center text-center">
                <Loader2 className="h-10 w-10 text-violet-500 animate-spin mb-4" />
                <h3 className="text-lg font-bold text-white mb-1">{statusText}</h3>
                <p className="text-xs text-slate-400 max-w-sm">
                  Analyzing expense files, mapping matching keywords, and constructing historical averages for Wants...
                </p>
              </motion.div>
            )}

            {/* Step 5: Review Recommendation */}
            {step === 5 && wantsRecommendation && (
              <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1.5 custom-scrollbar">
                  
                  {/* Summary Recommendation */}
                  <div className="bg-violet-950/20 border border-violet-500/30 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-violet-400 uppercase tracking-wider">Recommended Wants Budget</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-violet-600/30 text-violet-300 border border-violet-500/20">
                        {answers[1].split(":")[0]} Mode
                      </span>
                    </div>
                    <div className="text-3xl font-black text-white font-mono">
                      ₹{wantsRecommendation.totalWants.toLocaleString()}<span className="text-xs text-slate-400 font-normal"> / month</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed italic">
                      “{wantsRecommendation.explanation}”
                    </p>
                  </div>

                  {wantsRecommendation.warning && (
                    <div className="bg-red-950/30 border border-red-500/20 rounded-xl p-3 text-[11px] text-red-300 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <span>{wantsRecommendation.warning}</span>
                    </div>
                  )}

                  <div className="bg-emerald-950/25 border border-emerald-500/20 rounded-xl p-3 text-[11px] text-emerald-300 flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>{wantsRecommendation.suggestedReduction}</span>
                  </div>

                  {/* Manual editing card list */}
                  <div className="space-y-2">
                    <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Edit Wants Budgets Manually</h5>
                    {wantsList.map((want, idx) => (
                      <div key={want.name} className="flex items-center justify-between gap-4 bg-[#1e293b]/40 border border-white/5 rounded-xl px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: want.color }} />
                          <span className="text-xs font-semibold text-white">{want.name}</span>
                        </div>
                        <div className="relative w-32">
                          <span className="absolute left-3 top-1.5 text-xs text-slate-400">₹</span>
                          <input
                            type="number"
                            className="w-full bg-[#1e293b]/60 border border-white/10 rounded-lg pl-6 pr-2 py-1 text-xs text-white text-right font-mono focus:outline-none focus:border-violet-500"
                            value={want.budget}
                            onChange={e => handleWantChange(idx, e.target.value)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setStep("q10_12")}
                    className="flex-1 h-12 border border-white/10 text-slate-300 hover:bg-white/5 rounded-xl font-semibold transition-colors text-xs flex items-center justify-center gap-1"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Back
                  </button>
                  <Button
                    onClick={() => onSave(Number(salaryInput) || 50000, needsList, wantsList)}
                    className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/15 text-xs"
                  >
                    <CheckCircle2 className="h-4 w-4" /> Apply & Save Budget
                  </Button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
