"use client";

import React, { useState, useMemo } from "react";
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
  Sparkles,
  Flame,
  Layers,
  ChevronDown,
  ChevronUp,
  CreditCard,
} from "lucide-react";

interface ConsolidatedItem {
  id: string;
  name: string;
  quantity: number;
  unitPriceMinor: number;
  totalMinor: number;
  specialInstructions: string[];
  statuses: {
    status: OrderState;
    qty: number;
  }[];
}

export default function CustomerOrdersPage() {
  const params = useParams();
  const dispatch = useAppDispatch();
  const sessionId = params.sessionId as string;

  const {
    data: sessionData,
    isLoading,
    refetch,
    error: sessionError,
  } = useGetSessionQuery(sessionId, { pollingInterval: 3500 });

  const [customerPay, { isLoading: isRequestingBill }] = useCustomerPayMutation();
  const [showBillModal, setShowBillModal] = useState(false);
  const [activeView, setActiveView] = useState<"tracker" | "unified_bill">("tracker");
  const [expandedRounds, setExpandedRounds] = useState<Record<string, boolean>>({});

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
          message: "Your server has been notified to bring your consolidated bill & card terminal.",
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

  // Determine Overall Highest / Dominant Progress Stage for Swiggy/Zomato style tracker
  const overallTrackerStage = useMemo(() => {
    if (!orders.length) return { step: 0, label: "No Orders", desc: "Browse menu to order" };

    const activeOrders = orders.filter((o) => o.status !== OrderState.CANCELLED);
    if (!activeOrders.length) return { step: 0, label: "Orders Cancelled", desc: "No active dishes" };

    if (activeOrders.some((o) => o.status === OrderState.PLACED_UNVERIFIED)) {
      return {
        step: 1,
        title: "Awaiting Verification",
        label: "Verification Needed",
        desc: "Show 4-digit code to waiter to send order to chef",
        color: "amber",
        eta: "Server verifying table",
      };
    }

    if (activeOrders.some((o) => o.status === OrderState.PLACED_VERIFIED || o.status === OrderState.ACCEPTED)) {
      return {
        step: 2,
        title: "Order Sent to Kitchen",
        label: "Confirmed & In Queue",
        desc: "Kitchen has received your ticket and is preparing ingredients",
        color: "sky",
        eta: "Est. prep: 15-20 mins",
      };
    }

    if (activeOrders.some((o) => o.status === OrderState.PREPARING)) {
      return {
        step: 3,
        title: "Chef is Sizzling & Cooking",
        label: "Cooking in Progress 🔥",
        desc: "Your dishes are hot on the stove and in the tandoor",
        color: "amber",
        eta: "Plating shortly",
      };
    }

    if (activeOrders.some((o) => o.status === OrderState.READY)) {
      return {
        step: 4,
        title: "Dishes Plated & at Pass",
        label: "Ready at Pass 🛎️",
        desc: "Food is fresh, plated, and your server is bringing it to your table",
        color: "emerald",
        eta: "Arriving at table now",
      };
    }

    // If all are served
    if (activeOrders.every((o) => o.status === OrderState.SERVED)) {
      return {
        step: 5,
        title: "Served to Table",
        label: "All Dishes Served 🍽️",
        desc: "Enjoy your dining experience! You can re-order or request your bill anytime.",
        color: "emerald",
        eta: "Bon Appétit!",
      };
    }

    return {
      step: 3,
      title: "In Progress",
      label: "Cooking",
      desc: "Kitchen is preparing your order",
      color: "amber",
      eta: "Prep in progress",
    };
  }, [orders]);

  // Consolidate all orders into One United Big Bill
  const { consolidatedItems, unifiedSubtotalMinor, unifiedTaxMinor, unifiedTotalMinor } = useMemo(() => {
    const itemMap = new Map<string, ConsolidatedItem>();

    let subtotal = 0;
    let taxTotal = 0;
    let total = 0;

    orders.forEach((order) => {
      if (order.status === OrderState.CANCELLED) return;

      subtotal += order.subtotal?.amount_minor_units || 0;
      taxTotal += order.tax_total?.amount_minor_units || 0;
      total += order.total?.amount_minor_units || 0;

      order.items?.forEach((item) => {
        const key = item.item_name_snapshot.toLowerCase().trim();
        const lineTotal = item.line_total?.amount_minor_units || 0;
        const unitPrice = (item as any).unit_price?.amount_minor_units || (item.quantity > 0 ? Math.round(lineTotal / item.quantity) : 0);

        const existing = itemMap.get(key);
        if (existing) {
          existing.quantity += item.quantity;
          existing.totalMinor += lineTotal;
          if (item.special_instructions && !existing.specialInstructions.includes(item.special_instructions)) {
            existing.specialInstructions.push(item.special_instructions);
          }
          // Track status
          const statEntry = existing.statuses.find((s) => s.status === order.status);
          if (statEntry) {
            statEntry.qty += item.quantity;
          } else {
            existing.statuses.push({ status: order.status, qty: item.quantity });
          }
        } else {
          itemMap.set(key, {
            id: item.id,
            name: item.item_name_snapshot,
            quantity: item.quantity,
            unitPriceMinor: unitPrice,
            totalMinor: lineTotal,
            specialInstructions: item.special_instructions ? [item.special_instructions] : [],
            statuses: [{ status: order.status, qty: item.quantity }],
          });
        }
      });
    });

    return {
      consolidatedItems: Array.from(itemMap.values()),
      unifiedSubtotalMinor: subtotal,
      unifiedTaxMinor: taxTotal,
      unifiedTotalMinor: total,
    };
  }, [orders]);

  const toggleRound = (orderId: string) => {
    setExpandedRounds((prev) => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const getStageBadge = (status: OrderState) => {
    switch (status) {
      case OrderState.PLACED_UNVERIFIED:
        return { label: "Verification Required", color: "text-amber-400", badge: "amber" as const, icon: KeyRound };
      case OrderState.PLACED_VERIFIED:
      case OrderState.ACCEPTED:
        return { label: "Sent to Kitchen", color: "text-sky-400", badge: "blue" as const, icon: CheckCircle2 };
      case OrderState.PREPARING:
        return { label: "Cooking in Kitchen", color: "text-amber-400", badge: "gold" as const, icon: ChefHat };
      case OrderState.READY:
        return { label: "Ready at Pass", color: "text-emerald-400", badge: "success" as const, icon: BellRing };
      case OrderState.SERVED:
        return { label: "Served to Table", color: "text-emerald-400", badge: "success" as const, icon: Utensils };
      default:
        return { label: status, color: "text-gray-400", badge: "default" as const, icon: Clock };
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
        <Skeleton className="w-full h-32 rounded-3xl" />
        <Skeleton className="w-full h-48 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 px-4 pt-4 pb-12 max-w-2xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-100 font-display flex items-center gap-2">
            Live Order & Bill
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping inline-block" />
          </h1>
          <p className="text-xs text-gray-400">
            Table #{(session as any)?.table_number || ""} • {orders.length} {orders.length === 1 ? "round" : "rounds"} placed
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="text-xs text-primary hover:underline font-mono px-3 py-1.5 rounded-xl bg-surface-subtle border border-surface-border flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          Sync
        </button>
      </div>

      {/* Session Has Closed Banner */}
      {sessionStatus === SessionState.COMPLETED && (
        <div className="p-4 rounded-3xl bg-emerald-500/15 border-2 border-emerald-500/60 shadow-glow flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold uppercase tracking-wider mb-0.5 border border-emerald-500/30">
                SESSION CLOSED 🚪✨
              </span>
              <h4 className="text-xs font-bold text-emerald-300">
                Exit Approved with Gate Pass
              </h4>
              <p className="text-[11px] text-gray-300">
                Session has concluded and exit pass was verified.
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
        <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-500/25 via-[#1a1c24] to-[#12141a] border-2 border-amber-500/70 shadow-glow flex flex-col gap-3">
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
              Show This Code to Server
            </span>
            {displayOtp ? (
              <div className="my-3 px-8 py-3 rounded-2xl bg-black/70 border-2 border-amber-500/50 text-4xl sm:text-5xl font-black font-mono tracking-widest text-primary shadow-inner">
                {displayOtp}
              </div>
            ) : (
              <div className="my-2 px-4 py-2 text-sm text-amber-300 bg-amber-500/10 rounded-xl border border-amber-500/30">
                Awaiting server to confirm table order
              </div>
            )}
            <p className="text-xs text-gray-300 max-w-sm mt-1 leading-relaxed">
              Your server will punch this 4-digit code into their terminal to confirm you are seated at this table and release the ticket to the kitchen.
            </p>
          </div>
        </div>
      ) : isAwaitingPayment ? (
        <div className="p-4 rounded-3xl bg-gradient-to-r from-amber-500/20 via-surface to-surface border-2 border-amber-500/60 shadow-glow flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                Server Alerted to Bring Bill
              </h4>
              <p className="text-[11px] text-gray-300">
                Your waiter is on the way with your consolidated bill and card machine.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link href={`/dine/${sessionId}/menu`}>
              <Button size="sm" variant="secondary" className="text-xs">
                + Add More
              </Button>
            </Link>
            <Link href={`/dine/${sessionId}/bill`}>
              <Button size="sm" variant="gold" className="font-bold text-xs">
                Pay Online →
              </Button>
            </Link>
          </div>
        </div>
      ) : null}

      {/* SWIGGY / ZOMATO STYLE LIVE ORDER STAGE TRACKER (Prominent Top Card) */}
      {orders.length > 0 && (
        <Card className="p-5 sm:p-6 rounded-3xl border-primary/30 bg-gradient-to-br from-[#1b1e27] via-[#14161f] to-[#101218] shadow-2xl flex flex-col gap-5 relative overflow-hidden">
          {/* Background Ambient Glow */}
          <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

          {/* Tracker Header */}
          <div className="flex items-center justify-between border-b border-surface-border/50 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-primary/20 text-primary flex items-center justify-center border border-primary/30">
                <Flame className="w-5 h-5 text-primary animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-primary font-bold">
                  LIVE KITCHEN TRACKER
                </span>
                <h3 className="text-base font-black text-gray-100 font-display">
                  {overallTrackerStage.title}
                </h3>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-primary/20 text-primary border border-primary/30">
                {overallTrackerStage.eta}
              </span>
            </div>
          </div>

          {/* ZOMATO / SWIGGY 4-STAGE MILESTONE BAR */}
          <div className="relative pt-2 pb-1">
            {/* Background connecting rail */}
            <div className="absolute top-6 left-6 right-6 h-1 bg-surface-border rounded-full -translate-y-1/2 z-0" />
            {/* Active filled rail */}
            <div
              className="absolute top-6 left-6 h-1 bg-gradient-to-r from-primary via-amber-400 to-emerald-400 rounded-full -translate-y-1/2 z-0 transition-all duration-700 ease-out"
              style={{
                width: `${Math.min(
                  100,
                  Math.max(
                    0,
                    overallTrackerStage.step === 1
                      ? 5
                      : overallTrackerStage.step === 2
                      ? 33
                      : overallTrackerStage.step === 3
                      ? 66
                      : overallTrackerStage.step >= 4
                      ? 100
                      : 0
                  )
                )}%`,
              }}
            />

            {/* Stage Indicators */}
            <div className="relative z-10 grid grid-cols-4 gap-1 text-center">
              {/* Step 1: Confirmed */}
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                    overallTrackerStage.step >= 1
                      ? "bg-primary text-black font-black shadow-glow ring-2 ring-primary/40"
                      : "bg-[#1c1f2a] text-gray-500 border border-surface-border"
                  }`}
                >
                  <Receipt className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-gray-200">
                  Confirmed
                </span>
                <span className="text-[9px] text-gray-400 hidden sm:inline">
                  Order Received
                </span>
              </div>

              {/* Step 2: In Kitchen */}
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                    overallTrackerStage.step >= 2
                      ? "bg-sky-500 text-black font-black shadow-glow ring-2 ring-sky-400/40"
                      : "bg-[#1c1f2a] text-gray-500 border border-surface-border"
                  }`}
                >
                  <ChefHat className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-gray-200">
                  Kitchen
                </span>
                <span className="text-[9px] text-gray-400 hidden sm:inline">
                  Queue & Prep
                </span>
              </div>

              {/* Step 3: Cooking */}
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                    overallTrackerStage.step >= 3
                      ? "bg-amber-500 text-black font-black shadow-glow ring-2 ring-amber-400/40 animate-pulse"
                      : "bg-[#1c1f2a] text-gray-500 border border-surface-border"
                  }`}
                >
                  <Flame className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-gray-200">
                  Cooking
                </span>
                <span className="text-[9px] text-gray-400 hidden sm:inline">
                  On the Stove
                </span>
              </div>

              {/* Step 4: Ready & Served */}
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                    overallTrackerStage.step >= 4
                      ? "bg-emerald-500 text-black font-black shadow-glow ring-2 ring-emerald-400/40"
                      : "bg-[#1c1f2a] text-gray-500 border border-surface-border"
                  }`}
                >
                  <Utensils className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-gray-200">
                  {overallTrackerStage.step === 5 ? "Served" : "Ready"}
                </span>
                <span className="text-[9px] text-gray-400 hidden sm:inline">
                  {overallTrackerStage.step === 5 ? "At Table" : "At the Pass"}
                </span>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-300 text-center bg-black/30 p-2.5 rounded-2xl border border-surface-border/40">
            {overallTrackerStage.desc}
          </p>
        </Card>
      )}

      {/* VIEW TOGGLE: "ONE UNITED BIG BILL" VS "LIVE TRACKER & ROUNDS" */}
      {orders.length > 0 && (
        <div className="p-1 rounded-2xl bg-[#141720] border border-surface-border flex items-center gap-1">
          <button
            onClick={() => setActiveView("tracker")}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
              activeView === "tracker"
                ? "bg-primary text-black shadow-glow"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Order Rounds & Batches ({orders.length})</span>
          </button>
          <button
            onClick={() => setActiveView("unified_bill")}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
              activeView === "unified_bill"
                ? "bg-primary text-black shadow-glow"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>One United Big Bill ({formatMoney(unifiedTotalMinor)})</span>
          </button>
        </div>
      )}

      {/* SECTION 1: ONE UNITED BIG BILL VIEW */}
      {activeView === "unified_bill" ? (
        <Card className="p-6 rounded-3xl border-primary/40 bg-gradient-to-br from-[#191b24] via-[#14161f] to-[#0f1118] shadow-2xl flex flex-col gap-5 animate-fadeIn">
          {/* Bill Header */}
          <div className="flex items-center justify-between border-b border-surface-border/60 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 text-primary flex items-center justify-center border border-primary/30">
                <Receipt className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-primary font-bold">
                  CONSOLIDATED RUNNING BILL
                </span>
                <h3 className="text-lg font-black text-gray-100 font-display">
                  All Items Ordered Till Now
                </h3>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-400 font-mono block">Grand Total</span>
              <span className="text-xl font-black font-mono text-primary">
                {formatMoney(unifiedTotalMinor)}
              </span>
            </div>
          </div>

          <p className="text-xs text-gray-300">
            Every item you or your companions have ordered across all rounds is unified below into one combined master receipt.
          </p>

          {/* Consolidated Items Table */}
          <div className="flex flex-col divide-y divide-surface-border/40">
            {consolidatedItems.map((item) => (
              <div key={item.id} className="py-3 flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-lg bg-primary/20 text-primary font-black font-mono text-xs">
                      {item.quantity}x
                    </span>
                    <span className="text-sm font-bold text-gray-100">
                      {item.name}
                    </span>
                  </div>

                  {/* Status pills per item */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {item.statuses.map((st, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-surface-subtle text-gray-300 border border-surface-border"
                      >
                        {st.qty} {st.status === OrderState.SERVED ? "🍽️ Served" : st.status === OrderState.PREPARING ? "🔥 Cooking" : "📋 Queued"}
                      </span>
                    ))}
                    {item.specialInstructions.length > 0 && (
                      <span className="text-[10px] text-amber-300 italic">
                        Note: {item.specialInstructions.join(", ")}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-mono text-gray-400 block">
                    @{formatMoney(item.unitPriceMinor)}
                  </span>
                  <span className="text-sm font-black font-mono text-gray-100">
                    {formatMoney(item.totalMinor)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Total Breakdown Summary */}
          <div className="pt-4 border-t-2 border-surface-border/60 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Items Subtotal:</span>
              <span className="font-mono text-gray-200">
                {formatMoney(unifiedSubtotalMinor)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>GST (CGST 2.5% + SGST 2.5%):</span>
              <span className="font-mono text-gray-200">
                {formatMoney(unifiedTaxMinor)}
              </span>
            </div>
            <div className="flex items-center justify-between text-base font-black text-gray-100 pt-2 border-t border-surface-border/40">
              <span className="flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-primary" />
                United Grand Total:
              </span>
              <span className="font-mono text-2xl text-primary">
                {formatMoney(unifiedTotalMinor)}
              </span>
            </div>
          </div>

          {/* Payment & Reorder Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <Link href={`/dine/${sessionId}/menu`} className="w-full sm:flex-1">
              <Button variant="secondary" size="lg" className="w-full">
                + Order More Dishes
              </Button>
            </Link>

            {!isAwaitingPayment && (
              <Button
                variant="gold"
                size="lg"
                onClick={() => setShowBillModal(true)}
                className="w-full sm:flex-1 font-bold shadow-glow"
                leftIcon={<Bell className="w-5 h-5 text-black" />}
              >
                Request Waiter to Settle
              </Button>
            )}

            <Link href={`/dine/${sessionId}/bill`} className="w-full sm:flex-1">
              <Button
                variant="primary"
                size="lg"
                className="w-full font-bold bg-emerald-600 hover:bg-emerald-500"
                rightIcon={<CreditCard className="w-5 h-5" />}
              >
                Pay Online
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        /* SECTION 2: BATCH / ROUND-BY-ROUND TRACKER VIEW */
        <div className="flex flex-col gap-4 animate-fadeIn">
          {orders.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center p-6 bg-surface rounded-3xl border border-surface-border">
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
              const stage = getStageBadge(order.status);
              const StageIcon = stage.icon;
              const isExpanded = expandedRounds[order.id] ?? true;

              return (
                <Card
                  key={order.id}
                  className="p-5 rounded-3xl flex flex-col gap-3.5 border-surface-border/70 hover:border-surface-border transition-all"
                >
                  {/* Round Header */}
                  <div className="flex items-center justify-between border-b border-surface-border/50 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-xl bg-surface-subtle border border-surface-border flex items-center justify-center text-xs font-black text-primary font-mono">
                        #{idx + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-gray-200">
                            {idx === 0 ? "Round 1 (Initial Order)" : `Round ${idx + 1} (Re-order)`}
                          </h4>
                        </div>
                        <span className="text-[11px] text-gray-400 font-mono">
                          Placed at {new Date(order.placed_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant={stage.badge} size="sm">
                        <StageIcon className="w-3 h-3 mr-1 inline" />
                        {stage.label}
                      </Badge>
                      <button
                        onClick={() => toggleRound(order.id)}
                        className="text-gray-400 hover:text-gray-200 p-1"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Micro Progress Bar for this Batch */}
                  <div className="flex items-center gap-1.5 py-0.5">
                    {[1, 2, 3, 4].map((step) => {
                      const stepActive =
                        (step === 1 && order.status !== OrderState.CANCELLED) ||
                        (step === 2 && [OrderState.PLACED_VERIFIED, OrderState.ACCEPTED, OrderState.PREPARING, OrderState.READY, OrderState.SERVED].includes(order.status)) ||
                        (step === 3 && [OrderState.PREPARING, OrderState.READY, OrderState.SERVED].includes(order.status)) ||
                        (step === 4 && [OrderState.READY, OrderState.SERVED].includes(order.status));

                      return (
                        <div
                          key={step}
                          className={`h-1.5 flex-1 rounded-full transition-colors ${
                            stepActive ? "bg-primary shadow-glow" : "bg-surface-border/60"
                          }`}
                        />
                      );
                    })}
                  </div>

                  {/* Item lines */}
                  {isExpanded && (
                    <div className="flex flex-col gap-2 pt-1">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start justify-between text-xs py-1"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-primary text-xs">
                              {item.quantity}x
                            </span>
                            <span className="text-gray-200 font-medium">
                              {item.item_name_snapshot}
                            </span>
                            {item.special_instructions && (
                              <span className="text-[10px] text-gray-400 italic">
                                ({item.special_instructions})
                              </span>
                            )}
                          </div>
                          <span className="font-mono font-bold text-gray-300">
                            {formatMoney(item.line_total.amount_minor_units)}
                          </span>
                        </div>
                      ))}

                      {/* Batch subtotal */}
                      <div className="pt-2 border-t border-surface-border/40 flex items-center justify-between text-xs text-gray-400">
                        <span>Round Total (with Tax):</span>
                        <span className="font-mono font-bold text-gray-200">
                          {formatMoney(order.total?.amount_minor_units || 0)}
                        </span>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })
          )}

          {/* Quick Running Total Card below batches */}
          {orders.length > 0 && (
            <div className="p-4 rounded-3xl bg-surface border border-surface-border flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
                  Combined Running Total
                </span>
                <span className="text-lg font-black font-mono text-primary">
                  {formatMoney(unifiedTotalMinor)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/dine/${sessionId}/menu`}>
                  <Button size="sm" variant="secondary">
                    + Re-order
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="gold"
                  onClick={() => setActiveView("unified_bill")}
                  rightIcon={<Receipt className="w-3.5 h-3.5" />}
                >
                  View United Bill
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Request Bill Modal */}
      {showBillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <Card className="w-full max-w-md p-6 flex flex-col gap-4 border-amber-500/50 bg-[#161922] shadow-2xl rounded-3xl">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-100 font-display">
                    Request Bill & Settle
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Grand Total: {formatMoney(unifiedTotalMinor)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBillModal(false)}
                className="text-gray-400 hover:text-gray-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              How would you like your server to bring your consolidated final bill?
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleRequestBill(PaymentMethod.CASH)}
                disabled={isRequestingBill}
                className="p-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 flex flex-col items-center gap-2 transition-all font-bold text-xs"
              >
                <Banknote className="w-6 h-6" />
                <span>Pay with Cash</span>
              </button>
              <button
                onClick={() => handleRequestBill(PaymentMethod.RESTAURANT_POS)}
                disabled={isRequestingBill}
                className="p-4 rounded-2xl border border-sky-500/40 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 flex flex-col items-center gap-2 transition-all font-bold text-xs"
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
