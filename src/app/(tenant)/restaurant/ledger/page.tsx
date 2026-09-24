"use client";

import React from "react";
import { useGetPlatformFeeLedgerQuery } from "@/store/api/restaurantApi";
import { formatMoney } from "@/lib/money";
import { humanizeStatus } from "@/lib/statusLabels";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Receipt, ShieldCheck } from "lucide-react";

export default function RestaurantLedgerPage() {
  const { data: ledgerEntries, isLoading } = useGetPlatformFeeLedgerQuery();

  const entries = ledgerEntries || [];
  const totalGmvMinor = entries.reduce(
    (acc, e) => acc + (e.gmv_amount?.amount_minor_units || 0),
    0
  );
  const totalFeesMinor = entries.reduce(
    (acc, e) => acc + (e.fee_amount?.amount_minor_units || 0),
    0
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-gray-100 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-primary" />
            Platform Fee Payable Ledger
          </h1>
          <p className="text-xs text-gray-400">
            Audit-grade record of platform commissions accrued per settled session
          </p>
        </div>
        <Badge variant="gold" size="sm">
          Fixed Commission: 1.00% (100 bps)
        </Badge>
      </div>

      {/* Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Total GMV Processed
          </span>
          <div className="text-2xl font-black font-mono text-primary mt-1">
            {isLoading ? <Skeleton className="h-8 w-28" /> : formatMoney(totalGmvMinor)}
          </div>
        </Card>
        <Card className="p-4">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Commission Accrued
          </span>
          <div className="text-2xl font-black font-mono text-amber-400 mt-1">
            {isLoading ? <Skeleton className="h-8 w-28" /> : formatMoney(totalFeesMinor)}
          </div>
        </Card>
        <Card className="p-4">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Net Restaurant Payout
          </span>
          <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
            {isLoading ? <Skeleton className="h-8 w-28" /> : formatMoney(totalGmvMinor - totalFeesMinor)}
          </div>
        </Card>
      </div>

      {/* Ledger Table */}
      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-surface-border text-gray-400 uppercase tracking-wider">
                <th className="pb-3 font-semibold">Session ID</th>
                <th className="pb-3 font-semibold">Billing Period</th>
                <th className="pb-3 font-semibold text-right">Dining GMV</th>
                <th className="pb-3 font-semibold text-right">Fee</th>
                <th className="pb-3 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    Loading ledger data...
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500">
                    No platform fee ledger entries recorded yet.
                  </td>
                </tr>
              ) : (
                entries.map((e) => (
                  <tr
                    key={e.id}
                    className="hover:bg-surface-subtle/50 transition-colors"
                  >
                    <td className="py-3.5">
                      <div className="flex flex-col">
                        <span className="font-mono text-gray-200">
                          {e.session_id.substring(0, 16)}...
                        </span>
                        <span className="text-[10px] text-gray-500">
                          {new Date(e.created_at).toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 font-mono text-gray-300">
                      {e.billing_period}
                    </td>
                    <td className="py-3.5 text-right font-mono font-bold text-gray-100">
                      {formatMoney(e.gmv_amount.amount_minor_units)}
                    </td>
                    <td className="py-3.5 text-right font-mono font-bold text-amber-400">
                      {formatMoney(e.fee_amount.amount_minor_units)}
                    </td>
                    <td className="py-3.5 text-right">
                      <Badge
                        variant={
                          e.settlement_status === "SETTLED" ? "success" : "gold"
                        }
                        size="sm"
                      >
                        {humanizeStatus(e.settlement_status)}
                      </Badge>
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
