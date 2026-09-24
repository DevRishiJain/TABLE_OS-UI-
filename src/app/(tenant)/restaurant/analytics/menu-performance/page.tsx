"use client";

import React from "react";
import { useGetMenuPerformanceQuery } from "@/store/api/restaurantApi";
import { formatMoney } from "@/lib/money";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { PieChart } from "lucide-react";

export default function MenuPerformancePage() {
  const { data: menuPerf, isLoading } = useGetMenuPerformanceQuery();

  const dishes = menuPerf?.dishes || [];
  const topDish = dishes.length > 0 ? dishes[0] : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-gray-100 flex items-center gap-2">
            <PieChart className="w-6 h-6 text-primary" />
            Menu Item Sales Velocity & Gross Margins
          </h1>
          <p className="text-xs text-gray-400">
            Dish popularity rankings, contribution margins & cooking velocity
          </p>
        </div>
        {topDish && (
          <Badge variant="gold" size="sm">
            {topDish.name} • Top Seller
          </Badge>
        )}
      </div>

      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-surface-border text-gray-400 uppercase tracking-wider">
                <th className="pb-3 font-semibold">Rank & Dish</th>
                <th className="pb-3 font-semibold">Category</th>
                <th className="pb-3 font-semibold text-right">Units Sold</th>
                <th className="pb-3 font-semibold text-right">Total GMV</th>
                <th className="pb-3 font-semibold text-right">Gross Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    Loading menu performance...
                  </td>
                </tr>
              ) : dishes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500">
                    No menu performance analytics recorded yet. Data accumulates
                    as diners order dishes.
                  </td>
                </tr>
              ) : (
                dishes.map((d, index) => (
                  <tr
                    key={d.menu_item_id || d.name}
                    className="hover:bg-surface-subtle/50 transition-colors"
                  >
                    <td className="py-3.5 flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-md bg-surface-subtle font-mono font-bold flex items-center justify-center text-primary">
                        #{index + 1}
                      </span>
                      <span className="font-bold text-gray-200 text-sm">
                        {d.name}
                      </span>
                    </td>
                    <td className="py-3.5 text-gray-400 font-medium">
                      {d.category_name}
                    </td>
                    <td className="py-3.5 text-right font-mono font-bold text-gray-100">
                      {d.quantity_sold}
                    </td>
                    <td className="py-3.5 text-right font-mono font-bold text-primary">
                      {formatMoney(d.gmv_minor)}
                    </td>
                    <td className="py-3.5 text-right font-mono font-bold text-emerald-400">
                      {(d.gross_margin_bps / 100).toFixed(1)}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
