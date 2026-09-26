"use client";

import React, { useState } from "react";
import {
  useGetPendingOrdersQuery,
  useAcceptOrderMutation,
  PendingOrderEntry,
} from "@/store/api/staffApi";
import { useGetKitchenQueueQuery, useUpdateKitchenStatusMutation } from "@/store/api/kitchenApi";
import { formatMoney } from "@/lib/money";
import { humanizeStatus } from "@/lib/statusLabels";
import { addToast } from "@/store/slices/uiSlice";
import { useAppDispatch, useAppSelector } from "@/store";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { OrderItem } from "@/types/domain";
import {
  CheckCircle2,
  Clock,
  Utensils,
  RefreshCw,
  Bell,
  ChefHat,
  BellRing,
  Users,
  User,
  Phone,
} from "lucide-react";

function getTimeElapsed(placedAtStr?: string): string {
  if (!placedAtStr) return "recently";
  const elapsedSecs = Math.max(
    0,
    Math.floor((Date.now() - new Date(placedAtStr).getTime()) / 1000)
  );
  if (elapsedSecs < 60) return `${elapsedSecs}s ago`;
  const mins = Math.floor(elapsedSecs / 60);
  return `${mins}m ${elapsedSecs % 60}s ago`;
}

function getItemTotalMinor(item: OrderItem): number {
  if (typeof item.line_total === "number") {
    return item.line_total;
  }
  return item.line_total?.amount_minor_units || 0;
}

function getOrderTotalMinor(total: any): number {
  if (typeof total === "number") return total;
  return total?.amount_minor_units || 0;
}

type WaiterTab = "pending" | "ready_pickup" | "kitchen_status";

export default function WaiterOrderScreenPage() {
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const [activeTab, setActiveTab] = useState<WaiterTab>("pending");
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);

  // Poll pending orders every 3 seconds for instant real-time synchronization across all waiters
  const {
    data: pendingOrders,
    isLoading: isPendingLoading,
    refetch: refetchPending,
  } = useGetPendingOrdersQuery(undefined, { pollingInterval: 3000 });

  // Kitchen queue to track status of accepted tickets (now includes READY and SERVED)
  const { data: kitchenQueue, refetch: refetchKitchen } =
    useGetKitchenQueueQuery(auth.restaurantId || undefined, { pollingInterval: 4000 });

  const [acceptOrder] = useAcceptOrderMutation();
  const [updateKitchenStatus] = useUpdateKitchenStatusMutation();

  const pendingList = pendingOrders || [];
  const allKitchenOrders = kitchenQueue || [];

  // Separate READY orders for the "Ready for Pickup" tab
  const readyForPickupList = allKitchenOrders.filter(
    (ord) => ord.status === "READY"
  );
  // Kitchen status shows ACCEPTED and PREPARING orders
  const inKitchenList = allKitchenOrders.filter(
    (ord) => ord.status === "ACCEPTED" || ord.status === "PREPARING"
  );

  const handleAcceptOrder = async (orderId: string, tableNumber: string) => {
    setProcessingOrderId(orderId);
    try {
      await acceptOrder({ orderId }).unwrap();
      dispatch(
        addToast({
          type: "success",
          title: "Order Accepted!",
          message: `Table ${tableNumber} order accepted by ${auth.userName || "Waiter"} (${auth.employeeId || "Floor Staff"}) and sent to kitchen.`,
        })
      );
      await Promise.all([refetchPending(), refetchKitchen()]);
    } catch (err: any) {
      console.error("Failed to accept order:", err);
      dispatch(
        addToast({
          type: "error",
          title: "Order Acceptance Failed",
          message: err?.data?.error || "Could not accept order. Please try again.",
        })
      );
    } finally {
      setProcessingOrderId(null);
    }
  };

  const handleMarkServed = async (orderId: string, tableNumber: string) => {
    setProcessingOrderId(orderId);
    try {
      await updateKitchenStatus({
        orderId,
        data: { status: "SERVED" as any },
      }).unwrap();
      dispatch(
        addToast({
          type: "success",
          title: "Order Served!",
          message: `Order delivered to ${tableNumber} by ${auth.userName || "Waiter"} (${auth.employeeId || "Floor Staff"}).`,
        })
      );
      refetchKitchen();
    } catch (err: any) {
      console.error("Failed to mark served:", err);
      dispatch(
        addToast({
          type: "error",
          title: "Failed",
          message: err?.data?.error || "Could not mark order as served.",
        })
      );
    } finally {
      setProcessingOrderId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Waiter Identity & Shift Bar */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-surface to-surface-elevated border border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-bold border border-primary/30">
            <Utensils className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-100 font-display">
              {auth.userName || "Waiter"}{" "}
              <span className="text-xs text-gray-400 font-mono ml-1">
                {auth.employeeId || ""}
              </span>
            </p>
            <p className="text-[11px] text-gray-400">
              {auth.staffRole || "Floor Staff"} •{" "}
              {auth.restaurantName || "Restaurant"}
            </p>
          </div>
        </div>
        <Button
          variant="subtle"
          size="sm"
          onClick={() => {
            refetchPending();
            refetchKitchen();
          }}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Refresh
        </Button>
      </div>

      {/* Tab Navigation — 3 tabs */}
      <div className="flex gap-2">
        <button
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all border ${
            activeTab === "pending"
              ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
              : "bg-surface text-gray-400 border-surface-border hover:border-gray-500"
          }`}
          onClick={() => setActiveTab("pending")}
        >
          <div className="flex items-center gap-1.5">
            <Bell className="w-4 h-4" />
            New Orders
            {pendingList.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500 text-black animate-pulse">
                {pendingList.length}
              </span>
            )}
          </div>
        </button>

        <button
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all border ${
            activeTab === "ready_pickup"
              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50"
              : "bg-surface text-gray-400 border-surface-border hover:border-gray-500"
          }`}
          onClick={() => setActiveTab("ready_pickup")}
        >
          <div className="flex items-center gap-1.5">
            <BellRing className="w-4 h-4" />
            Ready for Pickup
            {readyForPickupList.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500 text-black animate-pulse">
                {readyForPickupList.length}
              </span>
            )}
          </div>
        </button>

        <button
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all border ${
            activeTab === "kitchen_status"
              ? "bg-primary/20 text-primary border-primary/50"
              : "bg-surface text-gray-400 border-surface-border hover:border-gray-500"
          }`}
          onClick={() => setActiveTab("kitchen_status")}
        >
          <div className="flex items-center gap-1.5">
            <ChefHat className="w-4 h-4" />
            In Kitchen
            {inKitchenList.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-primary text-background">
                {inKitchenList.length}
              </span>
            )}
          </div>
        </button>
      </div>

      {/* TAB 1: PENDING ORDERS REQUIRING ACCEPTANCE */}
      {activeTab === "pending" && (
        <div className="flex flex-col gap-4">
          {isPendingLoading ? (
            <div className="py-20 text-center text-gray-500 text-xs font-mono bg-surface rounded-2xl border border-surface-border p-6 animate-pulse">
              Loading incoming orders...
            </div>
          ) : pendingList.length === 0 ? (
            <div className="py-20 text-center bg-surface rounded-2xl border border-surface-border p-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-gray-200 font-display mb-1">
                All Clear
              </h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                All customer orders have been accepted into the kitchen. New orders placed by guests will pop up here in real time.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingList.map((entry: PendingOrderEntry) => {
                const ord = entry.order;
                const rawTable = entry.table_number || (ord as any).table_number || "Table 1";
                const cleanNum = rawTable.replace(/[^0-9]/g, "") || "1";
                const tableDisplay = `Table ${cleanNum}`;
                const tableBadge = `T${cleanNum}`;
                const customerName = (ord as any).customer_name || entry.customer_name || "Guest Diner";
                const guestCount = (ord as any).guest_count || entry.guest_count || 1;
                const isAccepting = processingOrderId === ord.id;
                const totalMinor = getOrderTotalMinor(ord.total);

                return (
                  <Card
                    key={ord.id}
                    className="p-5 flex flex-col justify-between gap-4 border-amber-500/50 bg-amber-500/[0.03] shadow-glow transition-all hover:border-amber-500"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 font-bold font-display flex items-center justify-center text-sm border border-amber-500/40 shadow-sm">
                          {tableBadge}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-gray-100 font-display flex items-center gap-1.5">
                            {tableDisplay} • Order #{ord.sequence_number}
                          </h3>
                          <div className="flex items-center gap-1.5 text-xs text-gray-300 font-medium mt-0.5">
                            <span className="text-amber-300 font-semibold">{customerName}</span>
                            <span className="text-gray-600">•</span>
                            <span className="text-gray-400 font-mono text-[11px] flex items-center gap-1">
                              <Users className="w-3 h-3 text-amber-400" />
                              {guestCount} {guestCount === 1 ? "Guest" : "Guests"}
                            </span>
                            <span className="text-gray-600">•</span>
                            <span className="text-[11px] text-amber-400 font-mono flex items-center gap-0.5">
                              <Clock className="w-3 h-3" />
                              {getTimeElapsed(ord.placed_at)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Badge variant="amber" size="sm">
                        Action Required
                      </Badge>
                    </div>

                    {/* Order Items List */}
                    <div className="flex flex-col gap-2 p-3 rounded-xl bg-surface-subtle border border-surface-border/60 text-xs">
                      {ord.items && ord.items.length > 0 ? (
                        ord.items.map((item: OrderItem) => (
                          <div
                            key={item.id}
                            className="flex items-start justify-between gap-2"
                          >
                            <div className="flex items-start gap-2">
                              <span className="font-mono font-bold text-amber-400">
                                {item.quantity}x
                              </span>
                              <div className="flex flex-col">
                                <span className="text-gray-200 font-medium">
                                  {item.item_name_snapshot}
                                </span>
                                {item.special_instructions && (
                                  <span className="text-[10px] text-amber-300 italic">
                                    Note: {item.special_instructions}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="font-mono font-bold text-gray-300 shrink-0">
                              {formatMoney(getItemTotalMinor(item))}
                            </span>
                          </div>
                        ))
                      ) : (
                        <span className="text-gray-500 text-[11px]">1x Guest Dining Items</span>
                      )}
                    </div>

                    {/* Footer & Action Button */}
                    <div className="flex items-center justify-between pt-3 border-t border-surface-border/60">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 uppercase font-semibold">
                          Total Ticket
                        </span>
                        <span className="text-base font-extrabold font-mono text-primary">
                          {formatMoney(totalMinor)}
                        </span>
                      </div>

                      <Button
                        variant="gold"
                        size="sm"
                        isLoading={isAccepting}
                        onClick={() => handleAcceptOrder(ord.id, tableDisplay)}
                        leftIcon={<CheckCircle2 className="w-4 h-4" />}
                        className="font-bold shadow-md shadow-amber-500/20"
                      >
                        Accept & Route to Kitchen
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: READY FOR PICKUP — Waiter must collect from kitchen pass */}
      {activeTab === "ready_pickup" && (
        <div className="flex flex-col gap-4">
          {readyForPickupList.length === 0 ? (
            <div className="py-20 text-center bg-surface rounded-2xl border border-surface-border p-6">
              <ChefHat className="w-10 h-10 text-gray-500 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-gray-200 font-display mb-1">
                No Orders Ready
              </h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                No orders are currently ready for pickup from the kitchen pass. Orders will appear here once chefs mark them done.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {readyForPickupList.map((ord) => {
                const totalMinor = getOrderTotalMinor(ord.total);
                const rawTable = (ord as any).table_number || "Table 1";
                const cleanNum = rawTable.replace(/[^0-9]/g, "") || "1";
                const tableDisplay = `Table ${cleanNum}`;
                const tableBadge = `T${cleanNum}`;
                const customerName = (ord as any).customer_name || "Guest Diner";
                const guestCount = (ord as any).guest_count || 1;
                const isProcessing = processingOrderId === ord.id;

                return (
                  <Card
                    key={ord.id}
                    className="p-5 flex flex-col justify-between gap-4 border-emerald-500/50 bg-emerald-500/[0.03] shadow-glow transition-all hover:border-emerald-400 animate-pulse-subtle"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 font-bold font-display flex items-center justify-center text-sm border border-emerald-500/40 shadow-sm">
                          {tableBadge}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-gray-100 font-display flex items-center gap-1.5">
                            {tableDisplay} • Order #{ord.sequence_number}
                          </h3>
                          <div className="flex items-center gap-1.5 text-xs text-gray-300 font-medium mt-0.5">
                            <span className="text-emerald-400 font-bold">Deliver to {customerName}</span>
                            <span className="text-gray-600">•</span>
                            <span className="text-gray-400 font-mono text-[11px] flex items-center gap-1">
                              <Users className="w-3 h-3 text-emerald-400" />
                              {guestCount}p
                            </span>
                          </div>
                        </div>
                      </div>

                      <Badge variant="success" size="sm">
                        🔔 READY
                      </Badge>
                    </div>

                    {/* Items */}
                    <div className="flex flex-col gap-2 p-3 rounded-xl bg-surface-subtle border border-emerald-500/20 text-xs">
                      {ord.items?.map((item: any) => (
                        <div key={item.id} className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2">
                            <span className="font-mono font-bold text-emerald-400">
                              {item.quantity}x
                            </span>
                            <span className="text-gray-200 font-medium">
                              {item.item_name_snapshot}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Action: Mark Served */}
                    <div className="flex items-center justify-between pt-3 border-t border-surface-border/60">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 uppercase font-semibold">
                          Total
                        </span>
                        <span className="text-base font-extrabold font-mono text-primary">
                          {formatMoney(totalMinor)}
                        </span>
                      </div>

                      <Button
                        variant="primary"
                        size="sm"
                        isLoading={isProcessing}
                        onClick={() => handleMarkServed(ord.id, tableDisplay)}
                        leftIcon={<Utensils className="w-4 h-4" />}
                        className="font-bold shadow-md shadow-emerald-500/20"
                      >
                        Mark Served to Table
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: IN-KITCHEN STATUS (ACCEPTED + PREPARING) */}
      {activeTab === "kitchen_status" && (
        <div className="flex flex-col gap-4">
          {inKitchenList.length === 0 ? (
            <div className="py-20 text-center text-gray-500 text-xs font-mono bg-surface rounded-2xl border border-surface-border p-6">
              No active tickets currently in kitchen preparation.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inKitchenList.map((ord) => {
                const totalMinor = getOrderTotalMinor(ord.total);
                const rawTable = (ord as any).table_number || "Table 1";
                const cleanNum = rawTable.replace(/[^0-9]/g, "") || "1";
                const tableDisplay = `Table ${cleanNum}`;
                const tableBadge = `T${cleanNum}`;
                const customerName = (ord as any).customer_name || "Guest Diner";
                const guestCount = (ord as any).guest_count || 1;
                return (
                  <Card
                    key={ord.id}
                    className="p-5 flex flex-col justify-between gap-3 border-surface-border bg-surface"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-surface-subtle text-primary font-bold font-display flex items-center justify-center text-sm border border-surface-border">
                          {tableBadge}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-gray-100 font-display">
                            {tableDisplay} • Order #{ord.sequence_number}
                          </h3>
                          <div className="flex items-center gap-1.5 text-xs text-gray-300 font-medium mt-0.5">
                            <span className="text-primary font-semibold">{customerName}</span>
                            <span className="text-gray-600">•</span>
                            <span className="text-gray-400 font-mono text-[11px] flex items-center gap-1">
                              <Users className="w-3 h-3 text-primary" />
                              {guestCount}p
                            </span>
                            <span className="text-gray-600">•</span>
                            <span className="text-[11px] text-gray-400 font-mono">
                              Accepted {getTimeElapsed(ord.accepted_at)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Badge
                        variant={
                          ord.status === "PREPARING"
                            ? "amber"
                            : "blue"
                        }
                      >
                        {humanizeStatus(ord.status)}
                      </Badge>
                    </div>

                    <div className="p-3 rounded-xl bg-surface-subtle text-xs flex flex-col gap-1.5">
                      {ord.items?.map((item: any) => (
                        <div key={item.id} className="flex justify-between text-gray-300">
                          <span>
                            <strong className="text-primary font-mono">{item.quantity}x</strong>{" "}
                            {item.item_name_snapshot}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-surface-border/50 text-gray-400">
                      <span className="text-[11px] flex items-center gap-1 text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Dispatched to Chefs
                      </span>
                      <span className="font-mono font-bold text-gray-200">
                        {formatMoney(totalMinor)}
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
