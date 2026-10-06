"use client";

import React from "react";
import { useGetSettlementsQuery } from "@/store/api/restaurantApi";
import { formatMoney } from "@/lib/money";
import { humanizeStatus } from "@/lib/statusLabels";
import { FranchiseOutletFilterSelect } from "@/components/franchise/FranchiseOutletFilterSelect";

export default function RestaurantSettlementsPage() {
  const { data: settlements, isLoading, refetch, isFetching } = useGetSettlementsQuery();
  const settlementList = settlements || [];

  return (
    <>
      {/* Header */}
      <div className="hd">
        <div>
          <h1>Payouts</h1>
          <p>Bank settlements for dining sales minus 1% platform fee</p>
        </div>
        <div className="sp"></div>
        <FranchiseOutletFilterSelect />
        <span className="pill c-g">Direct bank settlement</span>
      </div>

      {/* Settlements Table Card */}
      <div className="cd tw">
        {isLoading ? (
          <div className="em">
            <b>Loading settlement records…</b>
            Syncing verified bank transfer batches.
          </div>
        ) : settlementList.length === 0 ? (
          <div className="em">
            <b>No payouts yet</b>
            Batches are automatically created at the end of each billing cycle. Gross sales minus the 1% platform fee goes directly to your verified bank account.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Settlement Period</th>
                <th className="n">Gross Sales</th>
                <th className="n">Platform Fee (1%)</th>
                <th className="n">Net Bank Deposit</th>
                <th className="ac">Status</th>
              </tr>
            </thead>
            <tbody>
              {settlementList.map((s) => {
                const grossMinor = s.gross_sales?.amount_minor_units || 0;
                const feeMinor = s.platform_fees_owed?.amount_minor_units || 0;
                const netMinor = Math.max(0, grossMinor - feeMinor);
                const isSettled = s.status === "SETTLED";

                return (
                  <tr key={s.id}>
                    <td>
                      <b>
                        {s.period_start} → {s.period_end}
                      </b>
                      <small>Batch #{s.id}</small>
                    </td>
                    <td className="n">{formatMoney(grossMinor)}</td>
                    <td className="n" style={{ color: "var(--admin-red)" }}>
                      {formatMoney(feeMinor)}
                    </td>
                    <td className="n">
                      <b style={{ color: "var(--admin-grn)" }}>{formatMoney(netMinor)}</b>
                    </td>
                    <td className="ac">
                      <span className={`pill ${isSettled ? "c-g" : "c-a"}`}>
                        {humanizeStatus(s.status)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
