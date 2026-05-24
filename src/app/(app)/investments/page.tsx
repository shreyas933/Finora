"use client";

import { useState } from "react";
import { Plus, TrendingUp, TrendingDown, ExternalLink, Star } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { useFinance } from "@/context/FinanceContext";
import { useCurrency } from "@/context/CurrencyContext";

// ─── Mock Data matching user screenshots ─────────────────────────────────────

const PORTFOLIO = [
  { id: 1, name: "HDFC Equity Fund", type: "Mutual Fund", invested: 70000, value: 85000, returns: 15000, percent: 21.4, isUp: true },
  { id: 2, name: "Bitcoin", type: "Crypto", invested: 50000, value: 45000, returns: -5000, percent: -10, isUp: false },
  { id: 3, name: "Reliance Industries", type: "Stock", invested: 45000, value: 55000, returns: 10000, percent: 22.2, isUp: true },
  { id: 4, name: "SBI SIP", type: "SIP", invested: 25000, value: 32000, returns: 7000, percent: 28, isUp: true },
  { id: 5, name: "PPF Account", type: "PPF", invested: 85000, value: 95000, returns: 10000, percent: 11.8, isUp: true },
  { id: 6, name: "Ethereum", type: "Crypto", invested: 30000, value: 28000, returns: -2000, percent: -6.7, isUp: false },
];

const NEWS = [
  {
    id: 1,
    title: "Reliance Industries Q3 earnings beat expectations",
    desc: "Reliance reported strong quarterly earnings with revenue growth of 12% YoY, exceeding analyst expectations.",
    tags: ["RIL", "NIFTY50"],
    source: "Economic Times",
    time: "about 2 hours ago",
    sentiment: "up",
  },
  {
    id: 2,
    title: "Banking sector faces headwinds amid rate hikes",
    desc: "HDFC Bank and ICICI Bank stocks decline as RBI signals potential rate hikes in the coming months.",
    tags: ["HDFCBANK", "ICICIBANK"],
    source: "Reuters",
    time: "about 4 hours ago",
    sentiment: "down",
  },
  {
    id: 3,
    title: "TCS announces new tech partnership initiative",
    desc: "Tata Consultancy Services partners with global tech leaders to expand cloud services offerings.",
    tags: ["TCS", "IT"],
    source: "Business Standard",
    time: "about 6 hours ago",
    sentiment: "up",
  },
];

const POPULAR_STOCKS = [
  { symbol: "RELIANCE", name: "Reliance Industries", price: 2845, change: 45.5, pct: 1.62, marketCap: "19.2T", volume: "45.2M", isUp: true, inWatchlist: false },
  { symbol: "TCS", name: "Tata Consultancy", price: 3950, change: -25, pct: -0.63, marketCap: "14.8T", volume: "22.5M", isUp: false, inWatchlist: true },
  { symbol: "HDFCBANK", name: "HDFC Bank", price: 1685, change: 12.8, pct: 0.76, marketCap: "12.5T", volume: "35.8M", isUp: true, inWatchlist: false },
];

export default function InvestmentsPage() {
  const { investments } = useFinance();
  const { currency } = useCurrency();
  const [showConnectModal, setShowConnectModal] = useState(false);

  // Computed metrics based on the real user's investments
  const totalInvested = investments.reduce((acc, inv) => acc + Number(inv.invested), 0);
  const currentValue = investments.reduce((acc, inv) => acc + Number(inv.current_value), 0);
  const totalReturns = currentValue - totalInvested;
  const returnsPct = totalInvested > 0 ? ((totalReturns / totalInvested) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-8 pb-8 text-white max-w-[1200px] mx-auto p-4 md:p-6 lg:p-8">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Investments</h1>
          <p className="text-gray-400">Track your portfolio performance</p>
        </div>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-semibold flex items-center gap-2 transition-colors"
          onClick={() => setShowConnectModal(true)}
        >
          <Plus className="h-4 w-4" /> Add Investment
        </button>
      </div>

      {/* ── Top KPIs ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="inv-card">
          <p className="inv-label">Total Invested</p>
          <p className="inv-value">{formatCurrency(totalInvested, currency)}</p>
        </div>
        <div className="inv-card">
          <p className="inv-label">Current Value</p>
          <p className="inv-value">{formatCurrency(currentValue, currency)}</p>
        </div>
        <div className="inv-card">
          <p className="inv-label">Total Returns</p>
          <p className={cn("inv-value font-bold", totalReturns >= 0 ? "text-[#22c55e]" : "text-[#ef4444]")}>
            {totalReturns >= 0 ? "+" : ""}{formatCurrency(Math.abs(totalReturns), currency)} ({totalReturns >= 0 ? "+" : ""}{returnsPct}%)
          </p>
        </div>
      </div>

      {/* ── Your Portfolio ── */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Your Portfolio</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {investments.length === 0 ? (
             <div className="col-span-full py-12 text-center border border-dashed border-white/20 rounded-xl">
               <p className="text-gray-400">No investments added yet.</p>
               <Button onClick={() => setShowConnectModal(true)} variant="outline" className="mt-4">
                 Add your first investment
               </Button>
             </div>
          ) : investments.map((asset) => {
            const returns = Number(asset.current_value) - Number(asset.invested);
            const isUp = returns >= 0;
            const percent = Number(asset.invested) > 0 ? ((returns / Number(asset.invested)) * 100).toFixed(1) : "0";

            return (
              <div key={asset.id} className="inv-card flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <h3 className="text-lg font-bold">{asset.name}</h3>
                    <span className="bg-[#2a2a2a] text-xs px-3 py-1 rounded-md text-gray-300 font-medium">
                      {asset.type}
                    </span>
                  </div>
                  <div className="mb-6">
                    <p className="text-sm text-gray-400 mb-1">Current Value</p>
                    <p className="text-2xl font-bold">{formatCurrency(Number(asset.current_value), currency)}</p>
                  </div>
                </div>
                <div className="flex justify-between items-end border-t border-[#2a2a2a] pt-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Invested</p>
                    <p className="text-sm font-semibold">{formatCurrency(Number(asset.invested), currency)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400 mb-1">Returns</p>
                    <p className={isUp ? "text-[#22c55e] text-sm font-semibold flex items-center justify-end gap-1" : "text-[#ef4444] text-sm font-semibold flex items-center justify-end gap-1"}>
                      {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {isUp ? "+" : "-"}{formatCurrency(Math.abs(returns), currency)} ({isUp ? "+" : ""}{percent}%)
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Bottom Section (News & Stocks) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Market News */}
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Market News</h2>
            <button className="text-sm bg-[#1a1a1a] border border-[#2a2a2a] px-4 py-1.5 rounded-md hover:bg-[#222] transition-colors">
              View All
            </button>
          </div>
          <div className="flex flex-col gap-4">
            {NEWS.map((news) => (
              <div key={news.id} className="inv-card p-5">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-base font-bold text-white pr-4 leading-tight">{news.title}</h4>
                  {news.sentiment === "up" ? (
                    <TrendingUp className="h-5 w-5 text-[#22c55e] shrink-0" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-[#ef4444] shrink-0" />
                  )}
                </div>
                <p className="text-sm text-gray-400 mb-5 leading-relaxed">{news.desc}</p>
                <div className="flex justify-between items-end">
                  <div className="flex gap-2">
                    {news.tags.map((tag) => (
                      <span key={tag} className="bg-[#2a2a2a] text-[#888] text-xs px-2.5 py-1 rounded-md font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">{news.source}</p>
                    <p className="text-xs text-gray-500">{news.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Popular Stocks */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Popular Stocks</h2>
            <TrendingUp className="h-5 w-5 text-blue-500" />
          </div>
          <div className="flex flex-col gap-4">
            {POPULAR_STOCKS.map((stock) => (
              <div key={stock.symbol} className="inv-card p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <h4 className="text-lg font-bold">{stock.symbol}</h4>
                    <span className="text-xs text-gray-400 mt-1">{stock.name}</span>
                  </div>
                  <div className="text-right">
                    <p className={stock.isUp ? "text-[#22c55e] font-bold text-sm" : "text-[#ef4444] font-bold text-sm"}>
                      {stock.isUp ? "+" : ""}{stock.change}
                    </p>
                    <p className={stock.isUp ? "text-[#22c55e] text-xs font-semibold" : "text-[#ef4444] text-xs font-semibold"}>
                      ({stock.isUp ? "+" : ""}{stock.pct}%)
                    </p>
                  </div>
                </div>
                
                <p className="text-2xl font-bold mb-6">{formatCurrency(stock.price, currency)}</p>
                
                <div className="flex justify-between text-sm mb-6 pb-6 border-b border-[#2a2a2a]">
                  <div>
                    <span className="text-gray-400 block mb-1 text-xs">Market Cap</span>
                    <span className="font-medium">{currency} {stock.marketCap}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block mb-1 text-xs">Volume</span>
                    <span className="font-medium">{stock.volume}</span>
                  </div>
                </div>
                
                <button
                  className={cn(
                    "w-full py-2.5 rounded-md font-semibold flex justify-center items-center gap-2 transition-colors",
                    stock.inWatchlist 
                      ? "bg-blue-600 hover:bg-blue-700 text-white" 
                      : "bg-[#2a2a2a] hover:bg-[#333] text-gray-300"
                  )}
                >
                  <Star className={cn("h-4 w-4", stock.inWatchlist && "fill-current")} />
                  {stock.inWatchlist ? "In Watchlist" : "Add to Watchlist"}
                </button>
              </div>
            ))}
          </div>
        </div>
        
      </div>

      {/* ── Connect Broker Modal ── */}
      <AnimatePresence>
        {showConnectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#1a1a1a] border border-[#2a2a2a] p-6 rounded-xl w-full max-w-md shadow-2xl"
            >
              <h3 className="text-xl font-bold mb-2 text-white">Connect Broker</h3>
              <p className="text-gray-400 text-sm mb-6">Sync your portfolio automatically by connecting your Demat account.</p>
              
              <div className="space-y-3 mb-6">
                {['Zerodha', 'Groww', 'Upstox', 'Angel One'].map(broker => (
                  <button key={broker} className="w-full flex justify-between items-center p-4 rounded-lg border border-[#2a2a2a] hover:bg-[#222] transition-colors">
                    <span className="font-medium text-white">{broker}</span>
                    <ExternalLink className="h-4 w-4 text-gray-500" />
                  </button>
                ))}
              </div>
              
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setShowConnectModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => setShowConnectModal(false)}
                  className="px-4 py-2 text-sm font-semibold bg-[#2a2a2a] hover:bg-[#333] rounded-md transition-colors text-white"
                >
                  Import Manually Instead
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
