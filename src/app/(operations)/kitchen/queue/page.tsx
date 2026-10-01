"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  useGetKitchenQueueQuery,
  useUpdateKitchenStatusMutation,
} from "@/store/api/kitchenApi";
import { OrderState } from "@/types/enums";
import { formatDestination } from "@/lib/location";
import { addToast } from "@/store/slices/uiSlice";
import { useAppDispatch, useAppSelector } from "@/store";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  ChefHat,
  Clock,
  CheckCircle2,
  Flame,
  BellRing,
  Utensils,
  ArrowRight,
  RefreshCw,
  Users,
  AlertCircle,
  Filter,
} from "lucide-react";

export default function KitchenQueuePage() {
  const dispatch = useAppDispatch();
  const restaurantId = useAppSelector((state) => state.auth.restaurantId);
  const restaurantName = useAppSelector((state) => state.auth.restaurantName) || "Restaurant";

  const { data: queueOrders, isLoading, refetch } = useGetKitchenQueueQuery(
    restaurantId || undefined,
    { pollingInterval: 3500 }
  );

  const [updateKitchenStatus] = useUpdateKitchenStatusMutation();
  const [activeUpdatingId, setActiveUpdatingId] = useState<string | null>(null);

  // Local state for optimistic updates to ensure smooth ticket movement
  const [localOrders, setLocalOrders] = useState<any[]>([]);

  // Mobile active tab filter: "ALL" | "ACCEPTED" | "PREPARING" | "READY" | "SERVED"
  const [mobileStageFilter, setMobileStageFilter] = useState<string>("ALL");

  useEffect(() => {
    if (queueOrders) {
      setLocalOrders(queueOrders);
    }
  }, [queueOrders]);

  const handleAdvanceStatus = async (
    orderId: string,
    nextStatus: OrderState
  ) => {
    setActiveUpdatingId(orderId);

    // 1. Optimistic UI update: instantly update status locally for smooth visual flow
    setLocalOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
    );

    try {
      await updateKitchenStatus({
        orderId,
        data: { status: nextStatus },
      }).unwrap();

      dispatch(
        addToast({
          type: "success",
          title: "Cooking Stage Advanced",
          message: `Ticket transitioned to ${nextStatus}`,
          durationMs: 2000,
        })
      );
      refetch();
    } catch (err) {
      console.error("Status update error:", err);
      // Revert optimistic update
      if (queueOrders) setLocalOrders(queueOrders);
      dispatch(
        addToast({
          type: "error",
          title: "Update Failed",
          message: "Could not advance kitchen order status.",
        })
      );
    } finally {
      setActiveUpdatingId(null);
    }
  };

  const columns = [
    {
      id: "ACCEPTED",
      title: "New & Accepted",
      badge: "amber" as const,
      icon: Clock,
      statusFilter: [OrderState.ACCEPTED, OrderState.PLACED_VERIFIED],
      nextStatus: OrderState.PREPARING,
      nextLabel: "Start Cooking 🔥",
      nextVariant: "gold" as const,
    },
    {
      id: "PREPARING",
      title: "Actively Cooking",
      badge: "gold" as const,
      icon: Flame,
      statusFilter: [OrderState.PREPARING],
      nextStatus: OrderState.READY,
      nextLabel: "Mark Ready at Pass 🛎️",
      nextVariant: "primary" as const,
    },
    {
      id: "READY",
      title: "Ready for Pickup",
      badge: "success" as const,
      icon: BellRing,
      statusFilter: [OrderState.READY],
      nextStatus: null,
      nextLabel: "",
      nextVariant: "primary" as const,
    },
    {
      id: "SERVED",
      title: "Served / History",
      badge: "default" as const,
      icon: Utensils,
      statusFilter: [OrderState.SERVED],
      nextStatus: null,
      nextLabel: "",
      nextVariant: "default" as const,
    },
  ];

  // Helper to calculate elapsed time in minutes & SLA severity
  const getElapsedInfo = (placedAtStr?: string) => {
    if (!placedAtStr) return { text: "just now", isUrgent: false, isWarning: false };
    const diffSecs = Math.max(0, Math.floor((Date.now() - new Date(placedAtStr).getTime()) / 1000));
    const mins = Math.floor(diffSecs / 60);

    if (mins < 1) return { text: `${diffSecs}s ago`, isUrgent: false, isWarning: false };
    if (mins < 10) return { text: `${mins}m ago`, isUrgent: false, isWarning: false };
    if (mins < 20) return { text: `${mins}m ago`, isUrgent: false, isWarning: true };
    return { text: `${mins}m ago (DELAY)`, isUrgent: true, isWarning: true };
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Badge variant="gold" size="md">
            Active Tickets: {localOrders.filter((o) => o.status !== OrderState.SERVED).length}
          </Badge>
          <span className="text-xs text-gray-400 hidden sm:inline">
            Tap stage button on ticket to advance from cooking to pickup pass
          </span>
        </div>

        <Button
          variant="subtle"
          size="sm"
          onClick={() => refetch()}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          className="self-start sm:self-auto font-mono text-xs"
        >
          Refresh KDS
        </Button>
      </div>

      {/* MOBILE STAGE SELECTOR TABS (< md screens) */}
      <div className="md:hidden flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        <button
          type="button"
          onClick={() => setMobileStageFilter("ALL")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            mobileStageFilter === "ALL"
              ? "bg-primary text-black font-extrabold shadow-sm"
              : "bg-surface-subtle text-gray-300 border border-surface-border"
          }`}
        >
          All Tickets ({localOrders.length})
        </button>

        {columns.map((col) => {
          const count = localOrders.filter((o) => col.statusFilter.includes(o.status)).length;
          const isActive = mobileStageFilter === col.id;

          return (
            <button
              key={col.id}
              type="button"
              onClick={() => setMobileStageFilter(col.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                isActive
                  ? "bg-amber-400 text-black font-extrabold shadow-sm"
                  : "bg-surface-subtle text-gray-300 border border-surface-border"
              }`}
            >
              <span>{col.title.split("/")[0]}</span>
              <span className="px-1.5 py-0.2 rounded-md bg-black/30 text-[10px] font-mono">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* KANBAN BOARD (Responsive Grid: 1 col on mobile, 2 col on tablet, 4 col on desktop) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        {columns.map((col) => {
          const colOrders = localOrders.filter((o) =>
            col.statusFilter.includes(o.status)
          );

          // On mobile, if a specific stage tab is selected, hide other columns
          const isHiddenOnMobile =
            mobileStageFilter !== "ALL" && mobileStageFilter !== col.id;

          const ColIcon = col.icon;

          return (
            <div
              key={col.id}
              className={`flex flex-col gap-3 rounded-2xl bg-[#11141A] border border-surface-border p-3.5 transition-all duration-300 min-h-[400px] ${
                isHiddenOnMobile ? "hidden md:flex" : "flex"
              }`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between border-b border-surface-border/60 pb-2.5">
                <div className="flex items-center gap-2">
                  <ColIcon className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold font-display text-gray-100">
                    {col.title}
                  </h3>
                </div>
                <span className="w-6 h-6 rounded-full bg-surface-subtle border border-surface-border flex items-center justify-center text-xs font-mono font-bold text-gray-300">
                  {colOrders.length}
                </span>
              </div>

              {/* Tickets Column */}
              <div className="flex flex-col gap-3">
                {colOrders.length === 0 ? (
                  <div className="py-12 text-center text-xs text-gray-500 font-mono">
                    No tickets in this stage
                  </div>
                ) : (
                  colOrders.map((order) => {
                    const isProcessing = activeUpdatingId === order.id;
                    const customerName = order.customer_name || "Guest Diner";
                    const guestCount = order.guest_count || 1;
                    const dest = formatDestination(
                      order.table_number,
                      order.vehicle_number,
                      customerName,
                      guestCount
                    );

                    const elapsed = getElapsedInfo(order.placed_at);

                    return (
                      <Card
                        key={order.id}
                        className={`p-3.5 rounded-xl bg-[#161A22] border transition-all duration-300 flex flex-col justify-between gap-3 shadow-lg hover:border-gray-500 ${
                          elapsed.isUrgent
                            ? "border-red-500/60 shadow-red-500/10"
                            : elapsed.isWarning
                            ? "border-amber-500/50"
                            : "border-surface-border"
                        }`}
                      >
                        {/* Ticket Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`w-9 h-9 rounded-xl font-black flex items-center justify-center font-display text-sm border shadow-sm shrink-0 ${
                                dest.isVehicle
                                  ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                                  : dest.isRoom
                                  ? "bg-purple-500/20 text-purple-300 border-purple-500/50"
                                  : "bg-primary/20 text-primary border-primary/40"
                              }`}
                            >
                              {dest.shortBadge}
                            </span>
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-sm font-black font-display text-gray-100">
                                  {dest.display}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface-subtle border border-surface-border text-gray-300 font-mono">
                                  #{order.sequence_number || 1}
                                </span>
                                {(order.sequence_number || 1) > 1 && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                                    Reorder 🔁
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-gray-300 font-medium mt-0.5">
                                <span className="text-amber-400 font-bold truncate max-w-[110px]">
                                  {customerName}
                                </span>
                                <span className="text-gray-600">•</span>
                                <span className="text-gray-400 font-mono text-[10px] flex items-center gap-1">
                                  <Users className="w-3 h-3 text-primary" />
                                  {guestCount}p
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Elapsed Timer with Warning Indicator */}
                          <div
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 border shrink-0 ${
                              elapsed.isUrgent
                                ? "bg-red-500/20 text-red-300 border-red-500/50 animate-pulse"
                                : elapsed.isWarning
                                ? "bg-amber-500/15 text-amber-300 border-amber-500/40"
                                : "bg-surface-subtle text-gray-400 border-surface-border"
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            <span>{elapsed.text}</span>
                          </div>
                        </div>

                        {/* Dish items to cook */}
                        <div className="flex flex-col gap-1.5 p-2 rounded-lg bg-[#0C0E13] border border-surface-border/50 text-xs">
                          {order.items?.map((item: any) => (
                            <div
                              key={item.id}
                              className="flex items-start justify-between py-0.5 border-b border-surface-border/20 last:border-0"
                            >
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded bg-primary text-black font-black flex items-center justify-center text-[10px] font-mono">
                                  {item.quantity}
                                </span>
                                <span className="font-bold text-gray-100 text-xs">
                                  {item.item_name_snapshot}
                                </span>
                              </div>
                              {item.special_instructions && (
                                <span className="text-[10px] text-amber-300 italic px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 max-w-[130px] truncate">
                                  {item.special_instructions}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Advance Cooking Stage Action */}
                        {col.nextStatus ? (
                          <button
                            disabled={isProcessing}
                            onClick={() =>
                              handleAdvanceStatus(order.id, col.nextStatus!)
                            }
                            className={`w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-[0.98] select-none shadow-md ${
                              col.nextVariant === "gold"
                                ? "bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20"
                                : "bg-primary hover:bg-primary/90 text-black shadow-primary/20"
                            }`}
                          >
                            {isProcessing ? (
                              <span>Moving Stage...</span>
                            ) : (
                              <span>{col.nextLabel}</span>
                            )}
                          </button>
                        ) : order.status === OrderState.READY ? (
                          <div className="w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 select-none shadow-sm animate-pulse">
                            <BellRing className="w-4 h-4 text-emerald-400" />
                            <span>At Kitchen Pickup Pass 🛎️</span>
                          </div>
                        ) : null}
                      </Card>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
