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
      {/* ─── Desktop Sidebar ─── */}
      <div className="hidden md:flex h-full w-64 flex-col bg-card border-r border-black/[0.06] relative z-20">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2.5 px-6">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#84cc16"/>
              <path d="M2 17L12 22L22 17" stroke="#84cc16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="#84cc16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="text-lg font-bold tracking-widest text-foreground uppercase">FINORA</h1>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="flex flex-col gap-1 px-3">
            {routes.map((route) => {
              const isActive = pathname === route.href || pathname.startsWith(route.href + "/");
              return (
                <Link
                  key={route.href}
                  href={route.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 group relative",
                    isActive
                      ? "bg-slate-100 text-foreground font-semibold shadow-sm border border-slate-200/60"
                      : "text-muted-foreground hover:bg-slate-50 hover:text-foreground"
                  )}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full" />
                  )}
                  <route.icon className={cn("h-[18px] w-[18px]", isActive ? "text-primary" : "text-slate-400 group-hover:text-foreground")} />
                  {route.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom section */}
        <div className="p-4 border-t border-border">
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 shadow-sm">
            <p className="text-xs font-bold text-foreground mb-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              AI CFO Active
            </p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">Your personal financial intelligence is monitoring your accounts.</p>
          </div>
        </div>
      </div>

      {/* ─── Mobile Bottom Navigation Bar ─── */}
      <LumaBar />
    </>
  );
}
