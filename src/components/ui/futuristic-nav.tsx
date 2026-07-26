"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Wallet, Sparkles, Goal, CreditCard } from "lucide-react";

const mobileRoutes = [
  { id: 0, label: "Home", icon: <Home size={20} strokeWidth={1.8} />, href: "/dashboard" },
  { id: 1, label: "Transactions", icon: <Wallet size={20} strokeWidth={1.8} />, href: "/transactions" },
  { 
    id: 2, 
    label: "AI CFO", 
    icon: <Sparkles size={20} strokeWidth={1.8} />,
    href: "/chat" 
  },
  { id: 3, label: "Goals", icon: <Goal size={20} strokeWidth={1.8} />, href: "/goals" },
  { id: 4, label: "Cards", icon: <CreditCard size={20} strokeWidth={1.8} />, href: "/credit" },
];

export default function LumaBar() {
  const pathname = usePathname();

  const activeIndex = mobileRoutes.findIndex(route => pathname.startsWith(route.href));
  const active = activeIndex !== -1 ? activeIndex : 0;

  return (
    <div className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] w-[92vw] max-w-sm">
      <div className="relative flex items-center justify-between bg-card/90 backdrop-blur-2xl rounded-2xl px-4 py-2.5 shadow-float border border-black/[0.06] overflow-hidden">

        {mobileRoutes.map((item, index) => {
          const isActive = index === active;
          return (
            <Link key={item.id} href={item.href} className="relative flex flex-col items-center justify-center w-14 h-12 group">
              {/* Active background pill */}
              {isActive && (
                <motion.div
                  layoutId="active-indicator"
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-10 bg-primary/20 border border-primary/30 rounded-xl -z-10"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}

              {/* Icon */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                animate={{ scale: isActive ? 1.1 : 1, y: isActive ? -1 : 0 }}
                className={`flex items-center justify-center relative z-10 transition-colors duration-200 ${
                  isActive ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {item.icon}
              </motion.div>

              {/* Label */}
              <motion.span
                animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : 4 }}
                className="absolute -bottom-1.5 text-[8px] font-bold text-primary-foreground whitespace-nowrap tracking-wider"
              >
                {item.label}
              </motion.span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
