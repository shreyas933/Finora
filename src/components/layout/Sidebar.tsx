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
  MessageSquare
} from "lucide-react";

const routes = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Transactions", icon: Receipt, href: "/transactions" },
  { label: "Goals", icon: Target, href: "/goals" },
  { label: "Investments", icon: LineChart, href: "/investments" },
  { label: "Credit Score", icon: CreditCard, href: "/credit" },
  { label: "Tax AI", icon: Calculator, href: "/tax" },
  { label: "AI CFO Chat", icon: MessageSquare, href: "/chat" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-card/50 border-r border-border backdrop-blur-xl">
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
  );
}
