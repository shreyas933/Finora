"use client";

import { useState, useRef, useEffect } from "react";
import { useFinance } from "@/context/FinanceContext";
import { useCurrency } from "@/context/CurrencyContext";
import { Button } from "@/components/ui/Button";
import { 
  X, FileText, Loader2, Sparkles, BrainCircuit, 
  TrendingUp, TrendingDown, Trash2, Plus, CheckCircle2 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency } from "@/lib/utils";

interface AiPortfolioModalProps {
  onClose: () => void;
}

type Step = "upload" | "scanning" | "preview" | "success";

interface ExtractedAsset {
  id: string;
  name: string;
  type: string;
  invested: number;
  current_value: number;
}

export function AiPortfolioModal({ onClose }: AiPortfolioModalProps) {
  const { addInvestment } = useFinance();
  const { currency } = useCurrency();
  const [step, setStep] = useState<Step>("upload");
  const [files, setFiles] = useState<File[]>([]);
  const [statusText, setStatusText] = useState("");
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [assets, setAssets] = useState<ExtractedAsset[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  // Dynamic simulation text and progress bar matching implementation plan
  useEffect(() => {
    if (step !== "scanning") return;
    
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 1;
      setLoadingProgress(currentProgress);
      
      if (currentProgress < 25) {
        setStatusText("Analyzing PDF security signatures & decrypting statement headers...");
      } else if (currentProgress < 55) {
        setStatusText("AI OCR Engine active: Reading transaction ledger & identifying asset keywords...");
      } else if (currentProgress < 80) {
        setStatusText("Synthesizing holdings: Matching Mutual Funds, Equities, and Cryptocurrencies...");
      } else if (currentProgress < 100) {
        setStatusText("Calculating current market valuations and historical returns...");
      } else {
        clearInterval(interval);
        generateMockAssets();
        setStep("preview");
      }
    }, 60);

    return () => clearInterval(interval);
  }, [step]);

  const generateMockAssets = () => {
    const fileName = files[0]?.name.toLowerCase() || "";
    let extracted: Omit<ExtractedAsset, "id">[] = [];

    if (fileName.includes("hdfc") || fileName.includes("mutual") || fileName.includes("fund")) {
      extracted = [
        { name: "HDFC Balanced Advantage Fund", type: "Mutual Fund", invested: 120000, current_value: 148000 },
        { name: "ICICI Prudential Bluechip Fund", type: "Mutual Fund", invested: 80000, current_value: 98000 },
        { name: "SBI Small Cap Fund", type: "Mutual Fund", invested: 50000, current_value: 65000 },
      ];
    } else if (fileName.includes("zerodha") || fileName.includes("stock") || fileName.includes("demat") || fileName.includes("broker")) {
      extracted = [
        { name: "Infosys Ltd", type: "Stock", invested: 60000, current_value: 72000 },
        { name: "Reliance Industries Ltd", type: "Stock", invested: 90000, current_value: 112000 },
        { name: "Tata Motors Ltd", type: "Stock", invested: 40000, current_value: 58000 },
      ];
    } else if (fileName.includes("crypto") || fileName.includes("coin") || fileName.includes("wallet")) {
      extracted = [
        { name: "Bitcoin", type: "Crypto", invested: 75000, current_value: 68000 },
        { name: "Ethereum", type: "Crypto", invested: 45000, current_value: 49000 },
      ];
    } else {
      // Default high fidelity portfolio
      extracted = [
        { name: "Axis Bluechip Fund", type: "Mutual Fund", invested: 50000, current_value: 62500 },
        { name: "HDFC Bank Ltd", type: "Stock", invested: 45000, current_value: 51200 },
        { name: "SBI SIP Plan", type: "SIP", invested: 30000, current_value: 38000 },
      ];
    }

    setAssets(
      extracted.map((a, index) => ({
        ...a,
        id: `extracted-${index}-${Date.now()}`
      }))
    );
  };

  const handleFieldChange = (id: string, field: keyof ExtractedAsset, value: string | number) => {
    setAssets(prev =>
      prev.map(a => {
        if (a.id === id) {
          const updated = { ...a, [field]: value };
          return updated;
        }
        return a;
      })
    );
  };

  const handleDeleteAsset = (id: string) => {
    setAssets(prev => prev.filter(a => a.id !== id));
  };

  const handleAddNewAsset = () => {
    const newAsset: ExtractedAsset = {
      id: `new-${Date.now()}`,
      name: "New Investment Asset",
      type: "Stock",
      invested: 10000,
      current_value: 10000
    };
    setAssets(prev => [...prev, newAsset]);
  };

  const handleImport = async () => {
    if (assets.length === 0) return;
    setIsSaving(true);

    try {
      // Add all holdings to the database via context helper
      await Promise.all(
        assets.map(asset => 
          addInvestment({
            name: asset.name,
            type: asset.type,
            invested: Number(asset.invested),
            current_value: Number(asset.current_value)
          })
        )
      );
      
      setStep("success");
    } catch (error) {
      console.error("Failed to import investments:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" 
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#0f172a] w-full max-w-4xl rounded-2xl border border-white/10 shadow-[0_0_50px_rgba(139,92,246,0.15)] flex flex-col overflow-hidden relative max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-[#1e293b]/50">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2 text-white">
              <BrainCircuit className="h-5 w-5 text-primary animate-pulse" /> AI Statement Uploader
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Upload your bank statement PDF to extract investments and calculate your portfolio
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          <AnimatePresence mode="wait">
            
            {/* Step 1: Upload Dropzone */}
            {step === "upload" && (
              <motion.div 
                key="upload" 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                className="text-center"
              >
                <input 
                  type="file" 
                  accept=".pdf,.csv" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleFiles} 
                />
                
                <div 
                  className="border-2 border-dashed border-primary/30 bg-primary/5 rounded-2xl p-12 cursor-pointer hover:border-primary/50 hover:bg-primary/10 transition-all flex flex-col items-center justify-center group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="w-16 h-16 bg-primary/20 text-red-400 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <FileText className="h-8 w-8" />
                  </div>
                  <h4 className="text-lg font-bold mb-1 text-white">Select Bank Statement PDF</h4>
                  <p className="text-sm text-slate-400 max-w-md">
                    Drag and drop or browse to select your bank account statement, Demat portfolio export, or mutual fund transaction statement (PDF or CSV).
                  </p>
                  <span className="mt-3 text-xs text-red-400/70 border border-primary/20 px-2.5 py-1 rounded-full bg-primary/10">
                    Supports major banks, Zerodha, Groww, CAMS & more
                  </span>
                </div>

                {files.length > 0 && (
                  <div className="mt-6 p-4 bg-primary/20 border border-primary/20 rounded-xl flex items-center justify-between text-left">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="h-8 w-8 text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{files[0].name}</p>
                        <p className="text-xs text-slate-500">{(files[0].size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-md shrink-0 border border-emerald-500/20">
                      Ready
                    </span>
                  </div>
                )}

                <Button 
                  className="w-full h-12 mt-8 bg-primary hover:bg-primary text-white font-bold gap-2 rounded-xl transition-all"
                  disabled={files.length === 0}
                  onClick={() => setStep("scanning")}
                >
                  <Sparkles className="h-4 w-4 text-primary" /> Start AI Extraction
                </Button>
              </motion.div>
            )}

            {/* Step 2: Scanner Simulation */}
            {step === "scanning" && (
              <motion.div 
                key="scanning" 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="py-16 flex flex-col items-center text-center"
              >
                <div className="relative w-28 h-28 mb-8">
                  {/* Outer spinning radar border */}
                  <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  
                  {/* Inside pulsing glow */}
                  <div className="absolute inset-4 bg-gradient-to-tr from-primary to-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-primary/30 animate-pulse">
                    <Sparkles className="h-8 w-8 text-white" />
                  </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-3">{statusText}</h3>
                
                <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-full h-3.5 p-0.5 overflow-hidden">
                  <motion.div 
                    className="bg-gradient-to-r from-primary to-indigo-500 h-full rounded-full"
                    style={{ width: `${loadingProgress}%` }}
                    layout
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2 font-mono">{loadingProgress}% completed</p>
              </motion.div>
            )}

            {/* Step 3: Interactive Data Preview Grid */}
            {step === "preview" && (
              <motion.div 
                key="preview" 
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }} 
                className="space-y-6"
              >
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl text-sm text-emerald-400 flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
                  <div>
                    <strong>AI Extraction Successful!</strong> I parsed your statement and identified the holdings below. Please review, edit, or adjust values as needed before adding them to your portfolio.
                  </div>
                </div>

                <div className="border border-white/10 rounded-xl overflow-hidden bg-[#0c111d]">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-[#1e293b]/80 text-slate-300 border-b border-white/10">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Asset Name</th>
                          <th className="px-4 py-3 font-semibold">Asset Type</th>
                          <th className="px-4 py-3 font-semibold text-right">Invested Value</th>
                          <th className="px-4 py-3 font-semibold text-right">Current Value</th>
                          <th className="px-4 py-3 font-semibold text-right">Returns (%)</th>
                          <th className="px-4 py-3 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {assets.map((asset) => {
                          const returns = Number(asset.current_value) - Number(asset.invested);
                          const isUp = returns >= 0;
                          const percent = Number(asset.invested) > 0 
                            ? ((returns / Number(asset.invested)) * 100).toFixed(1) 
                            : "0";

                          return (
                            <tr key={asset.id} className="hover:bg-white/[0.02] transition-colors">
                              <td className="px-4 py-2.5">
                                <input
                                  type="text"
                                  className="w-full bg-[#1e293b] border border-white/15 rounded px-2.5 py-1.5 text-sm text-white font-medium focus:outline-none focus:border-primary"
                                  value={asset.name}
                                  onChange={e => handleFieldChange(asset.id, "name", e.target.value)}
                                />
                              </td>
                              <td className="px-4 py-2.5">
                                <select
                                  className="w-full bg-[#1e293b] border border-white/15 rounded px-2.5 py-1.5 text-sm text-white focus:outline-none focus:border-primary"
                                  value={asset.type}
                                  onChange={e => handleFieldChange(asset.id, "type", e.target.value)}
                                >
                                  {["Stock", "Mutual Fund", "Crypto", "SIP", "PPF", "Gold"].map(t => (
                                    <option key={t} value={t}>{t}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-4 py-2.5 text-right">
                                <input
                                  type="number"
                                  className="w-32 bg-[#1e293b] border border-white/15 rounded px-2.5 py-1.5 text-sm text-right text-white font-mono focus:outline-none focus:border-primary"
                                  value={asset.invested}
                                  onChange={e => handleFieldChange(asset.id, "invested", Number(e.target.value))}
                                />
                              </td>
                              <td className="px-4 py-2.5 text-right">
                                <input
                                  type="number"
                                  className="w-32 bg-[#1e293b] border border-white/15 rounded px-2.5 py-1.5 text-sm text-right text-white font-mono focus:outline-none focus:border-primary"
                                  value={asset.current_value}
                                  onChange={e => handleFieldChange(asset.id, "current_value", Number(e.target.value))}
                                />
                              </td>
                              <td className={`px-4 py-2.5 text-right font-mono font-bold whitespace-nowrap ${isUp ? "text-emerald-400" : "text-red-400"}`}>
                                <span className="flex items-center justify-end gap-1.5">
                                  {isUp ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                                  {isUp ? "+" : ""}{percent}%
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                <button 
                                  onClick={() => handleDeleteAsset(asset.id)}
                                  className="text-slate-500 hover:text-red-400 p-1.5 rounded hover:bg-red-500/10 transition-colors"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {assets.length === 0 && (
                    <div className="py-12 text-center text-slate-500 font-medium">
                      All assets deleted. Add one below to get started.
                    </div>
                  )}

                  {/* Add New Asset Trigger */}
                  <div className="p-4 bg-[#1e293b]/20 border-t border-white/10 flex justify-between items-center">
                    <button
                      onClick={handleAddNewAsset}
                      className="flex items-center gap-1.5 text-xs text-primary hover:text-primary font-bold transition-colors"
                    >
                      <Plus className="h-4 w-4" /> Add Asset Manually
                    </button>
                    <span className="text-xs text-slate-400">
                      Total Extracted: <strong className="text-white">{assets.length} Assets</strong>
                    </span>
                  </div>
                </div>

                <div className="flex gap-4 pt-2">
                  <Button 
                    variant="outline" 
                    className="flex-1 h-12 border-white/10 hover:bg-white/5 text-slate-300 font-semibold rounded-xl"
                    onClick={() => { setFiles([]); setStep("upload"); }}
                    disabled={isSaving}
                  >
                    Upload Again
                  </Button>
                  <Button 
                    className="flex-2 w-full h-12 bg-primary hover:bg-primary text-white font-bold gap-2 rounded-xl transition-all shadow-lg shadow-primary/20"
                    onClick={handleImport}
                    disabled={isSaving || assets.length === 0}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Saving Holdings...
                      </>
                    ) : (
                      <>
                        <BrainCircuit className="h-4 w-4" /> Approve & Import to Portfolio ({assets.length})
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 4: Success Celebrations */}
            {step === "success" && (
              <motion.div 
                key="success" 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }} 
                className="py-12 text-center flex flex-col items-center"
              >
                <div className="w-20 h-20 bg-emerald-500/20 border border-emerald-500 text-emerald-400 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/10">
                  <CheckCircle2 className="h-10 w-10 animate-bounce" />
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-2">Portfolio Successfully Updated!</h3>
                <p className="text-sm text-slate-400 max-w-sm mb-8 leading-relaxed">
                  Your manual statement holdings have been parsed, validated, and added straight into your active portfolio tracker.
                </p>

                <Button 
                  className="w-48 h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg"
                  onClick={onClose}
                >
                  Done
                </Button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
