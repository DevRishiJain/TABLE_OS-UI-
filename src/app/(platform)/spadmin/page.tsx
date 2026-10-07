"use client";

import React from "react";
import Link from "next/link";
import {
  useGetAdminOverviewQuery,
  useGetAdminActivityFeedQuery,
} from "@/store/api/adminApi";
import { formatMoney } from "@/lib/money";

const card = "bg-[#121418] border border-[#2A303C] rounded-2xl p-5";
const kpiLabel = "text-[11px] font-mono uppercase tracking-wider text-gray-500";
const kpiVal = "text-2xl font-extrabold text-white mt-1";

export default function SpAdminOverviewPage() {
  const { data: overview, isLoading } = useGetAdminOverviewQuery();
  const { data: feed } = useGetAdminActivityFeedQuery(
    { limit: 15 },
    { pollingInterval: 15000 }
  );

  const kpis = [
    { label: "Restaurants", value: overview?.total_restaurants },
    { label: "Active", value: overview?.active_restaurants },
    { label: "Suspended", value: overview?.suspended_restaurants },
    { label: "Franchises", value: overview?.franchise_count },
    { label: "Franchise Outlets", value: overview?.franchise_outlets },
    { label: "Single Restaurants", value: overview?.single_restaurants },
    { label: "Active Subs", value: overview?.active_subscriptions },
    { label: "Expired Subs", value: overview?.expired_subscriptions },
    { label: "Live Sessions", value: overview?.live_sessions },
    { label: "Orders Today", value: overview?.orders_today },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-extrabold text-white">Platform Overview</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Cross-tenant health, subscriptions and live activity.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {kpis.map((k) => (
          <div key={k.label} className={card}>
            <div className={kpiLabel}>{k.label}</div>
            <div className={kpiVal}>
              {isLoading ? "…" : (k.value ?? 0)}
            </div>
          </div>
        ))}
        <div className={`${card} border-amber-400/30`}>
          <div className={kpiLabel}>Revenue Today</div>
          <div className={`${kpiVal} text-amber-300`}>
            {isLoading ? "…" : formatMoney(overview?.revenue_today_minor)}
          </div>
        </div>
        <div className={card}>
          <div className={kpiLabel}>Platform Gross</div>
          <div className={`${kpiVal} text-emerald-400`}>
            {isLoading ? "…" : formatMoney(overview?.platform_gross_sales_minor)}
          </div>
        </div>
        <div className={card}>
          <div className={kpiLabel}>Fee Revenue</div>
          <div className={`${kpiVal} text-emerald-400`}>
            {isLoading ? "…" : formatMoney(overview?.platform_fee_revenue_minor)}
          </div>
        </div>
      </div>

      <div className={card}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-white">Latest Activity</h2>
            <p className="text-[11px] text-gray-500">Auto-refreshing every 15s</p>
          </div>
          <Link
            href="/spadmin/activity"
            className="text-xs text-amber-400 hover:text-amber-300 font-bold"
          >
            View all →
          </Link>
        </div>
        <div className="flex flex-col divide-y divide-[#2A303C]">
          {(feed || []).length === 0 && (
            <p className="text-xs text-gray-500 py-4">No recent activity.</p>
          )}
          {(feed || []).map((f, i) => (
            <div key={i} className="py-2.5 flex items-center justify-between gap-3 text-xs">
              <div className="min-w-0">
                <Link
                  href={`/spadmin/restaurants/${f.restaurant_id}`}
                  className="font-bold text-gray-100 hover:text-amber-300"
                >
                  {f.restaurant_name}
                </Link>
                <span className="text-gray-500"> · Table {f.table_number}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="px-2 py-0.5 rounded-md bg-white/5 border border-[#2A303C] font-mono text-[10px] text-gray-300">
                  {f.status}
                </span>
                <span className="font-mono text-amber-300">{formatMoney(f.total)}</span>
                <span className="text-gray-500 font-mono text-[10px]">
                  {f.placed_at ? new Date(f.placed_at).toLocaleTimeString("en-IN") : ""}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
