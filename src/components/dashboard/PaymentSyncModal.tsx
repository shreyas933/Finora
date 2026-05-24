"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, Loader2, Zap, Smartphone, Globe, BellRing, RefreshCw, ChevronRight, Wifi, WifiOff } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

// ─── Simulated GPay notification strings ──────────────────────────────────────
const SAMPLE_NOTIFICATIONS = [
  "\u20B9450 paid to Zomato via UPI. UPI Ref: 412938201. HDFC Bank",
  "\u20B91,250 paid to Amazon.in via UPI. Ref: 509128374. ICICI Bank",
  "\u20B985 paid to Uber via UPI. Ref: 301927465. SBI",
  "\u20B9340 paid to Swiggy via UPI. Ref: 612039812. Axis Bank",
  "\u20B92,800 paid to MakeMyTrip via UPI. Ref: 718293041. HDFC Bank",
  "\u20B9199 paid to Netflix via UPI. Ref: 823910472. Kotak Bank",
  "\u20B9550 paid to Myntra via UPI. Ref: 934812039. ICICI Bank",
];

type SyncedTx = {
  id: string;
  name: string;
  amount: number;
  category: string;
  type: string;
  timestamp: Date;
};

type Props = { onClose: () => void };

export function PaymentSyncModal({ onClose }: Props) {
  const [activeTab, setActiveTab] = useState<"android" | "ios">("android");
  const [syncLog, setSyncLog] = useState<SyncedTx[]>([]);
  const [simulating, setSimulating] = useState(false);
  const [simStatus, setSimStatus] = useState<"idle" | "parsing" | "saving" | "done" | "error">("idle");
  const [simMessage, setSimMessage] = useState("");
  const [androidConnected] = useState(true); // demo: show as connected
  const supabase = createClient();
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [syncLog]);

  const runSimulation = async () => {
    if (simulating) return;
    setSimulating(true);
    setSimStatus("parsing");

    const raw = SAMPLE_NOTIFICATIONS[Math.floor(Math.random() * SAMPLE_NOTIFICATIONS.length)];
    setSimMessage(`Intercepted: "${raw}"`);

    try {
      // Step 1: Categorize via Gemini
      const categorizeRes = await fetch("/api/sync/categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw }),
      });

      if (!categorizeRes.ok) throw new Error("Gemini parsing failed");
      const { transaction } = await categorizeRes.json();

      setSimStatus("saving");
      setSimMessage(`AI parsed: ${transaction.name} • ${transaction.category}`);

      // Step 2: Get current user and ingest
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await fetch("/api/sync/ingest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, transaction }),
        });
      }

      // Add to local log
      const newEntry: SyncedTx = {
        id: crypto.randomUUID(),
        ...transaction,
        timestamp: new Date(),
      };
      setSyncLog(prev => [newEntry, ...prev].slice(0, 10));
      setSimStatus("done");
      setSimMessage(`✓ "${transaction.name}" logged to FINORA!`);

      // Reset after 3s
      setTimeout(() => {
        setSimStatus("idle");
        setSimMessage("");
      }, 3000);
    } catch (err) {
      setSimStatus("error");
      setSimMessage("Failed to process. Check your API key.");
      setTimeout(() => { setSimStatus("idle"); setSimMessage(""); }, 4000);
    } finally {
      setSimulating(false);
    }
  };

  const statusColors: Record<string, string> = {
    idle: "text-slate-400",
    parsing: "text-violet-400",
    saving: "text-blue-400",
    done: "text-emerald-400",
    error: "text-red-400",
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25 }}
          className="relative w-full max-w-lg rounded-2xl overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(15,12,41,0.98) 0%, rgba(20,16,60,0.98) 100%)",
            border: "1px solid rgba(139,92,246,0.3)",
            boxShadow: "0 25px 60px rgba(0,0,0,0.6), 0 0 40px rgba(139,92,246,0.1)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-violet-500/20">
                <Zap className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Payment Sync Hub</h2>
                <p className="text-xs text-slate-400">Auto-capture Google Pay transactions</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors text-slate-400 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Tab Bar */}
          <div className="flex gap-1 p-3 border-b border-white/10 bg-black/20">
            {(["android", "ios"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  activeTab === tab
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-500/30"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {tab === "android" ? <Smartphone className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                {tab === "android" ? "Android (Real-time)" : "iOS (Bank Sync)"}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-5 space-y-5 max-h-[60vh] overflow-y-auto">

            {/* ─── ANDROID TAB ─── */}
            {activeTab === "android" && (
              <div className="space-y-4">
                {/* Status */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${androidConnected ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {androidConnected ? "Google Pay — Listening" : "Not Connected"}
                      </p>
                      <p className="text-xs text-slate-400">Notification listener active</p>
                    </div>
                  </div>
                  {androidConnected ? (
                    <Wifi className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-slate-500" />
                  )}
                </div>

                {/* How it works */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">How It Works</p>
                  {[
                    { icon: BellRing, label: "FINORA reads your Google Pay notification", sub: "e.g. \u20B9450 paid to Zomato via UPI" },
                    { icon: Zap, label: "Gemini AI extracts merchant, amount & category", sub: "100% on-server, no data stored" },
                    { icon: CheckCircle2, label: "Transaction auto-logged in your dashboard", sub: "Budget rings & Safe-to-Spend update instantly" },
                  ].map(({ icon: Icon, label, sub }, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
                      <div className="p-1.5 rounded-lg bg-violet-500/20 mt-0.5 shrink-0">
                        <Icon className="h-3.5 w-3.5 text-violet-400" />
                      </div>
                      <div>
                        <p className="text-sm text-white font-medium">{label}</p>
                        <p className="text-xs text-slate-400">{sub}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Simulate button */}
                <div className="space-y-2">
                  <button
                    onClick={runSimulation}
                    disabled={simulating}
                    className="w-full py-3 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold flex items-center justify-center gap-2 transition-all duration-200 shadow-lg shadow-violet-500/30"
                  >
                    {simulating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    {simulating ? "Processing..." : "⚡ Simulate a Google Pay Transaction"}
                  </button>
                  {simMessage && (
                    <p className={`text-xs text-center font-medium ${statusColors[simStatus]}`}>
                      {simMessage}
                    </p>
                  )}
                </div>

                {/* Live log */}
                {syncLog.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Auto-Synced Transactions</p>
                    <div className="space-y-2">
                      {syncLog.map((tx) => (
                        <motion.div
                          key={tx.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
                        >
                          <div>
                            <p className="text-sm font-semibold text-white">{tx.name}</p>
                            <p className="text-xs text-slate-400">{tx.category} • {tx.timestamp.toLocaleTimeString()}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-red-400">−\u20B9{tx.amount}</span>
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    <div ref={logEndRef} />
                  </div>
                )}
              </div>
            )}

            {/* ─── iOS TAB ─── */}
            {activeTab === "ios" && (
              <div className="space-y-4">
                {/* Warning notice */}
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                  <Globe className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-300">iOS Limitation</p>
                    <p className="text-xs text-slate-300 mt-1">
                      Apple does not allow apps to read notifications from other apps. On iOS, FINORA connects to your <strong>bank account directly</strong> via a secure aggregator API (similar to how apps like Cred, Fi, and Jupiter work).
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">How iOS Bank Sync Works</p>
                  {[
                    { step: "1", label: "Connect your bank via Account Aggregator", sub: "Setu AA (India) or Plaid (US/UK) — RBI approved & secure" },
                    { step: "2", label: "FINORA receives transaction webhooks", sub: "When your Google Pay charge clears the bank, we're notified" },
                    { step: "3", label: "Gemini AI categorizes and logs the transaction", sub: "Usually syncs within 1–4 hours of the payment" },
                  ].map(({ step, label, sub }) => (
                    <div key={step} className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
                      <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-blue-400">{step}</span>
                      </div>
                      <div>
                        <p className="text-sm text-white font-medium">{label}</p>
                        <p className="text-xs text-slate-400">{sub}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Provider tiles */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Supported Providers</p>
                  {[
                    { name: "Setu Account Aggregator", region: "India (UPI/NEFT)", status: "Ready to Connect", color: "blue" },
                    { name: "Plaid Link", region: "US / UK / Canada", status: "Ready to Connect", color: "green" },
                    { name: "Razorpay Webhook", region: "India (Business)", status: "Ready to Connect", color: "violet" },
                  ].map((p) => (
                    <button
                      key={p.name}
                      className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
                    >
                      <div className="text-left">
                        <p className="text-sm font-semibold text-white">{p.name}</p>
                        <p className="text-xs text-slate-400">{p.region}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">{p.status}</span>
                        <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-white transition-colors" />
                      </div>
                    </button>
                  ))}
                </div>

                {/* Simulate for iOS too */}
                <div className="space-y-2">
                  <button
                    onClick={runSimulation}
                    disabled={simulating}
                    className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold flex items-center justify-center gap-2 transition-all duration-200 shadow-lg shadow-blue-500/30"
                  >
                    {simulating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    {simulating ? "Processing..." : "⚡ Simulate a Bank Webhook"}
                  </button>
                  {simMessage && (
                    <p className={`text-xs text-center font-medium ${statusColors[simStatus]}`}>
                      {simMessage}
                    </p>
                  )}
                </div>

                {/* Live log */}
                {syncLog.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Auto-Synced Transactions</p>
                    <div className="space-y-2">
                      {syncLog.map((tx) => (
                        <motion.div
                          key={tx.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
                        >
                          <div>
                            <p className="text-sm font-semibold text-white">{tx.name}</p>
                            <p className="text-xs text-slate-400">{tx.category} • {tx.timestamp.toLocaleTimeString()}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-red-400">−\u20B9{tx.amount}</span>
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    <div ref={logEndRef} />
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
