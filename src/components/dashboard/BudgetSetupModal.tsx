"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Car, Utensils, CheckCircle2, ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface BudgetSetupModalProps {
  onComplete: () => void;
}

export function BudgetSetupModal({ onComplete }: BudgetSetupModalProps) {
  const [step, setStep] = useState(0);

  const [answers, setAnswers] = useState({
    housing: "",
    transport: "",
    dining: ""
  });

  const QUESTIONS = [
    {
      id: "housing",
      title: "Your Living Situation",
      desc: "This sets your baseline Rent & Utilities budget.",
      icon: <Home className="h-6 w-6 text-blue-400" />,
      options: [
        { id: "family", label: "Living with Family / Sharing", value: 2000 },
        { id: "renting", label: "Renting Apartment", value: 8000 },
        { id: "own", label: "Own property / Paying Mortgage", value: 15000 }
      ]
    },
    {
      id: "transport",
      title: "Your Daily Commute",
      desc: "This will map to your monthly Transport budget.",
      icon: <Car className="h-6 w-6 text-purple-400" />,
      options: [
        { id: "public", label: "Public Transport / Occasional", value: 1000 },
        { id: "car", label: "Personal Car (Fuel, Tolls)", value: 5000 },
        { id: "uber", label: "Heavy App Rides (Taxi/Uber)", value: 20000 }
      ]
    },
    {
      id: "dining",
      title: "Food & Dining Habits",
      desc: "This helps balance your Groceries vs Dining Out budgets.",
      icon: <Utensils className="h-6 w-6 text-orange-400" />,
      options: [
        { id: "home", label: "Mostly Home Cooked Meals", dining: 1000, groc: 10000 },
        { id: "balanced", label: "Eat out a few times a week", dining: 5000, groc: 6000 },
        { id: "out", label: "Order Delivery / Eat out daily", dining: 15000, groc: 2000 }
      ]
    }
  ];

  const handleSelect = (val: string) => {
    const key = QUESTIONS[step].id;
    setAnswers(prev => ({ ...prev, [key]: val }));
  };

  const currentQ = QUESTIONS[step];

  const handleNext = () => {
    if (step < QUESTIONS.length - 1) {
      setStep(s => s + 1);
    } else {
      // Calculate
      const hOpt = QUESTIONS[0].options.find(o => o.id === answers.housing) as any;
      const tOpt = QUESTIONS[1].options.find(o => o.id === answers.transport) as any;
      const dOpt = QUESTIONS[2].options.find(o => o.id === answers.dining) as any;

      const builtBudgets = [
        { name: "Rent & Utilities", budget: hOpt.value, color: "#3b82f6", ringColor: "#3b82f6", txCategories: ["Housing", "Utilities"] },
        { name: "Transport", budget: tOpt.value, color: "#a855f7", ringColor: "#a855f7", txCategories: ["Transport"] },
        { name: "Dining & Out", budget: dOpt.dining, color: "#f97316", ringColor: "#f97316", txCategories: ["Lifestyle", "Dining Out", "Food"] },
        { name: "Groceries", budget: dOpt.groc, color: "#22c55e", ringColor: "#22c55e", txCategories: ["Groceries"] },
        { name: "Healthcare", budget: 2000, color: "#ef4444", ringColor: "#ef4444", txCategories: ["Healthcare", "Medical"] },
        { name: "Savings", budget: 10000, color: "#eab308", ringColor: "#eab308", txCategories: ["Savings", "Investment"] },
      ];

      localStorage.setItem("finora_budgets", JSON.stringify(builtBudgets));
      localStorage.setItem("finora_onboarding_done", "true");
      window.dispatchEvent(new Event("finora_budget_update"));
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="bg-[#0f172a] w-full max-w-lg rounded-2xl border border-white/10 shadow-[0_0_50px_rgba(34,197,94,0.1)] flex flex-col overflow-hidden"
      >
        <div className="bg-[#1e293b]/50 p-6 border-b border-border text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-slate-800">
            <motion.div 
              className="h-full bg-emerald-500"
              initial={{ width: "0%" }}
              animate={{ width: `${((step + 1) / QUESTIONS.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <div className="mx-auto w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mb-4 border border-white/5 shadow-inner">
            {currentQ.icon}
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">{currentQ.title}</h2>
          <p className="text-slate-400 text-sm mt-1">{currentQ.desc}</p>
        </div>

        <div className="p-6 space-y-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              {currentQ.options.map((opt) => {
                const isSelected = answers[currentQ.id as keyof typeof answers] === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelect(opt.id)}
                    className={`w-full text-left p-4 rounded-xl border flex justify-between items-center transition-all ${
                      isSelected 
                        ? "bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]" 
                        : "bg-[#1e293b]/30 border-white/5 hover:border-white/20 hover:bg-[#1e293b]/50"
                    }`}
                  >
                    <span className={`font-medium ${isSelected ? "text-emerald-400" : "text-slate-200"}`}>
                      {opt.label}
                    </span>
                    {isSelected && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                  </button>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="p-6 pt-2 border-t border-white/5 flex gap-3">
          <Button 
            className="w-full h-12 text-sm bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl"
            disabled={!answers[currentQ.id as keyof typeof answers]}
            onClick={handleNext}
          >
            {step === QUESTIONS.length - 1 ? (
              <span className="flex items-center gap-2">Finish Setup <Check className="h-4 w-4" /></span>
            ) : (
              <span className="flex items-center gap-2">Next Step <ChevronRight className="h-4 w-4" /></span>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
