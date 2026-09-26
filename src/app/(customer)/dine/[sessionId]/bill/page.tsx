"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  useGetSessionQuery,
  useCustomerPayMutation,
  useGetExitPassQuery,
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

  // Fast polling to pick up waiter cash confirmation & gatepass approval in real time
  const { data: sessionData, isLoading, refetch, error: sessionError } = useGetSessionQuery(
    sessionId,
    { pollingInterval: 2500 }
  );

  const session = sessionData?.session;
  const orders = sessionData?.orders || [];
  const payments = sessionData?.payments || [];

  const { data: exitPassData, error: exitPassError } = useGetExitPassQuery(sessionId, {
    pollingInterval: 2500,
    skip: false,
  });

  const isSessionGone =
    (sessionError as any)?.status === 410 ||
    (exitPassError as any)?.status === 410 ||
    JSON.stringify(sessionError || {}).includes("session has closed") ||
    JSON.stringify(exitPassError || {}).includes("session has closed");

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
      <div className="flex flex-col gap-4 p-4">
        <Skeleton className="w-full h-48 rounded-2xl" />
        <Skeleton className="w-full h-64 rounded-2xl" />
      </div>
    );
  }

  // 1. Terminal State: COMPLETED (Session finalized & Gatepass cleared)
  if (isCompleted) {
    return (
      <div className="flex flex-col gap-5 px-4 pt-4 pb-12 animate-fadeIn">
        <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-500/20 via-surface to-surface border-2 border-emerald-500/70 shadow-glow flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border-2 border-emerald-500/50 text-emerald-400 flex items-center justify-center shadow-lg">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <div>
            <span className="inline-block px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold uppercase tracking-wider text-[11px] font-mono border border-emerald-500/40 mb-2">
              SESSION HAS CLOSED 🚪✨
            </span>
            <h2 className="text-2xl font-black text-gray-100 font-display mt-0.5">
              Exit Approved with Gate Pass! 🎉
            </h2>
            <p className="text-xs text-gray-300 mt-2 max-w-xs mx-auto leading-relaxed">
              Your dining session is complete and bill of <strong className="text-emerald-300">{formatMoney(finalTotalMinor)}</strong> has been settled. Your exit pass was verified by floor staff — you have successfully exited with your gate pass!
            </p>
          </div>

          <div className="w-full p-4 rounded-2xl bg-black/40 border border-emerald-500/30 flex flex-col gap-2.5 text-xs text-left">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Session Status:</span>
              <span className="font-mono text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> CLOSED & COMPLETED
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Gate Pass Clearance:</span>
              <span className="font-mono text-emerald-400 font-bold flex items-center gap-1">
                VERIFIED BY STAFF ✅
              </span>
            </div>
            {exitCode && (
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Verification Code:</span>
                <span className="font-mono text-gray-200 font-bold tracking-widest">{exitCode}</span>
              </div>
            )}
          </div>

          <Link href={`/dine/${sessionId}/exit`} className="w-full">
            <Button
              variant="primary"
              size="lg"
              className="w-full font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
              leftIcon={<Ticket className="w-4 h-4" />}
            >
              View Official Exit Pass 🎟️
            </Button>
          </Link>

          <p className="text-xs text-gray-400 italic pt-1">
            Thank you for dining with us at The Spice Route! Have a wonderful day ahead.
          </p>
        </div>

        {/* Paid Receipt Summary */}
        <Card className="p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-surface-border pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-emerald-400" />
              Final Settled Receipt
            </span>
            <Badge variant="success" size="sm">
              PAID IN FULL
            </Badge>
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>Table {tableNumber}</span>
            <span className="font-mono font-bold text-gray-200">
              {formatMoney(finalTotalMinor)}
            </span>
          </div>
        </Card>
      </div>
    );
  }

  // 2. Active Paid State: PAID (Exit Pass is active)
  return (
    <div className="flex flex-col gap-5 px-4 pt-4 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-100 font-display">
            Bill & Settlement
          </h1>
          <p className="text-[11px] text-gray-400">
            Table {tableNumber} • Real-time dining bill
          </p>
        </div>
        <Badge
          variant={isPaid ? "success" : isAwaitingPayment ? "gold" : "default"}
          size="sm"
          dot
        >
          {isPaid
            ? "Settled & Paid"
            : isAwaitingPayment
            ? "Server Alerted"
            : "Running Bill"}
        </Badge>
      </div>

      {/* Bill Paid / Gate Pass Banner */}
      {isPaid ? (
        <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-500/20 via-surface to-surface border-2 border-emerald-500/60 shadow-glow flex flex-col items-center text-center gap-4 animate-fadeIn">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-emerald-300 font-display">
              Payment Received! 🎟️
            </h3>
            <p className="text-xs text-gray-300 mt-0.5">
              Your bill of {formatMoney(finalTotalMinor)} has been settled with the server.
            </p>
          </div>

          {/* Quick Exit Pass Box OR Exit Approved Banner */}
          {isCompleted || exitPassData?.status === "VERIFIED" ? (
            <div className="w-full p-5 rounded-2xl bg-emerald-500/20 border-2 border-emerald-500/70 flex flex-col items-center gap-2 animate-fadeIn">
              <span className="text-3xl">🎉</span>
              <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold uppercase tracking-wider text-[11px] font-mono border border-emerald-500/40">
                SESSION HAS CLOSED 🚪✨
              </span>
              <span className="text-base font-black text-emerald-300 font-display">
                Exit Approved with Gate Pass! 🚪✅
              </span>
              <p className="text-xs text-emerald-100/90 text-center max-w-xs">
                Your waiter has cleared your table and verified your departure. Your session has officially closed. Thank you for dining with us!
              </p>
            </div>
          ) : (
            <div className="w-full p-4 rounded-2xl bg-surface-subtle border border-emerald-500/40 flex flex-col items-center gap-2">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Your Exit Pass Verification Code
              </span>
              <div className="px-6 py-2.5 rounded-xl bg-black/60 border border-emerald-500/50 text-3xl font-black font-mono tracking-widest text-emerald-400 shadow-inner flex items-center justify-center min-w-[150px] min-h-[50px]">
                {exitCode ? (
                  exitCode
                ) : (
                  <span className="text-xs font-mono font-medium text-emerald-400/80 animate-pulse flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 animate-spin" /> GENERATING...
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-400 text-center">
                Your waiter can verify this code or 1-click approve your exit on the floor.
              </p>
            </div>
          )}

          <Link href={`/dine/${sessionId}/exit`} className="w-full">
            <Button
              variant="primary"
              size="lg"
              className="w-full font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
              leftIcon={<Ticket className="w-4 h-4" />}
            >
              View Full Digital Exit Pass QR →
            </Button>
          </Link>
        </div>
      ) : isAwaitingPayment ? (
        <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 shadow-sm flex items-start gap-3 animate-fadeIn">
          <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-spin" />
          <div className="flex-1 text-xs">
            <h4 className="font-bold text-amber-300">
              Waiter Alerted for Table {tableNumber}
            </h4>
            <p className="text-gray-300 mt-0.5 leading-relaxed">
              Your server is on the way to your table to collect payment ({selectedMethod === PaymentMethod.CASH ? "Cash" : "UPI / Card POS"}). Once confirmed, your Gate Pass will appear automatically.
            </p>
          </div>
        </div>
      ) : null}

      {/* Itemized Bill Card */}
      <Card className="p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-surface-border/60 pb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
            <Receipt className="w-4 h-4 text-primary" />
            Itemized Order History
          </span>
          <span className="text-xs text-gray-400 font-mono">
            {allItems.length} Items
          </span>
        </div>

        {allItems.length === 0 ? (
          <p className="text-xs text-gray-500 py-4 text-center">
            No items have been ordered yet.
          </p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {allItems.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-xs py-1"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-primary font-bold">
                    {item.quantity}x
                  </span>
                  <span className="text-gray-200">{item.item_name_snapshot}</span>
                </div>
                <span className="font-mono font-bold text-gray-300">
                  {formatMoney(item.line_total.amount_minor_units)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* GST Tax Breakdown */}
        <div className="pt-4 border-t border-surface-border/60 flex flex-col gap-2 text-xs">
          <div className="flex items-center justify-between text-gray-400">
            <span>Items Subtotal:</span>
            <span className="font-mono">{formatMoney(subtotalMinor)}</span>
          </div>
          <div className="flex items-center justify-between text-gray-400">
            <span>CGST (2.5%):</span>
            <span className="font-mono">{formatMoney(cgstMinor)}</span>
          </div>
          <div className="flex items-center justify-between text-gray-400">
            <span>SGST (2.5%):</span>
            <span className="font-mono">{formatMoney(sgstMinor)}</span>
          </div>

          <div className="pt-3 border-t border-surface-border/60 flex items-center justify-between text-base font-extrabold text-gray-100">
            <span>Grand Total:</span>
            <span className="font-mono text-primary text-xl font-black">
              {formatMoney(finalTotalMinor)}
            </span>
          </div>
        </div>
      </Card>

      {/* Payment Tender Selector (Cash or Waiter UPI/POS) */}
      {!isPaid && (
        <Card className="p-5 flex flex-col gap-4 border-surface-border">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300">
            Select Settlement Method
          </h4>

          <div className="grid grid-cols-1 gap-2.5">
            {/* Cash Handover */}
            <button
              onClick={() => setSelectedMethod(PaymentMethod.CASH)}
              className={`p-3.5 rounded-xl border flex items-center justify-between transition-all text-left ${
                selectedMethod === PaymentMethod.CASH
                  ? "border-emerald-500 bg-emerald-500/10 shadow-glow text-gray-100"
                  : "border-surface-border bg-surface-subtle text-gray-400 hover:border-gray-600"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-100">
                    Cash Handover at Table
                  </div>
                  <div className="text-[11px] text-gray-400">
                    Pay currency notes directly to your waiter
                  </div>
                </div>
              </div>
              <span className="w-4 h-4 rounded-full border border-emerald-500 flex items-center justify-center">
                {selectedMethod === PaymentMethod.CASH && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                )}
              </span>
            </button>

            {/* Restaurant Static UPI / POS */}
            <button
              onClick={() => setSelectedMethod(PaymentMethod.RESTAURANT_POS)}
              className={`p-3.5 rounded-xl border flex items-center justify-between transition-all text-left ${
                selectedMethod === PaymentMethod.RESTAURANT_POS
                  ? "border-sky-500 bg-sky-500/10 shadow-glow text-gray-100"
                  : "border-surface-border bg-surface-subtle text-gray-400 hover:border-gray-600"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-100">
                    Restaurant UPI QR / Card POS
                  </div>
                  <div className="text-[11px] text-gray-400">
                    Waiter presents restaurant QR code or card swipe terminal
                  </div>
                </div>
              </div>
              <span className="w-4 h-4 rounded-full border border-sky-500 flex items-center justify-center">
                {selectedMethod === PaymentMethod.RESTAURANT_POS && (
                  <span className="w-2 h-2 rounded-full bg-sky-400" />
                )}
              </span>
            </button>
          </div>

          {/* Unserved Items Warning Banner */}
          {hasUnservedOrders && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col gap-3 animate-fadeIn">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1 text-xs">
                  <h4 className="font-bold text-amber-300">
                    Items Not Yet Served On Table 🍽️
                  </h4>
                  <p className="text-gray-300 mt-1 leading-relaxed">
                    To ensure you only pay for food you have received, bill settlement is paused until all items are served to your table.
                  </p>
                  {cookingOrders.length > 0 && (
                    <p className="text-amber-200/90 text-[11px] mt-1.5 font-medium">
                      🍳 Kitchen is currently cooking {cookingOrders.length} order(s). Please wait for food to arrive at your table.
                    </p>
                  )}
                </div>
              </div>

              {cancellableOrders.length > 0 && cookingOrders.length === 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs text-red-300 border-red-500/40 hover:bg-red-500/15 font-semibold"
                  isLoading={isCancelling}
                  onClick={handleCancelUncookedOrders}
                >
                  Cancel {cancellableOrders.length} Uncooked Item(s) & Settle Bill Now
                </Button>
              )}
            </div>
          )}

          {errorMessage && (
            <p className="text-xs text-red-400 mt-1">{errorMessage}</p>
          )}

          <Button
            variant="gold"
            size="lg"
            className="w-full font-bold shadow-xl shadow-amber-500/20 mt-1"
            isLoading={isPaying}
            onClick={handleInitiatePayment}
            disabled={finalTotalMinor === 0 || hasUnservedOrders}
          >
            {hasUnservedOrders
              ? "⏳ Food In Preparation — Cannot Settle Bill"
              : isAwaitingPayment
              ? "🔔 Re-Ping Waiter for Bill"
              : `Call Waiter to Collect • ${formatMoney(finalTotalMinor)}`}
          </Button>
        </Card>
      )}
    </div>
  );
}
