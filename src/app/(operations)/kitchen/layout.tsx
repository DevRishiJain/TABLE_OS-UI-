import React from "react";
import Link from "next/link";
import { ChefHat, ArrowLeft, Layers, Volume2 } from "lucide-react";

export default function KitchenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0A0C0F] text-gray-100 flex flex-col">
      {/* High-Contrast Kitchen Header */}
      <header className="sticky top-0 z-40 bg-[#12151B] border-b border-surface-border px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-bold">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-gray-100 font-display flex items-center gap-2">
              KITCHEN DISPLAY SYSTEM (KDS)
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </h1>
            <p className="text-[11px] text-gray-400 font-mono">
              The Spice Route • Active Line Cook Station
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/staff/tables"
            className="p-2.5 rounded-xl bg-surface hover:bg-surface-hover border border-surface-border text-gray-300 text-xs flex items-center gap-1.5"
          >
            <Layers className="w-4 h-4" />
            <span className="hidden sm:inline">Floor Plan</span>
          </Link>
          <Link
            href="/login"
            className="p-2.5 rounded-xl bg-surface hover:bg-surface-hover border border-surface-border text-gray-400 hover:text-white text-xs"
          >
            Switch Role
          </Link>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6">{children}</main>
    </div>
  );
}
