"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, Wallet, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useFinance } from "@/context/FinanceContext";
import { useCurrency } from "@/context/CurrencyContext";

interface StartingBalanceModalProps {
  onClose: () => void;
}

export function StartingBalanceModal({ onClose }: StartingBalanceModalProps) {
  const { transactions, balance, addTransaction, updateTransaction } = useFinance();
  const { currency } = useCurrency();
  const [inputValue, setInputValue] = useState<string>(Math.round(balance).toString());
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetBalance = parseFloat(inputValue);
    if (isNaN(targetBalance)) return;

    setIsSaving(true);
    try {
      const existingAdjustment = transactions.find(
        (t) => t.name === "Starting Balance Adjustment"
      );

      if (existingAdjustment) {
        // Compute current balance without this adjustment
        const adjustmentAmountSigned =
          existingAdjustment.type === "income"
            ? existingAdjustment.amount
            : -existingAdjustment.amount;
        const baseBalance = balance - adjustmentAmountSigned;
        const newAmountSigned = targetBalance - baseBalance;

        const updates: { amount: number; type: "income" | "expense" } = {
          amount: Math.abs(newAmountSigned),
          type: newAmountSigned >= 0 ? "income" : "expense",
        };
        await updateTransaction(existingAdjustment.id, updates);
      } else {
        // No existing adjustment, calculate difference against current balance
        const newAmountSigned = targetBalance - balance;
        await addTransaction({
          name: "Starting Balance Adjustment",
          amount: Math.abs(newAmountSigned),
          type: newAmountSigned >= 0 ? "income" : "expense",
          category: "Savings",
          date: new Date().toISOString().split("T")[0],
        });
      }
      onClose();
    } catch (err) {
      console.error("Failed to update starting balance adjustment:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="bg-[#0f172a] w-full max-w-md rounded-2xl border border-white/10 shadow-[0_0_50px_rgba(139,92,246,0.1)] flex flex-col overflow-hidden text-slate-100"
      >
        {/* Header */}
        <div className="bg-[#1e293b]/50 p-6 border-b border-white/10 flex items-center justify-between relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Adjust Balance</h2>
              <p className="text-slate-400 text-xs mt-0.5">Set your real-world wallet/bank balance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white rounded-lg p-1.5 hover:bg-white/5 transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-6 space-y-6">
          <div className="space-y-2">
            <label htmlFor="target-balance" className="text-sm font-semibold text-slate-300">
              What is your current bank/wallet balance?
            </label>
            <div className="relative rounded-xl border border-white/10 bg-[#1e293b]/20 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/25 transition-all overflow-hidden flex items-center px-4 py-3">
              <span className="text-2xl font-semibold text-primary mr-2">
                {currency === "INR" ? "₹" : "$"}
              </span>
              <input
                id="target-balance"
                type="number"
                step="any"
                required
                className="bg-transparent border-0 outline-none w-full text-2xl font-bold tracking-tight text-white placeholder-slate-500 focus:ring-0 p-0"
                placeholder="0.00"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-[#1e293b]/40 border border-white/5 rounded-xl p-4 text-xs text-slate-400 leading-relaxed">
            This will calculate the difference between your target balance and the current app balance, inserting or updating a <strong className="text-slate-300 font-medium">Starting Balance Adjustment</strong> transaction to align them instantly.
          </div>

          {/* Footer Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSaving}
              onClick={onClose}
              className="w-full h-11 border-white/10 text-slate-300 hover:text-white hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="w-full h-11 bg-primary hover:bg-primary text-white font-semibold flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Adjust Balance
                </>
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
