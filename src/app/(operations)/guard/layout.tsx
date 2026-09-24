import React from "react";
import Link from "next/link";
import { Shield, ArrowLeft } from "lucide-react";

export default function GuardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black text-gray-100 flex flex-col justify-between">
      {/* Guard Zero-Chrome Top Header */}
      <header className="px-6 py-3.5 bg-[#0F1115] border-b border-[#2A303C] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-wider text-gray-100 font-display">
              EXIT VERIFICATION STATION
            </h1>
            <p className="text-[10px] font-mono text-gray-400">
              The Spice Route • Gate 1
            </p>
          </div>
        </div>

        <Link
          href="/login"
          className="text-xs text-gray-400 hover:text-white px-3 py-1.5 rounded-lg bg-surface border border-surface-border"
        >
          Exit Station
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 max-w-lg mx-auto w-full">
        {children}
      </main>

      <footer className="text-center text-[10px] text-gray-600 py-3 font-mono">
        Strict Zero-PII Binary Verification Protocol
      </footer>
    </div>
  );
}
