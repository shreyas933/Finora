"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Receipt,
  Target,
  CreditCard,
  MessageSquare,
} from "lucide-react";
import LumaBar from "@/components/ui/futuristic-nav";

import { motion } from "framer-motion";

const routes = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Transactions", icon: Receipt, href: "/transactions" },
  { label: "Goals", icon: Target, href: "/goals" },
  { label: "Credit Cards", icon: CreditCard, href: "/credit" },
  { label: "AI CFO Chat", icon: MessageSquare, href: "/chat" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* ─── Desktop Sidebar (hidden on mobile) ─── */}
      <div className="hidden md:flex h-full w-64 flex-col bg-card border-r border-border relative z-20 shadow-level-1">
        <div className="flex h-16 items-center px-6">
          <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
            FINORA
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">CFO</span>
          </h1>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="grid gap-1.5 px-4 relative">
            {routes.map((route) => {
              const isActive = pathname === route.href;
              return (
                <Link
                  key={route.href}
                  href={route.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors relative group",
                    isActive ? "text-white font-bold" : "text-muted-foreground hover:text-white"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeSidebarPill"
                      className="absolute inset-0 bg-primary/20 border border-primary/40 rounded-xl shadow-[0_0_24px_rgba(129,1,0,0.35)]"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                  <route.icon className={cn("h-4 w-4 relative z-10 transition-all duration-200 group-hover:scale-110", isActive ? "text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]" : "")} />
                  <span className="relative z-10">{route.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* ─── Mobile Bottom Navigation Bar ─── */}
      <LumaBar />
    </>
  );
}
