"use client";

import { Bell, UserCircle, LogOut, ChevronDown } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useCurrency } from "@/context/CurrencyContext";
import { CURRENCIES } from "@/lib/utils";

export function Header() {
  const [email, setEmail] = useState<string | null>("Loading...");
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);
  const supabase = createClient();
  const router = useRouter();
  const { currency, setCurrency, currencySymbol } = useCurrency();
  const currencyMenuRef = useRef<HTMLDivElement>(null);

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
    <header className="flex h-16 items-center justify-between border-b border-border bg-card/50 px-6 backdrop-blur-xl z-10 sticky top-0">
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
        <div className="flex items-center gap-2 relative group">
          <UserCircle className="h-8 w-8 text-primary" />
          <div className="hidden md:block">
            <p className="text-sm font-medium">{email}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="absolute -bottom-8 right-0 bg-red-500/10 text-red-500 border border-red-500/20 px-3 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
          >
            <LogOut className="h-3 w-3" /> Logout
          </button>
        </div>
      </div>
    </header>
  );
}
