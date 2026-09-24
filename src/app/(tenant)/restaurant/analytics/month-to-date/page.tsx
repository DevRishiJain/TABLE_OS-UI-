"use client";

import React from "react";
import { useGetMonthToDateAnalyticsQuery } from "@/store/api/restaurantApi";
import { formatMoney } from "@/lib/money";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { TrendingUp, ArrowUpRight } from "lucide-react";

export default function MonthToDateAnalyticsPage() {
  const { data: mtd, isLoading } = useGetMonthToDateAnalyticsQuery();

  const chartData = [
    { day: "Day 1", currentMonth: 42000, previousMonth: 38000 },
    { day: "Day 3", currentMonth: 95000, previousMonth: 82000 },
    { day: "Day 6", currentMonth: 184000, previousMonth: 161000 },
    { day: "Day 9", currentMonth: 290000, previousMonth: 245000 },
    { day: "Day 12", currentMonth: 410000, previousMonth: 335000 },
    { day: "Day 15", currentMonth: 530000, previousMonth: 428000 },
    { day: "Day 18", currentMonth: 675000, previousMonth: 520000 },
    { day: "Day 21", currentMonth: 810000, previousMonth: 615000 },
    { day: "Day 24", currentMonth: 940000, previousMonth: 710000 },
    { day: "Day 27", currentMonth: 1080000, previousMonth: 820000 },
    { day: "Day 30", currentMonth: 1240000, previousMonth: 950000 },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-gray-100 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" />
            Month-to-Date (MTD) Cumulative Revenue
          </h1>
          <p className="text-xs text-gray-400">
            Cumulative GMV pacing against previous month benchmark
          </p>
        </div>
        <Badge variant="success" size="sm">
          +18.4% YoY Growth
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <span className="text-xs text-gray-400 uppercase font-bold">
            Current MTD Gross
          </span>
          <div className="text-2xl font-black font-mono text-primary mt-1">
            {formatMoney(mtd?.gross_sales_minor || 124000000)}
          </div>
        </Card>
        <Card className="p-4">
          <span className="text-xs text-gray-400 uppercase font-bold">
            Previous Month Equivalent
          </span>
          <div className="text-2xl font-black font-mono text-gray-400 mt-1">
            {formatMoney(mtd?.prev_month_sales_minor || 95000000)}
          </div>
        </Card>
        <Card className="p-4">
          <span className="text-xs text-gray-400 uppercase font-bold">
            Net Outperformance
          </span>
          <div className="text-2xl font-black font-mono text-emerald-400 mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-5 h-5" />
            +₹2,90,000
          </div>
        </Card>
      </div>

      <Card className="p-6 flex flex-col gap-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-200">
          Cumulative Pacing Curve
        </h3>
        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A303C" vertical={false} />
              <XAxis dataKey="day" stroke="#6B7280" fontSize={12} />
              <YAxis
                stroke="#6B7280"
                fontSize={12}
                tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#16191E",
                  borderColor: "#2A303C",
                  borderRadius: "12px",
                  color: "#F3F4F6",
                }}
                formatter={(val: number) => [`₹${val.toLocaleString()}`, ""]}
              />
              <Legend />
              <Line
                name="Current Month (Realized)"
                type="monotone"
                dataKey="currentMonth"
                stroke="#E5A93C"
                strokeWidth={3}
                dot={{ r: 4, fill: "#E5A93C" }}
              />
              <Line
                name="Previous Month Benchmark"
                type="monotone"
                dataKey="previousMonth"
                stroke="#6B7280"
                strokeWidth={2}
                strokeDasharray="4 4"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
