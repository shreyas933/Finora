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
    <div className="space-y-5 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight" style={{letterSpacing: '-0.02em'}}>Financial Goals</h2>
          <p className="text-muted-foreground text-sm mt-0.5">Track and manage your savings targets.</p>
        </div>
        <Button onClick={() => setIsAdding(!isAdding)} className="gap-2 bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Add Goal
        </Button>
      </div>

      {isAdding && (
        <div className="hero-card p-6">
          <p className="text-sm font-bold mb-4" style={{color: '#f0f4ff'}}>Create New Goal</p>
          <div className="relative z-10">

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
              <Button className="bg-primary hover:bg-primary/90 text-white" onClick={handleAddGoal}>Save Goal</Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {goals.map((goal) => {
          const progress = Math.min(100, (goal.current_amount / goal.target_amount) * 100);
          const monthsLeft = Math.max(1, differenceInMonths(new Date(goal.target_date), new Date()));
          const amountNeeded = goal.target_amount - goal.current_amount;
          const requiredMonthly = amountNeeded / monthsLeft;

          const isOffTrack = requiredMonthly > monthlySavingsCapacity && amountNeeded > 0;

          if (editingGoalId === goal.id) {
            return (
              <div key={goal.id} className="hero-card p-5">
                <div className="relative z-10">
                <p className="text-sm font-bold mb-4 flex justify-between items-center" style={{color: '#f0f4ff'}}>
                  Edit Goal
                  <button className="p-1 rounded hover:bg-white/10" onClick={() => setEditingGoalId(null)}><X className="h-4 w-4" /></button>
                </p>
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
                    <Button onClick={handleUpdateGoal} className="w-full gap-2 bg-primary hover:bg-primary/90 text-white"><Check className="h-4 w-4" /> Save Changes</Button>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div key={goal.id} className="navy-card p-5 relative overflow-hidden group">
              {/* Subtle ambient glow */}
              <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none opacity-40" style={{background: 'radial-gradient(circle at top right, rgba(59,130,246,0.08) 0%, transparent 70%)'}} />
              
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background: 'rgba(129,1,0,0.15)', border: '1px solid rgba(129,1,0,0.2)'}}>
                    <Target className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {progress >= 100 ? (
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Reached
                    </span>
                  ) : isOffTrack ? (
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Off Track
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">On Track</span>
                  )}
                  <button onClick={() => startEditing(goal)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => deleteGoal(goal.id)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-base font-bold mb-1" style={{color: '#f0f4ff'}}>{goal.name}</p>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-2xl font-bold" style={{color: '#f0f4ff'}}>{formatCurrency(goal.current_amount, currency)}</span>
                <span className="text-sm text-muted-foreground">/ {formatCurrency(goal.target_amount, currency)}</span>
              </div>

              {/* Progress bar */}
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-semibold" style={{color: '#f0f4ff'}}>{progress.toFixed(1)}%</span>
              </div>
              <div className="h-2 w-full rounded-full overflow-hidden" style={{background: 'rgba(30,42,58,0.8)'}}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${progress}%`, background: progress >= 100 ? '#22c55e' : progress >= 50 ? '#810100' : '#3b82f6' }}
                />
              </div>

              <div className="mt-4 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Target Date</span>
                  <span className="font-medium" style={{color: '#f0f4ff'}}>{new Date(goal.target_date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
                </div>
                {progress < 100 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Needed/month</span>
                    <span className={cn("font-medium", isOffTrack ? "text-amber-400" : "text-foreground")}>{formatCurrency(requiredMonthly, currency)}</span>
                  </div>
                )}
              </div>

              {isOffTrack && progress < 100 && (
                <div className="mt-3 p-2.5 rounded-lg text-xs" style={{background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.15)', color: '#fbbf24'}}>
                  Increase savings rate to {monthlyIncome > 0 ? ((requiredMonthly / monthlyIncome) * 100).toFixed(1) : "100"}% or extend deadline.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
