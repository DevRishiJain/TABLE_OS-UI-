"use client";

import React from "react";
import { useGetPlatformFeeLedgerQuery } from "@/store/api/restaurantApi";
import { formatMoney } from "@/lib/money";
import { humanizeStatus } from "@/lib/statusLabels";

export default function RestaurantLedgerPage() {
  const { data: ledgerEntries, isLoading } = useGetPlatformFeeLedgerQuery();

  const entries = Array.isArray(ledgerEntries)
    ? ledgerEntries
    : Array.isArray((ledgerEntries as any)?.entries)
    ? (ledgerEntries as any).entries
    : Array.isArray((ledgerEntries as any)?.settlements)
    ? (ledgerEntries as any).settlements
    : [];

  const totalGmvMinor = entries.reduce(
    (acc: number, e: any) => acc + (e.gmv_amount?.amount_minor_units || e.gross_sales_minor || 0),
    0
  );
  const totalFeesMinor = entries.reduce(
    (acc: number, e: any) => acc + (e.fee_amount?.amount_minor_units || e.platform_fees_owed_minor || 0),
    0
  );

  return (
    <>
      {/* Header Bar */}
      <div className="hd">
        <div>
          <h1>Fee Ledger</h1>
          <p>Audit-grade record of platform commissions accrued per settled session</p>
        </div>
        <div className="sp"></div>
        <span className="pill c-a">Platform Fee: 1.00%</span>
      </div>

      {/* KPI Cards */}
      <div className="g g4">
        <div className="cd st" style={{ "--c": "var(--admin-am)" } as any}>
          <small>Total GMV Processed</small>
          <b>{formatMoney(totalGmvMinor)}</b>
          <span>Across all settled tickets</span>
        </div>

        <div className="cd st" style={{ "--c": "var(--admin-grn)" } as any}>
          <small>Platform Fees Accrued</small>
          <b>{formatMoney(totalFeesMinor)}</b>
          <span>1% deduction ledger</span>
        </div>

        <div className="cd st" style={{ "--c": "var(--admin-blu)" } as any}>
          <small>Settled Sessions</small>
          <b>{entries.length}</b>
          <span>Dining closures</span>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="cd tw mt">
        <table>
          <thead>
            <tr>
              <th>Session ID</th>
              <th>Date</th>
              <th className="n">GMV Amount</th>
              <th className="n">Fee Accrued (1%)</th>
              <th className="ac">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="em">
                  <b>Loading ledger…</b>
                </td>
              </tr>
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan={5} className="em">
                  <b>No ledger entries found</b>
                  Ledger lines are generated when customer dining sessions settle.
                </td>
              </tr>
            ) : (
              entries.map((e: any, idx: number) => {
                const gmvMinor = e.gmv_amount?.amount_minor_units || e.gross_sales_minor || 0;
                const feeMinor = e.fee_amount?.amount_minor_units || e.platform_fees_owed_minor || 0;
                const isPaid = e.status === "SETTLED" || e.status === "PAID";

                return (
                  <tr key={e.id || idx}>
                    <td>
                      <code>{e.session_id || e.id || `#${idx + 1}`}</code>
                    </td>
                    <td>
                      <b>
                        {e.created_at
                          ? new Date(e.created_at).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                            })
                          : "—"}
                      </b>
                      <small>
                        {e.created_at
                          ? new Date(e.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""}
                      </small>
                    </td>
                    <td className="n">
                      <b>{formatMoney(gmvMinor)}</b>
                    </td>
                    <td className="n" style={{ color: "var(--admin-am)" }}>
                      <b>{formatMoney(feeMinor)}</b>
                    </td>
                    <td className="ac">
                      <span className={`pill ${isPaid ? "c-g" : "c-a"}`}>
                        {humanizeStatus(e.status || "ACCRUED")}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
