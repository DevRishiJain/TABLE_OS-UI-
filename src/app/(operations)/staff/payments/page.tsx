"use client";

import React, { useState } from "react";
import {
  useGetStaffTablesQuery,
  useConfirmPaymentMutation,
} from "@/store/api/staffApi";
import { useGetSessionQuery } from "@/store/api/customerApi";
import { formatMoney } from "@/lib/money";
import { PaymentMethod } from "@/types/enums";
import { generateUUID } from "@/lib/idempotency";
import { addToast } from "@/store/slices/uiSlice";
import { useAppDispatch } from "@/store";
import { translateBackendError } from "@/lib/errors";
import { humanizeStatus } from "@/lib/statusLabels";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Banknote,
  CreditCard,
  CheckCircle2,
  Receipt,
  ShieldCheck,
  RefreshCw,
  Utensils,
} from "lucide-react";

interface TablePaymentCardProps {
  tableNumber: string;
  sessionId: string;
  sessionStatus?: string;
  runningTotalMinor?: number;
  onRefreshParent: () => void;
}

function TablePaymentCard({
  tableNumber,
  sessionId,
  sessionStatus,
  runningTotalMinor,
  onRefreshParent,
}: TablePaymentCardProps) {
  const dispatch = useAppDispatch();
  const { data: sessionData, refetch: refetchSession } = useGetSessionQuery(
    sessionId,
    { pollingInterval: 4000 }
  );

  const [confirmPayment, { isLoading: isConfirming }] =
    useConfirmPaymentMutation();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(
    PaymentMethod.CASH
  );

  const session = sessionData?.session;
  const orders = sessionData?.orders || [];
  const status = session?.status || sessionStatus || "OPEN";

  const totalBillMinor =
    session?.final_total?.amount_minor_units ??
    session?.running_total?.amount_minor_units ??
    orders.reduce((sum, o) => sum + (o.total?.amount_minor_units || 0), 0) ??
    runningTotalMinor ??
    0;

  const isAwaitingPayment = status === "AWAITING_PAYMENT";
  const isPaid = status === "PAID" || status === "COMPLETED";

  const handleConfirm = async () => {
    try {
      const idempotencyKey = generateUUID();
      await confirmPayment({
        data: {
          session_id: sessionId,
          amount_minor: totalBillMinor,
          method: selectedMethod,
        },
        idempotencyKey,
      }).unwrap();

      dispatch(
        addToast({
          type: "success",
          title: "Payment Confirmed!",
          message: `Table ${tableNumber} bill of ${formatMoney(
            totalBillMinor
          )} marked as PAID. Digital ExitPass issued.`,
        })
      );
      refetchSession();
      onRefreshParent();
    } catch (err) {
      console.error("Payment confirmation failed:", err);
      dispatch(
        addToast({
          type: "error",
          title: "Confirmation Failed",
          message: translateBackendError(err),
        })
      );
    }
  };

  return (
    <Card className="p-6 flex flex-col gap-5 border-primary/40 shadow-glow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/20 text-primary font-black font-display text-lg flex items-center justify-center border border-primary/40">
            T{tableNumber}
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-100 font-display">
              Table {tableNumber}
            </h3>
            <span className="text-xs text-gray-400 font-mono">
              Session: {sessionId.substring(0, 16)}...
            </span>
          </div>
        </div>

        <Badge
          variant={isPaid ? "success" : isAwaitingPayment ? "gold" : "amber"}
          size="sm"
          dot
        >
          {humanizeStatus(status)}
        </Badge>
      </div>

      {/* Amount Breakdown */}
      <div className="p-4 rounded-xl bg-surface-subtle border border-surface-border flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] text-gray-400 uppercase font-semibold">
            Total Bill (Taxes Included)
          </span>
          <span className="text-2xl font-black font-mono text-primary">
            {formatMoney(totalBillMinor)}
          </span>
        </div>
        <Receipt className="w-8 h-8 text-gray-500" />
      </div>

      {/* Payment Method Selector */}
      {!isPaid ? (
        <div className="flex flex-col gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Confirm Received Via:
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setSelectedMethod(PaymentMethod.CASH)}
              className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs font-bold transition-all ${
                selectedMethod === PaymentMethod.CASH
                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-300"
                  : "border-surface-border bg-surface text-gray-400"
              }`}
            >
              <Banknote className="w-4 h-4" />
              <span>Cash Tendered</span>
            </button>

            <button
              onClick={() => setSelectedMethod(PaymentMethod.RESTAURANT_POS)}
              className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs font-bold transition-all ${
                selectedMethod === PaymentMethod.RESTAURANT_POS
                  ? "border-sky-500 bg-sky-500/10 text-sky-300"
                  : "border-surface-border bg-surface text-gray-400"
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Card POS Swiped</span>
            </button>
          </div>

          <Button
            variant="gold"
            size="lg"
            className="w-full font-bold mt-2"
            isLoading={isConfirming}
            onClick={handleConfirm}
            leftIcon={<CheckCircle2 className="w-5 h-5" />}
          >
            Confirm Payment Received ({formatMoney(totalBillMinor)})
          </Button>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-emerald-300 text-xs">
          <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
          <span>
            Payment has been verified and settled. Exit Pass has been generated
            for customer.
          </span>
        </div>
      )}
    </Card>
  );
}

export default function StaffPaymentsConfirmationPage() {
  const { data: tables, isLoading, refetch } = useGetStaffTablesQuery(
    undefined,
    { pollingInterval: 4000 }
  );

  const activeTables = (tables || []).filter((t) => t.active_session_id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-gray-100 flex items-center gap-2">
            <Banknote className="w-6 h-6 text-primary" />
            Offline Payment Settlement Queue
          </h1>
          <p className="text-xs text-gray-400">
            Confirm cash or POS terminal card payments to settle tables and issue
            Exit Passes
          </p>
        </div>

        <Button
          variant="subtle"
          size="sm"
          onClick={() => refetch()}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Refresh Payments
        </Button>
      </div>

      {activeTables.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center p-6 bg-surface rounded-2xl border border-surface-border">
          <Utensils className="w-12 h-12 text-gray-500 mb-3" />
          <h3 className="text-base font-bold text-gray-200">
            No pending payment settlements
          </h3>
          <p className="text-xs text-gray-400 mt-1 max-w-sm">
            All tables are either settled or no dining sessions are currently
            active.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {activeTables.map((table) => (
            <TablePaymentCard
              key={table.active_session_id!}
              tableNumber={table.table_number}
              sessionId={table.active_session_id!}
              sessionStatus={table.session_status}
              runningTotalMinor={table.running_total_minor}
              onRefreshParent={() => refetch()}
            />
          ))}
        </div>
      )}
    </div>
  );
}
