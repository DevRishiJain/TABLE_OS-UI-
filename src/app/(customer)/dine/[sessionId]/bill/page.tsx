"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  useGetSessionQuery,
  useCustomerPayMutation,
  useCancelOrderMutation,
} from "@/store/api/customerApi";
import { formatMoney } from "@/lib/money";
import { PaymentMethod, SessionState } from "@/types/enums";
import { generateUUID } from "@/lib/idempotency";
import { translateBackendError } from "@/lib/errors";
import { addToast } from "@/store/slices/uiSlice";
import { useAppDispatch } from "@/store";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { QRCodeSVG } from "qrcode.react";
import {
  Receipt,
  CreditCard,
  Banknote,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  Ticket,
  Utensils,
  PartyPopper,
  AlertTriangle,
} from "lucide-react";

export default function CustomerBillPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const dispatch = useAppDispatch();

  const { data: sessionData, isLoading, refetch, error: sessionError } = useGetSessionQuery(
    sessionId,
    { skipPollingIfUnfocused: true }
  );

  const session = sessionData?.session;
  const orders = sessionData?.orders || [];
  const payments = sessionData?.payments || [];
  const exitPassData = sessionData?.exit_pass;

  const isSessionGone =
    (sessionError as any)?.status === 410 ||
    JSON.stringify(sessionError || {}).includes("session has closed");

  const isCompleted =
    isSessionGone ||
    session?.status === SessionState.COMPLETED ||
    exitPassData?.status === "VERIFIED";

  const isPaid =
    isCompleted ||
    session?.status === SessionState.PAID ||
    payments.some((p) => p.status === "CONFIRMED");

  const isAwaitingPayment =
    !isCompleted &&
    (session?.status === SessionState.AWAITING_PAYMENT ||
    payments.some((p) => p.status === "PENDING_CONFIRMATION"));

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(
    PaymentMethod.CASH
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [customerPay, { isLoading: isPaying }] = useCustomerPayMutation();
  const [cancelOrder, { isLoading: isCancelling }] = useCancelOrderMutation();

  // Compute itemized list from all orders
  const allItems = orders.flatMap((o) => o.items);

  // Check unserved items
  const unservedOrders = orders.filter(
    (o) => o.status !== "SERVED" && o.status !== "CANCELLED"
  );
  const hasUnservedOrders = unservedOrders.length > 0;

  // Unserved orders where kitchen has not started cooking (can be cancelled)
  const cancellableOrders = unservedOrders.filter(
    (o) =>
      o.status === "PLACED_UNVERIFIED" ||
      o.status === "PLACED_VERIFIED" ||
      o.status === "ACCEPTED"
  );
  // Orders currently cooking in kitchen (cannot be cancelled, must wait)
  const cookingOrders = unservedOrders.filter(
    (o) => o.status === "PREPARING" || o.status === "READY"
  );

  const handleCancelUncookedOrders = async () => {
    try {
      for (const ord of cancellableOrders) {
        await cancelOrder({
          sessionId,
          orderId: ord.id,
          reason: "Customer cancelled before cooking to settle final bill",
        }).unwrap();
      }
      dispatch(
        addToast({
          type: "info",
          title: "Uncooked Items Cancelled",
          message: "Uncooked items were removed and bill recalculated.",
          durationMs: 3000,
        })
      );
      refetch();
    } catch (err) {
      dispatch(
        addToast({
          type: "error",
          title: "Cancellation Failed",
          message: translateBackendError(err),
        })
      );
    }
  };

  // Authoritative totals from backend
  const subtotalMinor = orders.reduce(
    (sum, o) => sum + o.subtotal.amount_minor_units,
    0
  );
  const taxTotalMinor = orders.reduce(
    (sum, o) => sum + o.tax_total.amount_minor_units,
    0
  );
  const cgstMinor = orders.reduce(
    (sum, o) =>
      sum +
      o.items.reduce(
        (iSum, item) => iSum + (item.cgst_amount?.amount_minor_units || 0),
        0
      ),
    0
  );
  const sgstMinor = orders.reduce(
    (sum, o) =>
      sum +
      o.items.reduce(
        (iSum, item) => iSum + (item.sgst_amount?.amount_minor_units || 0),
        0
      ),
    0
  );

  // Authoritative final balance due
  const finalTotalMinor =
    session?.final_total?.amount_minor_units &&
    session?.final_total?.amount_minor_units > 0
      ? session.final_total.amount_minor_units
      : orders.reduce((sum, o) => sum + o.total.amount_minor_units, 0);

  const tableNumber = (session as any)?.table_number || "1";
  const backendOtp =
    exitPassData?.otp ||
    (sessionData as any)?.exit_otp ||
    (sessionData as any)?.exit_pass?.otp ||
    (session as any)?.exit_otp ||
    (session as any)?.exit_pass?.otp ||
    "";

  const [exitCode, setExitCode] = useState<string>("");

  useEffect(() => {
    if (backendOtp) {
      setExitCode(backendOtp);
      if (typeof window !== "undefined") {
        localStorage.setItem(`table_os_exit_code_${sessionId}`, backendOtp);
      }
    } else if (typeof window !== "undefined") {
      const cached = localStorage.getItem(`table_os_exit_code_${sessionId}`);
      if (cached) setExitCode(cached);
    }
  }, [backendOtp, sessionId]);

  const handleInitiatePayment = async () => {
    setErrorMessage(null);
    if (hasUnservedOrders) {
      setErrorMessage(
        "Cannot request bill: some items are not yet served to your table."
      );
      return;
    }
    try {
      const idempotencyKey = generateUUID();
      await customerPay({
        sessionId,
        data: { method: selectedMethod },
        idempotencyKey,
      }).unwrap();

      dispatch(
        addToast({
          type: "success",
          title: "Waiter Alerted! 🛎️",
          message:
            selectedMethod === PaymentMethod.CASH
              ? "Your server has been notified to collect cash at your table."
              : "Your server is bringing the UPI QR code / card machine to your table.",
          durationMs: 4000,
        })
      );
      refetch();
    } catch (err: unknown) {
      console.error("Payment failed:", err);
      setErrorMessage(translateBackendError(err));
    }
  };

  if (isLoading) {
    return (
      <div style={{ paddingTop: 6 }}>
        <div style={{ padding: "8px 0 10px" }}>
          <h2>Bill</h2>
          <p className="mu" style={{ margin: "4px 0 0" }}>Loading bill...</p>
        </div>
        <div className="cd" style={{ height: 200, opacity: 0.5 }} />
      </div>
    );
  }

  // Header element
  const headerElem = (
    <div style={{ padding: "8px 0 10px" }}>
      <h2>Bill</h2>
      <p className="mu" style={{ margin: "4px 0 0" }}>
        Table {tableNumber} · live, updates as you order
      </p>
    </div>
  );

  // If no items have been ordered yet
  if (allItems.length === 0) {
    return (
      <div style={{ paddingTop: 6 }}>
        {headerElem}
        <div className="em">
          <b>No bill yet</b>
          It appears after your first order.
          <div style={{ marginTop: 16 }}>
            <Link href={`/dine/${sessionId}/menu`} className="b p">
              Browse the menu
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 1. Paid or Completed State
  if (isPaid || isCompleted) {
    return (
      <div style={{ paddingTop: 6 }}>
        {headerElem}
        <div className="cd ct g" style={{ padding: "28px 20px" }}>
          <div className="ck">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "2.2rem", height: "2.2rem" }}>
              <path d="M5 12l5 5 9-10" />
            </svg>
          </div>
          <h2>Payment received</h2>
          <p className="mu" style={{ margin: 0 }}>
            {formatMoney(finalTotalMinor)} settled. Show this code to staff at the exit.
          </p>

          {exitCode ? (
            <div className="cn" aria-label={`Exit code ${exitCode}`}>
              {exitCode.split("").map((c, i) => (
                <span key={i}>{c}</span>
              ))}
            </div>
          ) : (
            <div className="say" style={{ justifyContent: "center" }}>
              Generating exit pass...
            </div>
          )}

          <Link href={`/dine/${sessionId}/exit`} className="b p">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: "1.3rem", height: "1.3rem" }}>
              <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 18h2v2h-2z" />
            </svg>
            View exit pass
          </Link>
        </div>
      </div>
    );
  }

  // 2. Active Running Bill (Unpaid)
  return (
    <div style={{ paddingTop: 6 }}>
      {headerElem}

      {/* Perforated Receipt Mask */}
      <div className="rp">
        {allItems.map((item, idx) => (
          <div key={idx} className="it">
            <span>
              {item.quantity}× {item.item_name_snapshot}
            </span>
            <span>{formatMoney(item.line_total.amount_minor_units)}</span>
          </div>
        ))}

        <div className="it ln">
          <span className="mu">Subtotal</span>
          <span>{formatMoney(subtotalMinor)}</span>
        </div>
        <div className="it">
          <span className="mu">CGST 2.5%</span>
          <span>{formatMoney(cgstMinor)}</span>
        </div>
        <div className="it">
          <span className="mu">SGST 2.5%</span>
          <span>{formatMoney(sgstMinor)}</span>
        </div>

        <div className="tot">
          <span style={{ fontWeight: 700 }}>Grand total</span>
          <b>{formatMoney(finalTotalMinor)}</b>
        </div>
      </div>

      <div className="g" style={{ marginTop: 16 }}>
        {/* Unserved Items Notice */}
        {hasUnservedOrders && (
          <div className="say" style={{ display: "block" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Clock style={{ width: 18, height: 18, flexShrink: 0, color: "var(--ac)" }} />
              <span>
                {unservedOrders.length} {unservedOrders.length === 1 ? "round is" : "rounds are"} still being prepared in the kitchen.
              </span>
            </div>
            {cancellableOrders.length > 0 && cookingOrders.length === 0 && (
              <button
                type="button"
                className="b o"
                style={{ minHeight: 40, marginTop: 10, fontSize: "0.85rem", color: "var(--er)", borderColor: "var(--er)" }}
                onClick={handleCancelUncookedOrders}
                disabled={isCancelling}
              >
                Cancel uncooked orders & settle now
              </button>
            )}
          </div>
        )}

        {/* Payment Methods */}
        <div className="g" style={{ gap: 10 }}>
          <b style={{ fontSize: "1rem" }}>How would you like to pay?</b>

          <button
            type="button"
            className="op"
            aria-pressed={selectedMethod === PaymentMethod.CASH}
            onClick={() => setSelectedMethod(PaymentMethod.CASH)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: "1.4rem", height: "1.4rem", color: "var(--ac)" }}>
              <rect x="3" y="6" width="18" height="12" rx="2" />
              <circle cx="12" cy="12" r="2.5" />
            </svg>
            <span>
              <b>Cash at the table</b>
              <small>Hand notes to your waiter</small>
            </span>
            <u />
          </button>

          <button
            type="button"
            className="op"
            aria-pressed={selectedMethod === PaymentMethod.RESTAURANT_POS}
            onClick={() => setSelectedMethod(PaymentMethod.RESTAURANT_POS)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: "1.4rem", height: "1.4rem", color: "var(--ac)" }}>
              <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 18h2v2h-2z" />
            </svg>
            <span>
              <b>UPI QR or card</b>
              <small>Waiter brings the QR or card machine</small>
            </span>
            <u />
          </button>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="say" style={{ background: "color-mix(in srgb, var(--er) 15%, var(--pp))", color: "var(--er)", border: "1px solid color-mix(in srgb, var(--er) 30%, transparent)" }}>
            <AlertTriangle style={{ width: 18, height: 18, flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* CTA Button */}
        {isAwaitingPayment ? (
          <div>
            <button className="b p" disabled>
              Waiter is on the way…
            </button>
            <p className="mu sm ct" style={{ margin: "8px 0 0" }}>
              Staff is bringing the bill to Table {tableNumber}.
            </p>
          </div>
        ) : (
          <button
            type="button"
            className="b p"
            disabled={finalTotalMinor === 0 || isPaying || hasUnservedOrders}
            onClick={handleInitiatePayment}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: "1.2rem", height: "1.2rem" }}>
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10 21h4" />
            </svg>
            {hasUnservedOrders
              ? "Dishes cooking · Wait for service"
              : `Ask waiter to settle · ${formatMoney(finalTotalMinor)}`}
          </button>
        )}

        <Link href={`/dine/${sessionId}/menu`} className="b o">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "1.1rem", height: "1.1rem" }}>
            <path d="M12 5v14M5 12h14" />
          </svg>
          Order more dishes
        </Link>
      </div>
    </div>
  );
}

