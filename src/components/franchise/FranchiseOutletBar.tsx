"use client";

import React, { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import { setSelectedOutlet } from "@/store/slices/franchiseSlice";
import { Building2, Globe, Store, Plus, ShieldCheck } from "lucide-react";
import { LinkOutletModal } from "./LinkOutletModal";

export const FranchiseOutletBar: React.FC = () => {
  const dispatch = useAppDispatch();
  const { franchiseName, selectedOutletId, outlets } = useAppSelector(
    (state) => state.franchise
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const selectedOutlet = outlets.find((o) => o.id === selectedOutletId);

  return (
    <>
      <div className="mb-6 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-surface-subtle to-surface border border-amber-500/20 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Franchise Identity & Active Context */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-md">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono">
                Franchise Governance Mode
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                {outlets.length} Stores Owned
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-extrabold text-gray-100 font-display">
              {franchiseName}
            </h2>
          </div>
        </div>

        {/* Right: Global Outlet Context Selector & Action Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[240px] flex-1 sm:flex-initial">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
              Active Store Context Filter
            </label>
            <div className="relative">
              <select
                value={selectedOutletId}
                onChange={(e) => dispatch(setSelectedOutlet(e.target.value))}
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-surface border border-amber-500/30 text-xs font-bold text-gray-100 focus:outline-none focus:border-amber-400 font-mono shadow-inner cursor-pointer appearance-none"
              >
                <option value="ALL">
                  🌐 ALL Outlets Combined (Franchise Total)
                </option>
                {outlets.map((o) => (
                  <option key={o.id} value={o.id}>
                    📍 {o.name}
                  </option>
                ))}
              </select>
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400 pointer-events-none">
                {selectedOutletId === "ALL" ? (
                  <Globe className="w-4 h-4" />
                ) : (
                  <Store className="w-4 h-4" />
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-4 sm:mt-0 py-2 px-3.5 rounded-xl bg-amber-500 text-black text-xs font-extrabold flex items-center gap-1.5 hover:bg-amber-400 transition-all shadow-md shadow-amber-500/10 shrink-0 self-end"
          >
            <Plus className="w-4 h-4" />
            <span>Link / Create Outlet</span>
          </button>
        </div>
      </div>

      <LinkOutletModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};
