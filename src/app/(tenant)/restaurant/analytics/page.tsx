"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  useGetExecutiveDashboardAnalyticsQuery,
  useGetDishMarginsQuery,
} from "@/store/api/restaurantApi";
import { formatCurrencyMinor } from "@/lib/formatters";
import { FranchiseOutletFilterSelect } from "@/components/franchise/FranchiseOutletFilterSelect";

type DatePreset = "TODAY" | "7_DAYS" | "THIS_MONTH" | "ALL";

export default function UnifiedExecutiveAnalyticsPage() {
  const [preset, setPreset] = useState<DatePreset>("THIS_MONTH");

  const computeDateRange = () => {
    const now = new Date();
    const toYMD = (d: Date) => d.toISOString().split("T")[0];

    if (preset === "TODAY") {
      const today = toYMD(now);
      return { startDate: today, endDate: today };
    }
    if (preset === "7_DAYS") {
      const past = new Date(now);
      past.setDate(past.getDate() - 6);
      return { startDate: toYMD(past), endDate: toYMD(now) };
    }
    if (preset === "THIS_MONTH") {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: toYMD(firstDay), endDate: toYMD(now) };
    }
    return { startDate: undefined, endDate: undefined };
  };

  const { startDate, endDate } = computeDateRange();

  const {
    data: analytics,
    isLoading,
    refetch,
    isFetching,
  } = useGetExecutiveDashboardAnalyticsQuery({
    startDate,
    endDate,
  });

  const { data: dishMargins = [] } = useGetDishMarginsQuery();

  const pnl = analytics?.pnl;
  const grossSalesMinor = pnl?.gross_revenue?.amount_minor_units || 0;
  const foodCostMinor = pnl?.cogs_variable_expenses?.amount_minor_units || 0;
  const overheadMinor = pnl?.fixed_expenses?.amount_minor_units || 0;
  const netProfitMinor = pnl?.net_profit?.amount_minor_units || 0;
  const foodCostPct = pnl?.food_cost_pct || 0;
  const netMarginPct = pnl?.net_margin_pct || 0;
  const ordersCount = analytics?.total_orders || 0;
  const aovMinor = analytics?.average_order_value?.amount_minor_units || 0;

  // Daily Trends
  const dailyTrends = analytics?.sales_trend || [];
  const maxDayAmount = Math.max(
    1,
    ...dailyTrends.map((d) => Math.max(d.revenue, d.variable_cost))
  );

  // Payment methods
  const paymentMethods = analytics?.payment_methods || {};
  const totalPaymentsMinor = Object.values(paymentMethods).reduce((a, b) => a + b, 0);

  const isLoss = netProfitMinor < 0;

  return (
    <>
      {/* Header Bar */}
      <div className="hd">
        <div>
          <h1>Profit &amp; Loss</h1>
          <p>Is the restaurant making money? Real-time operational P&amp;L</p>
        </div>
        <div className="sp"></div>
        <FranchiseOutletFilterSelect />
        <div className="ch">
          {[
            { id: "TODAY", label: "Today" },
            { id: "7_DAYS", label: "7 days" },
            { id: "THIS_MONTH", label: "This month" },
            { id: "ALL", label: "All time" },
          ].map((p) => (
            <button
              key={p.id}
              className="chip"
              aria-pressed={preset === p.id}
              onClick={() => setPreset(p.id as DatePreset)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="g g4">
        <div className="cd st" style={{ "--c": "var(--admin-am)" } as any}>
          <small>Gross sales</small>
          <b>{formatCurrencyMinor(grossSalesMinor)}</b>
          <span>
            {ordersCount} orders · avg {formatCurrencyMinor(aovMinor)}
          </span>
        </div>

        <div
          className="cd st"
          style={{
            "--c": foodCostPct > 35 ? "var(--admin-red)" : "var(--admin-am)",
          } as any}
        >
          <small>Food cost</small>
          <b>{formatCurrencyMinor(foodCostMinor)}</b>
          <span>
            {foodCostPct.toFixed(1)}% of sales · target 30%
          </span>
        </div>

        <div className="cd st" style={{ "--c": "var(--admin-blu)" } as any}>
          <small>Overheads</small>
          <b>{formatCurrencyMinor(overheadMinor)}</b>
          <span>Rent, salaries &amp; utilities</span>
        </div>

        <div
          className="cd st"
          style={{
            "--c": isLoss ? "var(--admin-red)" : "var(--admin-grn)",
          } as any}
        >
          <small>Net profit</small>
          <b>{formatCurrencyMinor(netProfitMinor)}</b>
          <span>
            Margin {netMarginPct >= 0 ? `+${netMarginPct.toFixed(1)}%` : `${netMarginPct.toFixed(1)}%`}
          </span>
        </div>
      </div>

      {/* Explanation Alert */}
      {isLoss ? (
        <div className="al mt">
          <div>
            <b>Why running at a loss?</b>
            <small>
              Food cost &amp; stock purchases ({formatCurrencyMinor(foodCostMinor)}) exceed net dining receipts. Compare cost against stock used, eliminate kitchen wastage, and link recipes to monitor true margins.
            </small>
          </div>
          <Link href="/restaurant/expenses" className="btn sm">
            Review expenses
          </Link>
        </div>
      ) : (
        <div
          className="al mt"
          style={{
            borderColor: "rgba(47,154,98,0.4)",
            background: "rgba(47,154,98,0.08)",
            "--c": "var(--admin-grn)",
          } as any}
        >
          <div>
            <b>Healthy operational margins</b>
            <small>
              Net restaurant profit is running positive at {netMarginPct.toFixed(1)}% margin. Keep inventory stock logs updated to maintain accuracy.
            </small>
          </div>
          <span className="pill c-g">Profitable</span>
        </div>
      )}

      {/* Charts Grid */}
      <div className="g g2 mt">
        {/* Sales vs Cost by Day */}
        <div className="cd">
          <h2>Sales vs cost by day</h2>
          <p className="sub">
            <span style={{ color: "#B7791F" }}>■</span> sales &nbsp;&nbsp;
            <span style={{ color: "var(--admin-red)" }}>■</span> cost
          </p>

          {dailyTrends.length === 0 ? (
            <div className="em">
              <b>No daily breakdown</b>
              No sales or expense transactions recorded in this date range.
            </div>
          ) : (
            dailyTrends.map((d) => {
              const salesPct = Math.min(100, Math.round((d.revenue / maxDayAmount) * 100));
              const costPct = Math.min(100, Math.round((d.variable_cost / maxDayAmount) * 100));
              return (
                <div key={d.date} style={{ marginBottom: 12 }}>
                  <div className="row" style={{ border: 0, padding: "4px 0 0" }}>
                    <div>
                      <b>
                        {new Date(d.date).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                        })}
                      </b>{" "}
                      <small style={{ display: "inline" }}>
                        · {d.order_count} orders
                      </small>
                    </div>
                    <b>{formatCurrencyMinor(d.revenue)}</b>
                  </div>
                  <div className="bg">
                    <i style={{ width: `${salesPct}%` }}></i>
                    {costPct > 0 && (
                      <i className="k" style={{ width: `${costPct}%` }}></i>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Payments breakdown */}
        <div className="cd">
          <h2>Payments</h2>
          <p className="sub">How guests settled their bills</p>

          {totalPaymentsMinor === 0 ? (
            <div className="em">
              <b>No payment data</b>
              No dining payments settled yet for this period.
            </div>
          ) : (
            <>
              {Object.entries(paymentMethods).map(([method, minor]) => {
                const pct = Math.round((minor / totalPaymentsMinor) * 100);
                return (
                  <div key={method} style={{ marginBottom: 14 }}>
                    <div className="row" style={{ border: 0, padding: "4px 0 0" }}>
                      <div>
                        <b>{method}</b> <small style={{ display: "inline" }}>({pct}%)</small>
                      </div>
                      <b>{formatCurrencyMinor(minor)}</b>
                    </div>
                    <div className="bg">
                      <i style={{ width: `${pct}%`, background: "var(--admin-grn)" }}></i>
                    </div>
                  </div>
                );
              })}
              <small style={{ color: "var(--admin-mute)", display: "block", marginTop: 8 }}>
                Total settled: {formatCurrencyMinor(totalPaymentsMinor)}. Digital payments auto-reconcile with settlement batches.
              </small>
            </>
          )}
        </div>
      </div>

      {/* Dishes by Profit Table */}
      <div className="cd tw mt">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 8 }}>
          <div>
            <h2>Dishes by profit</h2>
            <p className="sub" style={{ margin: 0 }}>
              Live dish sales velocity and gross recipe margins.
            </p>
          </div>
          <Link href="/restaurant/inventory" className="btn s sm">
            Manage recipes
          </Link>
        </div>

        <table>
          <thead>
            <tr>
              <th>Dish</th>
              <th className="n">Selling Price</th>
              <th className="n">Recipe Cost</th>
              <th className="n">Margin</th>
            </tr>
          </thead>
          <tbody>
            {dishMargins.length === 0 ? (
              <tr>
                <td colSpan={4} className="em">
                  <b>No dish margins calculated</b>
                  Ensure recipes and stock items are linked in Inventory.
                </td>
              </tr>
            ) : (
              dishMargins.map((dm) => {
                const sellingMinor = dm.selling_price?.amount_minor_units || 0;
                const costMinor = dm.cost_price?.amount_minor_units || 0;
                const marginPct = dm.margin_pct || 0;
                const hasCost = costMinor > 0;

                return (
                  <tr key={dm.menu_item_id || dm.menu_item_name}>
                    <td>
                      <b>{dm.menu_item_name}</b>
                      {dm.category_name && <small>{dm.category_name}</small>}
                    </td>
                    <td className="n">
                      <b>{formatCurrencyMinor(sellingMinor)}</b>
                    </td>
                    <td className="n">
                      {hasCost ? formatCurrencyMinor(costMinor) : "—"}
                    </td>
                    <td className="n">
                      {hasCost ? (
                        <span className={`pill ${marginPct >= 60 ? "c-g" : marginPct >= 35 ? "c-a" : "c-r"}`}>
                          {marginPct.toFixed(1)}%
                        </span>
                      ) : (
                        <Link href="/restaurant/inventory" className="btn s sm">
                          Add cost
                        </Link>
                      )}
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
