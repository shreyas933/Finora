"use client";

import { useFinance } from "@/context/FinanceContext";
import { useCurrency } from "@/context/CurrencyContext";
import { formatCurrency } from "@/lib/utils";
import { StatusChip } from "@/components/v2/ui/StatusChip";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";
import { CreditCard, ExternalLink, ChevronDown } from "lucide-react";

interface WalletCard {
  id: string;
  bank: string;
  type: "credit" | "debit";
  lastFour: string;
  limit?: number;
  used?: number;
  dueDate?: string;
  color?: string;
  network?: string;
}

const CARD_GRADIENTS = [
  "from-[#1A0000] via-[#3D0000] to-[#000]",
  "from-[#000814] via-[#001d3d] to-[#000]",
  "from-[#0a0a0a] via-[#1a1a1a] to-[#000]",
  "from-[#0f0c29] via-[#302b63] to-[#24243e]",
];

function CardVisual({ card, index, isActive, onClick }: {
  card: WalletCard;
  index: number;
  isActive: boolean;
  onClick: () => void;
}) {
  const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length];
  const utilPct = card.limit && card.used ? Math.round((card.used / card.limit) * 100) : null;

  return (
    <motion.div
      onClick={onClick}
      layout
      animate={{
        y: isActive ? 0 : index * 12,
        scale: isActive ? 1 : 1 - index * 0.025,
        zIndex: isActive ? 10 : 10 - index,
        rotateZ: isActive ? 0 : index * -1.2,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className={`w-full h-44 rounded-2xl bg-gradient-to-br ${gradient} border border-[#2A2A2A] cursor-pointer select-none relative overflow-hidden`}
      style={{ boxShadow: isActive ? "0 20px 50px rgba(0,0,0,0.8)" : "none" }}
    >
      {/* Shimmer overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      {/* Top */}
      <div className="absolute top-5 left-5 right-5 flex items-start justify-between">
        <div>
          <p className="text-[9px] text-white/40 uppercase tracking-[0.2em] font-bold">{card.bank}</p>
          <p className="text-sm font-bold text-white mt-0.5">{card.type === "credit" ? "Credit" : "Debit"}</p>
        </div>
        <CreditCard className="w-5 h-5 text-white/30" />
      </div>
      {/* Card number */}
      <div className="absolute bottom-14 left-5">
        <p className="font-mono text-sm text-white/50 tracking-[0.2em]">
          •••• •••• •••• {card.lastFour || "0000"}
        </p>
      </div>
      {/* Bottom row */}
      <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between">
        <div>
          {card.dueDate && (
            <>
              <p className="text-[8px] text-white/30 uppercase tracking-wide">Due</p>
              <p className="text-xs font-bold text-white">{card.dueDate}</p>
            </>
          )}
        </div>
        {utilPct !== null && (
          <div className="text-right">
            <p className="text-[8px] text-white/30 uppercase tracking-wide">Utilization</p>
            <p className={`text-xs font-bold ${utilPct > 30 ? "text-amber-400" : "text-emerald-400"}`}>
              {utilPct}%
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function CreditV2() {
  const { transactions, monthlyExpenses } = useFinance();
  const { currency } = useCurrency();
  const [cards, setCards] = useState<WalletCard[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [deckExpanded, setDeckExpanded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("finora_wallet_items");
    if (saved) {
      try { setCards(JSON.parse(saved)); } catch { /* ignore */ }
    }
  }, []);

  const activeCard = cards[activeIdx];

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <span className="text-5xl">💳</span>
        <p className="text-[#525252] text-sm">No cards added yet</p>
        <Link href="/credit" className="px-4 py-2 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs font-bold hover:bg-primary/20 transition-colors">
          Add cards in original UI →
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      {/* LEFT — Physical card stack */}
      <div className="lg:w-[45%] flex flex-col gap-4">
        <div>
          <p className="text-[9px] uppercase tracking-widest text-[#525252] font-bold">Cards</p>
          <h2 className="text-xl font-black tracking-tight text-white">{cards.length} Card{cards.length !== 1 ? "s" : ""}</h2>
        </div>

        {/* Stack / fan */}
        <div
          className="relative cursor-pointer"
          style={{ height: deckExpanded ? cards.length * 60 + 176 : 176 + 24 }}
          onClick={() => setDeckExpanded(v => !v)}
        >
          {deckExpanded ? (
            <div className="flex flex-col gap-2">
              {cards.map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`w-full h-44 rounded-2xl bg-gradient-to-br ${CARD_GRADIENTS[i % CARD_GRADIENTS.length]} border cursor-pointer relative overflow-hidden
                    ${activeIdx === i ? "border-primary/50" : "border-[#2A2A2A]"}
                  `}
                  onClick={(e) => { e.stopPropagation(); setActiveIdx(i); setDeckExpanded(false); }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                  <div className="absolute top-5 left-5">
                    <p className="text-[9px] text-white/40 uppercase tracking-[0.2em] font-bold">{c.bank}</p>
                    <p className="text-sm font-bold text-white mt-0.5">{c.type === "credit" ? "Credit" : "Debit"}</p>
                  </div>
                  <div className="absolute bottom-5 left-5">
                    <p className="font-mono text-sm text-white/50 tracking-[0.2em]">•••• •••• •••• {c.lastFour}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            /* Stacked deck */
            <div className="relative" style={{ height: 176 }}>
              {[...cards].reverse().map((c, rIdx) => {
                const i = cards.length - 1 - rIdx;
                const isActive = i === activeIdx;
                return (
                  <motion.div
                    key={c.id}
                    onClick={(e) => { e.stopPropagation(); setActiveIdx(i); }}
                    className="absolute w-full"
                    animate={{
                      top: isActive ? 0 : rIdx * 8,
                      scale: isActive ? 1 : 1 - rIdx * 0.025,
                      zIndex: isActive ? 10 : rIdx,
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 28 }}
                  >
                    <div className={`w-full h-44 rounded-2xl bg-gradient-to-br ${CARD_GRADIENTS[i % CARD_GRADIENTS.length]} border ${isActive ? "border-primary/40" : "border-[#2A2A2A]"} relative overflow-hidden`}>
                      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
                      {isActive && (
                        <>
                          <div className="absolute top-5 left-5 right-5 flex items-start justify-between">
                            <div>
                              <p className="text-[9px] text-white/40 uppercase tracking-[0.2em] font-bold">{c.bank}</p>
                              <p className="text-sm font-bold text-white mt-0.5">{c.type === "credit" ? "Credit" : "Debit"}</p>
                            </div>
                            <CreditCard className="w-5 h-5 text-white/30" />
                          </div>
                          <div className="absolute bottom-5 left-5">
                            <p className="font-mono text-sm text-white/50 tracking-[0.2em]">•••• •••• •••• {c.lastFour || "0000"}</p>
                          </div>
                        </>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
          <button className="flex items-center gap-1 mt-2 text-[10px] text-[#525252] hover:text-[#A3A3A3] transition-colors">
            <ChevronDown className={`w-3 h-3 transition-transform ${deckExpanded ? "rotate-180" : ""}`} />
            {deckExpanded ? "Stack cards" : `${cards.length} cards — tap to fan`}
          </button>
        </div>

        {/* Card selector dots */}
        {cards.length > 1 && !deckExpanded && (
          <div className="flex items-center gap-2">
            {cards.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIdx(i)}
                className={`rounded-full transition-all ${i === activeIdx ? "w-4 h-1.5 bg-primary" : "w-1.5 h-1.5 bg-[#2A2A2A]"}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* RIGHT — Card details */}
      <div className="lg:flex-1 flex flex-col gap-3">
        {activeCard && (
          <>
            <div>
              <p className="text-[9px] uppercase tracking-widest text-[#525252] font-bold">
                {activeCard.bank} {activeCard.type === "credit" ? "Credit" : "Debit"} ···{activeCard.lastFour}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <StatusChip
                  label={activeCard.type === "credit" ? "Credit" : "Debit"}
                  variant={activeCard.type === "credit" ? "warning" : "info"}
                />
              </div>
            </div>

            {activeCard.limit && activeCard.used !== undefined && (
              <div className="rounded-xl border border-[#1E1E1E] bg-[#0A0A0A] p-4 space-y-3">
                <p className="text-[9px] uppercase tracking-widest text-[#525252] font-bold">Credit Utilisation</p>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="font-mono text-2xl font-bold text-white">{formatCurrency(activeCard.used, currency)}</p>
                    <p className="text-[10px] text-[#525252]">used of {formatCurrency(activeCard.limit, currency)}</p>
                  </div>
                  <StatusChip
                    label={`${Math.round((activeCard.used / activeCard.limit) * 100)}%`}
                    variant={activeCard.used / activeCard.limit > 0.3 ? "warning" : "success"}
                  />
                </div>
                <div className="h-1.5 bg-[#1E1E1E] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((activeCard.used / activeCard.limit) * 100, 100)}%` }}
                    transition={{ duration: 0.8 }}
                    className={`h-full rounded-full ${activeCard.used / activeCard.limit > 0.3 ? "bg-amber-400" : "bg-emerald-500"}`}
                  />
                </div>
                <p className="text-[9px] text-[#525252]">Keep below 30% for best credit score impact</p>
              </div>
            )}

            {/* Link to full credit page */}
            <Link
              href="/credit"
              className="flex items-center justify-between p-3.5 rounded-xl border border-[#1E1E1E] bg-[#0A0A0A] hover:border-[#2A2A2A] transition-colors group"
            >
              <span className="text-xs font-semibold text-[#A3A3A3] group-hover:text-white transition-colors">
                View perks, CIBIL score & full details
              </span>
              <ExternalLink className="w-3.5 h-3.5 text-[#525252] group-hover:text-primary transition-colors" />
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
