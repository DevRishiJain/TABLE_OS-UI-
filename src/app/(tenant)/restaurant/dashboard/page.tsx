"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useAppSelector } from "@/store";
import {
  useGetTodayAnalyticsQuery,
  useGetMenuItemsQuery,
} from "@/store/api/restaurantApi";
import {
  useGetStaffTablesQuery,
  useGetPendingOrdersQuery,
} from "@/store/api/staffApi";
import { useGetKitchenQueueQuery } from "@/store/api/kitchenApi";
import { formatDestination } from "@/lib/location";
import { formatMoney } from "@/lib/money";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  TrendingUp,
  Users,
  ShoppingBag,
  Receipt,
  Layers,
  ChefHat,
  Sparkles,
  ArrowRight,
  Clock,
  ArrowUpRight,
  AlertTriangle,
  Bell,
  CheckCircle2,
  Flame,
  Utensils,
  Car,
} from "lucide-react";

function getTimeElapsed(dateStr?: string): { minutes: number; text: string } {
  if (!dateStr) return { minutes: 0, text: "just now" };
  const diffMs = Math.max(0, Date.now() - new Date(dateStr).getTime());
  const minutes = Math.floor(diffMs / 60000);
  const seconds = Math.floor((diffMs % 60000) / 1000);
  if (minutes === 0) return { minutes: 0, text: `${seconds}s ago` };
  return { minutes, text: `${minutes}m ${seconds}s ago` };
}

export default function RestaurantDashboardOverviewPage() {
  const restaurantName = useAppSelector((state) => state.auth.restaurantName) || "Restaurant";
  const { data: today, isLoading: isTodayLoading, error: todayError } = useGetTodayAnalyticsQuery(
    undefined,
    { pollingInterval: 6000 }
  );

  const isBackendUnreachable = Boolean(
    (todayError as any)?.status === 502 ||
    (todayError as any)?.data?.error === "Backend proxy unreachable" ||
    (todayError as any)?.data?.details?.includes("fetch failed")
  );
  const { data: menuItems } = useGetMenuItemsQuery();
  const { data: staffTables } = useGetStaffTablesQuery(undefined, {
    pollingInterval: 3500,
  });
  const { data: pendingOrders } = useGetPendingOrdersQuery(undefined, {
    pollingInterval: 3000,
  });
  const { data: kitchenQueue } = useGetKitchenQueueQuery(undefined, {
    pollingInterval: 3500,
  });

  const totalGmvMinor = today?.total_gmv?.amount_minor_units || 0;
  const platformFeeMinor = today?.platform_fee_accrued?.amount_minor_units || 0;
  const netRevenueMinor = totalGmvMinor - platformFeeMinor;
  const orderCount = today?.order_count || 0;
  const aovMinor = today?.average_order_value?.amount_minor_units || 0;

  const tablesList = staffTables || [];
  const totalTables = tablesList.length || 8;
  const occupiedTables = tablesList.filter((t) => t.is_occupied).length;

  const pendingList = pendingOrders || [];
  const kitchenList = kitchenQueue || [];

  const cookingOrders = kitchenList.filter(
    (o) => o.status === "ACCEPTED" || o.status === "PREPARING"
  );
  const readyOrders = kitchenList.filter((o) => o.status === "READY");

  // SLA Alerts Calculation
  // 1. Kitchen Delays: Cook time > 12 minutes
  const kitchenDelays = useMemo(() => {
    return cookingOrders
      .map((ord) => {
        const { minutes, text } = getTimeElapsed(ord.accepted_at || ord.placed_at);
        return { order: ord, minutes, text };
      })
      .filter((item) => item.minutes >= 12);
  }, [cookingOrders]);

  // 2. Waiter Delays:
  // a) Pending unaccepted orders > 3 minutes
  // b) Food ready at pass without waiter pickup > 4 minutes
  const waiterDelays = useMemo(() => {
    const list: {
      type: "PENDING_ACCEPTANCE" | "PICKUP_DELAY";
      title: string;
      orderId: string;
      table: string;
      minutes: number;
      text: string;
    }[] = [];

    pendingList.forEach((entry) => {
      const { minutes, text } = getTimeElapsed(entry.order.placed_at);
      if (minutes >= 3) {
        list.push({
          type: "PENDING_ACCEPTANCE",
          title: "Awaiting Waiter Acceptance",
          orderId: entry.order.id,
          table: entry.table_number || `Order #${entry.order.sequence_number}`,
          minutes,
          text,
        });
      }
    });

    readyOrders.forEach((ord) => {
      const { minutes, text } = getTimeElapsed(ord.placed_at);
      if (minutes >= 4) {
        list.push({
          type: "PICKUP_DELAY",
          title: "Ready at Pass (Needs Waiter Pickup)",
          orderId: ord.id,
          table: (ord as any).table_number || `Order #${ord.sequence_number}`,
          minutes,
          text,
        });
      }
    });

    return list;
  }, [pendingList, readyOrders]);

  // 3. Service Call Alerts from Diners
  const activeServiceCalls = tablesList.filter((t) => Boolean(t.assistance_reason));

  const totalActiveAlerts =
    kitchenDelays.length + waiterDelays.length + activeServiceCalls.length;

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-gray-100 flex items-center gap-2">
            {restaurantName} — Executive Overview
          </h1>
          <p className="text-xs text-gray-400">
            Real-time floor operations, live kitchen queue & SLA monitoring
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/kitchen/queue">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<ChefHat className="w-4 h-4 text-amber-400" />}
            >
              Kitchen KDS ({kitchenList.length})
            </Button>
          </Link>
          <Link href="/staff/tables">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Layers className="w-4 h-4 text-primary" />}
            >
              Floor Plan
            </Button>
          </Link>
          <Link href="/restaurant/menu">
            <Button
              variant="gold"
              size="sm"
              leftIcon={<Sparkles className="w-4 h-4" />}
            >
              Menu Studio
            </Button>
          </Link>
        </div>
      </div>

      {/* Backend Connectivity Alert Banner */}
      {isBackendUnreachable && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-between text-red-400 shadow-lg">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 text-red-400 animate-pulse" />
            <div>
              <p className="text-sm font-bold text-red-300">Backend Proxy Unreachable</p>
              <p className="text-xs text-red-400/80 mt-0.5">
                Frontend cannot connect to backend service (<code className="font-mono bg-red-500/20 px-1 py-0.5 rounded text-red-200">http://localhost:8088</code>). Live metrics, tables, and orders are paused.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 shrink-0">
            502 Proxy Unreachable
          </span>
        </div>
      )}

      {/* SLA Delays & Live Bottlenecks Alert Center */}
      {totalActiveAlerts > 0 ? (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-red-500/20 via-amber-500/15 to-red-500/10 border-2 border-red-500/50 shadow-xl flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-red-500/30 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-red-500/30 text-red-300 flex items-center justify-center font-bold">
                <AlertTriangle className="w-4 h-4 text-red-400 animate-bounce" />
              </div>
              <h3 className="text-sm font-bold text-red-200 font-display">
                Operational Delays & SLA Bottlenecks ({totalActiveAlerts} Active)
              </h3>
            </div>
            <span className="text-[11px] font-mono text-red-300 bg-red-500/20 px-2.5 py-0.5 rounded-full border border-red-500/40 font-bold">
              Requires Immediate Floor Attention
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {/* Waiter Delays */}
            {waiterDelays.map((wd, i) => (
              <div
                key={`wd-${i}`}
                className="p-3 rounded-xl bg-surface/90 border border-amber-500/50 flex items-start gap-2.5 text-xs shadow-sm"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                  <Users className="w-4 h-4 text-amber-400" />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="font-bold text-amber-300 flex items-center justify-between">
                    <span>Waiter Delay: {wd.table}</span>
                    <span className="text-[10px] font-mono font-bold text-red-400">
                      {wd.text}
                    </span>
                  </span>
                  <span className="text-[11px] text-gray-300 mt-0.5">
                    {wd.title}
                  </span>
                </div>
              </div>
            ))}

            {/* Kitchen Delays */}
            {kitchenDelays.map((kd, i) => (
              <div
                key={`kd-${i}`}
                className="p-3 rounded-xl bg-surface/90 border border-red-500/50 flex items-start gap-2.5 text-xs shadow-sm"
              >
                <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-300 flex items-center justify-center shrink-0 mt-0.5">
                  <Flame className="w-4 h-4 text-red-400" />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="font-bold text-red-300 flex items-center justify-between">
                    <span>Kitchen Cook Delay</span>
                    <span className="text-[10px] font-mono font-bold text-red-400">
                      {kd.text}
                    </span>
                  </span>
                  <span className="text-[11px] text-gray-300 mt-0.5 truncate">
                    {(kd.order as any).table_number || `Order #${kd.order.sequence_number}`} • {kd.order.items?.map(it => it.item_name_snapshot).join(", ")}
                  </span>
                </div>
              </div>
            ))}

            {/* Service Calls */}
            {activeServiceCalls.map((sc, i) => (
              <div
                key={`sc-${i}`}
                className="p-3 rounded-xl bg-surface/90 border border-sky-500/50 flex items-start gap-2.5 text-xs shadow-sm"
              >
                <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-300 flex items-center justify-center shrink-0 mt-0.5">
                  <Bell className="w-4 h-4 text-sky-400 animate-bounce" />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="font-bold text-sky-300 flex items-center justify-between">
                    <span>Diner Call: Table {sc.table_number}</span>
                    <span className="text-[10px] font-mono text-sky-400 font-bold">Ping</span>
                  </span>
                  <span className="text-[11px] text-gray-300 mt-0.5 truncate">
                    Reason: "{sc.assistance_reason}"
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300 shadow-sm">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Operations Running Smoothly</strong>: Kitchen cooking times and waiter pickup queues are strictly within target SLA limits (&lt;12m cook, &lt;3m pickup).
            </span>
          </div>
          <Badge variant="success" size="sm">
            SLA On Target
          </Badge>
        </div>
      )}

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's GMV */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Today's Gross Sales
            </span>
            <div className="p-2 rounded-xl bg-primary/20 text-primary">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black font-mono text-primary">
              {formatMoney(totalGmvMinor)}
            </div>
            <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 mt-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              Updated in real-time
            </span>
          </div>
        </Card>

        {/* Net Revenue */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Net Restaurant Revenue
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black font-mono text-emerald-400">
              {formatMoney(netRevenueMinor)}
            </div>
            <span className="text-[11px] text-gray-400 mt-1">
              After 1% platform fee deduction
            </span>
          </div>
        </Card>

        {/* Orders Placed */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Total Placed Orders
            </span>
            <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black font-mono text-gray-100">
              {orderCount}
            </div>
            <span className="text-[11px] text-gray-400 mt-1">
              AOV: {formatMoney(aovMinor)}
            </span>
          </div>
        </Card>

        {/* Table Turn Status */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Active Floor Tables
            </span>
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black font-mono text-amber-300">
              {occupiedTables} / {totalTables}
            </div>
            <span className="text-[11px] text-gray-400 mt-1">
              {occupiedTables > 0
                ? `${occupiedTables} in active dining`
                : "All tables available"}
            </span>
          </div>
        </Card>
      </div>

      {/* Live Floor Current View Grid */}
      <Card className="p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-surface-border/60 pb-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-100 font-display flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              Live Table & Seating Current View ({tablesList.length} Units)
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Real-time occupancy, party sizes, active running bills & dining durations
            </p>
          </div>
          <Link
            href="/staff/tables"
            className="text-xs text-primary hover:underline font-bold flex items-center gap-1"
          >
            Manage Floor Grid <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {tablesList.map((t) => {
            const dest = formatDestination(t.table_number, undefined, t.customer_name, t.guest_count);
            const isOccupied = t.is_occupied;
            const status = t.session_status || (isOccupied ? "OPEN" : "AVAILABLE");
            const billMinor = t.running_total_minor || 0;
            const { text: dwellText } = getTimeElapsed(t.opened_at);

            return (
              <div
                key={t.table_id || t.table_number}
                className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between min-h-[120px] shadow-sm ${
                  isOccupied
                    ? status === "AWAITING_PAYMENT"
                      ? "bg-amber-500/10 border-amber-500/50 shadow-amber-500/10"
                      : status === "PAID"
                      ? "bg-emerald-500/10 border-emerald-500/50 shadow-emerald-500/10"
                      : "bg-surface-elevated border-primary/40 shadow-glow"
                    : "bg-surface/60 border-surface-border opacity-70"
                }`}
              >
                <div className="flex items-start justify-between gap-1">
                  <span className="w-7 h-7 rounded-lg bg-surface-subtle font-black text-xs font-mono flex items-center justify-center border border-surface-border text-gray-200">
                    {dest.shortBadge}
                  </span>
                  <Badge
                    variant={
                      !isOccupied
                        ? "default"
                        : status === "PAID"
                        ? "success"
                        : status === "AWAITING_PAYMENT"
                        ? "amber"
                        : "gold"
                    }
                    size="sm"
                  >
                    {!isOccupied ? "FREE" : status === "AWAITING_PAYMENT" ? "BILL" : status === "PAID" ? "PAID" : "DINING"}
                  </Badge>
                </div>

                <div className="mt-2">
                  <span className="text-xs font-bold text-gray-100 font-display block truncate">
                    {dest.display}
                  </span>
                  {isOccupied ? (
                    <>
                      <span className="text-[11px] text-amber-400 font-medium block truncate">
                        {t.customer_name || "Guest Diner"} ({t.guest_count || 1}p)
                      </span>
                      <div className="flex items-center justify-between text-[11px] font-mono mt-1 pt-1 border-t border-surface-border/40 text-gray-300">
                        <span className="font-bold text-primary">{formatMoney(billMinor)}</span>
                        <span className="text-[10px] text-gray-400">{dwellText}</span>
                      </div>
                    </>
                  ) : (
                    <span className="text-[11px] text-gray-500 block mt-1">
                      Ready to Seat
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Orders Operational Breakdown: Pending Orders & Kitchen Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Orders Awaiting Waiter Acceptance */}
        <Card className="p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-surface-border/60 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold">
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-100 font-display">
                  Pending Orders ({pendingList.length})
                </h3>
                <span className="text-[11px] text-gray-400">
                  Placed by diners, awaiting floor staff acceptance
                </span>
              </div>
            </div>
            <Link
              href="/staff/orders"
              className="text-xs text-primary hover:underline font-bold flex items-center gap-1"
            >
              Open Waiter Station <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex flex-col gap-3 min-h-[220px]">
            {pendingList.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center p-8 bg-surface-subtle/40 rounded-2xl border border-surface-border my-auto">
                <CheckCircle2 className="w-9 h-9 text-emerald-400 mb-2" />
                <h4 className="text-xs font-bold text-gray-200">All Orders Accepted</h4>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  No incoming tickets waiting for waiter action.
                </p>
              </div>
            ) : (
              pendingList.map((entry) => {
                const dest = formatDestination(
                  entry.table_number || (entry.order as any).table_number,
                  (entry.order as any).vehicle_number,
                  entry.customer_name,
                  entry.guest_count
                );
                const { text: elapsed } = getTimeElapsed(entry.order.placed_at);
                const totalMinor =
                  typeof entry.order.total === "number"
                    ? entry.order.total
                    : entry.order.total?.amount_minor_units || 0;

                return (
                  <div
                    key={entry.order.id}
                    className="p-3.5 rounded-xl bg-surface border border-amber-500/30 flex items-center justify-between gap-3 shadow-sm hover:border-amber-500/60 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 font-bold font-display flex items-center justify-center text-xs shrink-0 border border-amber-500/40">
                        {dest.shortBadge}
                      </span>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-100">
                            {dest.display} • Order #{entry.order.sequence_number}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">
                            {elapsed}
                          </span>
                        </div>
                        <span className="text-[11px] text-gray-400 truncate max-w-xs mt-0.5">
                          {entry.customer_name || "Guest"} • {entry.order.items?.map(it => `${it.quantity}x ${it.item_name_snapshot}`).join(", ")}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-primary shrink-0">
                      {formatMoney(totalMinor)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Live Kitchen Cooking & Pass Queue */}
        <Card className="p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-surface-border/60 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-bold">
                <ChefHat className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-100 font-display">
                  Kitchen KDS Queue ({cookingOrders.length} Cooking • {readyOrders.length} Ready)
                </h3>
                <span className="text-[11px] text-gray-400">
                  Tickets actively being cooked or waiting for pickup on pass
                </span>
              </div>
            </div>
            <Link
              href="/kitchen/queue"
              className="text-xs text-primary hover:underline font-bold flex items-center gap-1"
            >
              Open KDS <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex flex-col gap-3 min-h-[220px]">
            {kitchenList.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center p-8 bg-surface-subtle/40 rounded-2xl border border-surface-border my-auto">
                <ChefHat className="w-9 h-9 text-gray-500 mb-2" />
                <h4 className="text-xs font-bold text-gray-200">Kitchen Queue Clear</h4>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Chefs have completed all tickets.
                </p>
              </div>
            ) : (
              [...kitchenList]
                .sort((a, b) => {
                  const priority = (s: string) => {
                    if (s === "PREPARING") return 1;
                    if (s === "ACCEPTED" || s === "PLACED_VERIFIED") return 2;
                    if (s === "READY") return 3;
                    if (s === "SERVED") return 4;
                    return 5;
                  };
                  return priority(a.status) - priority(b.status);
                })
                .slice(0, 5)
                .map((ord) => {
                  const dest = formatDestination(
                    (ord as any).table_number,
                    (ord as any).vehicle_number,
                    (ord as any).customer_name,
                    (ord as any).guest_count
                  );
                  const { text: elapsed } = getTimeElapsed(ord.accepted_at || ord.placed_at);
                  
                  // Accurate status classification
                  const getStatusInfo = (status: string) => {
                    switch (status) {
                      case "READY":
                        return {
                          label: "READY ON PASS 🛎️",
                          badgeVariant: "success" as const,
                          cardBg: "bg-emerald-500/10 border-emerald-500/40 shadow-emerald-500/10",
                          badgeBg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/50",
                        };
                      case "SERVED":
                        return {
                          label: "SERVED ✅",
                          badgeVariant: "default" as const,
                          cardBg: "bg-surface/70 border-surface-border opacity-90",
                          badgeBg: "bg-surface-subtle text-gray-300 border-surface-border",
                        };
                      case "PREPARING":
                        return {
                          label: "COOKING 🔥",
                          badgeVariant: "gold" as const,
                          cardBg: "bg-amber-500/10 border-amber-500/40 shadow-amber-500/5",
                          badgeBg: "bg-primary/20 text-primary border-primary/40",
                        };
                      case "ACCEPTED":
                      case "PLACED_VERIFIED":
                        return {
                          label: "ACCEPTED 📋",
                          badgeVariant: "amber" as const,
                          cardBg: "bg-surface border-amber-500/30",
                          badgeBg: "bg-amber-500/20 text-amber-300 border-amber-500/40",
                        };
                      case "CANCELLED":
                        return {
                          label: "CANCELLED ✕",
                          badgeVariant: "error" as const,
                          cardBg: "bg-red-500/10 border-red-500/30 opacity-70",
                          badgeBg: "bg-red-500/20 text-red-400 border-red-500/40",
                        };
                      default:
                        return {
                          label: status,
                          badgeVariant: "default" as const,
                          cardBg: "bg-surface border-surface-border",
                          badgeBg: "bg-surface-subtle text-gray-400 border-surface-border",
                        };
                    }
                  };

                  const info = getStatusInfo(ord.status);

                  return (
                    <div
                      key={ord.id}
                      className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 shadow-sm transition-colors ${info.cardBg}`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-9 h-9 rounded-xl font-bold font-display flex items-center justify-center text-xs shrink-0 border ${info.badgeBg}`}
                        >
                          {dest.shortBadge}
                        </span>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-100">
                              {dest.display} • Order #{ord.sequence_number}
                            </span>
                            <Badge
                              variant={info.badgeVariant}
                              size="sm"
                            >
                              {info.label}
                            </Badge>
                          </div>
                          <span className="text-[11px] text-gray-400 truncate max-w-xs mt-0.5">
                            {ord.items?.map(it => `${it.quantity}x ${it.item_name_snapshot}`).join(", ")}
                          </span>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono text-gray-400 shrink-0">
                        {elapsed}
                      </span>
                    </div>
                  );
                })
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
