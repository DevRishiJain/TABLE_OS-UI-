"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  useGetSessionQuery,
  useCustomerPayMutation,
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
import {
  Receipt,
  CreditCard,
  Banknote,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default function CustomerBillPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const dispatch = useAppDispatch();

  const { data: sessionData, isLoading, refetch } = useGetSessionQuery(
    sessionId,
    { pollingInterval: 4000 }
  );

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(
    PaymentMethod.RAZORPAY_GATEWAY
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [customerPay, { isLoading: isPaying }] = useCustomerPayMutation();

  const session = sessionData?.session;
  const orders = sessionData?.orders || [];
  const payments = sessionData?.payments || [];

  // Compute itemized list from all orders
  const allItems = orders.flatMap((o) => o.items);

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

  const isPaid =
    session?.status === SessionState.PAID ||
    session?.status === SessionState.COMPLETED ||
    payments.some((p) => p.status === "CONFIRMED");

  const isAwaitingPayment =
    session?.status === SessionState.AWAITING_PAYMENT ||
    payments.some((p) => p.status === "PENDING_CONFIRMATION");

  const handleInitiatePayment = async () => {
    setErrorMessage(null);
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
          title: "Payment Requested",
          message:
            selectedMethod === PaymentMethod.CASH ||
            selectedMethod === PaymentMethod.RESTAURANT_POS
              ? "Your server has been notified to collect payment."
              : "Payment gateway initialized successfully.",
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

  return (
    <div className="flex flex-col gap-5 px-4 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-100 font-display">
            Bill Summary
          </h1>
          <p className="text-[11px] text-gray-400">
            Your dining bill & tax details
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
            ? "Pending Confirmation"
            : "Running Bill"}
        </Badge>
      </div>

      {/* Bill Paid Banner */}
      {isPaid ? (
        <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-500/20 via-surface to-surface border-2 border-emerald-500/60 shadow-glow flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-emerald-300 font-display">
              Payment Completed!
            </h3>
            <p className="text-xs text-gray-300 mt-0.5">
              Your bill of {formatMoney(finalTotalMinor)} has been settled.
            </p>
          </div>
          <Link href={`/dine/${sessionId}/exit`} className="w-full mt-2">
            <Button
              variant="primary"
              size="lg"
              className="w-full font-bold bg-emerald-500 hover:bg-emerald-600 text-black shadow-lg shadow-emerald-500/20"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              View Your Exit Pass
            </Button>
          </Link>
        </div>
      ) : isAwaitingPayment ? (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
          <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-spin" />
          <div className="flex-1 text-xs">
            <h4 className="font-bold text-amber-200">
              Verifying Status with Restaurant...
            </h4>
            <p className="text-gray-300 mt-0.5 leading-relaxed">
              Your payment request is pending server confirmation. Once received, your digital Exit Pass will be issued instantly.
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

      {/* Payment Method Selector (if not already paid) */}
      {!isPaid && (
        <Card className="p-5 flex flex-col gap-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300">
            Choose Payment Method
          </h4>

          <div className="grid grid-cols-1 gap-2.5">
            {/* Razorpay Gateway */}
            <button
              onClick={() => setSelectedMethod(PaymentMethod.RAZORPAY_GATEWAY)}
              className={`p-3.5 rounded-xl border flex items-center justify-between transition-all text-left ${
                selectedMethod === PaymentMethod.RAZORPAY_GATEWAY
                  ? "border-primary bg-primary/10 shadow-glow text-gray-100"
                  : "border-surface-border bg-surface-subtle text-gray-400 hover:border-gray-600"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-100">
                    Online Gateway (UPI / Cards / NetBanking)
                  </div>
                  <div className="text-[10px] text-gray-400">
                    Instant automated digital settlement & ExitPass
                  </div>
                </div>
              </div>
              <span className="w-4 h-4 rounded-full border border-primary flex items-center justify-center">
                {selectedMethod === PaymentMethod.RAZORPAY_GATEWAY && (
                  <span className="w-2 h-2 rounded-full bg-primary" />
                )}
              </span>
            </button>

            {/* Cash at Table */}
            <button
              onClick={() => setSelectedMethod(PaymentMethod.CASH)}
              className={`p-3.5 rounded-xl border flex items-center justify-between transition-all text-left ${
                selectedMethod === PaymentMethod.CASH
                  ? "border-primary bg-primary/10 shadow-glow text-gray-100"
                  : "border-surface-border bg-surface-subtle text-gray-400 hover:border-gray-600"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Banknote className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-100">
                    Cash at Table
                  </div>
                  <div className="text-[10px] text-gray-400">
                    Pay physical currency directly to your server
                  </div>
                </div>
              </div>
              <span className="w-4 h-4 rounded-full border border-primary flex items-center justify-center">
                {selectedMethod === PaymentMethod.CASH && (
                  <span className="w-2 h-2 rounded-full bg-primary" />
                )}
              </span>
            </button>

            {/* Restaurant Card POS */}
            <button
              onClick={() => setSelectedMethod(PaymentMethod.RESTAURANT_POS)}
              className={`p-3.5 rounded-xl border flex items-center justify-between transition-all text-left ${
                selectedMethod === PaymentMethod.RESTAURANT_POS
                  ? "border-primary bg-primary/10 shadow-glow text-gray-100"
                  : "border-surface-border bg-surface-subtle text-gray-400 hover:border-gray-600"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-100">
                    Restaurant POS Terminal
                  </div>
                  <div className="text-[10px] text-gray-400">
                    Server brings handheld card swipe device
                  </div>
                </div>
              </div>
              <span className="w-4 h-4 rounded-full border border-primary flex items-center justify-center">
                {selectedMethod === PaymentMethod.RESTAURANT_POS && (
                  <span className="w-2 h-2 rounded-full bg-primary" />
                )}
              </span>
            </button>
          </div>

          {errorMessage && (
            <p className="text-xs text-red-400 mt-1">{errorMessage}</p>
          )}

          <Button
            variant="gold"
            size="lg"
            className="w-full font-bold shadow-xl shadow-amber-500/20 mt-2"
            isLoading={isPaying}
            onClick={handleInitiatePayment}
            disabled={finalTotalMinor === 0}
          >
            Pay & Settle • {formatMoney(finalTotalMinor)}
          </Button>
        </Card>
      )}
    </div>
  );
}
