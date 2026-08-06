"use client";

import { useFinance } from "@/context/FinanceContext";
import { useCurrency } from "@/context/CurrencyContext";
import { formatCurrency } from "@/lib/utils";
import { StatusChip } from "@/components/v2/ui/StatusChip";
import { motion } from "framer-motion";
import Link from "next/link";
import { Plus } from "lucide-react";

// Trajectory Arc SVG — curved road showing progress position
function TrajectoryArc({ pct }: { pct: number }) {
  const clamped = Math.max(0, Math.min(100, pct));
  // Arc from left to right, dot position follows the arc
  const t = clamped / 100;
  // Bezier: P0=(4,40), P1=(60,4), P2=(116,40)
  const x = Math.round((1 - t) * (1 - t) * 4 + 2 * (1 - t) * t * 60 + t * t * 116);
  const y = Math.round((1 - t) * (1 - t) * 40 + 2 * (1 - t) * t * 4 + t * t * 40);

  const isGood = clamped >= 50;

  return (
    <svg viewBox="0 0 120 44" fill="none" className="w-full h-10">
      {/* Track */}
      <path d="M4,40 Q60,4 116,40" stroke="#1E1E1E" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Progress segment */}
      <path
        d={`M4,40 Q${Math.round(4 + t * 56)},${Math.round(40 - t * 36)} ${x},${y}`}
        stroke={isGood ? "#22c55e" : "#eab308"}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      {/* Dot */}
      <circle cx={x} cy={y} r="4" fill={isGood ? "#22c55e" : "#eab308"} />
      <circle cx={x} cy={y} r="7" fill={isGood ? "#22c55e" : "#eab308"} fillOpacity="0.15" />
      {/* Labels */}
      <text x="4" y="44" fontSize="6" fill="#525252">Now</text>
      <text x="92" y="44" fontSize="6" fill="#525252">Target</text>
    </svg>
  );
}

const GOAL_EMOJIS: Record<string, string> = {
  house: "🏠", home: "🏠", rent: "🏠",
  car: "🚗", vehicle: "🚗",
  trip: "✈️", travel: "✈️", vacation: "🏖️", tour: "✈️",
  laptop: "💻", computer: "💻", phone: "📱",
  wedding: "💍", marriage: "💍",
  education: "🎓", study: "🎓",
  emergency: "🛡️", fund: "🛡️",
  default: "🎯",
};

function getGoalEmoji(name: string) {
  const lower = name.toLowerCase();
  return Object.entries(GOAL_EMOJIS).find(([key]) => lower.includes(key))?.[1] ?? GOAL_EMOJIS.default;
}

export default function GoalsV2() {
  const { goals } = useFinance();
  const { currency } = useCurrency();

  const totalSaved = goals.reduce((a, g) => a + g.current_amount, 0);
  const totalTarget = goals.reduce((a, g) => a + g.target_amount, 0);
  const overallPct = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  const completed = goals.filter(g => g.current_amount >= g.target_amount);
  const active = goals.filter(g => g.current_amount < g.target_amount);

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      {/* LEFT — Hero aggregate */}
      <div className="lg:w-[38%] flex flex-col gap-3">
        <div>
          <p className="text-[9px] uppercase tracking-widest text-[#525252] font-bold">Goals</p>
          <h2 className="text-xl font-black tracking-tight text-white">Savings Targets</h2>
        </div>

        {/* Aggregate hero */}
        <div className="rounded-xl border border-[#1E1E1E] bg-gradient-to-br from-[#0A0A0A] to-[#000] p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
          <p className="text-[9px] uppercase tracking-widest text-[#525252] font-bold mb-1">Total Saved</p>
          <p className="font-mono text-3xl font-black text-white">{formatCurrency(totalSaved, currency)}</p>
          <p className="text-[10px] text-[#525252] mt-1">
            {goals.length} goals · {overallPct}% overall
          </p>

          <div className="mt-4 h-1 bg-[#1E1E1E] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${overallPct}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-primary via-emerald-500 to-emerald-400"
            />
          </div>
          <div className="flex justify-between mt-1 text-[9px] text-[#525252]">
            <span>{formatCurrency(totalSaved, currency)}</span>
            <span>{formatCurrency(totalTarget, currency)}</span>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-[#1E1E1E] bg-[#0A0A0A] p-3">
            <p className="text-[9px] text-[#525252] uppercase tracking-wide">Active</p>
            <p className="font-mono text-2xl font-bold text-white">{active.length}</p>
          </div>
          <div className="rounded-xl border border-[#1E1E1E] bg-[#0A0A0A] p-3">
            <p className="text-[9px] text-[#525252] uppercase tracking-wide">Completed</p>
            <p className="font-mono text-2xl font-bold text-emerald-400">{completed.length}</p>
          </div>
        </div>

        {/* Completed goals */}
        {completed.length > 0 && (
          <div className="rounded-xl border border-[#1E1E1E] bg-[#0A0A0A] p-4">
            <p className="text-[9px] uppercase tracking-widest text-[#525252] font-bold mb-3">Completed 🎉</p>
            <div className="flex flex-col gap-2">
              {completed.map(g => (
                <div key={g.id} className="flex items-center gap-2">
                  <span className="text-lg">{getGoalEmoji(g.name)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-emerald-400 truncate">{g.name}</p>
                    <p className="text-[9px] text-[#525252]">{formatCurrency(g.current_amount, currency)}</p>
                  </div>
                  <StatusChip label="Done!" variant="success" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT — Active goal cards */}
      <div className="lg:flex-1 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-[9px] uppercase tracking-widest text-[#525252] font-bold">Active Goals</p>
          <Link
            href="/goals"
            className="flex items-center gap-1 text-[10px] text-primary font-bold hover:underline"
          >
            <Plus className="w-3 h-3" /> Add Goal
          </Link>
        </div>

        {active.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center rounded-xl border border-[#1E1E1E] bg-[#0A0A0A] gap-3 py-12">
            <span className="text-4xl">🎯</span>
            <p className="text-sm text-[#525252]">No active goals</p>
            <Link href="/goals" className="text-xs text-primary font-bold hover:underline">
              + Create your first goal
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {active.map((goal, i) => {
              const pct = Math.round((goal.current_amount / goal.target_amount) * 100);
              const isOnTrack = pct >= 50;
              const deadline = goal.target_date
                ? new Date(goal.target_date).toLocaleDateString("en-IN", { month: "short", year: "numeric" })
                : null;
              const remaining = goal.target_amount - goal.current_amount;

              return (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="rounded-xl border border-[#1E1E1E] bg-[#0A0A0A] p-4 hover:border-[#2A2A2A] transition-colors"
                >
                  {/* Top row */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-[#111] border border-[#1E1E1E] flex items-center justify-center text-xl">
                      {getGoalEmoji(goal.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{goal.name}</p>
                      <p className="text-[9px] text-[#525252]">
                        {deadline ? `Target: ${deadline}` : "No deadline set"}
                      </p>
                    </div>
                    <StatusChip
                      label={isOnTrack ? "On Track" : "Off Track"}
                      variant={isOnTrack ? "success" : "warning"}
                    />
                  </div>

                  {/* Trajectory arc */}
                  <TrajectoryArc pct={pct} />

                  {/* Progress bar */}
                  <div className="mt-2 h-1 bg-[#1E1E1E] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className={`h-full rounded-full ${isOnTrack ? "bg-emerald-500" : "bg-amber-400"}`}
                    />
                  </div>

                  {/* Amount row */}
                  <div className="flex justify-between mt-2 text-[10px]">
                    <div>
                      <span className="text-[#525252]">Saved </span>
                      <span className="font-mono font-bold text-white">{formatCurrency(goal.current_amount, currency)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[#525252]">Still need </span>
                      <span className="font-mono font-bold text-[#A3A3A3]">{formatCurrency(remaining, currency)}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
