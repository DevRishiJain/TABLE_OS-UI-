"use client";

import React from "react";
import { useGetTodayAnalyticsQuery } from "@/store/api/restaurantApi";
import { formatMoney } from "@/lib/money";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Clock } from "lucide-react";

export default function TodayAnalyticsPage() {
  const { data: today, isLoading } = useGetTodayAnalyticsQuery();

  const totalGmvMinor = today?.total_gmv?.amount_minor_units || 0;
  const avgOrderMinor = today?.average_order_value?.amount_minor_units || 0;
  const platformFeeMinor = today?.platform_fee_accrued?.amount_minor_units || 0;

  const chartData =
    today?.hourly_breakdown && today.hourly_breakdown.length > 0
      ? today.hourly_breakdown.map((h) => ({
          time: `${String(h.hour).padStart(2, "0")}:00`,
          sales: Math.round(h.gmv_minor / 100),
          orders: h.orders_count,
        }))
      : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-gray-100 flex items-center gap-2">
            <Clock className="w-6 h-6 text-primary" />
            Today's Intraday Sales Curve
          </h1>
          <p className="text-xs text-gray-400">
            Real-time hourly dining ticket size & volume velocity
          </p>
        </div>
        <Badge variant="gold" size="sm" dot>
          Live Hourly Feed
        </Badge>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <span className="text-xs text-gray-400 uppercase font-bold">
            Today's GMV
          </span>
          <div className="text-2xl font-black font-mono text-primary mt-1">
            {isLoading ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              formatMoney(totalGmvMinor)
            )}
          </div>
        </Card>
        <Card className="p-4">
          <span className="text-xs text-gray-400 uppercase font-bold">
            Average Ticket Size
          </span>
          <div className="text-2xl font-black font-mono text-gray-100 mt-1">
            {isLoading ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              formatMoney(avgOrderMinor)
            )}
          </div>
        </Card>
        <Card className="p-4">
          <span className="text-xs text-gray-400 uppercase font-bold">
            1% Platform Fee Accrued
          </span>
          <div className="text-2xl font-black font-mono text-amber-400 mt-1">
            {isLoading ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              formatMoney(platformFeeMinor)
            )}
          </div>
        </Card>
      </div>

      {/* Intraday Sales Hourly Curve AreaChart */}
      <Card className="p-6 flex flex-col gap-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-200">
          Hourly Sales Distribution (₹)
        </h3>
        {isLoading ? (
          <div className="h-80 flex items-center justify-center">
            <Skeleton className="h-full w-full rounded-xl" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-80 flex flex-col items-center justify-center text-center p-6 bg-surface-subtle/30 rounded-xl border border-surface-border">
            <Clock className="w-10 h-10 text-gray-500 mb-2" />
            <span className="text-sm font-bold text-gray-300">
              No intraday sales activity recorded yet today
            </span>
            <span className="text-xs text-gray-500 mt-1">
              Data will plot in real time as tables place and settle orders.
            </span>
          </div>
        ) : (
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="amberGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E5A93C" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#E5A93C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#2A303C"
                  vertical={false}
                />
                <XAxis dataKey="time" stroke="#6B7280" fontSize={12} />
                <YAxis
                  stroke="#6B7280"
                  fontSize={12}
                  tickFormatter={(v) => `₹${v}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#16191E",
                    borderColor: "#2A303C",
                    borderRadius: "12px",
                    color: "#F3F4F6",
                  }}
                  formatter={(value: any) => [`₹${value}`, "Sales"]}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#E5A93C"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#amberGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </div>
  );
}
