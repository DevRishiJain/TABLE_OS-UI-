"use client";

import React from "react";
import Link from "next/link";
import { useGetAdminActivityFeedQuery } from "@/store/api/adminApi";
import { formatMoney } from "@/lib/money";

export default function SpAdminActivityPage() {
  const { data: feed, isLoading } = useGetAdminActivityFeedQuery(
    { limit: 100 },
    { pollingInterval: 15000 }
  );

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-extrabold text-white">Live Activity</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Latest orders across all restaurants · refreshes every 15s.
        </p>
      </div>

      <div className="bg-[#121418] border border-[#2A303C] rounded-2xl divide-y divide-[#2A303C]">
        {isLoading && <p className="px-5 py-6 text-xs text-gray-500">Loading feed…</p>}
        {!isLoading && (feed || []).length === 0 && (
          <p className="px-5 py-6 text-xs text-gray-500">No activity recorded yet.</p>
        )}
        {(feed || []).map((f, i) => (
          <div key={i} className="px-5 py-3.5 flex items-center justify-between gap-3 text-xs">
            <div className="min-w-0">
              <Link
                href={`/spadmin/restaurants/${f.restaurant_id}`}
                className="font-bold text-gray-100 hover:text-amber-300"
              >
                {f.restaurant_name}
              </Link>
              <span className="text-gray-500"> · Table {f.table_number}</span>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <span className="px-2 py-0.5 rounded-md bg-white/5 border border-[#2A303C] font-mono text-[10px] text-gray-300">
                {f.status}
              </span>
              <span className="font-mono text-amber-300 font-bold">
                {formatMoney(f.total)}
              </span>
              <span className="text-gray-500 font-mono text-[10px] w-20 text-right">
                {f.placed_at ? new Date(f.placed_at).toLocaleTimeString("en-IN") : ""}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
