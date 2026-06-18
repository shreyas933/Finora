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

const routes = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Transactions", icon: Receipt, href: "/transactions" },
  { label: "Goals", icon: Target, href: "/goals" },
  { label: "Investments", icon: LineChart, href: "/investments" },
  { label: "Credit Cards", icon: CreditCard, href: "/credit" },
  // { label: "Tax AI", icon: Calculator, href: "/tax" }, /* Kept in memory: uncomment to restore exactly as before */
  { label: "AI CFO Chat", icon: MessageSquare, href: "/chat" },
];

// Bottom nav shows a subset of routes (max 6 for mobile)
const mobileRoutes = [
  { label: "Home", icon: Home, href: "/dashboard" },
  { label: "Wallet", icon: Wallet, href: "/transactions" },
  { label: "AI", icon: Sparkles, href: "/chat" },
  { label: "Goals", icon: Goal, href: "/goals" },
  { label: "Cards", icon: CreditCard, href: "/credit" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* ─── Desktop Sidebar (hidden on mobile) ─── */}
      <div className="hidden md:flex h-full w-64 flex-col bg-card border-r border-border relative z-20 shadow-level-1">
        <div className="flex h-16 items-center px-6">
          <h1 className="text-2xl font-bold tracking-tight text-primary">FINORA</h1>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="grid gap-1 px-4">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground",
                  pathname === route.href ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                )}
              >
                <route.icon className="h-4 w-4" />
                {route.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* ─── Mobile Bottom Navigation Bar (visible only on mobile) ─── */}
      <div className="md:hidden fixed bottom-3 left-4 right-4 z-50 bg-background/20 backdrop-blur-2xl border border-border/50 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] text-foreground">
        <nav className="flex justify-around items-center h-16 px-4">
          {mobileRoutes.map((route) => {
            const isActive = pathname === route.href;
            return (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "relative flex items-center justify-center p-2 rounded-xl transition-all",
                  isActive ? "text-primary" : "text-muted-foreground active:text-primary"
                )}
              >
                <route.icon className="h-6 w-6 stroke-[1.5]" />
                {isActive && (
                  <div className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
