"use client";

import React, { useState } from "react";
import {
  useGetStaffTablesQuery,
  useVerifyFirstOrderMutation,
  useForceCloseSessionMutation,
} from "@/store/api/staffApi";
import { useGetSessionQuery } from "@/store/api/customerApi";
import { formatMoney } from "@/lib/money";
import { addToast } from "@/store/slices/uiSlice";
import { useAppDispatch } from "@/store";
import { translateBackendError } from "@/lib/errors";
import { humanizeStatus } from "@/lib/statusLabels";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  Layers,
  KeyRound,
  ShieldAlert,
  Clock,
  Receipt,
  CheckCircle2,
  RefreshCw,
  Utensils,
  AlertTriangle,
} from "lucide-react";



export default function StaffTablesFloorPage() {
  const dispatch = useAppDispatch();
  const { data: liveTables, isLoading, refetch } = useGetStaffTablesQuery(
    undefined,
    { pollingInterval: 4000 }
  );

  const [selectedTable, setSelectedTable] = useState<{
    tableNumber: string;
    tableId: string;
    sessionId?: string;
    status?: string;
  } | null>(null);

  const [otpInput, setOtpInput] = useState("");
  const [forceCloseReason, setForceCloseReason] = useState("");
  const [showForceCloseConfirm, setShowForceCloseConfirm] = useState(false);

  const [verifyFirstOrder, { isLoading: isVerifying }] =
    useVerifyFirstOrderMutation();
  const [forceCloseSession, { isLoading: isClosing }] =
    useForceCloseSessionMutation();

  // If a table is selected and has active session, query session details
  const activeSessionId = selectedTable?.sessionId || "";
  const { data: sessionDetail, refetch: refetchSession } = useGetSessionQuery(
    activeSessionId,
    { skip: !selectedTable?.sessionId }
  );

  const handleVerifyOtp = async () => {
    if (!otpInput.trim() || !selectedTable?.sessionId) return;
    try {
      await verifyFirstOrder({
        sessionId: selectedTable.sessionId,
        data: { otp: otpInput.trim() },
      }).unwrap();

      dispatch(
        addToast({
          type: "success",
          title: "Table Verified!",
          message: `Table ${selectedTable.tableNumber} is now verified and active. Orders routed to KDS.`,
        })
      );
      setOtpInput("");
      refetch();
      refetchSession();
    } catch (err) {
      console.error("OTP verification failed:", err);
      dispatch(
        addToast({
          type: "error",
          title: "Invalid Verification Code",
          message: translateBackendError(err),
        })
      );
    }
  };

  const handleForceClose = async () => {
    if (!selectedTable?.sessionId) return;
    try {
      await forceCloseSession({
        sessionId: selectedTable.sessionId,
        data: { reason: forceCloseReason || "Manager Force Close" },
      }).unwrap();

      dispatch(
        addToast({
          type: "warning",
          title: "Session Terminated",
          message: `Table ${selectedTable.tableNumber} has been freed.`,
        })
      );
      setSelectedTable(null);
      setShowForceCloseConfirm(false);
      refetch();
    } catch (err) {
      console.error("Force close failed:", err);
      dispatch(
        addToast({
          type: "error",
          title: "Force Close Failed",
          message: translateBackendError(err),
        })
      );
    }
  };

  // Live tables returned by backend
  const tablesToRender = (liveTables || []).map((t) => ({
    table_id: t.table_id,
    table_number: t.table_number,
    isOccupied: t.is_occupied ?? false,
    status: t.session_status ?? "FREE",
    sessionId: t.active_session_id,
    runningTotalMinor: t.running_total_minor ?? 0,
  }));

  return (
    <div className="flex flex-col gap-6">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-gray-100 flex items-center gap-2">
            <Layers className="w-6 h-6 text-primary" />
            Live Floor Plan
          </h1>
          <p className="text-xs text-gray-400">
            Real-time occupancy, first-order OTP verification & table status
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="subtle"
            size="sm"
            onClick={() => refetch()}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh Floor
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 p-3 rounded-2xl bg-surface border border-surface-border text-xs text-gray-300">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-surface-subtle border border-surface-border" />
          <span>Available / Free</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500 animate-pulse" />
          <span>Unverified (Needs OTP)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500" />
          <span>Verified Active</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-sky-500/20 border border-sky-500" />
          <span>Awaiting Payment</span>
        </div>
      </div>

      {/* Visual Table Grid */}
      {tablesToRender.length === 0 && !isLoading ? (
        <div className="p-12 text-center rounded-2xl bg-surface border border-surface-border">
          <Layers className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-200">No Live Tables Found</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
            No dining tables are currently provisioned for this restaurant in the backend. Tables provisioned during onboarding will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {tablesToRender.map((table) => {
          const isUnverified = table.status === "OPEN";
          const isVerified = table.status === "OPEN_VERIFIED";
          const isAwaitingPayment = table.status === "AWAITING_PAYMENT";
          const isFree = table.status === "FREE" || !table.isOccupied;

          let borderStyle = "border-surface-border hover:border-gray-500";
          let badgeVariant: "default" | "amber" | "success" | "blue" = "default";
          let statusText = "Available";

          if (isUnverified) {
            borderStyle = "border-amber-500/80 bg-amber-500/5 shadow-glow";
            badgeVariant = "amber";
            statusText = "Enter OTP";
          } else if (isVerified) {
            borderStyle = "border-emerald-500/60 bg-emerald-500/5";
            badgeVariant = "success";
            statusText = "Active Dining";
          } else if (isAwaitingPayment) {
            borderStyle = "border-sky-500/60 bg-sky-500/5";
            badgeVariant = "blue";
            statusText = "Bill Requested";
          }

          return (
            <Card
              key={table.table_id}
              hoverable
              onClick={() =>
                setSelectedTable({
                  tableNumber: table.table_number,
                  tableId: table.table_id,
                  sessionId: table.sessionId,
                  status: table.status,
                })
              }
              className={`p-5 flex flex-col justify-between min-h-[160px] cursor-pointer transition-all ${borderStyle}`}
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-surface-subtle border border-surface-border flex items-center justify-center font-bold text-base text-gray-100 font-display">
                  {table.table_number}
                </div>
                <Badge variant={badgeVariant} size="sm" dot={!isFree}>
                  {statusText}
                </Badge>
              </div>

              <div className="flex flex-col gap-1 pt-4 border-t border-surface-border/40 mt-3">
                {isFree ? (
                  <span className="text-xs text-gray-500">Ready for diner QR scan</span>
                ) : (
                  <>
                    <span className="text-xs text-gray-400">Running Total</span>
                    <span className="text-base font-extrabold font-mono text-primary">
                      {formatMoney(table.runningTotalMinor)}
                    </span>
                  </>
                )}
              </div>
            </Card>
          );
        })}
        </div>
      )}

      {/* Table Detail & Verification Drawer */}
      <Drawer
        isOpen={!!selectedTable}
        onClose={() => setSelectedTable(null)}
        position="right"
        title={`Table ${selectedTable?.tableNumber} Management`}
      >
        {selectedTable && (
          <div className="flex flex-col gap-6">
            {/* Status overview */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-subtle border border-surface-border">
              <div>
                <span className="text-[11px] text-gray-400 uppercase font-semibold">
                  Current Session
                </span>
                <div className="text-xs font-mono text-gray-200 mt-0.5">
                  {selectedTable.sessionId
                    ? `${selectedTable.sessionId.substring(0, 16)}...`
                    : "No Active Session"}
                </div>
              </div>
              <Badge
                variant={
                  selectedTable.status === "OPEN"
                    ? "amber"
                    : selectedTable.status === "OPEN_VERIFIED"
                    ? "success"
                    : "default"
                }
              >
                {humanizeStatus(selectedTable.status || "FREE")}
              </Badge>
            </div>

            {/* First-Order OTP Verification Section */}
            {selectedTable.sessionId && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-amber-400" />
                  <h4 className="text-xs font-bold text-amber-200 uppercase tracking-wider">
                    First-Order Table Verification
                  </h4>
                </div>
                <p className="text-xs text-gray-300">
                  Ask the diner for the 4-digit verification code shown on their screen.
                </p>
                <div className="flex gap-2 mt-1">
                  <Input
                    placeholder="Enter 4-digit OTP"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    maxLength={4}
                    className="font-mono text-center tracking-widest text-lg font-bold"
                  />
                  <Button
                    variant="gold"
                    onClick={handleVerifyOtp}
                    isLoading={isVerifying}
                    disabled={otpInput.length !== 4}
                  >
                    Verify
                  </Button>
                </div>
              </div>
            )}

            {/* Active Orders List in Drawer */}
            {sessionDetail?.orders && sessionDetail.orders.length > 0 && (
              <div className="flex flex-col gap-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300">
                  Active Table Orders ({sessionDetail.orders.length})
                </h4>
                <div className="flex flex-col gap-2">
                  {sessionDetail.orders.map((order, idx) => (
                    <div
                      key={order.id}
                      className="p-3 rounded-xl bg-surface border border-surface-border text-xs flex flex-col gap-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-gray-300">
                          Order #{idx + 1}
                        </span>
                        <Badge variant="default" size="sm">
                          {humanizeStatus(order.status)}
                        </Badge>
                      </div>
                      <div className="flex flex-col gap-1 text-gray-400">
                        {order.items.map((i) => (
                          <div key={i.id} className="flex justify-between">
                            <span>
                              {i.quantity}x {i.item_name_snapshot}
                            </span>
                            <span className="font-mono">
                              {formatMoney(i.line_total.amount_minor_units)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Force Close Override */}
            {selectedTable.sessionId && (
              <div className="pt-4 border-t border-surface-border flex flex-col gap-3">
                <span className="text-xs font-bold text-red-400 uppercase tracking-wider">
                  Manager Overrides
                </span>
                {!showForceCloseConfirm ? (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setShowForceCloseConfirm(true)}
                  >
                    Force-Close / Free Table
                  </Button>
                ) : (
                  <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex flex-col gap-2">
                    <p className="text-xs text-red-300">
                      Are you sure you want to terminate this active dining session?
                    </p>
                    <Input
                      placeholder="Reason (e.g. Walkout, Duplicate scan)"
                      value={forceCloseReason}
                      onChange={(e) => setForceCloseReason(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowForceCloseConfirm(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        isLoading={isClosing}
                        onClick={handleForceClose}
                      >
                        Confirm Termination
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
