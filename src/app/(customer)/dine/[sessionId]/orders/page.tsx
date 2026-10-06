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
  } = useGetSessionQuery(sessionId, { skipPollingIfUnfocused: true });

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
  const displayOtp: string | null =
    storedOtp ||
    ((session as any)?.first_order_otp as string) ||
    ((orders[0] as any)?.verification_otp as string) ||
    null;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <Skeleton className="w-full h-32 rounded-3xl" />
        <Skeleton className="w-full h-48 rounded-3xl" />
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 6 }}>
      {/* Top Header */}
      <div style={{ padding: "8px 0 4px", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h2>Your orders</h2>
          <p className="mu" style={{ margin: "4px 0 0" }}>
            {orders.length
              ? `${orders.length} ${orders.length === 1 ? "round" : "rounds"} placed · Follow your food live`
              : "Follow your food live"}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="b i"
          style={{ width: 40, height: 40, minHeight: 40 }}
          aria-label="Refresh orders"
          title="Refresh orders"
        >
          <Sparkles style={{ width: 16, height: 16 }} />
        </button>
      </div>

      {/* Session Has Closed Banner */}
      {sessionStatus === SessionState.COMPLETED && (
        <div className="nl live" style={{ borderColor: "var(--ok)", marginTop: 12 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "1.35rem", height: "1.35rem", color: "var(--ok)" }}>
            <path d="M5 12l5 5 9-10" />
          </svg>
          <span>
            <b>Session Closed · Exit Approved</b>
            <small>Show exit pass to door staff</small>
          </span>
          <Link href={`/dine/${sessionId}/exit`} className="tag" style={{ background: "var(--ok)", color: "#12100C", border: 0 }}>
            Exit Pass
          </Link>
        </div>
      )}

      {/* Prominent First-Order OTP Banner */}
      {isFirstOrderUnverified && (
        <div className="cd" style={{ marginTop: 12, textAlign: "center", border: "1.5px solid var(--ac)" }}>
          <span className="tag" style={{ background: "color-mix(in srgb, var(--ac) 18%, transparent)", color: "var(--ac)", borderColor: "var(--ac)" }}>
            Table Verification Required
          </span>
          <p className="mu sm" style={{ margin: "10px 0 6px" }}>
            Show this 4-digit code to your server to release your order to the kitchen:
          </p>
          {displayOtp ? (
            <div className="cn" style={{ margin: "12px 0" }}>
              {displayOtp.split("").map((c, i) => (
                <span key={i}>{c}</span>
              ))}
            </div>
          ) : (
            <div className="say" style={{ justifyContent: "center" }}>
              Awaiting server verification
            </div>
          )}
        </div>
      )}

      {/* Awaiting Payment Banner */}
      {isAwaitingPayment && (
        <div className="say" style={{ marginTop: 12, background: "color-mix(in srgb, var(--ac) 15%, var(--pp))", color: "var(--ac)", borderColor: "var(--ac)" }}>
          <Bell style={{ width: 18, height: 18, flexShrink: 0 }} />
          <span>Waiter alerted to bring bill to Table {(session as any)?.table_number || ""}</span>
        </div>
      )}

      {/* View Toggle (Batches vs United Bill) */}
      {orders.length > 0 && (
        <div className="tabs" style={{ margin: "14px 0 10px" }}>
          <button
            type="button"
            className="tab"
            aria-pressed={activeView === "tracker"}
            onClick={() => setActiveView("tracker")}
          >
            Order rounds ({orders.length})
          </button>
          <button
            type="button"
            className="tab"
            aria-pressed={activeView === "unified_bill"}
            onClick={() => setActiveView("unified_bill")}
          >
            Unified bill ({formatMoney(unifiedTotalMinor)})
          </button>
        </div>
      )}

      {/* SECTION 1: UNIFIED BILL VIEW */}
      {activeView === "unified_bill" ? (
        <div className="g" style={{ marginTop: 10 }}>
          <div className="rp">
            <div className="px" style={{ marginBottom: 12 }}>
              <h3>Master Bill</h3>
              <span className="tag">All Rounds</span>
            </div>
            {consolidatedItems.map((item) => (
              <div key={item.id} className="it">
                <span>
                  {item.quantity}× {item.name}
                  {item.specialInstructions.length > 0 && (
                    <small className="mu" style={{ display: "block" }}>
                      Note: {item.specialInstructions.join(", ")}
                    </small>
                  )}
                </span>
                <b>{formatMoney(item.totalMinor)}</b>
              </div>
            ))}
            <div className="it ln">
              <span className="mu">Subtotal</span>
              <span>{formatMoney(unifiedSubtotalMinor)}</span>
            </div>
            <div className="it">
              <span className="mu">CGST 2.5%</span>
              <span>{formatMoney(unifiedTaxMinor / 2)}</span>
            </div>
            <div className="it">
              <span className="mu">SGST 2.5%</span>
              <span>{formatMoney(unifiedTaxMinor / 2)}</span>
            </div>
            <div className="tot">
              <span style={{ fontWeight: 700 }}>Grand total</span>
              <b>{formatMoney(unifiedTotalMinor)}</b>
            </div>
          </div>

          <div className="g">
            <Link href={`/dine/${sessionId}/bill`} className="b p">
              Proceed to payment · {formatMoney(unifiedTotalMinor)}
            </Link>
            <Link href={`/dine/${sessionId}/menu`} className="b o">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "1.1rem", height: "1.1rem" }}>
                <path d="M12 5v14M5 12h14" />
              </svg>
              Order more dishes
            </Link>
          </div>
        </div>
      ) : (
        /* SECTION 2: ROUND-BY-ROUND VIEW */
        <div className="g" style={{ marginTop: 10 }}>
          {orders.length === 0 ? (
            <div className="em">
              <b>Nothing ordered yet</b>
              Your orders will appear here.
              <div style={{ marginTop: 16 }}>
                <Link href={`/dine/${sessionId}/menu`} className="b p">
                  Browse the menu
                </Link>
              </div>
            </div>
          ) : (
            orders.map((order, idx) => {
              const orderStatusIdx =
                order.status === OrderState.PLACED_UNVERIFIED
                  ? 0
                  : order.status === OrderState.PLACED_VERIFIED || order.status === OrderState.ACCEPTED
                  ? 0
                  : order.status === OrderState.PREPARING
                  ? 1
                  : order.status === OrderState.READY
                  ? 2
                  : 3;

              const statusLabels = [
                "Kitchen has your order",
                "Chefs are cooking it now · about 15 min",
                "Ready. Your waiter is bringing it to your table",
                "Served. Enjoy your meal!",
              ];

              return (
                <div key={order.id} className="cd">
                  <div className="px">
                    <h3>Round {idx + 1}</h3>
                    <span className="tag">
                      {order.status === OrderState.SERVED
                        ? "Served"
                        : order.status === OrderState.CANCELLED
                        ? "Cancelled"
                        : "In progress"}
                    </span>
                  </div>

                  {/* 4-step progress stepper matching sample */}
                  <div className="stp">
                    {[
                      { label: "Received", icon: "rec" },
                      { label: "Cooking", icon: "fire" },
                      { label: "Ready", icon: "pot" },
                      { label: "Served", icon: "ok" },
                    ].map((step, sIdx) => (
                      <div
                        key={sIdx}
                        className={`s1 ${sIdx <= orderStatusIdx ? "on" : ""}`}
                      >
                        <i>
                          {step.icon === "rec" ? (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: "1.1rem", height: "1.1rem" }}>
                              <path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2zM9 8h6M9 12h6" />
                            </svg>
                          ) : step.icon === "fire" ? (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: "1.1rem", height: "1.1rem" }}>
                              <path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z" />
                            </svg>
                          ) : step.icon === "pot" ? (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: "1.1rem", height: "1.1rem" }}>
                              <path d="M6 14a4 4 0 1 1 2-7 4 4 0 0 1 8 0 4 4 0 1 1 2 7v6H6z" />
                            </svg>
                          ) : (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "1.1rem", height: "1.1rem" }}>
                              <path d="M5 12l5 5 9-10" />
                            </svg>
                          )}
                        </i>
                        {step.label}
                      </div>
                    ))}
                  </div>

                  {/* Status Banner */}
                  <div className="say">
                    {statusLabels[orderStatusIdx]}
                  </div>

                  {/* Item lines */}
                  <div style={{ marginTop: 10 }}>
                    {order.items.map((item) => (
                      <div key={item.id}>
                        <div className="it">
                          <span>
                            {item.quantity}× {item.item_name_snapshot}
                          </span>
                          <span>
                            {formatMoney(item.line_total.amount_minor_units)}
                          </span>
                        </div>
                        {item.special_instructions && (
                          <div className="mu sm" style={{ marginTop: -4, marginBottom: 4 }}>
                            Note: {item.special_instructions}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="it ln">
                    <span className="mu">Round Total</span>
                    <b>{formatMoney(order.total?.amount_minor_units || 0)}</b>
                  </div>
                </div>
              );
            })
          )}

          {/* Bottom Actions */}
          {orders.length > 0 && (
            <div className="g" style={{ marginTop: 6 }}>
              <Link href={`/dine/${sessionId}/menu`} className="b o">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "1.1rem", height: "1.1rem" }}>
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Order more dishes
              </Link>

              <Link href={`/dine/${sessionId}/bill`} className="b p">
                View Bill & Settle
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

