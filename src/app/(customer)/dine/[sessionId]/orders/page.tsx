"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useGetSessionQuery, useCustomerPayMutation } from "@/store/api/customerApi";
import { formatMoney } from "@/lib/money";
import { OrderState, SessionState, PaymentMethod } from "@/types/enums";
import { generateUUID } from "@/lib/idempotency";
import { addToast } from "@/store/slices/uiSlice";
import { useAppDispatch } from "@/store";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  Clock,
  CheckCircle2,
  ChefHat,
  BellRing,
  Utensils,
  KeyRound,
  ArrowRight,
  ShieldCheck,
  Receipt,
  Banknote,
  Bell,
} from "lucide-react";

export default function CustomerOrdersPage() {
  const params = useParams();
  const dispatch = useAppDispatch();
  const sessionId = params.sessionId as string;

  const { data: sessionData, isLoading, refetch, error: sessionError } = useGetSessionQuery(
    sessionId,
    { pollingInterval: 4000 }
  );

  const [customerPay, { isLoading: isRequestingBill }] = useCustomerPayMutation();
  const [showBillModal, setShowBillModal] = useState(false);

  const isSessionGone =
    (sessionError as any)?.status === 410 ||
    JSON.stringify(sessionError || {}).includes("session has closed");

  const session = sessionData?.session;
  const orders = sessionData?.orders || [];
  const sessionStatus = isSessionGone
    ? SessionState.COMPLETED
    : session?.status;

  const handleRequestBill = async (method: PaymentMethod) => {
    try {
      await customerPay({
        sessionId,
        data: { method },
        idempotencyKey: generateUUID(),
      }).unwrap();

      dispatch(
        addToast({
          type: "success",
          title: "Waiter Alerted! 🔔",
          message: "Your server has been notified to bring your bill and collect payment.",
          durationMs: 4000,
        })
      );
      setShowBillModal(false);
      refetch();
    } catch (err) {
      console.error("Failed to request bill:", err);
      dispatch(
        addToast({
          type: "error",
          title: "Request Failed",
          message: "Could not ping waiter. Please try again or wave to your server.",
        })
      );
    }
  };

  const isFirstOrderUnverified =
    sessionStatus === SessionState.OPEN &&
    orders.some((o) => o.status === OrderState.PLACED_UNVERIFIED);

  const isAwaitingPayment = sessionStatus === SessionState.AWAITING_PAYMENT;

  // Helper for Order stage badge and progress indicator
  const getStageInfo = (status: OrderState) => {
    switch (status) {
      case OrderState.PLACED_UNVERIFIED:
        return {
          label: "Awaiting Staff Verification",
          step: 1,
          color: "text-amber-400",
          badge: "amber" as const,
          icon: KeyRound,
          description: "Waiting for your server to verify table code",
        };
      case OrderState.PLACED_VERIFIED:
      case OrderState.ACCEPTED:
        return {
          label: "Order Sent to Kitchen",
          step: 2,
          color: "text-sky-400",
          badge: "blue" as const,
          icon: CheckCircle2,
          description: "Order verified and sent directly to the kitchen queue.",
        };
      case OrderState.PREPARING:
        return {
          label: "Chef Preparing",
          step: 3,
          color: "text-amber-400",
          badge: "gold" as const,
          icon: ChefHat,
          description: "Dishes are actively being cooked by the chef",
        };
      case OrderState.READY:
        return {
          label: "Ready for Pickup",
          step: 4,
          color: "text-emerald-400",
          badge: "success" as const,
          icon: BellRing,
          description: "Dishes are plated and coming to your table",
        };
      case OrderState.SERVED:
        return {
          label: "Served to Table",
          step: 5,
          color: "text-emerald-400",
          badge: "success" as const,
          icon: Utensils,
          description: "Enjoy your meal! Additional orders welcome.",
        };
      default:
        return {
          label: status,
          step: 1,
          color: "text-gray-400",
          badge: "default" as const,
          icon: Clock,
          description: "",
        };
    }
  };

  const storedOtp =
    typeof window !== "undefined"
      ? sessionStorage.getItem(`table_os_otp_${sessionId}`)
      : null;
  const displayOtp =
    storedOtp ||
    (session as any)?.first_order_otp ||
    (orders[0] as any)?.verification_otp;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <Skeleton className="w-full h-32 rounded-2xl" />
        <Skeleton className="w-full h-48 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 px-4 pt-4">
      {/* Top Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-100 font-display">
            Order Status
          </h1>
          <p className="text-[11px] text-gray-400">
            Live updates directly from the kitchen
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="text-xs text-primary hover:underline font-mono"
        >
          Refresh
        </button>
      </div>

      {/* Session Has Closed Banner */}
      {sessionStatus === SessionState.COMPLETED && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border-2 border-emerald-500/60 shadow-glow flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold uppercase tracking-wider mb-0.5 border border-emerald-500/30">
                SESSION HAS CLOSED 🚪✨
              </span>
              <h4 className="text-xs font-bold text-emerald-300">
                Exit Approved with Gate Pass
              </h4>
              <p className="text-[11px] text-gray-300">
                Your dining session has concluded and exit pass was verified.
              </p>
            </div>
          </div>
          <Link href={`/dine/${sessionId}/exit`}>
            <Button size="sm" variant="primary" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shrink-0">
              Exit Pass 🎟️
            </Button>
          </Link>
        </div>
      )}

      {/* Prominent First-Order OTP Banner */}
      {isFirstOrderUnverified ? (
        <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-500/20 via-surface to-surface border-2 border-amber-500/60 shadow-glow flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Badge variant="gold" dot>
              Table Verification Required
            </Badge>
            <span className="text-[11px] font-mono text-amber-300">
              Session #{sessionId.substring(0, 8)}
            </span>
          </div>

          <div className="flex flex-col items-center justify-center text-center py-2">
            <span className="text-xs text-gray-300 font-medium uppercase tracking-wider">
              Your First-Order Verification Code
            </span>
            {displayOtp ? (
              <div className="my-2 px-6 py-2.5 rounded-2xl bg-black/60 border border-amber-500/40 text-3xl sm:text-4xl font-black font-mono tracking-widest text-primary shadow-inner">
                {displayOtp}
              </div>
            ) : (
              <div className="my-2 px-4 py-2 text-sm text-amber-300 bg-amber-500/10 rounded-xl border border-amber-500/30">
                Awaiting server to confirm table order
              </div>
            )}
            <p className="text-xs text-gray-300 max-w-xs mt-1">
              Please show this 4-digit code to your server to verify your table and begin preparation.
            </p>
          </div>
        </div>
      ) : isAwaitingPayment ? (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-surface to-surface border-2 border-amber-500/50 shadow-glow flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                Server Alerted to Collect Payment
              </h4>
              <p className="text-[11px] text-gray-300">
                Your waiter is on the way with the bill & card machine. You can also pay online or keep ordering.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link href={`/dine/${sessionId}/menu`}>
              <Button size="sm" variant="secondary" className="text-xs">
                + Order More
              </Button>
            </Link>
            <Link href={`/dine/${sessionId}/bill`}>
              <Button size="sm" variant="gold" className="font-bold text-xs">
                Pay Online →
              </Button>
            </Link>
          </div>
        </div>
      ) : sessionStatus === SessionState.OPEN_VERIFIED ? (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-emerald-300">
                Table Verified Active
              </h4>
              <p className="text-[11px] text-gray-300 leading-tight">
                Your table is unlocked. Orders are sent immediately to the chef.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="subtle"
            onClick={() => setShowBillModal(true)}
            leftIcon={<Bell className="w-3.5 h-3.5 text-amber-400" />}
            className="shrink-0 text-amber-300 border-amber-500/30 hover:border-amber-500/60"
          >
            Request Bill
          </Button>
        </div>
      ) : null}

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="py-16 flex flex-col items-center justify-center text-center p-6 bg-surface rounded-2xl border border-surface-border">
          <Utensils className="w-10 h-10 text-gray-500 mb-2" />
          <h4 className="text-sm font-bold text-gray-200">
            No orders placed yet
          </h4>
          <p className="text-xs text-gray-400 mt-1 mb-4">
            Browse our menu and submit your first round of dishes.
          </p>
          <Link href={`/dine/${sessionId}/menu`}>
            <Button size="sm">Browse Menu</Button>
          </Link>
        </div>
      ) : (
        orders.map((order, idx) => {
          const stage = getStageInfo(order.status);
          const StageIcon = stage.icon;

          return (
            <Card key={order.id} className="p-5 flex flex-col gap-4">
              {/* Order Header */}
              <div className="flex items-center justify-between border-b border-surface-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-surface-subtle flex items-center justify-center text-xs font-bold text-gray-300 font-mono">
                    #{idx + 1}
                  </span>
                  <span className="text-xs text-gray-400 font-mono">
                    {new Date(order.placed_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <Badge variant={stage.badge} size="sm">
                  {stage.label}
                </Badge>
              </div>

              {/* Progress Steps (1 to 5) */}
              <div className="flex items-center gap-1.5 py-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <div
                    key={s}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      s <= stage.step
                        ? "bg-primary shadow-glow"
                        : "bg-surface-border/80"
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-start gap-2 text-xs text-gray-400">
                <StageIcon className={`w-4 h-4 shrink-0 ${stage.color}`} />
                <span>{stage.description}</span>
              </div>

              {/* Order Line Items */}
              <div className="flex flex-col gap-2 pt-2 border-t border-surface-border/50">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-primary">
                        {item.quantity}x
                      </span>
                      <span className="text-gray-200 font-medium">
                        {item.item_name_snapshot}
                      </span>
                      {(item.special_instructions || item.specialInstructions) && (
                        <span className="text-[10px] text-gray-400 italic">
                          ({item.special_instructions || item.specialInstructions})
                        </span>
                      )}
                    </div>
                    <span className="font-mono font-bold text-gray-300">
                      {formatMoney(item.line_total.amount_minor_units)}
                    </span>
                  </div>
                ))}

                {/* Subtotal & Tax */}
                <div className="pt-3 border-t border-surface-border/40 flex flex-col gap-1 text-xs">
                  <div className="flex items-center justify-between text-gray-400">
                    <span>Order Subtotal:</span>
                    <span className="font-mono">
                      {formatMoney(order.subtotal.amount_minor_units)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-gray-400">
                    <span>GST (CGST 2.5% + SGST 2.5%):</span>
                    <span className="font-mono">
                      {formatMoney(order.tax_total.amount_minor_units)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between font-bold text-gray-100 pt-1 border-t border-surface-border/30">
                    <span>Order Total:</span>
                    <span className="font-mono text-primary">
                      {formatMoney(order.total.amount_minor_units)}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })
      )}

      {/* Action to add more or settle bill */}
      {orders.length > 0 && (
        <div className="flex flex-col gap-2 pt-2 pb-6">
          <div className="flex items-center gap-3">
            <Link href={`/dine/${sessionId}/menu`} className="flex-1">
              <Button variant="secondary" size="md" className="w-full">
                Order More Dishes
              </Button>
            </Link>
            <Link href={`/dine/${sessionId}/bill`} className="flex-1">
              <Button
                variant="gold"
                size="md"
                className="w-full font-bold"
                rightIcon={<Receipt className="w-4 h-4" />}
              >
                View Full Bill
              </Button>
            </Link>
          </div>

          {!isAwaitingPayment && sessionStatus === SessionState.OPEN_VERIFIED && (
            <Button
              variant="subtle"
              size="md"
              onClick={() => setShowBillModal(true)}
              leftIcon={<Bell className="w-4 h-4 text-amber-400" />}
              className="w-full border-amber-500/40 text-amber-300 hover:bg-amber-500/10 font-bold"
            >
              Request Waiter to Bring Bill & Settle
            </Button>
          )}
        </div>
      )}

      {/* Request Bill Modal */}
      {showBillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <Card className="w-full max-w-md p-6 flex flex-col gap-4 border-amber-500/50 bg-[#161922] shadow-2xl">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Bell className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-gray-100 font-display">
                  Request Bill / Call Waiter
                </h3>
              </div>
              <button
                onClick={() => setShowBillModal(false)}
                className="text-gray-400 hover:text-gray-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              How would you like to settle your bill with the waiter?
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleRequestBill(PaymentMethod.CASH)}
                disabled={isRequestingBill}
                className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 flex flex-col items-center gap-2 transition-all font-bold text-xs"
              >
                <Banknote className="w-6 h-6" />
                <span>Pay with Cash</span>
              </button>
              <button
                onClick={() => handleRequestBill(PaymentMethod.RESTAURANT_POS)}
                disabled={isRequestingBill}
                className="p-4 rounded-xl border border-sky-500/40 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 flex flex-col items-center gap-2 transition-all font-bold text-xs"
              >
                <Receipt className="w-6 h-6" />
                <span>Card / POS Swipe</span>
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-surface-border">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBillModal(false)}
              >
                Cancel
              </Button>
              <Link href={`/dine/${sessionId}/bill`}>
                <Button variant="gold" size="sm">
                  Pay Online (UPI / Card) →
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
