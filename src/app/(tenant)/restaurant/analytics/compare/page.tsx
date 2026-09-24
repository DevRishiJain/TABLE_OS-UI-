"use client";

import React from "react";
import { useGetPeriodComparisonQuery } from "@/store/api/restaurantApi";
import { formatMoney } from "@/lib/money";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { Calendar, ArrowUpRight, CheckCircle2 } from "lucide-react";

export default function PeriodCompareAnalyticsPage() {
  const { data: comparison } = useGetPeriodComparisonQuery();

  const chartData = [
    { metric: "Week 1", currentPeriod: 142000, previousPeriod: 121000 },
    { metric: "Week 2", currentPeriod: 178000, previousPeriod: 154000 },
    { metric: "Week 3", currentPeriod: 215000, previousPeriod: 182000 },
    { metric: "Week 4", currentPeriod: 245000, previousPeriod: 198000 },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-gray-100 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary" />
            Period vs Period Comparison
          </h1>
          <p className="text-xs text-gray-400">
            Compare past 30 days against preceding 30 days across GMV and covers
          </p>
        </div>
        <Badge variant="gold" size="sm">
          +21.2% GMV Delta
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-5 border-primary/40 bg-primary/5">
          <span className="text-xs text-gray-400 uppercase font-bold">
            Current Period Gross Sales
          </span>
          <div className="text-3xl font-black font-mono text-primary mt-1">
            {formatMoney(
              comparison?.current_period_sales_minor || 78000000
            )}
          </div>
          <span className="text-xs text-emerald-400 font-semibold mt-1 inline-block">
            {comparison?.current_orders || 1240} dining tickets processed
          </span>
        </Card>

        <Card className="p-5">
          <span className="text-xs text-gray-400 uppercase font-bold">
            Preceding Period Gross Sales
          </span>
          <div className="text-3xl font-black font-mono text-gray-400 mt-1">
            {formatMoney(
              comparison?.previous_period_sales_minor || 64400000
            )}
          </div>
          <span className="text-xs text-gray-400 font-semibold mt-1 inline-block">
            {comparison?.previous_orders || 1030} dining tickets processed
          </span>
        </Card>
      </div>

      <Card className="p-6 flex flex-col gap-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-200">
          Weekly Revenue Distribution
        </h3>
        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A303C" vertical={false} />
              <XAxis dataKey="metric" stroke="#6B7280" fontSize={12} />
              <YAxis
                stroke="#6B7280"
                fontSize={12}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#16191E",
                  borderColor: "#2A303C",
                  borderRadius: "12px",
                  color: "#F3F4F6",
                }}
                formatter={(v: number) => [`₹${v.toLocaleString()}`, ""]}
              />
              <Legend />
              <Bar
                name="Current Period"
                dataKey="currentPeriod"
                fill="#E5A93C"
                radius={[6, 6, 0, 0]}
              />
              <Bar
                name="Preceding Period"
                dataKey="previousPeriod"
                fill="#374151"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
