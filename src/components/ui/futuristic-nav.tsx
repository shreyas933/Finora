"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Wallet, Sparkles, Goal, CreditCard } from "lucide-react";

// Use the exact routes from the mobile app
const mobileRoutes = [
  { id: 0, label: "Home", icon: <Home size={22} />, href: "/dashboard" },
  { id: 1, label: "Transactions", icon: <Wallet size={22} />, href: "/transactions" },
  { 
    id: 2, 
    label: "AI CFO", 
    icon: (
      <div 
        className="w-[22px] h-[22px] bg-current" 
        style={{
          maskImage: 'url(/ai-cfo.png)',
          WebkitMaskImage: 'url(/ai-cfo.png)',
          maskSize: 'contain',
          WebkitMaskSize: 'contain',
          maskRepeat: 'no-repeat',
          WebkitMaskRepeat: 'no-repeat'
        }}
      />
    ), 
    href: "/chat" 
  },
  { id: 3, label: "Goals", icon: <Goal size={22} />, href: "/goals" },
  { id: 4, label: "Cards", icon: <CreditCard size={22} />, href: "/credit" },
];

export default function LumaBar() {
  const pathname = usePathname();

  // Determine which route is active based on the URL
  const activeIndex = mobileRoutes.findIndex(route => pathname.startsWith(route.href));
  const active = activeIndex !== -1 ? activeIndex : 0;

  return (
    <div className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] w-[92vw] max-w-sm">
      <div className="relative flex items-center justify-between bg-card/60 backdrop-blur-3xl rounded-[2rem] px-6 py-3.5 shadow-2xl border border-white/10 overflow-hidden">



        {mobileRoutes.map((item, index) => {
          const isActive = index === active;
          return (
            <Link key={item.id} href={item.href} className="relative flex flex-col items-center justify-center w-12 h-12 group">
              {/* Perfectly centered, larger active background circle */}
              {isActive && (
                <motion.div
                  layoutId="active-indicator"
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-[-2px] w-16 h-12 bg-primary/20 border border-primary/30 rounded-[2rem] -z-10"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}

              {/* Button */}
              <motion.div
                whileHover={{ scale: 1.1 }}
                animate={{ scale: isActive ? 1.3 : 1, y: isActive ? -2 : 0 }}
                className={`flex items-center justify-center relative z-10 transition-colors ${isActive ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'text-slate-400 hover:text-slate-200'
                  }`}
              >
                {item.icon}
              </motion.div>

              {/* Label */}
              <motion.span
                animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : 5 }}
                className="absolute -bottom-3 text-[9px] font-bold text-white whitespace-nowrap"
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
