"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Receipt,
  Target,
  LineChart,
  CreditCard,
  Calculator,
  MessageSquare,
  Landmark,
  Menu,
  X,
  Home,
  Wallet,
  Sparkles,
  Goal
} from "lucide-react";
import { useState } from "react";
import LumaBar from "@/components/ui/futuristic-nav";

const routes = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Transactions", icon: Receipt, href: "/transactions" },
  { label: "Goals", icon: Target, href: "/goals" },
  // { label: "Investments", icon: LineChart, href: "/investments" },
  { label: "Credit Cards", icon: CreditCard, href: "/credit" },
  // { label: "Tax AI", icon: Calculator, href: "/tax" }, /* Kept in memory: uncomment to restore exactly as before */
  { label: "AI CFO Chat", icon: MessageSquare, href: "/chat" },
];

// Bottom nav shows a subset of routes (max 6 for mobile)
const mobileRoutes = [
  { label: "Home", icon: Home, href: "/dashboard" },
  { label: "Transactions", icon: Wallet, href: "/transactions" },
  { label: "AI", icon: Sparkles, href: "/chat" },
  { label: "Goals", icon: Goal, href: "/goals" },
  { label: "Cards", icon: CreditCard, href: "/credit" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* ─── Desktop Sidebar (hidden on mobile) ─── */}
      <div className="hidden md:flex h-full w-64 flex-col relative z-20" style={{background: '#0a0f1a', borderRight: '1px solid rgba(30,42,58,0.8)'}}>

        {/* Logo */}
        <div className="flex h-16 items-center px-6 gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-lg" style={{background: 'linear-gradient(135deg, #810100, #b01010)'}}>✳</div>
          <h1 className="text-xl font-bold tracking-tight" style={{color: '#f0f4ff', letterSpacing: '-0.02em'}}>FINORA</h1>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto py-4 px-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest px-3 mb-3" style={{color: '#4a5568'}}>Menu</p>
          <nav className="grid gap-0.5">
            {routes.map((route) => {
              const isActive = pathname === route.href || pathname.startsWith(route.href + '/');
              return (
                <Link
                  key={route.href}
                  href={route.href}
                  className={cn("nav-item", isActive && "active")}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                    isActive ? "bg-primary/20" : "bg-muted"
                  )}>
                    <route.icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")} />
                  </div>
                  <span className={isActive ? "text-foreground" : "text-muted-foreground"}>{route.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom hint */}
        <div className="px-6 py-4 border-t" style={{borderColor: 'rgba(30,42,58,0.6)'}}>
          <p className="text-[10px] text-muted-foreground">FINORA AI CFO · v1.0</p>
        </div>
      </div>

      {/* ─── Mobile Bottom Navigation Bar (visible only on mobile) ─── */}
      <LumaBar />
    </>
  );
}

