"use client";

import React from "react";
import Link from "next/link";
import { useGetFraudReviewQueueQuery } from "@/store/api/adminApi";
import { formatMoney } from "@/lib/money";
import { ShieldAlert } from "lucide-react";

export default function SpAdminFraudPage() {
  const { data: queue, isLoading } = useGetFraudReviewQueueQuery();

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-extrabold text-white">Fraud & Risk</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Sessions flagged by the platform for manual review.
        </p>
      </div>

      {isLoading && <p className="text-xs text-gray-500">Loading flags…</p>}
      {!isLoading && (queue || []).length === 0 && (
        <div className="bg-[#121418] border border-[#2A303C] rounded-2xl p-10 text-center">
          <ShieldAlert className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
          <p className="text-sm font-bold text-white">All clear</p>
          <p className="text-xs text-gray-500 mt-1">No flagged sessions pending review.</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {(queue || []).map((f, i) => (
          <div
            key={f.session_id || i}
            className="bg-[#121418] border border-red-500/20 rounded-2xl p-5 flex items-start justify-between gap-4"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-md bg-red-500/15 text-red-300 text-[10px] font-mono font-bold uppercase">
                  {f.flag_type || f.flag_reason || "FLAGGED"}
                </span>
                {f.risk_score !== undefined && (
                  <span className="text-[10px] font-mono text-gray-500">
                    score {f.risk_score}
                  </span>
                )}
              </div>
              <Link
                href={`/spadmin/restaurants/${f.restaurant_id}`}
                className="block font-bold text-sm text-gray-100 hover:text-amber-300 mt-2"
              >
                {f.restaurant_name || f.restaurant_id}
              </Link>
              <p className="text-xs text-gray-400 mt-1">
                {f.description || "No description provided."}
              </p>
            </div>
            <div className="text-right shrink-0">
              {f.amount_minor !== undefined && (
                <div className="font-mono text-amber-300 font-bold">
                  {formatMoney(f.amount_minor)}
                </div>
              )}
              {f.created_at && (
                <div className="text-[10px] font-mono text-gray-500 mt-1">
                  {new Date(f.created_at).toLocaleString("en-IN")}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
