"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Utensils,
  Sparkles,
  Phone,
  Mail,
  ShieldCheck,
  Lock,
  FileText,
  Clock,
  ArrowRight,
  Sun,
  Moon,
} from "lucide-react";
import { PolicyModals, ModalType } from "@/components/marketing/PolicyModals";
import { useRestaurantTheme } from "@/components/providers/RestaurantThemeProvider";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const { colorMode, toggleColorMode, isMounted } = useRestaurantTheme();

  return (
    <div className="min-h-screen flex flex-col bg-background text-gray-100 selection:bg-primary/30 selection:text-white">
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
                Hospitality Operating System
              </span>
            </div>
          </Link>

          {/* Clean in-page feature navigation — no random internal redirects */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-gray-300">
            <a
              href="#features"
              className="hover:text-primary transition-colors flex items-center gap-1.5"
            >
              Guest & Menu
            </a>
            <a
              href="#inventory"
              className="hover:text-primary transition-colors flex items-center gap-1.5"
            >
              Sourcing & Wastage
            </a>
            <a
              href="#operations"
              className="hover:text-primary transition-colors flex items-center gap-1.5"
            >
              KDS & Operations
            </a>
            <a
              href="#venues"
              className="hover:text-primary transition-colors flex items-center gap-1.5"
            >
              Venues & Themes
            </a>
            <a
              href="#contact"
              className="hover:text-primary transition-colors flex items-center gap-1.5 text-primary"
            >
              Contact Concierge
            </a>
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
              href="/login"
              className="px-3.5 py-2 text-xs font-semibold text-gray-200 hover:text-white bg-surface-subtle hover:bg-surface-hover rounded-xl border border-surface-border transition-colors font-mono"
            >
              Sign In
            </Link>

            {/* Light / Dark Mode Toggle */}
            <button
              type="button"
              onClick={toggleColorMode}
              aria-label="Toggle Light/Dark Mode"
              className="w-9 h-9 rounded-xl bg-surface-subtle hover:bg-surface-hover border border-surface-border flex items-center justify-center text-gray-300 hover:text-white transition-all shadow-sm group"
              title={isMounted && colorMode === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
            >
              {isMounted && colorMode === "light" ? (
                <Moon className="w-4 h-4 text-indigo-500 group-hover:scale-110 transition-transform" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1">{children}</main>

      {/* Comprehensive Enterprise Footer */}
      <footer className="border-t border-surface-border bg-[#0B0D13] py-14 px-4 sm:px-6 lg:px-8 mt-16">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-surface-border">
            {/* Brand column */}
            <div className="md:col-span-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary">
                  <Utensils className="w-4 h-4" />
                </div>
                <span className="font-display font-extrabold text-lg text-white">
                  Table<span className="text-primary">OS</span>
                </span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed max-w-sm">
                The all-in-one hospitality operating platform powering dining rooms, drive-in bars, kitchens, and raw material inventory with zero revenue leakage.
              </p>
              <div className="flex items-center gap-2 text-xs text-emerald-400 pt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
                <span>All Station Services Operational</span>
              </div>
            </div>

            {/* Customer Care Desk */}
            <div className="md:col-span-5 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-300">
                Customer Care & Hospitality Concierge
              </span>
              <div className="space-y-2 text-xs text-gray-300">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-primary" />
                  <span>Toll-Free Hotline:</span>
                  <a href="tel:+9118008903240" className="text-white hover:text-primary font-mono font-bold">
                    +91 1800 890 3240
                  </a>
                  <span className="text-gray-500 font-mono">/ +91 98765 43210</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-primary" />
                  <span>Support Desk:</span>
                  <a href="mailto:concierge@tableos.in" className="text-white hover:text-primary font-mono font-bold">
                    concierge@tableos.in
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  <span>Coverage:</span>
                  <span className="text-gray-400">24/7 Dedicated Support & On-Ground Onboarding</span>
                </div>
              </div>
            </div>

            {/* Legal & Policies */}
            <div className="md:col-span-3 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-300">
                Trust & Security
              </span>
              <ul className="space-y-2 text-xs text-gray-400">
                <li>
                  <button
                    onClick={() => setActiveModal("privacy")}
                    className="hover:text-primary transition-colors flex items-center gap-1.5"
                  >
                    <Lock className="w-3.5 h-3.5 text-gray-500" />
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveModal("security")}
                    className="hover:text-primary transition-colors flex items-center gap-1.5"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-gray-500" />
                    Security Standards
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveModal("terms")}
                    className="hover:text-primary transition-colors flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5 text-gray-500" />
                    Terms of Service
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
            <div>
              &copy; {new Date().getFullYear()} TableOS Hospitality Technologies. All rights reserved.
            </div>
            <div className="flex items-center gap-4">
              <span>2 Months Complimentary Trial</span>
              <span>•</span>
              <span>Zero Setup Cost</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Policy Modals */}
      <PolicyModals
        activeModal={activeModal}
        onClose={() => setActiveModal(null)}
      />
    </div>
  );
}
