"use client";

import { Bell, UserCircle, LogOut, ChevronDown, Trash2 } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useCurrency } from "@/context/CurrencyContext";
import { CURRENCIES } from "@/lib/utils";
import { useFinance } from "@/context/FinanceContext";

export function Header() {
  const [email, setEmail] = useState<string | null>("Loading...");
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);
  const supabase = createClient();
  const router = useRouter();
  const { currency, setCurrency, currencySymbol } = useCurrency();
  const { clearAllData } = useFinance();
  const [isClearing, setIsClearing] = useState(false);
  const currencyMenuRef = useRef<HTMLDivElement>(null);

  const handleClearData = async () => {
    if (confirm("Are you SURE you want to permanently delete all your transactions, goals, credit cards, and investments? This cannot be undone.")) {
      setIsClearing(true);
      await clearAllData();
      setIsClearing(false);
      alert("All account data has been completely erased.");
    }
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setEmail(user.email || "Active User");
      } else {
        setEmail("Not logged in");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setEmail(session.user.email || "Active User");
      } else {
        setEmail("Not logged in");
        router.push("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [router, supabase]);

  // Close currency menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (currencyMenuRef.current && !currencyMenuRef.current.contains(e.target as Node)) {
        setShowCurrencyMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const selectedCurrency = CURRENCIES.find(c => c.code === currency);

  return (
    <header className="flex h-16 items-center justify-between border-b border-white/5 bg-[#0a0f18]/40 px-6 backdrop-blur-2xl z-20 sticky top-0 shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
      <div className="flex items-center">
        {/* Mobile menu toggle could go here */}
      </div>
      <div className="flex items-center gap-4">
        
        
        {/* ── Currency Switcher ── */}
        <div className="relative" ref={currencyMenuRef}>
          <button
            onClick={() => setShowCurrencyMenu(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-sm font-semibold hover:bg-primary/20 transition-colors"
          >
            <span className="text-base">{currencySymbol}</span>
            <span>{currency}</span>
            <ChevronDown className="h-3.5 w-3.5 opacity-70" />
          </button>

          {showCurrencyMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-xl shadow-2xl py-1 z-50 overflow-hidden">
              <p className="px-3 pt-2 pb-1 text-xs text-muted-foreground font-medium uppercase tracking-wider">Select Currency</p>
              {CURRENCIES.map(c => (
                <button
                  key={c.code}
                  onClick={() => { setCurrency(c.code); setShowCurrencyMenu(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-white/5 transition-colors text-left ${c.code === currency ? "text-primary font-semibold bg-primary/5" : "text-foreground"}`}
                >
                  <span className="text-base w-6 text-center">{c.symbol}</span>
                  <div>
                    <p className="font-medium">{c.code}</p>
                    <p className="text-xs text-muted-foreground">{c.name}</p>
                  </div>
                  {c.code === currency && <span className="ml-auto text-primary">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <button className="text-muted-foreground hover:text-foreground">
          <Bell className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2 relative group py-2 cursor-pointer">
          <UserCircle className="h-8 w-8 text-primary" />
          <div className="hidden md:block">
            <p className="text-sm font-medium">{email}</p>
          </div>
          
          <div className="absolute top-full right-0 mt-1 w-52 bg-card border border-border rounded-xl shadow-2xl py-2 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all z-50 translate-y-[-5px] group-hover:translate-y-0">
            <button 
              onClick={handleClearData}
              disabled={isClearing}
              className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 flex items-center gap-2.5 transition-colors disabled:opacity-50 font-medium"
            >
              <Trash2 className="h-4 w-4" /> {isClearing ? "Clearing..." : "Clear Account Data"}
            </button>
            <div className="h-px bg-border my-1" />
            <button 
              onClick={handleLogout}
              className="w-full text-left px-4 py-2.5 text-sm text-muted-foreground hover:bg-white/5 flex items-center gap-2.5 transition-colors"
            >
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
