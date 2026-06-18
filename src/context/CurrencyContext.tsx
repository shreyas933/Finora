"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { CURRENCIES } from "@/lib/utils";

interface CurrencyContextType {
  currency: string;
  setCurrency: (code: string) => void;
  currencySymbol: string;
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: "INR",
  setCurrency: () => { },
  currencySymbol: "₹",
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState("INR");

  useEffect(() => {
    const saved = localStorage.getItem("finora_currency");
    if (saved && CURRENCIES.find(c => c.code === saved)) {
      setCurrencyState(saved);
    }
  }, []);

  const setCurrency = (code: string) => {
    localStorage.setItem("finora_currency", code);
    setCurrencyState(code);
  };

  const currencySymbol = CURRENCIES.find(c => c.code === currency)?.symbol || "₹";

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, currencySymbol }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
