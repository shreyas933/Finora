"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Star, ArrowUpRight, Home, Wallet, ShieldCheck, Zap, Globe } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#060b0e] text-white selection:bg-emerald-500/30 overflow-hidden relative">
      
      {/* ── Background Elements ── */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] right-[-10%] w-[30%] h-[50%] rounded-full bg-emerald-600/5 blur-[150px] pointer-events-none" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />

      {/* ── Navbar ── */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto md:px-12">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-500 p-1.5 rounded-lg">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">FINORA</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <Link href="#features" className="hover:text-white transition-colors">Features</Link>
          <Link href="#about" className="hover:text-white transition-colors">About Us</Link>
          <Link href="#testimonials" className="hover:text-white transition-colors">Testimonials</Link>
          <Link href="#download" className="hover:text-white transition-colors">Download</Link>
        </div>

        <div>
          <Link href="/login">
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-full px-6">
              Contact Us
            </Button>
          </Link>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 pt-12 lg:pt-20 pb-24 grid lg:grid-cols-2 gap-12 lg:gap-8 items-center min-h-[85vh]">
        
        {/* Left Copy */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="space-y-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700/50 text-emerald-400 text-sm font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Finora version 1.0 is Live
          </div>

          <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]">
            Stay in control <br className="hidden md:block" />
            of your financial <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">flow with us</span>
          </h1>

          <p className="text-slate-400 text-lg sm:text-xl max-w-lg leading-relaxed">
            Application that provides complete information about your finances and has principles to make it easier for you to manage finances.
          </p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-4">
            <Link href="/login">
              <Button className="h-14 px-8 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-lg transition-transform hover:scale-105 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                Get Started
              </Button>
            </Link>
            <Button variant="outline" className="h-14 px-8 rounded-full border-slate-700 text-white hover:bg-slate-800 font-semibold text-lg">
              Learn More
            </Button>
          </div>

          <div className="flex gap-12 pt-8 items-center">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-emerald-400">
                <Star className="h-4 w-4 fill-emerald-400" />
                <Star className="h-4 w-4 fill-emerald-400" />
                <Star className="h-4 w-4 fill-emerald-400" />
                <Star className="h-4 w-4 fill-emerald-400" />
                <Star className="h-4 w-4 fill-emerald-400" />
              </div>
              <p className="text-sm text-slate-400"><strong className="text-white">4.9</strong> / 5.0 Rating</p>
            </div>
            
            <div className="w-px h-10 bg-slate-800" />

            <div className="space-y-2">
              <div className="flex -space-x-3">
                {[1,2,3,4].map(i => (
                  <div key={i} className={`w-8 h-8 rounded-full border-2 border-[#060b0e] bg-slate-700 flex items-center justify-center text-xs overflow-hidden`}>
                    <img src={`https://i.pravatar.cc/100?img=${i+40}`} alt="user" />
                  </div>
                ))}
              </div>
              <p className="text-sm text-slate-400"><strong className="text-white">100k+</strong> Active Users</p>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800/50">
            <p className="text-sm text-slate-500 font-medium mb-4">Our Support Partners</p>
            <div className="flex flex-wrap items-center gap-8 opacity-60 invert-[0.8]">
              {/* Dummy logos utilizing a free text approach for now */}
              <div className="text-xl font-bold tracking-tighter">PayPal</div>
              <div className="text-xl font-black italic">Wise</div>
              <div className="text-xl font-bold">stripe</div>
              <div className="text-xl font-mono border-2 border-white px-1">Square</div>
            </div>
          </div>
        </motion.div>

        {/* Right Phone Mockup */}
        <div className="relative h-[600px] lg:h-[700px] w-full flex justify-center lg:justify-end items-center">
          
          {/* Abstract Green Shape Behind Phone */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] lg:w-[450px] h-[500px] lg:h-[650px] bg-emerald-500 rounded-full blur-[100px] opacity-20"
          />

          <motion.div 
            initial={{ opacity: 0, y: 50, rotateX: 10 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative z-10 w-[320px] lg:w-[350px] h-[650px] lg:h-[700px] bg-[#1a1f26] rounded-[48px] border-[8px] border-slate-800 shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Phone Notch */}
            <div className="absolute top-0 w-full flex justify-center z-20">
              <div className="w-[120px] h-[24px] bg-slate-800 rounded-b-xl" />
            </div>

            {/* Mock App UI inside Phone */}
            <div className="flex-1 overflow-hidden p-6 pt-12 flex flex-col bg-[#0b0f14]">
              
              <div className="flex justify-between items-center mb-8">
                <div>
                  <p className="text-xs text-slate-400">Hello,</p>
                  <p className="font-semibold text-white">Ali Husni</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center relative">
                  <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#1a1f26]" />
                  <img src="https://i.pravatar.cc/100?img=11" className="w-full h-full rounded-full" alt="avatar"/>
                </div>
              </div>

              <div className="mb-8">
                <p className="text-sm text-slate-400">Available Balance</p>
                <h2 className="text-4xl font-bold text-white mt-1">$45,123.70</h2>
                <div className="flex gap-2 items-center mt-3 text-xs text-slate-400">
                  <div className="flex -space-x-1">
                    <div className="w-4 h-4 rounded-full bg-red-500 opacity-80" />
                    <div className="w-4 h-4 rounded-full bg-yellow-500 opacity-80" />
                  </div>
                  <span>**** **** 3241</span>
                </div>
              </div>

              <div className="flex gap-6 border-b border-slate-800 pb-3 mb-6">
                <span className="text-sm font-semibold text-emerald-400 border-b-2 border-emerald-400 pb-3 -mb-[14px]">Spending Status</span>
                <span className="text-sm font-medium text-slate-500">Saving Plans</span>
              </div>

              <div className="flex justify-between items-end mb-6">
                <div>
                  <p className="text-xs text-slate-400">My Spending</p>
                  <p className="text-xl font-bold text-white">$6,234.00</p>
                  <p className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
                    <ArrowUpRight className="h-3 w-3" /> 3.2% from last week
                  </p>
                </div>
                {/* Mock Chart Bars */}
                <div className="flex gap-1.5 items-end h-12">
                  {[40, 60, 30, 80, 50, 90, 70].map((h, i) => (
                    <div key={i} className="w-1.5 rounded-t-sm bg-emerald-500" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>

              <div className="flex-1">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-semibold">Last Transactions</h3>
                  <ArrowRight className="h-4 w-4 text-slate-500" />
                </div>
                
                <div className="space-y-4">
                  {[
                    { n: "Fiverr International", a: "+$100.00", in: true },
                    { n: "Annie Leonhart", a: "-$60.00", in: false },
                    { n: "Eren Yeager", a: "+$60.00", in: true }
                  ].map((tx, i) => (
                    <div key={i} className="flex justify-between items-center bg-slate-800/40 p-3 rounded-xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-700 font-bold flex items-center justify-center text-xs">
                          {tx.n[0]}
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">{tx.in ? "Receive" : "Transfer"}</p>
                          <p className="text-sm font-medium">{tx.n}</p>
                        </div>
                      </div>
                      <p className={`text-sm font-bold ${tx.in ? 'text-white' : 'text-slate-400'}`}>{tx.a}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* App Nav Bar */}
            <div className="h-16 bg-[#12161c] border-t border-slate-800 flex justify-between items-center px-8 z-20">
              <Home className="h-5 w-5 text-slate-500" />
              <Wallet className="h-5 w-5 text-slate-500" />
              <div className="h-12 w-12 bg-emerald-500 rounded-full flex items-center justify-center -mt-6 border-4 border-[#12161c] shadow-lg shadow-emerald-500/20">
                <Globe className="h-5 w-5 text-white" />
              </div>
              <ShieldCheck className="h-5 w-5 text-slate-500" />
              <div className="h-5 w-5 rounded-full border-2 border-slate-500 flex items-center justify-center">
                <div className="w-2.5 h-2.5 bg-slate-500 rounded-full" />
              </div>
            </div>

          </motion.div>

        </div>
      </main>
    </div>
  );
}
