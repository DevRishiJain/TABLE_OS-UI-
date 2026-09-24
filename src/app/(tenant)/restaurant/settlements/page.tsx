"use client";

import React from "react";
import { useGetSettlementsQuery } from "@/store/api/restaurantApi";
import { formatMoney } from "@/lib/money";
import { humanizeStatus } from "@/lib/statusLabels";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ShieldCheck } from "lucide-react";

export default function RestaurantSettlementsPage() {
  const { data: settlements, isLoading } = useGetSettlementsQuery();

  const settlementList = settlements || [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-gray-100 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" />
            Settlement Batch Payouts
          </h1>
          <p className="text-xs text-gray-400">
            Automated bank disbursements for dining sales minus platform fee
          </p>
        </div>
        <Badge variant="success" size="sm">
          Direct Bank Settlement
        </Badge>
      </div>

      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-surface-border text-gray-400 uppercase tracking-wider">
                <th className="pb-3 font-semibold">Settlement Period</th>
                <th className="pb-3 font-semibold text-right">Gross Sales</th>
                <th className="pb-3 font-semibold text-right">Platform Fee</th>
                <th className="pb-3 font-semibold text-right">Net Bank Deposit</th>
                <th className="pb-3 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    Loading settlements...
                  </td>
                </tr>
              ) : settlementList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500">
                    No settlement batches generated yet. Payouts are created at the end of each billing cycle.
                  </td>
                </tr>
              ) : (
                settlementList.map((s) => {
                  const grossMinor = s.gross_sales?.amount_minor_units || 0;
                  const feeMinor = s.platform_fees_owed?.amount_minor_units || 0;
                  const netMinor = Math.max(0, grossMinor - feeMinor);

                  return (
                    <tr
                      key={s.id}
                      className="hover:bg-surface-subtle/50 transition-colors"
                    >
                      <td className="py-3.5">
                        <span className="font-bold text-gray-200 block">
                          {s.period_start} → {s.period_end}
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono">
                          Batch #{s.id}
                        </span>
                      </td>
                      <td className="py-3.5 text-right font-mono text-gray-300">
                        {formatMoney(grossMinor)}
                      </td>
                      <td className="py-3.5 text-right font-mono text-amber-400">
                        {formatMoney(feeMinor)}
                      </td>
                      <td className="py-3.5 text-right font-mono font-bold text-emerald-400 text-sm">
                        {formatMoney(netMinor)}
                      </td>
                      <td className="py-3.5 text-right">
                        <Badge
                          variant={s.status === "SETTLED" ? "success" : "gold"}
                          size="sm"
                        >
                          {humanizeStatus(s.status)}
                        </Badge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
