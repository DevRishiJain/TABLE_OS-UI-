"use client";

import React, { useState } from "react";
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
  User,
  Users,
  Phone,
} from "lucide-react";

export default function KitchenQueuePage() {
  const dispatch = useAppDispatch();
  const restaurantId = useAppSelector((state) => state.auth.restaurantId);
  const { data: queueOrders, isLoading, refetch } = useGetKitchenQueueQuery(
    restaurantId || undefined,
    { pollingInterval: 4000 }
  );

  const [updateKitchenStatus, { isLoading: isUpdating }] =
    useUpdateKitchenStatusMutation();
  const [activeUpdatingId, setActiveUpdatingId] = useState<string | null>(null);

  const allOrders = queueOrders || [];

  const handleAdvanceStatus = async (
    orderId: string,
    nextStatus: OrderState
  ) => {
    setActiveUpdatingId(orderId);
    try {
      await updateKitchenStatus({
        orderId,
        data: { status: nextStatus },
      }).unwrap();

      dispatch(
        addToast({
          type: "success",
          title: "Cooking Stage Updated",
          message: `Order transitioned to ${nextStatus}`,
          durationMs: 2000,
        })
      );
      refetch();
    } catch (err) {
      console.error("Status update error:", err);
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
      title: "Accepted / New",
      badge: "amber" as const,
      icon: Clock,
      statusFilter: [OrderState.ACCEPTED],
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
      nextLabel: "Mark Ready on Pass 🛎️",
      nextVariant: "primary" as const,
    },
    {
      id: "READY",
      title: "Ready for Pickup",
      badge: "success" as const,
      icon: BellRing,
      statusFilter: [OrderState.READY],
      nextStatus: OrderState.SERVED,
      nextLabel: "Mark Served to Table ✅",
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

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant="gold" size="md">
            Active Orders: {allOrders.length}
          </Badge>
          <span className="text-xs text-gray-400">
            Tap the large bottom button on each ticket to advance its cooking stage
          </span>
        </div>
        <Button
          variant="subtle"
          size="sm"
          onClick={() => {
            refetch();
          }}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Refresh KDS
        </Button>
      </div>

      {/* 4-Column Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 items-start">
        {columns.map((col) => {
          const colOrders = allOrders.filter((o) =>
            col.statusFilter.includes(o.status)
          );
          const ColIcon = col.icon;

          return (
            <div
              key={col.id}
              className="flex flex-col gap-3.5 rounded-2xl bg-[#11141A] border border-surface-border p-4 min-h-[600px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between border-b border-surface-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <ColIcon className="w-5 h-5 text-gray-300" />
                  <h3 className="text-sm font-bold font-display text-gray-100">
                    {col.title}
                  </h3>
                </div>
                <span className="w-6 h-6 rounded-full bg-surface-subtle border border-surface-border flex items-center justify-center text-xs font-mono font-bold text-gray-300">
                  {colOrders.length}
                </span>
              </div>

              {/* Tickets in this column */}
              <div className="flex flex-col gap-3.5">
                {colOrders.length === 0 ? (
                  <div className="py-12 text-center text-xs text-gray-600 font-medium">
                    No tickets in this stage
                  </div>
                ) : (
                  colOrders.map((order) => {
                    const isProcessing = activeUpdatingId === order.id;
                    const customerName = (order as any).customer_name || "Guest Diner";
                    const guestCount = (order as any).guest_count || 1;
                    const dest = formatDestination(
                      (order as any).table_number,
                      (order as any).vehicle_number,
                      customerName,
                      guestCount
                    );

                    return (
                      <Card
                        key={order.id}
                        className="p-4 rounded-xl bg-[#181C23] border border-surface-border flex flex-col justify-between gap-4 shadow-lg hover:border-gray-500 transition-all"
                      >
                        {/* Ticket Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className={`w-10 h-10 rounded-xl font-black flex items-center justify-center font-display text-base border shadow-sm shrink-0 ${
                              dest.isVehicle
                                ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                                : dest.isRoom
                                ? "bg-purple-500/20 text-purple-300 border-purple-500/50"
                                : "bg-primary/20 text-primary border-primary/40"
                            }`}>
                              {dest.shortBadge}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-black font-display ${
                                  dest.isVehicle
                                    ? "text-amber-300"
                                    : dest.isRoom
                                    ? "text-purple-300"
                                    : "text-gray-100"
                                }`}>
                                  {dest.display}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-surface-subtle border border-surface-border text-gray-300 font-mono">
                                  Order #{order.sequence_number || 1}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-gray-300 font-medium mt-0.5">
                                <span className="text-amber-400 font-bold truncate max-w-[120px]">
                                  {customerName}
                                </span>
                                <span className="text-gray-600">•</span>
                                <span className="text-gray-400 font-mono text-[11px] flex items-center gap-1">
                                  <Users className="w-3 h-3 text-primary" />
                                  {guestCount}p
                                </span>
                              </div>
                            </div>
                          </div>

                          <span className="text-[11px] font-mono text-gray-400 flex items-center gap-1 shrink-0 pt-0.5">
                            <Clock className="w-3 h-3 text-gray-500" />
                            {new Date(order.placed_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        {/* Dish items to cook */}
                        <div className="flex flex-col gap-2 p-2.5 rounded-lg bg-[#0E1015] border border-surface-border/50 text-xs">
                          {order.items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-start justify-between py-0.5"
                            >
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded bg-primary text-background font-black flex items-center justify-center text-[11px] font-mono">
                                  {item.quantity}
                                </span>
                                <span className="font-bold text-gray-100 text-sm">
                                  {item.item_name_snapshot}
                                </span>
                              </div>
                              {item.special_instructions && (
                                <span className="text-[11px] text-amber-300 italic px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
                                  {item.special_instructions}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Large 60px+ Touch Target Button */}
                        {col.nextStatus && (
                          <button
                            disabled={isProcessing}
                            onClick={() =>
                              handleAdvanceStatus(order.id, col.nextStatus!)
                            }
                            className={`w-full min-h-[58px] rounded-xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-[0.98] select-none shadow-md ${
                              col.nextVariant === "gold"
                                ? "bg-amber-500 hover:bg-amber-600 text-black shadow-amber-500/20"
                                : "bg-primary hover:bg-primary-hover text-background shadow-primary/20"
                            }`}
                          >
                            {isProcessing ? (
                              <span>Updating State...</span>
                            ) : (
                              <span>{col.id === "READY" ? dest.actionLabel : col.nextLabel}</span>
                            )}
                          </button>
                        )}
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
