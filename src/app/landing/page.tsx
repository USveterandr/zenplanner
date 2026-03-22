'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle2, Crown, RefreshCcw, Shield, Eye, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-violet-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-slate-950/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">ZenPlanner</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#testimonials" className="hover:text-white transition-colors">Testimonials</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link href="/">
              <Button className="bg-white text-slate-950 hover:bg-slate-200 font-semibold rounded-full px-6">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-violet-600/20 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-sm font-medium mb-8">
              <Crown className="w-4 h-4" />
              Join 500,000+ top performers architecting their time
            </div>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight mb-8"
          >
            Take Back Control <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-violet-400 to-indigo-400">
              Of Your Time.
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10"
          >
            The ultimate unified calendar that turns chaotic schedules into flawless days. 
            Seamlessly sync Google Calendar and imports, and find your focus in seconds.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/">
              <Button size="lg" className="bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-full px-8 h-14 text-lg w-full sm:w-auto shadow-xl shadow-violet-900/20">
                Start Architecting Your Day
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <p className="text-sm text-slate-500 sm:hidden">No credit card required.</p>
          </motion.div>

          {/* Abstract App Mockup */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-20 relative mx-auto max-w-5xl"
          >
            <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-transparent to-transparent z-10 top-1/2" />
            <div className="rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-2xl p-4 md:p-8 shadow-2xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="space-y-4 opacity-50 grayscale">
                  <div className="h-8 w-1/3 bg-slate-800 rounded-lg" />
                  <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: 14 }).map((_, i) => (
                      <div key={i} className="aspect-square bg-slate-800 rounded-md" />
                    ))}
                  </div>
                  <div className="space-y-2 mt-4">
                    <div className="h-12 w-full bg-red-900/40 rounded-lg border border-red-500/20" />
                    <div className="h-12 w-3/4 bg-amber-900/40 rounded-lg border border-amber-500/20" />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="h-8 w-1/3 bg-violet-500/20 rounded-lg flex items-center px-3">
                    <span className="text-xs text-violet-400 font-medium">ZenPlanner Master View</span>
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: 14 }).map((_, i) => (
                      <div key={i} className={`aspect-square rounded-md ${i % 3 === 0 ? 'bg-violet-600' : 'bg-slate-800'}`} />
                    ))}
                  </div>
                  <div className="space-y-2 mt-4">
                    <div className="h-12 w-full bg-violet-600/20 rounded-lg border border-violet-500/50 flex items-center px-4">
                       <span className="text-sm text-violet-200">Deep Work Block</span>
                    </div>
                    <div className="h-12 w-full bg-indigo-600/20 rounded-lg border border-indigo-500/50 flex items-center px-4">
                      <span className="text-sm text-indigo-200">Team Sync - Google Meet</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-slate-900/50 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Your current calendar is working against you.</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              You're bouncing between apps, manually importing files, and constantly feeling behind. ZenPlanner fixes the fragmentation.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-950 p-8 rounded-2xl border border-white/5 hover:border-violet-500/30 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center mb-6">
                <RefreshCcw className="w-6 h-6 text-violet-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3">All your calendars, finally playing nice.</h3>
              <p className="text-slate-400">
                Instantly sync your Google Calendar and effortlessly drop in any .ics file. We aggregate your life into one beautiful, conflict-free master schedule.
              </p>
            </div>

            <div className="bg-slate-950 p-8 rounded-2xl border border-white/5 hover:border-violet-500/30 transition-colors mt-8 md:mt-0">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Defend your focus.</h3>
              <p className="text-slate-400">
                ZenPlanner automatically identifies fragmented open slots and consolidates them into protected blocks for deep work. Less context switching.
              </p>
            </div>

            <div className="bg-slate-950 p-8 rounded-2xl border border-white/5 hover:border-violet-500/30 transition-colors mt-8 md:mt-0">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-6">
                <Eye className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Noise-canceling for your schedule.</h3>
              <p className="text-slate-400">
                A distraction-free UI designed to lower your cortisol. See what you need to do, exactly when you need to do it, without visual clutter.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-violet-600/10" />
        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to meet the most productive version of yourself?</h2>
          <p className="text-xl text-slate-300 mb-10">
            Users switch to ZenPlanner and reclaim an average of 5.2 hours a week. What could you do with an extra 20 hours a month?
          </p>
          <Link href="/">
            <Button size="lg" className="bg-white text-slate-950 hover:bg-slate-200 font-bold rounded-full px-10 h-16 text-xl shadow-2xl">
              Claim Your Free Account Now
            </Button>
          </Link>
          <p className="mt-4 text-slate-400">Setup takes less than 30 seconds.</p>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="border-t border-white/10 bg-slate-950 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-violet-500" />
            <span className="font-bold tracking-tight">ZenPlanner</span>
          </div>
          <div className="flex gap-6 text-sm text-slate-500">
            <Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/" className="hover:text-white transition-colors">Terms of Service</Link>
            <a href="https://twitter.com/ZenPlannerApp" className="hover:text-white transition-colors">@ZenPlannerApp</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
