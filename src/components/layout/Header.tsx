"use client";

import {
  Bell, UserCircle, LogOut, ChevronDown, Trash2, Settings, AlertTriangle,
  CheckCircle, Info, Sparkles, X, BellRing, UtensilsCrossed, ShoppingCart,
  Car, Tv, Heart, Plane, Zap, Briefcase, TrendingUp, Wallet
} from "lucide-react";
import { useEffect, useState, useRef, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useFinance } from "@/context/FinanceContext";
import { cn } from "@/lib/utils";

const CATEGORIES_LIST = [
  { name: "Food & Dining",  icon: <UtensilsCrossed className="h-3 w-3" /> },
  { name: "Shopping",       icon: <ShoppingCart    className="h-3 w-3" /> },
  { name: "Transportation", icon: <Car             className="h-3 w-3" /> },
  { name: "Entertainment",  icon: <Tv              className="h-3 w-3" /> },
  { name: "Health",         icon: <Heart           className="h-3 w-3" /> },
  { name: "Travel",         icon: <Plane           className="h-3 w-3" /> },
  { name: "Utilities",      icon: <Zap             className="h-3 w-3" /> },
  { name: "Income",         icon: <Briefcase       className="h-3 w-3" /> },
  { name: "Investment",     icon: <TrendingUp      className="h-3 w-3" /> },
  { name: "Other",          icon: <Wallet          className="h-3 w-3" /> }
];

export function Header() {
  const [displayName, setDisplayName] = useState<string | null>("Loading...");
  const supabase = createClient();
  const router = useRouter();
  const { transactions, balance, goals, needsReviewCount, needsReviewTransactions, assignCategory } = useFinance();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Persistent notification states
  const [readIds, setReadIds] = useState<string[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedRead = localStorage.getItem("finora_read_notifications");
      const savedDismissed = localStorage.getItem("finora_dismissed_notifications");
      if (savedRead) {
        try { setReadIds(JSON.parse(savedRead)); } catch (e) { }
      }
      if (savedDismissed) {
        try { setDismissedIds(JSON.parse(savedDismissed)); } catch (e) { }
      }
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const notifications = useMemo(() => {
    const list: ({
      id: string;
      title: string;
      message: string;
      time: string;
      type: "alert" | "info" | "success";
      isReview?: boolean;
      txId?: string;
      merchant?: string;
      amountStr?: string;
      txType?: "income" | "expense";
    })[] = [];

    // 1. Welcome
    list.push({
      id: "welcome",
      title: "Welcome to FINORA",
      message: "Your premium wealth intelligence suite is active.",
      time: "Just now",
      type: "info" as const
    });

    // 2. Low Balance
    if (balance > 0 && balance < 5000) {
      list.push({
        id: "low-balance",
        title: "Liquidity Alert",
        message: `Your account balance is below the ₹5,000 threshold (₹${balance.toLocaleString()}).`,
        time: "Recent",
        type: "alert" as const
      });
    }

    // 3. Goal Achieved
    const achievedGoals = goals?.filter(g => g.current_amount >= g.target_amount) || [];
    if (achievedGoals.length > 0) {
      achievedGoals.forEach(g => {
        list.push({
          id: `goal-achieved-${g.id}`,
          title: "Milestone Reached! 🎉",
          message: `Congratulations! You've fully funded your savings goal: "${g.name}".`,
          time: "Recent",
          type: "success" as const
        });
      });
    }

    // 4. Large Transaction
    const recentLargeTxs = transactions?.filter(t => t.type === "expense" && Number(t.amount) > 10000) || [];
    if (recentLargeTxs.length > 0) {
      recentLargeTxs.slice(0, 3).forEach(t => {
        list.push({
          id: `large-tx-${t.id}`,
          title: "Significant Outflow",
          message: `A charge of ₹${Number(t.amount).toLocaleString()} was logged for ${t.name}.`,
          time: new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          type: "alert" as const
        });
      });
    }

    // 5. Uncategorized Transactions (Needs Review)
    const reviewTxs = needsReviewTransactions || [];

    reviewTxs.forEach(t => {
      list.push({
        id: `review-tx-${t.id}`,
        title: "Transaction Review",
        message: `Currently classified as "${t.category}". Tap below to confirm or correct.`,
        time: "Needs Review",
        type: "alert" as const,
        isReview: true,
        txId: t.id,
        merchant: t.name,
        amountStr: `₹${Number(t.amount).toLocaleString()}`,
        txType: t.type
      });
    });

    return list
      .filter(n => !dismissedIds.includes(n.id))
      .map(n => ({
        ...n,
        read: readIds.includes(n.id)
      }));
  }, [balance, goals, transactions, readIds, dismissedIds, needsReviewTransactions]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    if (readIds.includes(id)) return;
    const updated = [...readIds, id];
    setReadIds(updated);
    localStorage.setItem("finora_read_notifications", JSON.stringify(updated));
  };

  const markAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    const updated = Array.from(new Set([...readIds, ...allIds]));
    setReadIds(updated);
    localStorage.setItem("finora_read_notifications", JSON.stringify(updated));
  };

  const dismissNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = [...dismissedIds, id];
    setDismissedIds(updated);
    localStorage.setItem("finora_dismissed_notifications", JSON.stringify(updated));
  };

  const handleReviewPick = async (txId: string, category: string, merchantName: string) => {
    try {
      await assignCategory(txId, category, merchantName);
    } catch (e) {
      console.error("[FINORA review pick] error:", e);
    }
  };


  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const name = user.user_metadata?.first_name
          ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ""}`.trim()
          : user.email;
        setDisplayName(name || "Active User");
      } else {
        setDisplayName("Not logged in");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const name = session.user.user_metadata?.first_name
          ? `${session.user.user_metadata.first_name} ${session.user.user_metadata.last_name || ""}`.trim()
          : session.user.email;
        setDisplayName(name || "Active User");
      } else {
        setDisplayName("Not logged in");
        router.push("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [router, supabase]);



  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };



  return (
    <header className="flex h-14 md:h-16 items-center justify-between px-4 md:px-6 backdrop-blur-xl z-20 sticky top-0" style={{background: 'rgba(10,15,26,0.85)', borderBottom: '1px solid rgba(30,42,58,0.7)'}}>
      <div className="flex items-center gap-3">
        {/* Show FINORA branding on mobile (sidebar is hidden) */}
        <div className="md:hidden flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{background: 'linear-gradient(135deg, #810100, #b01010)'}}>✳</div>
          <h1 className="text-lg font-bold tracking-tight" style={{color: '#f0f4ff'}}>FINORA</h1>
        </div>

        {/* Desktop: Pill search bar */}
        <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl border text-sm text-muted-foreground" style={{background: 'rgba(28,35,51,0.6)', borderColor: 'rgba(30,42,58,0.8)', minWidth: '200px'}}>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <span className="text-xs">Search transactions...</span>
        </div>
      </div>
      <div className="flex items-center gap-3">


        {/* Needs Review Badge */}
        {needsReviewCount > 0 && (
          <Link href="/transactions" className="relative p-2 text-amber-500 hover:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 rounded-xl transition-all hidden sm:flex items-center gap-2 border border-amber-500/20">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-xs font-bold hidden md:inline-block">Review</span>
            <span className="absolute -top-1.5 -right-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-black border-2 border-card">
              {needsReviewCount}
            </span>
          </Link>
        )}

        {/* Notifications Dropdown */}
        <div className="relative py-2" ref={notificationsRef}>
          <button
            className={`text-muted-foreground hover:text-foreground relative p-2 rounded-xl transition-all duration-200 ${showNotifications ? 'bg-secondary text-foreground' : 'hover:bg-secondary/60'}`}
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white border-2 border-card ring-2 ring-primary/10">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-[-48px] md:right-0 mt-3 w-80 md:w-96 bg-zinc-950/95 backdrop-blur-xl border border-zinc-800/80 rounded-2xl shadow-2xl z-50 overflow-hidden transition-all duration-200 scale-100 origin-top-right">
              <div className="px-4 py-3.5 border-b border-zinc-800/60 flex items-center justify-between bg-zinc-900/30">
                <div className="flex items-center gap-2">
                  <BellRing className="h-4 w-4 text-primary animate-pulse" />
                  <h3 className="font-semibold text-sm text-foreground">Updates & Alerts</h3>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-primary hover:text-primary/80 transition-colors font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-[360px] overflow-y-auto divide-y divide-zinc-900">
                {notifications.length > 0 ? (
                  notifications.map(notification => (
                    <div
                      key={notification.id}
                      onClick={() => markAsRead(notification.id)}
                      className={`relative px-4 py-3.5 hover:bg-zinc-900/40 transition-all cursor-pointer flex gap-3 group/item ${!notification.read ? 'bg-primary/5' : ''}`}
                    >
                      {/* Unread Left Border Accent */}
                      {!notification.read && (
                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary" />
                      )}

                      {/* Icon container */}
                      <div className="flex-shrink-0">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${notification.type === 'alert' ? 'bg-red-500/10 text-red-400' :
                            notification.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
                              'bg-primary/10 text-primary-foreground'
                          }`}>
                          {notification.type === 'alert' && <AlertTriangle className="h-4 w-4" />}
                          {notification.type === 'success' && <CheckCircle className="h-4 w-4" />}
                          {notification.type === 'info' && <Sparkles className="h-4 w-4" />}
                        </div>
                      </div>

                      {/* Text details */}
                      <div className="flex-grow min-w-0 pr-4">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className={`text-xs font-semibold truncate ${!notification.read ? 'text-foreground font-bold' : 'text-zinc-400'}`}>
                            {notification.title}
                          </p>
                          <span className="text-[10px] text-zinc-500 whitespace-nowrap flex-shrink-0">
                            {notification.time}
                          </span>
                        </div>
                        <p className={cn("text-[11px] text-zinc-400 leading-normal mt-0.5 font-medium", !notification.isReview && "line-clamp-2")}>
                          {notification.message}
                        </p>

                        {notification.isReview && (
                          <div className="mt-2.5 space-y-2 border-t border-white/5 pt-2.5">
                            <div className="flex justify-between items-center text-[10px] text-zinc-400 font-mono bg-white/[0.03] px-2 py-1.5 rounded-lg border border-white/5">
                              <span className="truncate max-w-[140px] font-semibold text-zinc-200">{notification.merchant}</span>
                              <span className={cn("font-bold", notification.txType === "income" ? "text-emerald-400" : "text-red-400")}>
                                {notification.txType === "income" ? "+" : "-"}{notification.amountStr}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {CATEGORIES_LIST.map((cat) => (
                                <button
                                  key={cat.name}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (notification.txId) {
                                      handleReviewPick(notification.txId, cat.name, notification.merchant || "");
                                    }
                                  }}
                                  className="flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-semibold bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20 hover:text-white transition-all active:scale-95 cursor-pointer"
                                >
                                  {cat.icon}
                                  <span>{cat.name}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Dismiss button */}
                      <button
                        onClick={(e) => dismissNotification(notification.id, e)}
                        className="absolute right-2 top-3.5 p-1 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60 opacity-0 group-hover/item:opacity-100 transition-all"
                        title="Dismiss"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-12 text-center flex flex-col items-center justify-center">
                    <div className="h-10 w-10 rounded-full bg-zinc-900 flex items-center justify-center mb-3">
                      <Bell className="h-5 w-5 text-zinc-600" />
                    </div>
                    <p className="text-xs font-medium text-zinc-400">All caught up</p>
                    <p className="text-[10px] text-zinc-500 mt-1 max-w-[200px]">No new alerts or system updates to review.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="relative py-2" ref={profileRef}>
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <UserCircle className="h-8 w-8 text-primary" />
            <div className="hidden md:block">
              <p className="text-sm font-medium">{displayName}</p>
            </div>
          </div>

          {showProfileMenu && (
            <div className="absolute top-full right-0 mt-1 w-52 bg-card border border-border rounded-xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
              <Link
                href="/settings"
                onClick={() => setShowProfileMenu(false)}
                className="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-secondary flex items-center gap-2.5 transition-colors font-medium"
              >
                <Settings className="h-4 w-4" /> Settings
              </Link>
              <div className="h-px bg-border my-1" />
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2.5 text-sm text-muted-foreground hover:bg-secondary flex items-center gap-2.5 transition-colors"
              >
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
