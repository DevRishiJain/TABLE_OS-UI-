"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  DollarSign,
  PieChart,
  ShoppingBag,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  RefreshCw,
  Wallet,
  Receipt,
  Layers,
  ChevronRight,
  ShieldCheck,
  Percent,
} from "lucide-react";
import {
  useGetExecutiveDashboardAnalyticsQuery,
  useGetDishMarginsQuery,
} from "@/store/api/restaurantApi";
import { formatCurrencyMinor } from "@/lib/formatters";

type DatePreset = "TODAY" | "YESTERDAY" | "LAST_7_DAYS" | "THIS_MONTH" | "CUSTOM";

export default function UnifiedExecutiveAnalyticsPage() {
  const [preset, setPreset] = useState<DatePreset>("THIS_MONTH");
  const [customStart, setCustomStart] = useState<string>("");
  const [customEnd, setCustomEnd] = useState<string>("");

  const computeDateRange = () => {
    const now = new Date();
    const toYMD = (d: Date) => d.toISOString().split("T")[0];

    if (preset === "TODAY") {
      const today = toYMD(now);
      return { startDate: today, endDate: today };
    }
    if (preset === "YESTERDAY") {
      const yest = new Date(now);
      yest.setDate(yest.getDate() - 1);
      const yStr = toYMD(yest);
      return { startDate: yStr, endDate: yStr };
    }
    if (preset === "LAST_7_DAYS") {
      const past = new Date(now);
      past.setDate(past.getDate() - 6);
      return { startDate: toYMD(past), endDate: toYMD(now) };
    }
    if (preset === "THIS_MONTH") {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: toYMD(firstDay), endDate: toYMD(now) };
    }
    return {
      startDate: customStart || undefined,
      endDate: customEnd || undefined,
    };
  };

  const { startDate, endDate } = computeDateRange();

  const {
    data: analytics,
    isLoading,
    isFetching,
    refetch,
  } = useGetExecutiveDashboardAnalyticsQuery({
    startDate,
    endDate,
  });

  const { data: dishMargins } = useGetDishMarginsQuery();

  const pnl = analytics?.pnl;
  const isHealthyFoodCost = (pnl?.food_cost_pct || 0) <= (pnl?.target_food_cost_pct || 30.0);
  const isProfitable = (pnl?.net_profit.amount_minor_units || 0) >= 0;

  // Calculate payment totals & percentages
  const paymentMethods = analytics?.payment_methods || {};
  const totalPaymentMinor = Object.values(paymentMethods).reduce((acc, curr) => acc + curr, 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-8 animate-fade-in text-gray-100">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-surface-border">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display text-white">
              Executive Analytics & P&L
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Real-time Ledger
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            Consolidated Profit & Loss statement, live food cost variance, and dish margins.
          </p>
        </div>

        {/* Date Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-[#12151B] p-1 rounded-xl border border-surface-border flex items-center gap-1 shadow-sm">
            {(
              [
                { id: "TODAY", label: "Today" },
                { id: "YESTERDAY", label: "Yesterday" },
                { id: "LAST_7_DAYS", label: "7 Days" },
                { id: "THIS_MONTH", label: "This Month" },
                { id: "CUSTOM", label: "Custom" },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                onClick={() => setPreset(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  preset === p.id
                    ? "bg-primary text-black font-bold shadow-md shadow-primary/20"
                    : "text-gray-400 hover:text-white hover:bg-surface-hover"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2.5 rounded-xl border border-surface-border bg-surface hover:bg-surface-hover text-gray-300 transition-colors shadow-sm disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin text-primary" : ""}`} />
          </button>
        </div>
      </div>

      {/* Custom Date Pickers */}
      {preset === "CUSTOM" && (
        <div className="p-4 rounded-xl border border-surface-border bg-surface flex flex-wrap items-center gap-4 text-xs animate-slide-down">
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Start Date:</span>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="bg-background border border-surface-border rounded-lg px-3 py-1.5 text-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">End Date:</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="bg-background border border-surface-border rounded-lg px-3 py-1.5 text-white"
            />
          </div>
        </div>
      )}

      {/* Low Stock Warning Banner */}
      {analytics && analytics.low_stock_alerts_count > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-300">
                {analytics.low_stock_alerts_count} Raw Material(s) Running Below Threshold
              </p>
              <p className="text-xs text-amber-400/80">
                Immediate stock replenishment recommended to avoid menu item sell-outs.
              </p>
            </div>
          </div>
          <Link
            href="/restaurant/inventory"
            className="px-3.5 py-1.5 rounded-lg bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 transition-colors flex items-center gap-1.5"
          >
            <span>View Stock</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Executive P&L Scorecard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Gross Revenue */}
        <div className="bg-surface border border-surface-border rounded-2xl p-6 relative overflow-hidden group hover:border-primary/40 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Gross Sales</span>
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {isLoading ? "..." : formatCurrencyMinor(pnl?.gross_revenue.amount_minor_units || 0)}
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
              <span>{analytics?.total_orders || 0} completed orders</span>
              <span>•</span>
              <span>AOV: {formatCurrencyMinor(analytics?.average_order_value.amount_minor_units || 0)}</span>
            </div>
          </div>
        </div>

        {/* COGS (Food Cost) */}
        <div className="bg-surface border border-surface-border rounded-2xl p-6 relative overflow-hidden group hover:border-amber-500/40 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Food Cost (COGS)
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {isLoading
                ? "..."
                : formatCurrencyMinor(pnl?.cogs_variable_expenses.amount_minor_units || 0)}
            </div>
            <div className="flex items-center justify-between mt-2 text-xs">
              <span className="text-gray-400">Food Cost %:</span>
              <span
                className={`font-bold px-2 py-0.5 rounded ${
                  isHealthyFoodCost
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-rose-500/10 text-rose-400"
                }`}
              >
                {pnl ? `${pnl.food_cost_pct.toFixed(1)}%` : "0%"} (Target: {pnl?.target_food_cost_pct || 30}%)
              </span>
            </div>
          </div>
        </div>

        {/* Operating Overhead */}
        <div className="bg-surface border border-surface-border rounded-2xl p-6 relative overflow-hidden group hover:border-rose-500/40 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Operating Overhead
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {isLoading ? "..." : formatCurrencyMinor(pnl?.fixed_expenses.amount_minor_units || 0)}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-400">
              <span>Rent, Salaries & Utilities</span>
              <Link href="/restaurant/expenses" className="text-primary hover:underline ml-auto">
                Details →
              </Link>
            </div>
          </div>
        </div>

        {/* Net Profit */}
        <div
          className={`border rounded-2xl p-6 relative overflow-hidden transition-all shadow-sm ${
            isProfitable
              ? "bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/50"
              : "bg-rose-950/20 border-rose-500/30 hover:border-rose-500/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Net Profit</span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isProfitable
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-rose-500/20 text-rose-400"
              }`}
            >
              {isProfitable ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            </div>
          </div>
          <div className="mt-4">
            <div
              className={`text-2xl sm:text-3xl font-black tracking-tight ${
                isProfitable ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {isLoading ? "..." : formatCurrencyMinor(pnl?.net_profit.amount_minor_units || 0)}
            </div>
            <div className="flex items-center justify-between mt-2 text-xs">
              <span className="text-gray-400">Net Margin:</span>
              <span
                className={`font-extrabold ${isProfitable ? "text-emerald-400" : "text-rose-400"}`}
              >
                {pnl ? `${pnl.net_margin_pct.toFixed(1)}%` : "0%"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Daily Trend & Payment Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales & Cost Trend Chart/List */}
        <div className="lg:col-span-2 bg-surface border border-surface-border rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Daily Sales vs. Variable Cost Trend</h2>
              <p className="text-xs text-gray-400">
                Tracking revenue alongside daily supply procurement for margin control.
              </p>
            </div>
            <span className="text-xs font-mono text-gray-400">
              Range: {analytics?.date_range.start_date} to {analytics?.date_range.end_date}
            </span>
          </div>

          {analytics?.sales_trend && analytics.sales_trend.length > 0 ? (
            <div className="space-y-3">
              {analytics.sales_trend.map((day) => {
                const maxRev = Math.max(...analytics.sales_trend.map((d) => d.revenue), 1);
                const revWidth = Math.min(100, Math.round((day.revenue / maxRev) * 100));
                const costWidth = Math.min(100, Math.round((day.variable_cost / maxRev) * 100));

                return (
                  <div key={day.date} className="p-3 rounded-xl bg-background border border-surface-border/60 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-gray-300">{day.date}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-gray-400">{day.order_count} orders</span>
                        <span className="font-extrabold text-emerald-400">
                          {formatCurrencyMinor(day.revenue)}
                        </span>
                        {day.variable_cost > 0 && (
                          <span className="text-rose-400 text-[11px]">
                            Cost: {formatCurrencyMinor(day.variable_cost)}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Visual Bars */}
                    <div className="space-y-1">
                      <div className="w-full bg-surface-hover h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-primary h-full rounded-full transition-all duration-500"
                          style={{ width: `${revWidth}%` }}
                        />
                      </div>
                      {day.variable_cost > 0 && (
                        <div className="w-full bg-surface-hover h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-rose-500/80 h-full rounded-full transition-all duration-500"
                            style={{ width: `${costWidth}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-gray-500 text-sm">
              No orders or expenses logged for the selected date range.
            </div>
          )}
        </div>

        {/* Payment Methods Breakdown */}
        <div className="bg-surface border border-surface-border rounded-2xl p-6 space-y-6">
          <div>
            <h2 className="text-base font-bold text-white">Payment Method Share</h2>
            <p className="text-xs text-gray-400">Settled customer payments distribution.</p>
          </div>

          <div className="space-y-4">
            {Object.keys(paymentMethods).length > 0 ? (
              Object.entries(paymentMethods).map(([method, amount]) => {
                const pct = totalPaymentMinor > 0 ? ((amount / totalPaymentMinor) * 100).toFixed(1) : "0";
                return (
                  <div key={method} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-gray-300">{method}</span>
                      <span className="text-gray-400">
                        {formatCurrencyMinor(amount)} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-background h-2 rounded-full overflow-hidden border border-surface-border/40">
                      <div
                        className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-gray-500 text-xs">
                No payment transactions recorded for this period.
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-surface-border flex items-center justify-between text-xs font-bold text-gray-300">
            <span>Total Settled:</span>
            <span className="text-white text-sm font-extrabold">
              {formatCurrencyMinor(totalPaymentMinor)}
            </span>
          </div>
        </div>
      </div>

      {/* Dish Velocity & Recipe Margins Table */}
      <div className="bg-surface border border-surface-border rounded-2xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white">Top Menu Item Performance & Margins</h2>
            <p className="text-xs text-gray-400">
              Live sales velocity cross-referenced with Bill-of-Materials recipe ingredient cost.
            </p>
          </div>
          <Link
            href="/restaurant/inventory"
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Configure Recipes & Costs</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-surface-border text-gray-400 font-semibold uppercase tracking-wider">
                <th className="pb-3 pl-2">Dish Name</th>
                <th className="pb-3 text-right">Units Sold</th>
                <th className="pb-3 text-right">Revenue</th>
                <th className="pb-3 text-right">Recipe Cost</th>
                <th className="pb-3 text-right">Gross Profit</th>
                <th className="pb-3 text-right pr-2">Gross Margin %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/60">
              {analytics?.top_dishes && analytics.top_dishes.length > 0 ? (
                analytics.top_dishes.map((dish) => (
                  <tr key={dish.menu_item_name} className="hover:bg-surface-hover/50 transition-colors">
                    <td className="py-3 pl-2 font-medium text-white">{dish.menu_item_name}</td>
                    <td className="py-3 text-right text-gray-300">{dish.quantity_sold}</td>
                    <td className="py-3 text-right font-semibold text-white">
                      {formatCurrencyMinor(dish.total_revenue_minor)}
                    </td>
                    <td className="py-3 text-right text-gray-400">
                      {dish.cost_minor > 0 ? formatCurrencyMinor(dish.cost_minor) : "—"}
                    </td>
                    <td className="py-3 text-right font-semibold text-emerald-400">
                      {dish.gross_profit_minor > 0
                        ? formatCurrencyMinor(dish.gross_profit_minor)
                        : formatCurrencyMinor(dish.total_revenue_minor)}
                    </td>
                    <td className="py-3 text-right pr-2">
                      <span
                        className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                          dish.margin_pct >= 60
                            ? "bg-emerald-500/10 text-emerald-400"
                            : dish.margin_pct >= 40
                            ? "bg-amber-500/10 text-amber-400"
                            : "bg-gray-800 text-gray-400"
                        }`}
                      >
                        {dish.margin_pct > 0 ? `${dish.margin_pct.toFixed(1)}%` : "N/A"}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    No dish sales recorded in this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
