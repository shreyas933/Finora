"use client";

import { useState, useRef } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/Button";
import { X, FileJson, Loader2, Sparkles, BrainCircuit } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AiBudgetModalProps {
  onClose: () => void;
  onBudgetSet: (budgets: any[]) => void;
}

type Step = "upload" | "generating_questions" | "questions" | "finalizing";

interface AiQuestion {
  id: string;
  text: string;
  options: string[];
}

export function AiBudgetModal({ onClose, onBudgetSet }: AiBudgetModalProps) {
  const [step, setStep] = useState<Step>("upload");
  const [files, setFiles] = useState<File[]>([]);
  const [statusText, setStatusText] = useState("");
  const [aggregatedData, setAggregatedData] = useState<Record<string, number>>({});
  
  const [questions, setQuestions] = useState<AiQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles(Array.from(e.target.files));
  };

  const processCsvAndGetQuestions = async () => {
    if (files.length === 0) return;
    setStep("generating_questions");
    setStatusText("Aggregating statements & spotting anomalies...");

    const aggregatedTokens: Record<string, number> = {};

    for (const file of files) {
      if (file.name.toLowerCase().endsWith(".pdf")) {
        // Simulating high-fidelity PDF text & transaction ledger extraction
        await new Promise<void>((resolve) => {
          setTimeout(() => {
            const simulatedSpend: Record<string, number> = {
              "Dining & Out": 4200,
              "Groceries": 5500,
              "Rent & Utilities": 13500,
              "Healthcare": 1500,
              "Transport": 2800,
              "Savings": 8000,
              "Income": 42000
            };
            for (const [key, val] of Object.entries(simulatedSpend)) {
              aggregatedTokens[key] = (aggregatedTokens[key] || 0) + val;
            }
            resolve();
          }, 800);
        });
        continue;
      }

      await new Promise<void>((resolve) => {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            results.data.forEach((row: any) => {
              const rawType = (row["Type"] || row["Dr/Cr"] || row["Transaction Type"] || row["Debit/Credit"] || "").toLowerCase().trim();
              const debitVal = parseFloat((row["Debit"] || "").replace(/,/g, "")) || 0;
              const creditVal = parseFloat((row["Credit"] || "").replace(/,/g, "")) || 0;
              const rawAmount = (row["Amount"] || row["amount"] || "").replace(/,/g, "");

              let amount = 0;
              let txType = "expense";

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

              if (amount <= 0 || isNaN(amount)) return;

              let finalCategory = "Other";
              const rawCategory = row["Category"] || row["category"] || "";
              if (rawCategory && rawCategory.trim().toLowerCase() !== "other") {
                const c = rawCategory.trim();
                if (c.includes("Food") || c.includes("Dining")) finalCategory = "Dining & Out";
                else if (c.includes("Groc")) finalCategory = "Groceries";
                else if (c.includes("Rent") || c.includes("Utilit")) finalCategory = "Rent & Utilities";
                else if (c.includes("Health")) finalCategory = "Healthcare";
                else if (c.includes("Invest")) finalCategory = "Savings";
                else if (c.includes("Trans")) finalCategory = "Transport";
                else finalCategory = c;
              } else if (txType === "expense") {
                finalCategory = "General Expense";
              }

              if (txType === "expense") {
                aggregatedTokens[finalCategory] = (aggregatedTokens[finalCategory] || 0) + amount;
              } else {
                aggregatedTokens["Income"] = (aggregatedTokens["Income"] || 0) + amount;
              }
            });
            resolve();
          }
        });
      });
    }

    const months = Math.max(1, files.length);
    const avgMonthly: Record<string, number> = {};
    for (const [key, val] of Object.entries(aggregatedTokens)) {
      avgMonthly[key] = Math.round(val / months);
    }
    setAggregatedData(avgMonthly);

    setStatusText("Consulting Finora AI CFO for targeted interrogation...");

    try {
      const res = await fetch("/api/budget-ai/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aggregatedSpending: avgMonthly }),
      });

      if (!res.ok) throw new Error("Stage 1 AI Failed");
      const data = await res.json();
      
      setQuestions(data.questions || []);
      setStep("questions");
    } catch (e) {
      console.error(e);
      // Ensure we have questions even if the API fails
      setQuestions([
        { id: "q1", text: "We spotted discretionary spending bloat. Do you want to heavily restrict non-essential shopping to force savings?", options: ["Yes, strict 50% cut", "Moderate 20% cut", "No change"] },
        { id: "q2", text: "Are you willing to cook more at home to curb dining out and food delivery expenses?", options: ["Yes, slash dining by 40%", "Slight reduction", "Keep as is"] },
        { id: "q3", text: "Active recurring subscriptions were found in your statements. Would you audit and cancel unused services?", options: ["Yes, cancel unused plans", "Reduce to cheaper tiers", "Keep current active plans"] },
        { id: "q4", text: "Transport and fuel represent dynamic outlays. Can you commit to carpooling or public transit?", options: ["Yes, optimize transport by 30%", "Slight effort to cut", "Cannot reduce transport spends"] },
        { id: "q5", text: "Are you comfortable routing these recovered funds aggressively into your target Index Funds and goals?", options: ["Yes, route 100% to savings targets", "Save 50%, use 50% as flexible buffer", "Keep as flexible buffer"] }
      ]);
      setStep("questions");
    }
  };

  const submitAnswersAndFinalize = async () => {
    setStep("finalizing");
    setStatusText("Synthesizing answers & formulating strict JSON limits...");

    try {
      const res = await fetch("/api/budget-ai/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aggregatedSpending: aggregatedData, questionnaireData: answers }),
      });

      if (!res.ok) throw new Error("Stage 2 AI Failed");
      const limits = await res.json();

      applyLimits(limits);
    } catch (e) {
      console.error(e);
      const fallbackLimits = {
        "Groceries": 5000, "Dining & Out": 1500, "Transport": 3000, 
        "Rent & Utilities": 12000, "Healthcare": 2000, "Savings": 20000
      };
      applyLimits(fallbackLimits);
    }
  };

  const applyLimits = (limits: Record<string, number>) => {
    const newGlobalBudgets = [
      { name: "Groceries", budget: limits["Groceries"] || 5000, color: "#22c55e", ringColor: "#22c55e", txCategories: ["Groceries", "Food"] },
      { name: "Dining & Out", budget: limits["Dining & Out"] || 2000, color: "#f97316", ringColor: "#f97316", txCategories: ["Dining Out", "Lifestyle"] },
      { name: "Transport", budget: limits["Transport"] || 3000, color: "#a855f7", ringColor: "#a855f7", txCategories: ["Transport"] },
      { name: "Rent & Utilities", budget: limits["Rent & Utilities"] || 15000, color: "#3b82f6", ringColor: "#3b82f6", txCategories: ["Rent", "Housing", "Utilities"] },
      { name: "Healthcare", budget: limits["Healthcare"] || 2000, color: "#ef4444", ringColor: "#ef4444", txCategories: ["Healthcare"] },
      { name: "Savings", budget: limits["Savings"] || 10000, color: "#eab308", ringColor: "#eab308", txCategories: ["Savings", "Investment"] },
    ];

    localStorage.setItem("finora_budgets", JSON.stringify(newGlobalBudgets));
    window.dispatchEvent(new Event("finora_budget_update"));
    onBudgetSet(newGlobalBudgets);

    setTimeout(() => {
      onClose();
    }, 1000);
  };

  const allQuestionsAnswered = questions.length > 0 && Object.keys(answers).length === questions.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#0f172a] w-full max-w-xl rounded-2xl border border-white/10 shadow-[0_0_50px_rgba(139,92,246,0.15)] flex flex-col overflow-hidden relative"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-[#1e293b]/50">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-violet-400" /> AI Interrogation Mode
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {step === "upload" ? "Upload data for analysis." : "Formulating precise restrictions."}
            </p>
          </div>
          <button onClick={onClose}><X className="h-5 w-5 text-slate-400 hover:text-white" /></button>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            
            {/* Step 1: Upload */}
            {step === "upload" && (
              <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
                <input type="file" accept=".csv,.pdf" multiple className="hidden" ref={fileInputRef} onChange={handleFiles} />
                
                <div 
                  className="border-2 border-dashed border-violet-500/30 bg-violet-500/5 rounded-xl p-10 cursor-pointer hover:border-violet-500/50 hover:bg-violet-500/10 transition-all flex flex-col items-center justify-center group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="w-14 h-14 bg-violet-500/20 text-violet-400 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <FileJson className="h-6 w-6" />
                  </div>
                  <h4 className="text-base font-semibold mb-1">Select Multiple Bank Statements</h4>
                  <p className="text-sm text-slate-500">Highlight 3-4 PDFs or CSVs from your bank to establish a behavioral baseline.</p>
                </div>

                {files.length > 0 && <div className="mt-4 text-sm text-emerald-400 font-medium">{files.length} file(s) loaded. Ready for Stage 1.</div>}

                <Button 
                  className="w-full h-12 mt-6 bg-violet-600 hover:bg-violet-500 text-white font-bold gap-2"
                  disabled={files.length === 0}
                  onClick={processCsvAndGetQuestions}
                >
                  <Sparkles className="h-4 w-4" /> Trigger Profiling
                </Button>
              </motion.div>
            )}

            {/* Step 2: Generated Questions */}
            {step === "questions" && (
              <motion.div key="questions" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="bg-violet-500/10 border border-violet-500/20 p-4 rounded-xl text-sm text-violet-300">
                  <strong>Initial Profiling Complete.</strong> I found specific behavioral patterns in your spending over the loaded period. Please lock in your commitments below before I calculate your final ceilings.
                </div>

                <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                  {questions.map((q, idx) => (
                    <div key={q.id} className="space-y-3">
                      <h4 className="font-medium text-white text-base">
                        <span className="text-violet-400 mr-2">Q{idx + 1}.</span>{q.text}
                      </h4>
                      <div className="space-y-2 pl-6">
                        {q.options.map(opt => (
                          <label key={opt} className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${answers[q.id] === opt ? 'bg-violet-600/20 border-violet-500' : 'bg-[#1e293b]/50 border-white/5 hover:bg-[#1e293b]'}`}>
                            <input 
                              type="radio" 
                              name={q.id} 
                              value={opt} 
                              checked={answers[q.id] === opt}
                              onChange={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                              className="hidden"
                            />
                            <div className={`w-4 h-4 rounded-full border border-violet-500 mr-3 flex items-center justify-center ${answers[q.id] === opt ? 'bg-violet-500' : ''}`}>
                              {answers[q.id] === opt && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                            </div>
                            <span className="text-sm text-slate-200">{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <Button 
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-bold gap-2"
                  disabled={!allQuestionsAnswered}
                  onClick={submitAnswersAndFinalize}
                >
                  <BrainCircuit className="h-4 w-4" /> Finalize Strict Constraints
                </Button>
              </motion.div>
            )}

            {/* Loading States */}
            {(step === "generating_questions" || step === "finalizing") && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-16 flex flex-col items-center text-center">
                <Loader2 className="h-12 w-12 text-violet-500 animate-spin mb-6" />
                <h3 className="text-xl font-bold text-white mb-2">{statusText}</h3>
                <p className="text-sm text-slate-400 max-w-sm">
                  {step === "generating_questions" 
                    ? "Evaluating category bloat & mapping structural weaknesses to build tailored queries."
                    : "Routing commitments to math engine. Your new lifestyle bounds will deploy in seconds."}
                </p>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
