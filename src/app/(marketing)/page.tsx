"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Activity, Wallet, PieChart, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F0F2F5] p-3 sm:p-6 font-sans">
      {/* ── Main White Container ── */}
      <div className="bg-white rounded-[2.5rem] sm:rounded-[3rem] w-full min-h-[95vh] relative overflow-hidden shadow-2xl border border-slate-100 flex flex-col">
        
        {/* ── Floating Navbar ── */}
        <div className="pt-8 px-6 sm:px-10 max-w-7xl mx-auto w-full flex justify-center z-50">
          <nav className="bg-[#111111] text-white rounded-full py-2.5 px-3 sm:px-4 flex items-center justify-between w-full shadow-xl">
            {/* Logo */}
            <div className="flex items-center gap-2 pl-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#a3e635"/>
                <path d="M2 17L12 22L22 17" stroke="#a3e635" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="#a3e635" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-lg font-bold tracking-widest uppercase">FINORA</span>
            </div>

            {/* Links */}
            <div className="hidden lg:flex items-center gap-8 text-sm font-medium text-gray-300">
              <Link href="#features" className="hover:text-white transition-colors">Features</Link>
              <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>
              <Link href="#business" className="hover:text-white transition-colors">For Business</Link>
              <Link href="#help" className="hover:text-white transition-colors">Help Center</Link>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pr-1">
              <Link href="/login">
                <Button variant="ghost" className="hidden sm:inline-flex text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-full px-5 h-10">
                  Sign In
                </Button>
              </Link>
              <Link href="/login">
                <Button className="bg-[#a3e635] hover:bg-[#84cc16] text-black font-semibold rounded-full px-6 h-10 border border-[#a3e635]/20 shadow-[0_0_20px_rgba(163,230,53,0.3)] transition-all">
                  Create Account
                </Button>
              </Link>
            </div>
          </nav>
        </div>

        {/* ── Hero Content ── */}
        <main className="flex-1 flex flex-col items-center pt-20 sm:pt-28 px-4 relative z-10 w-full max-w-5xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-6 max-w-4xl"
          >
            <h1 className="text-5xl sm:text-6xl md:text-[5rem] font-bold tracking-tight text-slate-900 leading-[1.05]">
              Revolutionizing finance for a better tomorrow. Today.
            </h1>
            <p className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed font-medium">
              Fintech services leverage technology to enhance financial processes, offering innovative AI solutions for banking and budget pacing.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
              <Button className="bg-[#111111] hover:bg-black text-white rounded-full px-8 h-14 text-base font-semibold w-full sm:w-auto shadow-xl">
                Get Started
              </Button>
              <Button className="bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 rounded-full px-8 h-14 text-base font-semibold w-full sm:w-auto shadow-sm">
                Learn more
              </Button>
            </div>
          </motion.div>

          {/* ── Floating Mockup Cluster ── */}
          <div className="mt-20 w-full max-w-5xl relative h-[400px] sm:h-[500px]">
            {/* Main Application Tablet Box */}
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[90%] sm:w-[800px] h-[350px] sm:h-[450px] bg-[#f8fafc] border-[8px] border-[#111111] rounded-t-[2rem] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 sm:p-8 bg-white border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-full"></div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Welcome back, William 👋</h3>
                    <p className="text-sm text-slate-400">Personal CFO Active</p>
                  </div>
                </div>
              </div>
              <div className="p-6 sm:p-8 flex-1 grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm col-span-2 sm:col-span-1">
                   <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">Available Balance</p>
                   <p className="text-2xl font-bold text-slate-900">$12,480.50</p>
                   <div className="w-full h-12 mt-4 bg-emerald-100/50 rounded-lg relative overflow-hidden">
                     <svg className="absolute w-full h-full text-emerald-400" viewBox="0 0 100 30" preserveAspectRatio="none"><path d="M0,30 L0,20 Q20,10 40,25 T80,15 T100,5 L100,30 Z" fill="currentColor"/></svg>
                   </div>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hidden sm:block">
                   <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">This Month Volume</p>
                   <p className="text-2xl font-bold text-slate-900">$48,320.00</p>
                   <div className="w-full h-12 mt-4 bg-purple-100/50 rounded-lg relative overflow-hidden">
                     <svg className="absolute w-full h-full text-purple-400" viewBox="0 0 100 30" preserveAspectRatio="none"><path d="M0,30 L0,25 Q20,15 40,20 T80,10 T100,20 L100,30 Z" fill="currentColor"/></svg>
                   </div>
                </div>
              </div>
            </motion.div>

            {/* Left Floating Card - Transfer */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute bottom-20 left-[0%] sm:left-[5%] z-20 w-64 bg-white rounded-3xl p-5 shadow-[0_20px_40px_rgba(0,0,0,0.08)] border border-slate-100 hidden md:block"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white"><ShieldCheck className="w-6 h-6"/></div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Jhon Barrel</p>
                  <p className="text-xs text-slate-400">Personal account</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-[#a3e635] rounded-full flex items-center justify-center"><ArrowRight className="w-3 h-3 text-emerald-900"/></div>
                  <span className="text-sm font-semibold">Transfer</span>
                </div>
                <span className="text-xs font-bold font-mono">VISA</span>
              </div>
            </motion.div>

            {/* Top Left Floating Pill */}
            <motion.div 
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut", delay: 1 }}
              className="absolute top-20 sm:top-10 left-[8%] sm:left-[22%] z-30 bg-white rounded-full px-4 py-2 shadow-lg border border-slate-100 flex items-center gap-2"
            >
              <div className="w-5 h-5 bg-[#a3e635] rounded-full"></div>
              <span className="font-bold text-sm">+$347.23</span>
            </motion.div>

            {/* Right Floating Card - Bar Chart */}
            <motion.div 
              animate={{ y: [0, -12, 0] }}
              transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut", delay: 0.5 }}
              className="absolute bottom-32 right-[-2%] sm:right-[10%] z-20 w-56 bg-white rounded-3xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-100 hidden lg:block"
            >
              <p className="text-[10px] font-semibold text-slate-400 uppercase text-center mb-4">Average spend in half a year</p>
              <div className="flex items-end justify-between h-24 gap-2">
                {[40, 70, 50, 100, 80, 50].map((h, i) => (
                  <div key={i} className="w-full bg-[#8b5cf6] rounded-full" style={{ height: `${h}%` }}></div>
                ))}
              </div>
              <div className="flex justify-between mt-2 px-1">
                {['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => (
                  <span key={m} className="text-[8px] font-bold text-slate-400">{m}</span>
                ))}
              </div>
            </motion.div>

            {/* Bottom Right Floating Share */}
            <motion.div 
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut", delay: 1.5 }}
              className="absolute bottom-10 right-[5%] sm:right-[20%] z-30 bg-white rounded-2xl p-4 shadow-xl border border-slate-100 hidden sm:flex items-center justify-between w-48"
            >
              <span className="text-sm font-semibold text-slate-700">Share spendings</span>
              <div className="w-6 h-6 bg-[#a3e635] rounded-full flex items-center justify-center cursor-pointer">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M18 8L22 12L18 16M2 12H22" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
