"use client";

import React, { useState } from "react";
import { useGetStaffTablesQuery, useAcceptOrderMutation } from "@/store/api/staffApi";
import { useGetSessionQuery } from "@/store/api/customerApi";
import { formatMoney } from "@/lib/money";
import { humanizeStatus } from "@/lib/statusLabels";
import { addToast } from "@/store/slices/uiSlice";
import { useAppDispatch } from "@/store";
import { OrderState } from "@/types/enums";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  Utensils,
  RefreshCw,
} from "lucide-react";

interface TableOrdersBlockProps {
  sessionId: string;
  tableNumber: string;
  onRefreshParent: () => void;
}

function TableOrdersBlock({
  sessionId,
  tableNumber,
  onRefreshParent,
}: TableOrdersBlockProps) {
  const dispatch = useAppDispatch();
  const { data: sessionData, refetch } = useGetSessionQuery(sessionId, {
    pollingInterval: 4000,
  });
  const [acceptOrder] = useAcceptOrderMutation();
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);

  const orders = sessionData?.orders || [];
  if (orders.length === 0) return null;

  const handleAccept = async (orderId: string) => {
    setProcessingOrderId(orderId);
    try {
      await acceptOrder({ orderId }).unwrap();
      dispatch(
        addToast({
          type: "success",
          title: "Order Accepted!",
          message: `Table ${tableNumber} order routed to Kitchen Display System.`,
        })
      );
      refetch();
      onRefreshParent();
    } catch (err) {
      console.error("Failed to accept order:", err);
      dispatch(
        addToast({
          type: "error",
          title: "Order Acceptance Failed",
          message: "Could not accept order. Please verify table status.",
        })
      );
    } finally {
      setProcessingOrderId(null);
    }
  };

  return (
    <>
      {orders.map((order, idx) => {
        const isUnverified = order.status === OrderState.PLACED_UNVERIFIED;
        const isAccepted = order.status === OrderState.ACCEPTED;

        return (
          <Card
            key={order.id}
            className={`p-5 flex flex-col justify-between gap-4 transition-all ${
              isUnverified
                ? "border-amber-500/60 bg-amber-500/5 shadow-glow"
                : "border-surface-border"
            }`}
          >
            {/* Order Meta Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary font-bold font-display flex items-center justify-center text-sm border border-primary/40">
                  T{tableNumber}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-100 font-display">
                    Table {tableNumber} • Order #{idx + 1}
                  </h3>
                  <span className="text-[11px] text-gray-400 font-mono">
                    {new Date(order.placed_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                </div>
              </div>

              <Badge
                variant={
                  isUnverified
                    ? "amber"
                    : isAccepted
                    ? "blue"
                    : "success"
                }
              >
                {humanizeStatus(order.status)}
              </Badge>
            </div>

            {/* Dish Line Items */}
            <div className="flex flex-col gap-2 p-3 rounded-xl bg-surface-subtle border border-surface-border/50 text-xs">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-primary">
                      {item.quantity}x
                    </span>
                    <span className="text-gray-200 font-medium">
                      {item.item_name_snapshot}
                    </span>
                    {item.specialInstructions && (
                      <span className="text-[10px] text-amber-300 italic">
                        ({item.specialInstructions})
                      </span>
                    )}
                  </div>
                  <span className="font-mono font-bold text-gray-300">
                    {formatMoney(item.line_total.amount_minor_units)}
                  </span>
                </div>
              ))}
            </div>

            {/* Total & Action Bar */}
            <div className="flex items-center justify-between pt-3 border-t border-surface-border/60">
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-400 uppercase font-semibold">
                  Total Ticket
                </span>
                <span className="text-base font-extrabold font-mono text-primary">
                  {formatMoney(order.total.amount_minor_units)}
                </span>
              </div>

              {isUnverified ? (
                <div className="flex items-center gap-2">
                  <Button
                    variant="gold"
                    size="sm"
                    isLoading={processingOrderId === order.id}
                    onClick={() => handleAccept(order.id)}
                    leftIcon={<CheckCircle2 className="w-4 h-4" />}
                  >
                    Accept to KDS
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-sky-400 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Sent to Kitchen</span>
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </>
  );
}

export default function StaffOrdersQueuePage() {
  const { data: tables, isLoading: tablesLoading, refetch: refetchTables } =
    useGetStaffTablesQuery(undefined, { pollingInterval: 4000 });

  const activeTables = (tables || []).filter((t) => t.active_session_id);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-gray-100 flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-primary" />
            Incoming Order Queue
          </h1>
          <p className="text-xs text-gray-400">
            Accept incoming orders to route tickets into kitchen preparation
          </p>
        </div>

        <button
          onClick={() => refetchTables()}
          className="text-xs text-primary hover:underline font-mono flex items-center gap-1"
        >
          <RefreshCw className="w-3 h-3" /> Refresh Queue
        </button>
      </div>

      {/* Orders Stream */}
      {activeTables.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center p-6 bg-surface rounded-2xl border border-surface-border">
          <Utensils className="w-12 h-12 text-gray-500 mb-3" />
          <h3 className="text-base font-bold text-gray-200">
            No active incoming orders
          </h3>
          <p className="text-xs text-gray-400 mt-1 max-w-sm">
            All submitted dining orders have been processed or table queues are clear.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeTables.map((table) => (
            <TableOrdersBlock
              key={table.active_session_id!}
              sessionId={table.active_session_id!}
              tableNumber={table.table_number}
              onRefreshParent={() => refetchTables()}
            />
          ))}
        </div>
      )}
    </div>
  );
}
