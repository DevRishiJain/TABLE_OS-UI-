"use client";

import React from "react";
import Link from "next/link";
import {
  useGetTodayAnalyticsQuery,
  useGetRestaurantOverviewQuery,
  useGetMenuItemsQuery,
} from "@/store/api/restaurantApi";
import { useGetStaffTablesQuery } from "@/store/api/staffApi";
import { formatMoney } from "@/lib/money";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  TrendingUp,
  Users,
  ShoppingBag,
  Receipt,
  Layers,
  ChefHat,
  Sparkles,
  ArrowRight,
  Clock,
  ArrowUpRight,
} from "lucide-react";

export default function RestaurantDashboardOverviewPage() {
  const { data: today, isLoading: isTodayLoading } =
    useGetTodayAnalyticsQuery();
  const { data: menuItems } = useGetMenuItemsQuery();
  const { data: staffTables } = useGetStaffTablesQuery();

  const totalGmvMinor = today?.total_gmv?.amount_minor_units || 0;
  const platformFeeMinor = today?.platform_fee_accrued?.amount_minor_units || 0;
  const netRevenueMinor = totalGmvMinor - platformFeeMinor;
  const orderCount = today?.order_count || 0;
  const aovMinor = today?.average_order_value?.amount_minor_units || 0;

  const totalTables = staffTables?.length || 8;
  const occupiedTables =
    staffTables?.filter((t) => t.is_occupied)?.length ||
    today?.active_session_count ||
    0;

  return (
    <div className="flex flex-col gap-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-gray-100 flex items-center gap-2">
            The Spice Route — Executive Overview
          </h1>
          <p className="text-xs text-gray-400">
            Today's business at a glance
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/restaurant/menu">
            <Button
              variant="gold"
              size="sm"
              leftIcon={<Sparkles className="w-4 h-4" />}
            >
              Scan Menu with AI
            </Button>
          </Link>
          <Link href="/staff/tables">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Layers className="w-4 h-4" />}
            >
              Floor Plan
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's GMV */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Today's Gross Sales
            </span>
            <div className="p-2 rounded-xl bg-primary/20 text-primary">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black font-mono text-primary">
              {formatMoney(totalGmvMinor)}
            </div>
            <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 mt-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              Updated in real-time
            </span>
          </div>
        </Card>

        {/* Net Revenue */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Net Restaurant Revenue
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black font-mono text-emerald-400">
              {formatMoney(netRevenueMinor)}
            </div>
            <span className="text-[11px] text-gray-400 mt-1">
              After 1% platform fee deduction
            </span>
          </div>
        </Card>

        {/* Orders Placed */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Total Placed Orders
            </span>
            <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black font-mono text-gray-100">
              {orderCount}
            </div>
            <span className="text-[11px] text-gray-400 mt-1">
              AOV: {formatMoney(aovMinor)}
            </span>
          </div>
        </Card>

        {/* Table Turn Status */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Active Tables
            </span>
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black font-mono text-amber-300">
              {occupiedTables} / {totalTables}
            </div>
            <span className="text-[11px] text-gray-400 mt-1">
              {occupiedTables > 0
                ? `${occupiedTables} in active dining`
                : "All tables available"}
            </span>
          </div>
        </Card>
      </div>

      {/* Quick Launchpad & Catalog Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-surface-border/60 pb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-200">
              Catalog Snapshot
            </h3>
            <Link
              href="/restaurant/menu"
              className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold"
            >
              Manage Catalog ({menuItems?.length || 0} Dishes)
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {menuItems?.slice(0, 4).map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-surface-subtle border border-surface-border flex items-center justify-between"
              >
                <div>
                  <h4 className="text-xs font-bold text-gray-100">{item.name}</h4>
                  <span className="text-[11px] text-primary font-mono font-bold">
                    {formatMoney(item.price.amount_minor_units)}
                  </span>
                </div>
                <Badge variant="success" size="sm">
                  Active
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Operations Launchpad */}
        <Card className="p-6 flex flex-col justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-200 mb-1">
              Live Operations Links
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Open specialized screens for waitstaff, line chefs, or security personnel.
            </p>
          </div>

          <div className="flex flex-col gap-2.5">
            <Link
              href="/staff/tables"
              className="p-3 rounded-xl bg-surface-subtle hover:bg-surface-hover border border-surface-border text-xs font-bold flex items-center justify-between text-gray-200 group"
            >
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-primary" />
                <span>Interactive Floor Grid</span>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-primary transition-colors" />
            </Link>

            <Link
              href="/kitchen/queue"
              className="p-3 rounded-xl bg-surface-subtle hover:bg-surface-hover border border-surface-border text-xs font-bold flex items-center justify-between text-gray-200 group"
            >
              <div className="flex items-center gap-2.5">
                <ChefHat className="w-4 h-4 text-amber-400" />
                <span>Kitchen Display System</span>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-amber-400 transition-colors" />
            </Link>

            <Link
              href="/restaurant/ledger"
              className="p-3 rounded-xl bg-surface-subtle hover:bg-surface-hover border border-surface-border text-xs font-bold flex items-center justify-between text-gray-200 group"
            >
              <div className="flex items-center gap-2.5">
                <Receipt className="w-4 h-4 text-emerald-400" />
                <span>Platform Fee Payable Ledger</span>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-emerald-400 transition-colors" />
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
