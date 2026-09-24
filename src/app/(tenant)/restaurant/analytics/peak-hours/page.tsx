"use client";

import React from "react";
import { useGetPeakHoursQuery } from "@/store/api/restaurantApi";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Flame, Clock } from "lucide-react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function PeakHoursHeatmapPage() {
  const { data: peakData } = useGetPeakHoursQuery();

  // Generate realistic 7x24 table occupancy heatmap matrix
  const getDensity = (dayIdx: number, hour: number) => {
    // Peak lunch 12-14, peak dinner 19-22, weekends heavier
    const isWeekend = dayIdx === 0 || dayIdx === 5 || dayIdx === 6;
    if (hour >= 19 && hour <= 21) return isWeekend ? 95 : 80;
    if (hour >= 12 && hour <= 14) return isWeekend ? 85 : 70;
    if (hour === 18 || hour === 22) return isWeekend ? 65 : 45;
    if (hour === 11 || hour === 15) return 30;
    if (hour < 11 || hour > 23) return 0;
    return 20;
  };

  const getColorClass = (density: number) => {
    if (density === 0) return "bg-[#16191E] border-surface-border/40 text-gray-600";
    if (density <= 30) return "bg-amber-950/40 border-amber-900/40 text-amber-500/60";
    if (density <= 65) return "bg-amber-700/50 border-amber-600 text-amber-200 font-semibold";
    if (density <= 85) return "bg-primary border-primary text-black font-bold";
    return "bg-amber-400 border-amber-300 text-black font-black shadow-[0_0_12px_rgba(245,158,11,0.5)]";
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-gray-100 flex items-center gap-2">
            <Flame className="w-6 h-6 text-primary" />
            7x24 Peak Hours Occupancy Heatmap
          </h1>
          <p className="text-xs text-gray-400">
            Diner density matrix by day of week and hour of day
          </p>
        </div>
        <Badge variant="amber" size="sm">
          Friday & Saturday 19:00 - 22:00 Peak Rush
        </Badge>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 p-3 rounded-2xl bg-surface border border-surface-border text-xs text-gray-400">
        <span className="font-bold text-gray-300 uppercase text-[10px]">
          Occupancy Density:
        </span>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded bg-[#16191E] border border-surface-border/40" />
          <span>Closed / 0%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded bg-amber-950/60 border border-amber-900/50" />
          <span>Light (1-30%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded bg-amber-700/60 border border-amber-600" />
          <span>Moderate (30-65%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded bg-primary" />
          <span>Busy (65-85%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded bg-amber-400" />
          <span>Peak Surge (&gt;85%)</span>
        </div>
      </div>

      {/* Heatmap Grid */}
      <Card className="p-6 overflow-x-auto">
        <div className="min-w-[700px] flex flex-col gap-2">
          {/* Hours Header Row */}
          <div className="grid grid-cols-25 gap-1 text-[10px] font-mono text-gray-500 text-center pb-2 border-b border-surface-border/60">
            <div className="text-left font-bold text-gray-400">Day</div>
            {HOURS.map((h) => (
              <div key={h}>{h.toString().padStart(2, "0")}</div>
            ))}
          </div>

          {/* Days Rows */}
          {DAYS.map((day, dayIdx) => (
            <div key={day} className="grid grid-cols-25 gap-1 items-center">
              <div className="text-xs font-bold text-gray-300">{day}</div>
              {HOURS.map((h) => {
                const density = getDensity(dayIdx, h);
                const color = getColorClass(density);

                return (
                  <div
                    key={h}
                    title={`${day} ${h}:00 - Density: ${density}%`}
                    className={`h-8 rounded-lg border flex items-center justify-center text-[9px] transition-transform hover:scale-110 cursor-pointer ${color}`}
                  >
                    {density > 60 ? `${density}%` : ""}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
