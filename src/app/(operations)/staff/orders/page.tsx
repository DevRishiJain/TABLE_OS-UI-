"use client";

import React, { useState } from "react";
import {
  useGetPendingOrdersQuery,
  useAcceptOrderMutation,
  PendingOrderEntry,
} from "@/store/api/staffApi";
import { useGetKitchenQueueQuery } from "@/store/api/kitchenApi";
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

export default function WaiterOrderScreenPage() {
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState<"pending" | "kitchen_status">("pending");
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);

  // Poll pending orders every 3 seconds for instant real-time synchronization across all waiters
  const {
    data: pendingOrders,
    isLoading: isPendingLoading,
    refetch: refetchPending,
  } = useGetPendingOrdersQuery(undefined, { pollingInterval: 3000 });

  // Kitchen queue to track status of accepted tickets
  const { data: kitchenQueue, refetch: refetchKitchen } =
    useGetKitchenQueueQuery(undefined, { pollingInterval: 5000 });

  const [acceptOrder] = useAcceptOrderMutation();

  const pendingList = pendingOrders || [];
  const inKitchenList = kitchenQueue || [];

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
      refetchPending();
      refetchKitchen();
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

  return (
    <div className="flex flex-col gap-6">
      {/* Waiter Identity & Shift Bar */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-surface to-surface-elevated border border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-bold border border-primary/30">
            <Utensils className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-extrabold text-gray-100 font-display">
                {auth.userName || "Floor Waiter"}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-primary/20 text-primary border border-primary/40">
                {auth.employeeId || "EMP-WTR-001"}
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Waiter Order Terminal • Gated Kitchen Acceptance
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              refetchPending();
              refetchKitchen();
            }}
            className="px-3 py-1.5 rounded-xl bg-surface border border-surface-border text-xs text-gray-300 hover:text-primary transition-colors flex items-center gap-1.5 font-mono"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* Screen Mode Tabs */}
      <div className="flex items-center justify-between border-b border-surface-border pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "pending"
                ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
                : "bg-surface text-gray-400 hover:text-gray-200 border border-surface-border"
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            Pending Waiter Acceptance
            {pendingList.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-black/30 text-black text-[10px] font-mono font-extrabold">
                {pendingList.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("kitchen_status")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "kitchen_status"
                ? "bg-primary text-black shadow-md shadow-primary/20"
                : "bg-surface text-gray-400 hover:text-gray-200 border border-surface-border"
            }`}
          >
            <ChefHat className="w-3.5 h-3.5" />
            In-Prep Kitchen Queue
            {inKitchenList.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-black/30 text-black text-[10px] font-mono font-extrabold">
                {inKitchenList.length}
              </span>
            )}
          </button>
        </div>

        <span className="text-[11px] text-gray-400 font-mono hidden sm:inline">
          Auto-syncing every 3s
        </span>
      </div>

      {/* TAB 1: PENDING ORDERS NEEDING WAITER ACCEPTANCE */}
      {activeTab === "pending" && (
        <div className="flex flex-col gap-4">
          {isPendingLoading ? (
            <div className="py-20 text-center text-gray-500 text-xs font-mono">
              Syncing incoming order stream...
            </div>
          ) : pendingList.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center p-6 bg-surface rounded-2xl border border-surface-border">
              <div className="w-14 h-14 rounded-2xl bg-surface-subtle flex items-center justify-center text-gray-500 mb-3">
                <Utensils className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-gray-200">
                No Pending Customer Orders
              </h3>
              <p className="text-xs text-gray-400 mt-1 max-w-sm">
                All customer orders have been accepted into the kitchen. New orders placed by guests will pop up here in real time.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingList.map((entry: PendingOrderEntry) => {
                const ord = entry.order;
                const tableNumber = entry.table_number || "Table";
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
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 font-bold font-display flex items-center justify-center text-sm border border-amber-500/40">
                          {tableNumber.replace(/[^0-9]/g, "") ? `T${tableNumber.replace(/[^0-9]/g, "")}` : tableNumber}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-gray-100 font-display flex items-center gap-1.5">
                            {tableNumber} • Order #{ord.sequence_number}
                          </h3>
                          <span className="text-[11px] text-amber-400 font-mono flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {getTimeElapsed(ord.placed_at)}
                          </span>
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
                        onClick={() => handleAcceptOrder(ord.id, tableNumber)}
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

      {/* TAB 2: IN-PREP KITCHEN STATUS */}
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
                return (
                  <Card
                    key={ord.id}
                    className="p-5 flex flex-col justify-between gap-3 border-surface-border bg-surface"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-gray-100 font-display">
                          Order #{ord.sequence_number}
                        </h3>
                        <span className="text-[11px] text-gray-400 font-mono">
                          Accepted {getTimeElapsed(ord.accepted_at)}
                        </span>
                      </div>

                      <Badge
                        variant={
                          ord.status === "READY"
                            ? "success"
                            : ord.status === "PREPARING"
                            ? "amber"
                            : "blue"
                        }
                      >
                        {humanizeStatus(ord.status)}
                      </Badge>
                    </div>

                    <div className="p-3 rounded-xl bg-surface-subtle text-xs flex flex-col gap-1.5">
                      {ord.items?.map((item) => (
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
