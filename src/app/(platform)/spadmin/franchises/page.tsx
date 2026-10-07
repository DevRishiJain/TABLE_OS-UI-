"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useGetAdminFranchisesQuery } from "@/store/api/adminApi";
import { formatMoney } from "@/lib/money";
import { ChevronDown, ChevronRight, Store } from "lucide-react";

export default function SpAdminFranchisesPage() {
  const { data: franchises, isLoading } = useGetAdminFranchisesQuery();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-extrabold text-white">Franchises</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Brand groups, owners and their outlets.
        </p>
      </div>

      {isLoading && <p className="text-xs text-gray-500">Loading franchises…</p>}
      {!isLoading && (franchises || []).length === 0 && (
        <div className="bg-[#121418] border border-[#2A303C] rounded-2xl p-8 text-center text-xs text-gray-500">
          No franchises yet.
        </div>
      )}

      {(franchises || []).map((f) => {
        const open = expanded[f.id];
        return (
          <div
            key={f.id}
            className="bg-[#121418] border border-[#2A303C] rounded-2xl overflow-hidden"
          >
            <button
              onClick={() => setExpanded((p) => ({ ...p, [f.id]: !p[f.id] }))}
              className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-white/[0.02] transition-colors"
            >
              {open ? (
                <ChevronDown className="w-4 h-4 text-amber-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )}
              <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-300 flex items-center justify-center">
                <Store className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-white">{f.name}</div>
                <div className="text-[11px] text-gray-500 font-mono">
                  Owner: {f.owner_name || "—"} {f.owner_email ? `· ${f.owner_email}` : ""}
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-[#2A303C] text-[10px] font-mono text-gray-300">
                {f.outlet_count ?? f.outlets?.length ?? 0} outlets
              </span>
            </button>

            {open && (
              <div className="border-t border-[#2A303C] divide-y divide-[#2A303C]">
                {(f.outlets || []).map((o) => (
                  <Link
                    key={o.id}
                    href={`/spadmin/restaurants/${o.id}`}
                    className="flex items-center justify-between px-6 py-3 hover:bg-white/[0.02] text-xs transition-colors"
                  >
                    <div>
                      <span className="font-bold text-gray-200">{o.name}</span>
                      <span className="text-gray-500 font-mono text-[10px] ml-2">
                        /{o.slug || "—"}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 font-mono text-[11px]">
                      <span className="text-gray-400">
                        {o.days_remaining ?? "—"}d left
                      </span>
                      <span
                        className={
                          o.is_active ? "text-emerald-400" : "text-red-400"
                        }
                      >
                        {o.is_active ? "ACTIVE" : "SUSPENDED"}
                      </span>
                      <span className="text-amber-300">
                        {formatMoney(o.revenue_today_minor)}
                      </span>
                    </div>
                  </Link>
                ))}
                {(f.outlets || []).length === 0 && (
                  <p className="px-6 py-4 text-xs text-gray-500">No outlets in this franchise.</p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
