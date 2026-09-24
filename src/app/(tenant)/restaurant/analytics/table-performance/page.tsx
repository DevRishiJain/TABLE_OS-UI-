"use client";

import React from "react";
import { useGetTablePerformanceQuery } from "@/store/api/restaurantApi";
import { formatMoney } from "@/lib/money";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Layers2, Clock, DollarSign } from "lucide-react";

export default function TablePerformancePage() {
  const { data: tablePerf, isLoading } = useGetTablePerformanceQuery();

  const tables = tablePerf?.tables || [];
  const avgTurnAll =
    tables.length > 0
      ? Math.round(
          tables.reduce((acc, t) => acc + (t.avg_turn_minutes || 0), 0) /
            tables.length
        )
      : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-gray-100 flex items-center gap-2">
            <Layers2 className="w-6 h-6 text-primary" />
            Table Turn-Time & Revenue Efficiency
          </h1>
          <p className="text-xs text-gray-400">
            Seating velocity, average dining duration & gross revenue yield per
            table
          </p>
        </div>
        {avgTurnAll > 0 && (
          <Badge variant="gold" size="sm">
            Avg Turn-Time: {avgTurnAll} Mins
          </Badge>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-5 h-40">
              <Skeleton className="h-full w-full" />
            </Card>
          ))}
        </div>
      ) : tables.length === 0 ? (
        <Card className="p-12 text-center text-gray-500">
          <Layers2 className="w-10 h-10 mx-auto text-gray-600 mb-2" />
          <span className="text-sm font-bold text-gray-300 block">
            No table performance data available yet
          </span>
          <span className="text-xs text-gray-500 mt-1 block">
            Metrics will calculate as dining sessions complete and tables turn
            over.
          </span>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {tables.map((t) => (
            <Card
              key={t.table_id || t.table_number}
              className="p-5 flex flex-col justify-between gap-4"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary font-black font-display text-base flex items-center justify-center border border-primary/40">
                  {t.table_number.startsWith("T")
                    ? t.table_number
                    : `T${t.table_number}`}
                </div>
                <Badge variant="success" size="sm">
                  {t.turns_count} Turns Today
                </Badge>
              </div>

              <div className="flex flex-col gap-2 pt-2 border-t border-surface-border/60 text-xs">
                <div className="flex items-center justify-between text-gray-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Avg Duration:
                  </span>
                  <span className="font-bold text-gray-200">
                    {t.avg_turn_minutes} mins
                  </span>
                </div>
                <div className="flex items-center justify-between text-gray-400">
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5" />
                    Yield:
                  </span>
                  <span className="font-black font-mono text-primary text-sm">
                    {formatMoney(t.total_gmv_minor)}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
