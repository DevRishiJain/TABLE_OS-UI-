"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useGetAdminRestaurantsQuery } from "@/store/api/adminApi";

type TypeTab = "ALL" | "FRANCHISE" | "SINGLE";

export default function SpAdminRestaurantsPage() {
  const [tab, setTab] = useState<TypeTab>("ALL");
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");

  const { data: restaurants, isLoading } = useGetAdminRestaurantsQuery({
    type: tab === "ALL" ? undefined : tab,
    q: q || undefined,
  });

  const th = "text-left text-[10px] font-mono uppercase tracking-wider text-gray-500 px-3 py-2";
  const td = "px-3 py-2.5 text-xs text-gray-300";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-white">Restaurants</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            All tenant venues — ownership, subscriptions and live ops.
          </p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setQ(search);
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or handle…"
            className="px-3.5 py-2 rounded-xl bg-[#121418] border border-[#2A303C] text-xs text-gray-100 w-64 focus:outline-none focus:border-amber-400"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-amber-400 text-black text-xs font-extrabold hover:bg-amber-300"
          >
            Search
          </button>
        </form>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {([
          { k: "ALL" as TypeTab, label: "All" },
          { k: "FRANCHISE" as TypeTab, label: "Franchise-owned" },
          { k: "SINGLE" as TypeTab, label: "Single-owned" },
        ]).map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              tab === t.k
                ? "bg-amber-400 text-black"
                : "bg-[#121418] border border-[#2A303C] text-gray-400 hover:text-gray-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-[#121418] border border-[#2A303C] rounded-2xl overflow-x-auto">
        <table className="w-full min-w-[1100px]">
          <thead className="border-b border-[#2A303C]">
            <tr>
              <th className={th}>Restaurant</th>
              <th className={th}>Ownership</th>
              <th className={th}>Venue</th>
              <th className={th}>Status</th>
              <th className={th}>Subscription</th>
              <th className={`${th} text-right`}>Tables</th>
              <th className={`${th} text-right`}>Live</th>
              <th className={`${th} text-right`}>Orders Today</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2A303C]">
            {isLoading && (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-xs text-gray-500">
                  Loading restaurants…
                </td>
              </tr>
            )}
            {!isLoading && (restaurants || []).length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-xs text-gray-500">
                  No restaurants match this filter.
                </td>
              </tr>
            )}
            {(restaurants || []).map((r) => (
              <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                <td className={td}>
                  <Link
                    href={`/spadmin/restaurants/${r.id}`}
                    className="font-bold text-gray-100 hover:text-amber-300"
                  >
                    {r.name}
                  </Link>
                  <div className="text-[10px] text-gray-500 font-mono">
                    /{(r as any).slug || "—"}
                  </div>
                </td>
                <td className={td}>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                      r.ownership_type === "FRANCHISE"
                        ? "bg-violet-500/15 text-violet-300"
                        : "bg-sky-500/15 text-sky-300"
                    }`}
                  >
                    {r.ownership_type || "SINGLE"}
                  </span>
                  {r.franchise_name && (
                    <div className="text-[10px] text-gray-500 mt-0.5">{r.franchise_name}</div>
                  )}
                </td>
                <td className={td}>{(r as any).venue_type || "—"}</td>
                <td className={td}>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                      r.is_active
                        ? "bg-emerald-500/15 text-emerald-300"
                        : "bg-red-500/15 text-red-300"
                    }`}
                  >
                    {r.is_active ? "ACTIVE" : "SUSPENDED"}
                  </span>
                </td>
                <td className={td}>
                  <div className="font-bold">{r.subscription_plan || "—"}</div>
                  <div className="text-[10px] text-gray-500">
                    {r.days_remaining ?? "—"}d left ·{" "}
                    {r.is_subscription_active ? "active" : "inactive"}
                  </div>
                </td>
                <td className={`${td} text-right font-mono`}>{r.table_count ?? "—"}</td>
                <td className={`${td} text-right font-mono`}>{r.active_sessions ?? 0}</td>
                <td className={`${td} text-right font-mono`}>{r.orders_today ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
