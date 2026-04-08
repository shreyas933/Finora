"use client";

import { useState } from "react";
import { useFinance } from "@/context/FinanceContext";
import { formatCurrency, cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Target, AlertTriangle, CheckCircle2, Plus } from "lucide-react";
import { differenceInMonths } from "date-fns";

export default function GoalsPage() {
  const { goals, addGoal, monthlyIncome, savingsRate } = useFinance();
  const [isAdding, setIsAdding] = useState(false);
  const [newGoal, setNewGoal] = useState({ name: "", targetAmount: "", targetDate: "" });

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
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="text-lg">Create New Goal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-4 items-end">
              <div className="space-y-2">
                <label className="text-sm font-medium">Goal Name</label>
                <Input placeholder="e.g. New Car" value={newGoal.name} onChange={e => setNewGoal({...newGoal, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Target Amount (₹)</label>
                <Input type="number" placeholder="500000" value={newGoal.targetAmount} onChange={e => setNewGoal({...newGoal, targetAmount: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Target Date</label>
                <Input type="date" value={newGoal.targetDate} onChange={e => setNewGoal({...newGoal, targetDate: e.target.value})} />
              </div>
              <Button onClick={handleAddGoal}>Save Goal</Button>
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

          return (
            <Card key={goal.id} className={cn("relative overflow-hidden", isOffTrack ? "border-amber-500/50" : "")}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <Target className="h-5 w-5" />
                  </div>
                  {progress >= 100 ? (
                    <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded">
                      <CheckCircle2 className="h-3 w-3" /> Reached
                    </span>
                  ) : isOffTrack ? (
                    <span className="text-xs font-semibold text-amber-500 flex items-center gap-1 bg-amber-500/10 px-2 py-1 rounded">
                      <AlertTriangle className="h-3 w-3" /> Off Track
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded">
                      On Track
                    </span>
                  )}
                </div>
                <CardTitle className="text-xl mt-4">{goal.name}</CardTitle>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold">{formatCurrency(goal.current_amount)}</span>
                  <span className="text-sm text-muted-foreground">/ {formatCurrency(goal.target_amount)}</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mt-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Progress</span>
                    <span className="font-medium">{progress.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div 
                      className={cn("h-full transition-all", progress >= 100 ? "bg-emerald-500" : "bg-primary")} 
                      style={{ width: `${progress}%` }} 
                    />
                  </div>
                </div>

                <div className="mt-6 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Target Date</span>
                    <span className="font-medium">{new Date(goal.target_date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
                  </div>
                  {progress < 100 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">To save monthly</span>
                      <span className={cn("font-medium", isOffTrack ? "text-amber-500" : "")}>{formatCurrency(requiredMonthly)}</span>
                    </div>
                  )}
                </div>

                {isOffTrack && progress < 100 && (
                  <div className="mt-4 p-3 rounded bg-amber-500/10 text-xs text-amber-500">
                    Suggestion: You need to increase your savings rate from {savingsRate.toFixed(1)}% to {((requiredMonthly / monthlyIncome) * 100).toFixed(1)}% to hit this goal on time, or extend the deadline.
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
