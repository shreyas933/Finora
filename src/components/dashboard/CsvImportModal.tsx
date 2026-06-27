"use client";

import { useState, useRef } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/Button";
import { X, UploadCloud, CheckCircle2, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { formatCurrency, CURRENCIES } from "@/lib/utils";
import { useCurrency } from "@/context/CurrencyContext";

interface ParsedRow {
  date: string;
  name: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  confidence: number;
}

import { categorizeTransaction, extractUserCategories } from "@/lib/categorizationEngine";
import { useFinance } from "@/context/FinanceContext";

// Tries to detect the currency from a CSV row
function detectCurrencyFromRow(row: Record<string, string>): string | null {
  // Look for a "Currency" column
  const currencyVal = row["Currency"] || row["currency"] || row["CCY"] || row["Ccy"];
  if (currencyVal) {
    const code = currencyVal.trim().toUpperCase();
    if (CURRENCIES.find(c => c.code === code)) return code;
  }
  return null;
}

export function CsvImportModal({ 
  onClose, 
  onImport 
}: { 
  onClose: () => void; 
  onImport: (rows: ParsedRow[]) => Promise<void>;
}) {
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [detectedCurrency, setDetectedCurrency] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currency, setCurrency } = useCurrency();
  const { merchantMappings } = useFinance();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const userCategories = extractUserCategories();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows: ParsedRow[] = [];
        let foundCurrency: string | null = null;

        results.data.forEach((rawRow: any) => {
          const row = rawRow as Record<string, string>;

          // ── DATE ──
          // Try common date column names
          const rawDate = row["Date"] || row["Transaction Date"] || row["Trans. Date"] || row["Value Date"] || "";
          let date: string;
          try {
            const parsed = new Date(rawDate);
            date = isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
          } catch {
            date = new Date().toISOString();
          }

          // ── DESCRIPTION ──
          // Try common description column names
          const desc = (
            row["Description"] || 
            row["Narration"] || 
            row["Merchant Name"] ||
            row["Details"] ||
            row["Particulars"] ||
            row["Transaction Description"] ||
            row["Reference"] ||
            ""
          ).trim();

          // Skip rows with no useful description
          if (!desc) return;

          // ── CURRENCY ──
          const rowCurrency = detectCurrencyFromRow(row);
          if (rowCurrency && !foundCurrency) foundCurrency = rowCurrency;

          // ── AMOUNT & TYPE ──
          let amount = 0;
          let txType: "income" | "expense" = "expense";

          // Format: separate Debit/Credit columns (ADCB, HDFC style)
          // Format: separate Debit/Credit columns (ADCB, HDFC style)
          const rawType = (row["Type"] || row["Dr/Cr"] || row["Transaction Type"] || row["Debit/Credit"] || row["Debit/ Credit"] || row["Debit / Credit"] || "").toLowerCase().trim();
          const debitVal = parseFloat((row["Debit"] || "").replace(/,/g, "")) || 0;
          const creditVal = parseFloat((row["Credit"] || "").replace(/,/g, "")) || 0;
          const rawAmount = (row["Amount"] || row["amount"] || "").replace(/,/g, "");

          if (rawType === "credit" || rawType === "cr" || rawType === "income") {
            // The "Type" column strictly says Credit or Income
            amount = parseFloat(rawAmount) || creditVal;
            txType = "income";
          } else if (rawType === "debit" || rawType === "dr" || rawType === "expense") {
            // The "Type" column strictly says Debit or Expense
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

          // If the CSV provides an explicit Category column, attempt to respect and standardize it
          const rawCategory = row["Category"] || row["category"] || "";
          let finalCategory = "";
          let finalConfidence = 0;

          if (rawCategory && rawCategory.trim().toLowerCase() !== "other") {
            const c = rawCategory.trim();
            if (c.includes("Food")) finalCategory = "Food";
            else if (c.includes("Rent") || c.includes("Utilit")) finalCategory = "Housing";
            else if (c.includes("Health")) finalCategory = "Healthcare";
            else if (c.includes("Invest")) finalCategory = "Savings";
            else finalCategory = c;
            finalConfidence = 1.0;
          } else {
            const result = categorizeTransaction(desc, txType, merchantMappings, userCategories);
            finalCategory = result.category;
            finalConfidence = result.confidence;
          }

          rows.push({
            date,
            name: desc,       // ← uses the actual description
            amount,
            type: txType,
            category: finalCategory,
            confidence: finalConfidence || 0,
          });
        });

        setParsedData(rows);
        if (foundCurrency) setDetectedCurrency(foundCurrency);
      },
      error: () => {
        alert("Failed to parse CSV. Please check the file format.");
      }
    });
  };

  const applyDetectedCurrency = () => {
    if (detectedCurrency) setCurrency(detectedCurrency);
  };

  const submitImport = async () => {
    if (detectedCurrency) setCurrency(detectedCurrency);
    setIsImporting(true);
    await onImport(parsedData);
    setIsImporting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card w-full max-w-4xl rounded-xl border border-border shadow-2xl flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-bold">Import Transactions</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Supports ADCB, HDFC, ICICI, SBI, and most bank CSV exports.
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-auto space-y-4">
          {/* Detected currency banner */}
          {detectedCurrency && detectedCurrency !== currency && (
            <div className="flex items-center justify-between gap-3 p-3 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg text-sm">
              <span>
                🌍 Currency <strong>{detectedCurrency}</strong> detected in your CSV.
                Switch app currency to match?
              </span>
              <button
                onClick={applyDetectedCurrency}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-black font-semibold rounded-lg text-xs hover:bg-amber-400 transition"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Switch to {detectedCurrency}
              </button>
            </div>
          )}
          {detectedCurrency && detectedCurrency === currency && (
            <div className="flex items-center gap-2 p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-sm">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Currency <strong>{detectedCurrency}</strong> matches your current setting.</span>
            </div>
          )}

          {parsedData.length === 0 ? (
            <div
              className="border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center p-12 text-center hover:bg-white/5 transition cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadCloud className="h-10 w-10 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-1">Click to Upload CSV</h3>
              <p className="text-sm text-muted-foreground max-w-[320px]">
                Works with ADCB, HDFC, ICICI, SBI, and any bank export with Date, Description, Amount columns.
              </p>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-lg text-sm">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>
                  Parsed <strong>{parsedData.length}</strong> transactions. Review categories below — click <em>Confirm &amp; Import</em> when ready.
                </span>
              </div>

              <div className="border border-border rounded-lg overflow-hidden">
                <div className="max-h-[340px] overflow-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted text-muted-foreground sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-3 font-medium">Date</th>
                        <th className="px-4 py-3 font-medium">Description</th>
                        <th className="px-4 py-3 font-medium">Category</th>
                        <th className="px-4 py-3 font-medium text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {parsedData.map((row, i) => (
                        <tr key={i} className="hover:bg-white/5">
                          <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                            {new Date(row.date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-2.5 font-medium max-w-[220px] truncate" title={row.name}>
                            {row.name}
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <span className="bg-primary/10 text-red-400 px-2 py-0.5 rounded text-xs border border-primary/20">
                                {row.category}
                              </span>
                              {row.confidence >= 0.8 ? (
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" title="High confidence auto-match" />
                              ) : row.confidence >= 0.5 ? (
                                <div className="h-1.5 w-1.5 rounded-full bg-amber-500" title="Suggested match" />
                              ) : (
                                <div className="h-1.5 w-1.5 rounded-full bg-red-500" title="Needs review" />
                              )}
                            </div>
                          </td>
                          <td className={`px-4 py-2.5 text-right font-mono font-medium ${row.type === "income" ? "text-emerald-500" : "text-foreground"}`}>
                            {row.type === "income" ? "+" : "-"}{formatCurrency(row.amount, detectedCurrency || currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-border flex items-center justify-between gap-3">
          <button
            className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
            onClick={() => { setParsedData([]); setDetectedCurrency(null); fileInputRef.current && (fileInputRef.current.value = ""); }}
          >
            Upload a different file
          </button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} disabled={isImporting}>Cancel</Button>
            <Button
              disabled={parsedData.length === 0 || isImporting}
              onClick={submitImport}
              className="min-w-[180px]"
            >
              {isImporting ? "Importing..." : `Confirm & Import (${parsedData.length})`}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
