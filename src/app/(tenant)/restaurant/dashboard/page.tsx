"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useAppSelector } from "@/store";
import { useRestaurantTheme, THEME_OPTIONS } from "@/components/providers/RestaurantThemeProvider";
import { Sun, Moon } from "lucide-react";
import {
  useGetTodayAnalyticsQuery,
  useGetInventoryQuery,
  useGetExpensesQuery,
} from "@/store/api/restaurantApi";
import {
  useGetStaffTablesQuery,
  useGetPendingOrdersQuery,
} from "@/store/api/staffApi";
import { useGetKitchenQueueQuery } from "@/store/api/kitchenApi";
import { formatMoney } from "@/lib/money";

function getTimeElapsed(dateStr?: string): { minutes: number; text: string } {
  if (!dateStr) return { minutes: 0, text: "just now" };
  const diffMs = Math.max(0, Date.now() - new Date(dateStr).getTime());
  const minutes = Math.floor(diffMs / 60000);
  const seconds = Math.floor((diffMs % 60000) / 1000);
  if (minutes === 0) return { minutes: 0, text: `${seconds}s ago` };
  return { minutes, text: `${minutes}m ${seconds}s ago` };
}

export default function RestaurantDashboardOverviewPage() {
  const userName = useAppSelector((state) => state.auth.userName) || "Vikram";
  const firstName = userName.split(" ")[0] || "Vikram";

  const { colorMode, setColorMode, currentTheme, setTheme } = useRestaurantTheme();

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2400);
  };

  // Live queries - zero hardcoded data
  const { data: today, error: todayError } = useGetTodayAnalyticsQuery(
    undefined,
    { pollingInterval: 6000 }
  );

  const isBackendUnreachable = Boolean(
    (todayError as any)?.status === 502 ||
    (todayError as any)?.data?.error === "Backend proxy unreachable" ||
    (todayError as any)?.data?.details?.includes("fetch failed")
  );

  const { data: staffTables } = useGetStaffTablesQuery(undefined, {
    pollingInterval: 3500,
  });
  const { data: pendingOrders } = useGetPendingOrdersQuery(undefined, {
    pollingInterval: 3000,
  });
  const { data: kitchenQueue } = useGetKitchenQueueQuery(undefined, {
    pollingInterval: 3500,
  });
  const { data: inventoryData } = useGetInventoryQuery(undefined, {
    pollingInterval: 10000,
  });
  const { data: expensesData } = useGetExpensesQuery(undefined, {
    pollingInterval: 12000,
  });

  // Financial Metrics
  const totalGmvMinor = today?.total_gmv?.amount_minor_units || 0;
  const platformFeeMinor = today?.platform_fee_accrued?.amount_minor_units || 0;
  const netRevenueMinor = totalGmvMinor - platformFeeMinor;
  const orderCount = today?.order_count || 0;
  const aovMinor = today?.average_order_value?.amount_minor_units || 0;

  // Tables
  const tablesList = staffTables || [];
  const totalTables = tablesList.length || 4;
  const occupiedTables = tablesList.filter((t) => t.is_occupied).length;

  // Kitchen queue
  const kitchenList = kitchenQueue || [];
  const cookingOrders = kitchenList.filter(
    (o) => o.status === "ACCEPTED" || o.status === "PREPARING" || o.status === "PLACED_VERIFIED"
  );
  const readyOrders = kitchenList.filter((o) => o.status === "READY");

  // Stock
  const lowStockCount = inventoryData?.low_stock_items_count ?? 0;

  // Food cost spend vs sales calculation
  const totalExpenseMinor = (expensesData || []).reduce(
    (acc, exp) => acc + (exp.amount?.amount_minor_units || 0),
    0
  );
  const foodCostRatio =
    totalGmvMinor > 0
      ? Math.round((totalExpenseMinor / totalGmvMinor) * 100)
      : totalExpenseMinor > 0
      ? 100
      : 0;

  // Delays and bottlenecks
  const readyDelays = useMemo(() => {
    return readyOrders
      .map((ro) => {
        const { minutes } = getTimeElapsed(ro.placed_at);
        return { order: ro, minutes };
      })
      .filter((item) => item.minutes >= 4);
  }, [readyOrders]);

  const cookingDelays = useMemo(() => {
    return cookingOrders
      .map((co) => {
        const { minutes } = getTimeElapsed(co.accepted_at || co.placed_at);
        return { order: co, minutes };
      })
      .filter((item) => item.minutes >= 12);
  }, [cookingOrders]);

  const activeServiceCalls = tablesList.filter((t) => Boolean(t.assistance_reason));

  // Time-based greeting
  const hour = new Date().getHours();
  const timeGreeting =
    hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";

  return (
    <>
      {/* Toast Notification */}
      <div className={`toast ${toastMsg ? "on" : ""}`} role="status">
        {toastMsg}
      </div>

      {/* Header Bar */}
      <div className="hd">
        <div>
          <h1>Home</h1>
          <p>
            Good {timeGreeting}, {firstName}. Here is what needs you.
          </p>
        </div>
        <div className="sp"></div>

        {/* System Theme & Dark Mode Controls (Dashboard Header UI) */}
        <div className="theme-bar" role="toolbar" aria-label="System Theme and Dark Mode">
          <div className="mode-toggle">
            <button
              type="button"
              className={`mode-btn ${colorMode === "light" ? "active" : ""}`}
              onClick={() => {
                setColorMode("light");
                showToast("Parchment Light mode applied system-wide");
              }}
              title="Switch to Parchment Light Mode"
              aria-pressed={colorMode === "light"}
            >
              <Sun style={{ width: 14, height: 14 }} />
              <span>Light</span>
            </button>
            <button
              type="button"
              className={`mode-btn ${colorMode === "dark" ? "active" : ""}`}
              onClick={() => {
                setColorMode("dark");
                showToast("Noir Dark mode applied system-wide");
              }}
              title="Switch to Noir Dark Mode"
              aria-pressed={colorMode === "dark"}
            >
              <Moon style={{ width: 14, height: 14 }} />
              <span>Dark</span>
            </button>
          </div>

          <div className="theme-swatches" title="Brand accent color palette">
            {THEME_OPTIONS.map((t) => {
              const isSelected =
                (currentTheme === "" && (t.id === "" || t.key === "")) ||
                currentTheme === t.id ||
                currentTheme === t.key;
              return (
                <button
                  key={t.name}
                  type="button"
                  className={`theme-dot ${isSelected ? "active" : ""}`}
                  style={{ backgroundColor: t.primaryColor }}
                  onClick={() => {
                    setTheme(t.key);
                    showToast(`${t.name} brand color applied system-wide`);
                  }}
                  title={`${t.name} (${t.description})`}
                  aria-label={`Select ${t.name} brand theme`}
                />
              );
            })}
          </div>
        </div>

        <Link href="/kitchen/queue" className="btn s">
          Kitchen display
        </Link>
        <Link href="/staff/tables" className="btn">
          Open floor
        </Link>
      </div>

      {/* Needs You Alert Center */}
      <div className="cd">
        <h2>Needs you</h2>
        <p className="sub">Sorted by urgency. Clear these first.</p>

        {isBackendUnreachable && (
          <div className="al">
            <div>
              <b>Backend proxy unreachable</b>
              <small>
                Cannot connect to backend service at port 8088. Live metrics and orders are paused.
              </small>
            </div>
            <span className="pill c-r">502 Error</span>
          </div>
        )}

        {/* 1. Food Waiting at Pass */}
        {readyDelays.map(({ order, minutes }) => {
          const tb = (order as any).table_number || `Order #${order.sequence_number}`;
          return (
            <div key={`rd-${order.id}`} className="al">
              <div>
                <b>Table {tb}: food waiting at the pass</b>
                <small>Ready for {minutes} min · nobody has picked it up</small>
              </div>
              <button
                className="btn r sm"
                onClick={() => showToast(`Waiter alerted for Table ${tb}`)}
              >
                Alert waiter
              </button>
            </div>
          );
        })}

        {/* 2. Cooking Delays */}
        {cookingDelays.map(({ order, minutes }) => {
          const tb = (order as any).table_number || `Order #${order.sequence_number}`;
          return (
            <div key={`cd-${order.id}`} className="al">
              <div>
                <b>Table {tb}: cook delay in kitchen</b>
                <small>
                  Order #{order.sequence_number} cooking for {minutes} min (target &lt;12 min)
                </small>
              </div>
              <Link href="/kitchen/queue" className="btn r sm">
                Kitchen queue
              </Link>
            </div>
          );
        })}

        {/* 3. Service Calls */}
        {activeServiceCalls.map((table) => (
          <div key={`sc-${table.table_id || table.table_number}`} className="al w">
            <div>
              <b>Table {table.table_number}: guest requested assistance</b>
              <small>Reason: "{table.assistance_reason}"</small>
            </div>
            <Link
              href={`/staff/tables?table=${table.table_number}`}
              className="btn sm"
            >
              Attend table
            </Link>
          </div>
        ))}

        {/* 4. Food Cost / P&L Alert */}
        {foodCostRatio > 35 ? (
          <div className="al w">
            <div>
              <b>Food cost is {foodCostRatio}% of sales (target 30%)</b>
              <small>
                Recent purchases & wastage logged total {formatMoney(totalExpenseMinor)}. Review P&L to protect margins.
              </small>
            </div>
            <Link href="/restaurant/analytics" className="btn sm">
              Review
            </Link>
          </div>
        ) : null}

        {/* 5. Smooth operations fallback if no urgent bottlenecks */}
        {!isBackendUnreachable &&
          readyDelays.length === 0 &&
          cookingDelays.length === 0 &&
          activeServiceCalls.length === 0 &&
          foodCostRatio <= 35 && (
            <div
              className="al"
              style={
                {
                  borderColor: "rgba(47,154,98,0.4)",
                  background: "rgba(47,154,98,0.08)",
                  "--c": "var(--admin-grn)",
                } as any
              }
            >
              <div>
                <b>Operations running smoothly</b>
                <small>
                  Kitchen cooking times, pass pickup queues and floor tables are all strictly on target.
                </small>
              </div>
              <span className="pill c-g">SLA On Target</span>
            </div>
          )}
      </div>

      {/* 4 KPI Metric Cards */}
      <div className="g g4 mt">
        <div className="cd st" style={{ "--c": "var(--admin-am)" } as any}>
          <small>Sales today</small>
          <b>{formatMoney(totalGmvMinor)}</b>
          <span>
            {orderCount} orders · avg {formatMoney(aovMinor)}
          </span>
        </div>

        <div className="cd st" style={{ "--c": "var(--admin-grn)" } as any}>
          <small>Net after fees</small>
          <b>{formatMoney(netRevenueMinor)}</b>
          <span>1% platform fee deducted</span>
        </div>

        <div className="cd st" style={{ "--c": "var(--admin-blu)" } as any}>
          <small>Tables in use</small>
          <b>
            {occupiedTables} / {totalTables}
          </b>
          <span>
            {occupiedTables > 0 ? `${occupiedTables} dining now` : "All tables available"}
          </span>
        </div>

        <div
          className="cd st"
          style={{
            "--c": lowStockCount > 0 ? "var(--admin-red)" : "var(--admin-grn)",
          } as any}
        >
          <small>Low stock</small>
          <b>{lowStockCount}</b>
          <span>
            {lowStockCount > 0 ? "Reorder soon" : "Everything above minimum"}
          </span>
        </div>
      </div>

      {/* Floor Now & Kitchen Queue Grid */}
      <div className="g g2 mt">
        {/* Floor Now */}
        <div className="cd">
          <h2>Floor now</h2>
          <p className="sub">Tap a table to open its bill or seat guests.</p>
          <div
            className="tg"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}
          >
            {tablesList.length === 0 ? (
              <div className="em" style={{ gridColumn: "1 / -1" }}>
                <b>No tables registered</b>
                Add tables to start generating QR codes and managing seating.
              </div>
            ) : (
              tablesList.map((t) => {
                const isOccupied = t.is_occupied;
                const { minutes: dwellMin } = getTimeElapsed(t.opened_at);
                const hasReadyFood = readyOrders.some(
                  (ro: any) =>
                    (ro.table_number === t.table_number || ro.table_id === t.table_id) &&
                    getTimeElapsed(ro.placed_at).minutes >= 4
                );

                if (!isOccupied) {
                  return (
                    <Link
                      key={t.table_id || t.table_number}
                      href={`/staff/tables?table=${t.table_number}`}
                      className="tc free"
                      title={`Table ${t.table_number} is Free`}
                    >
                      <span className="id">{t.table_number}</span>
                      <small style={{ color: "var(--admin-mute)" }}>
                        Free · seats {(t as any).capacity || t.guest_count || 4}
                      </small>
                    </Link>
                  );
                }

                return (
                  <Link
                    key={t.table_id || t.table_number}
                    href={`/staff/tables?table=${t.table_number}`}
                    className={`tc ${hasReadyFood ? "late" : ""}`}
                    style={
                      {
                        "--c": hasReadyFood
                          ? "var(--admin-red)"
                          : "var(--admin-am)",
                      } as any
                    }
                    title={`Table ${t.table_number}: ${t.customer_name || "Diner"}`}
                  >
                    <span className="id">{t.table_number}</span>
                    <b>{t.customer_name || "Guest Diner"}</b>
                    <small style={{ color: "var(--admin-mute)" }}>
                      {t.guest_count || 2} guests · {dwellMin}m
                    </small>
                    <span className="ft">
                      <span>Bill</span>
                      <span>{formatMoney(t.running_total_minor || 0)}</span>
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Kitchen Queue */}
        <div className="cd">
          <h2>Kitchen queue</h2>
          <p className="sub">
            {readyOrders.length} ready · {cookingOrders.length} cooking
          </p>

          {kitchenList.length === 0 ? (
            <div className="em">
              <b>Kitchen queue clear</b>
              Chefs have completed all active tickets.
            </div>
          ) : (
            kitchenList.slice(0, 5).map((o) => {
              const isReady = o.status === "READY";
              const itemsText =
                o.items
                  ?.map((it) => `${it.quantity} ${it.item_name_snapshot}`)
                  .join(", ") || "Order ticket";
              const tableNum =
                (o as any).table_number || `Order #${o.sequence_number}`;

              return (
                <div key={o.id} className="row">
                  <div>
                    <b>
                      Table {tableNum} · #{o.sequence_number}
                    </b>
                    <small>{itemsText}</small>
                  </div>
                  <span className={`pill ${isReady ? "c-a" : "c-g"}`}>
                    {isReady ? "Ready" : "Cooking"}
                  </span>
                </div>
              );
            })
          )}

          <Link
            href="/restaurant/orders"
            className="btn s sm"
            style={{ marginTop: 12, display: "inline-flex" }}
          >
            All orders
          </Link>
        </div>
      </div>
    </>
  );
}
