import React from "react";
import Link from "next/link";
import { Utensils, Shield, ChefHat, Sparkles, ArrowRight } from "lucide-react";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-gray-100">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 glass-panel border-b border-surface-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-background transition-all shadow-glow">
              <Utensils className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-extrabold text-lg tracking-tight text-gray-100">
                Table<span className="text-primary">OS</span>
              </span>
              <span className="text-[10px] text-gray-400 font-mono tracking-widest uppercase -mt-1">
                Dining Operating System
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-300">
            <Link
              href="/t/table-qr-token-spice-route-01"
              className="hover:text-primary transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-primary" />
              Diner Experience
            </Link>
            <Link
              href="/staff/tables"
              className="hover:text-primary transition-colors"
            >
              Floor Plan
            </Link>
            <Link
              href="/kitchen/queue"
              className="hover:text-primary transition-colors flex items-center gap-1.5"
            >
              <ChefHat className="w-4 h-4 text-amber-400" />
              Kitchen KDS
            </Link>
            <Link
              href="/guard/scan"
              className="hover:text-primary transition-colors flex items-center gap-1.5"
            >
              <Shield className="w-4 h-4 text-emerald-400" />
              Guard Scanner
            </Link>
            <Link
              href="/restaurant/dashboard"
              className="hover:text-primary transition-colors"
            >
              Restaurant Admin
            </Link>
          </nav>

          <div className="flex items-center gap-2.5">
            <Link
              href="/signup"
              className="px-3.5 py-2 text-xs font-bold text-black bg-primary hover:bg-primary-hover rounded-xl shadow-md shadow-primary/20 flex items-center gap-1.5 transition-all font-mono"
            >
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              Onboard Restaurant
            </Link>
            <Link
              href="/staff/login"
              className="px-3.5 py-2 text-xs font-bold text-amber-400 hover:text-white bg-amber-500/10 hover:bg-amber-500/20 rounded-xl border border-amber-500/30 transition-all font-mono hidden sm:inline-flex"
            >
              Staff Terminal
            </Link>
            <Link
              href="/login"
              className="px-3 py-2 text-xs font-medium text-gray-300 hover:text-gray-100 bg-surface-subtle hover:bg-surface-hover rounded-xl border border-surface-border transition-colors font-mono"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-surface-border bg-surface py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-gray-200">TableOS</span>
            <span>• Single-Codebase Dining Operating System</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-xs text-gray-500 font-mono">
              Live Backend: 54.146.192.20:8088
            </span>
            <span className="text-xs text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
              All Systems Operational
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
