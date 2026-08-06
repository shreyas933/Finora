"use client";

import { useState } from "react";
import { useFinance } from "@/context/FinanceContext";
import { useCurrency } from "@/context/CurrencyContext";
import { formatCurrency, cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Target, AlertTriangle, CheckCircle2, Plus, Pencil, Trash2, X, Check } from "lucide-react";
import { differenceInMonths } from "date-fns";

export default function GoalsPage() {
  const { goals, addGoal, updateGoal, deleteGoal, monthlyIncome, savingsRate } = useFinance();
  const { currency } = useCurrency();
  const [isAdding, setIsAdding] = useState(false);
  const [newGoal, setNewGoal] = useState({ name: "", targetAmount: "", targetDate: "" });
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editGoalData, setEditGoalData] = useState({ name: "", targetAmount: "", currentAmount: "", targetDate: "" });

  const monthlySavingsCapacity = (monthlyIncome * savingsRate) / 100;

  const handleAddGoal = () => {
    if (!newGoal.name || !newGoal.targetAmount || !newGoal.targetDate) return;

    addGoal({
      name: newGoal.name,
      target_amount: Number(newGoal.targetAmount),
      current_amount: 0,
      target_date: newGoal.targetDate
    });

    setNewGoal({ name: "", targetAmount: "", targetDate: "" });
    setIsAdding(false);
  };

  const startEditing = (goal: any) => {
    setEditingGoalId(goal.id);
    setEditGoalData({
      name: goal.name,
      targetAmount: goal.target_amount.toString(),
      currentAmount: goal.current_amount.toString(),
      targetDate: new Date(goal.target_date).toISOString().split('T')[0]
    });
  };

  const handleUpdateGoal = async () => {
    if (!editingGoalId) return;
    await updateGoal(editingGoalId, {
      name: editGoalData.name,
      target_amount: Number(editGoalData.targetAmount),
      current_amount: Number(editGoalData.currentAmount),
      target_date: editGoalData.targetDate
    });
    setEditingGoalId(null);
  };

  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Financial Goals</h2>
          <p className="text-muted-foreground">Track and manage your savings targets.</p>
        </div>
        <Button onClick={() => setIsAdding(!isAdding)} className="gap-2">
          <Plus className="h-4 w-4" /> Add Goal
        </Button>
      </div>

      {isAdding && (
        <Card className="border-transparent bg-gradient-to-br from-primary to-secondary text-white">
          <CardHeader>
            <CardTitle className="text-lg text-white">Create New Goal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-4 items-end">
              <div className="space-y-2">
                <label className="text-sm font-medium text-red-100">Goal Name</label>
                <Input className="bg-white/10 border-white/20 text-white placeholder:text-white/50" placeholder="e.g. New Car" value={newGoal.name} onChange={e => setNewGoal({ ...newGoal, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-red-100">Target Amount ({currency})</label>
                <Input className="bg-white/10 border-white/20 text-white placeholder:text-white/50" type="number" placeholder="500000" value={newGoal.targetAmount} onChange={e => setNewGoal({ ...newGoal, targetAmount: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-red-100">Target Date</label>
                <Input className="bg-white/10 border-white/20 text-white" type="date" value={newGoal.targetDate} onChange={e => setNewGoal({ ...newGoal, targetDate: e.target.value })} />
              </div>
              <Button className="bg-white text-primary hover:bg-white/90" onClick={handleAddGoal}>Save Goal</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {goals.map((goal) => {
          const progress = Math.min(100, (goal.current_amount / goal.target_amount) * 100);
          const monthsLeft = Math.max(1, differenceInMonths(new Date(goal.target_date), new Date()));
          const amountNeeded = goal.target_amount - goal.current_amount;
          const requiredMonthly = amountNeeded / monthsLeft;

          const isOffTrack = requiredMonthly > monthlySavingsCapacity && amountNeeded > 0;

          if (editingGoalId === goal.id) {
            return (
              <Card key={goal.id} className="border-transparent bg-gradient-to-br from-primary to-secondary text-white">
                <CardHeader>
                  <CardTitle className="text-lg flex justify-between items-center text-white">
                    Edit Goal
                    <Button variant="ghost" size="sm" className="text-white hover:bg-white/10" onClick={() => setEditingGoalId(null)}><X className="h-4 w-4" /></Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-red-100">Goal Name</label>
                      <Input className="bg-white/10 border-white/20 text-white" value={editGoalData.name} onChange={e => setEditGoalData({ ...editGoalData, name: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-red-100">Current Amount</label>
                        <Input className="bg-white/10 border-white/20 text-white" type="number" value={editGoalData.currentAmount} onChange={e => setEditGoalData({ ...editGoalData, currentAmount: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-red-100">Target Amount</label>
                        <Input className="bg-white/10 border-white/20 text-white" type="number" value={editGoalData.targetAmount} onChange={e => setEditGoalData({ ...editGoalData, targetAmount: e.target.value })} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-red-100">Target Date</label>
                      <Input className="bg-white/10 border-white/20 text-white" type="date" value={editGoalData.targetDate} onChange={e => setEditGoalData({ ...editGoalData, targetDate: e.target.value })} />
                    </div>
                    <Button onClick={handleUpdateGoal} className="w-full gap-2 bg-white text-primary hover:bg-white/90"><Check className="h-4 w-4" /> Save Changes</Button>
                  </div>
                </CardContent>
              </Card>
            );
          }

          // Calculate dynamic progress glow style (20% -> 50% -> 80% -> 100%)
          const glowClass = progress >= 100
            ? "shadow-[0_0_35px_rgba(16,185,129,0.35)] border-emerald-400/60"
            : progress >= 80
            ? "shadow-[0_0_28px_rgba(6,182,212,0.3)] border-cyan-500/50"
            : progress >= 50
            ? "shadow-[0_0_20px_rgba(6,182,212,0.2)] border-cyan-500/35"
            : progress >= 20
            ? "shadow-[0_0_12px_rgba(6,182,212,0.12)] border-cyan-500/20"
            : "shadow-lg border-transparent";

          return (
            <Card key={goal.id} className={cn("relative overflow-hidden group bg-gradient-to-br from-primary to-secondary border text-white transition-all duration-300 hover:-translate-y-0.5", glowClass)}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="p-2 bg-white/20 rounded-lg text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
                    <Target className="h-5 w-5" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 mr-1">
                      <button onClick={() => startEditing(goal)} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => deleteGoal(goal.id)} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {progress >= 100 ? (
                      <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider bg-emerald-500/20 border border-emerald-400/40 px-2.5 py-1 rounded-full flex items-center gap-1 shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                        <CheckCircle2 className="h-3 w-3" /> Reached
                      </span>
                    ) : isOffTrack ? (
                      <span className="text-[10px] font-bold text-yellow-300 uppercase tracking-wider bg-yellow-500/20 border border-yellow-500/30 px-2.5 py-1 rounded-full flex items-center gap-1 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                        <AlertTriangle className="h-3 w-3" /> Off Track
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-cyan-200 uppercase tracking-wider bg-cyan-500/20 border border-cyan-400/30 px-2.5 py-1 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                        On Track
                      </span>
                    )}
                  </div>
                </div>
                <CardTitle className="text-xl mt-4 text-white">{goal.name}</CardTitle>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-white">{formatCurrency(goal.current_amount, currency)}</span>
                  <span className="text-sm text-red-100">/ {formatCurrency(goal.target_amount, currency)}</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mt-4">
                  <div className="flex justify-between text-xs mb-1 text-red-100">
                    <span>Progress</span>
                    <span className="font-medium">{progress.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden bar-ambient-shine">
                    <div
                      className={cn(
                        "h-full transition-all duration-500 rounded-full",
                        progress >= 100
                          ? "bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.6)]"
                          : progress >= 50
                          ? "bg-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                          : "bg-white"
                      )}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="mt-6 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-red-100">Target Date</span>
                    <span className="font-medium text-white">{new Date(goal.target_date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
                  </div>
                  {progress < 100 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-red-100">To save monthly</span>
                      <span className={cn("font-medium text-white", isOffTrack ? "text-yellow-300 font-semibold" : "")}>{formatCurrency(requiredMonthly, currency)}</span>
                    </div>
                  )}
                </div>

                {isOffTrack && progress < 100 && (
                  <div className="mt-4 p-3 rounded-lg bg-red-900/50 border border-red-800/80 text-xs text-red-100 shadow-[0_0_12px_rgba(239,68,68,0.15)]">
                    Suggestion: You need to increase your savings rate from {savingsRate.toFixed(1)}% to {monthlyIncome > 0 ? ((requiredMonthly / monthlyIncome) * 100).toFixed(1) : "100"}% to hit this goal on time, or extend the deadline.
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
