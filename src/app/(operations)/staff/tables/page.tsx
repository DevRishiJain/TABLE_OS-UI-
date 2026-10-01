"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useGetStaffTablesQuery,
  useVerifyFirstOrderMutation,
  useForceCloseSessionMutation,
  useStartStaffSessionMutation,
} from "@/store/api/staffApi";
import { useGetSessionQuery } from "@/store/api/customerApi";
import { formatMoney } from "@/lib/money";
import { addToast } from "@/store/slices/uiSlice";
import { useAppDispatch, useAppSelector } from "@/store";
import { translateBackendError } from "@/lib/errors";
import { humanizeStatus } from "@/lib/statusLabels";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { Input } from "@/components/ui/Input";
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
  Users,
  Plus,
  ArrowRight,
  UserPlus,
  Phone,
  ShoppingCart,
  X,
  Sparkles,
} from "lucide-react";

export default function StaffTablesFloorPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const restaurantName = useAppSelector((state) => state.auth.restaurantName) || "Restaurant";
  const restaurantId = useAppSelector((state) => state.auth.restaurantId) || undefined;

  const { data: liveTables, isLoading, refetch } = useGetStaffTablesQuery(
    restaurantId,
    { pollingInterval: 3500 }
  );

  const [filterMode, setFilterMode] = useState<"ALL" | "AVAILABLE" | "OCCUPIED" | "BILL">("ALL");

  // Selected table for side drawer view
  const [selectedTable, setSelectedTable] = useState<{
    tableNumber: string;
    tableId: string;
    tableToken?: string;
    sessionId?: string;
    status?: string;
    customerName?: string;
    customerPhone?: string;
    guestCount?: number;
    isOccupied?: boolean;
  } | null>(null);

  // Walk-in Guest Seating Modal State (Issue 7)
  const [seatGuestTable, setSeatGuestTable] = useState<{
    tableNumber: string;
    tableId: string;
    tableToken?: string;
  } | null>(null);
  const [walkinName, setWalkinName] = useState("Walk-in Diner");
  const [walkinPhone, setWalkinPhone] = useState("");
  const [walkinGuestCount, setWalkinGuestCount] = useState(2);
  const [isSeating, setIsSeating] = useState(false);

  // Drawer Action States
  const [otpInput, setOtpInput] = useState("");
  const [forceCloseReason, setForceCloseReason] = useState("");
  const [showForceCloseConfirm, setShowForceCloseConfirm] = useState(false);

  const [verifyFirstOrder, { isLoading: isVerifying }] = useVerifyFirstOrderMutation();
  const [forceCloseSession, { isLoading: isClosing }] = useForceCloseSessionMutation();
  const [startStaffSession] = useStartStaffSessionMutation();

  // If a table is selected and has active session, query session details
  const activeSessionId = selectedTable?.sessionId || "";
  const { data: sessionDetail, refetch: refetchSession } = useGetSessionQuery(
    activeSessionId,
    { skip: !selectedTable?.sessionId }
  );

  const handleStartWalkinSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seatGuestTable) return;

    setIsSeating(true);
    try {
      const sess = await startStaffSession({
        table_number: seatGuestTable.tableNumber,
        table_id: seatGuestTable.tableId,
        customer_name: walkinName.trim() || "Walk-in Diner",
        customer_phone: walkinPhone.trim(),
        guest_count: Number(walkinGuestCount) || 2,
      }).unwrap();

      dispatch(
        addToast({
          type: "success",
          title: `Table ${seatGuestTable.tableNumber} Seated!`,
          message: `Session started for ${walkinName || "Walk-in Diner"} (${walkinGuestCount} guests). Table is verified & ready for orders.`,
        })
      );

      setSeatGuestTable(null);
      setWalkinName("Walk-in Diner");
      setWalkinPhone("");
      setWalkinGuestCount(2);
      refetch();
    } catch (err: any) {
      console.error("Failed to start walk-in session:", err);
      dispatch(
        addToast({
          type: "error",
          title: "Seating Failed",
          message: translateBackendError(err) || "Could not start session for this table.",
        })
      );
    } finally {
      setIsSeating(false);
    }
  };

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
          message: `Table ${selectedTable.tableNumber} is verified. Orders released to kitchen.`,
        })
      );
      setOtpInput("");
      refetch();
      refetchSession();
    } catch (err) {
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
          message: `Table ${selectedTable.tableNumber} has been cleared and marked available.`,
        })
      );
      setSelectedTable(null);
      setShowForceCloseConfirm(false);
      refetch();
    } catch (err) {
      dispatch(
        addToast({
          type: "error",
          title: "Force Close Failed",
          message: translateBackendError(err),
        })
      );
    }
  };

  // Live tables formatted
  const tablesList = useMemo(() => {
    return (liveTables || []).map((t, idx) => ({
      table_id: t.table_id || `tbl-${idx + 1}`,
      table_number: t.table_number || `Table ${idx + 1}`,
      table_token: (t as any).table_token,
      isOccupied: t.is_occupied ?? Boolean(t.active_session_id),
      status: t.session_status ?? (t.is_occupied ? "OPEN_VERIFIED" : "FREE"),
      sessionId: t.active_session_id,
      runningTotalMinor: t.running_total_minor ?? 0,
      customerName: t.customer_name || "",
      customerPhone: t.customer_phone || "",
      guestCount: t.guest_count || 0,
      assistanceReason: (t as any).assistance_reason,
    }));
  }, [liveTables]);

  const filteredTables = useMemo(() => {
    if (filterMode === "AVAILABLE") return tablesList.filter((t) => !t.isOccupied);
    if (filterMode === "OCCUPIED") return tablesList.filter((t) => t.isOccupied);
    if (filterMode === "BILL") return tablesList.filter((t) => t.status === "AWAITING_PAYMENT");
    return tablesList;
  }, [tablesList, filterMode]);

  const totalCount = tablesList.length;
  const occupiedCount = tablesList.filter((t) => t.isOccupied).length;
  const availableCount = tablesList.filter((t) => !t.isOccupied).length;
  const assistanceCount = tablesList.filter((t) => Boolean(t.assistanceReason)).length;

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header & Metrics Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-gray-100 flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-primary" />
            Floor Tables & Seating Management
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Real-time table occupancy, walk-in guest check-in, and table billing status for{" "}
            <strong className="text-gray-200">{restaurantName}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="subtle"
            size="sm"
            onClick={() => refetch()}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            className="font-mono text-xs"
          >
            Refresh Floor
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => router.push("/staff/orders")}
            leftIcon={<ShoppingCart className="w-4 h-4" />}
            className="font-bold text-xs"
          >
            Take Order
          </Button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-surface border border-surface-border flex flex-col gap-1">
          <span className="text-[10px] font-mono text-gray-400 uppercase">Total Floor Tables</span>
          <span className="text-2xl font-black font-mono text-gray-100">{totalCount}</span>
          <span className="text-[11px] text-gray-500">Physical dining tables</span>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-surface-border flex flex-col gap-1">
          <span className="text-[10px] font-mono text-gray-400 uppercase">Available / Empty</span>
          <span className="text-2xl font-black font-mono text-emerald-400">{availableCount}</span>
          <span className="text-[11px] text-emerald-500/80">Ready to seat guests</span>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-surface-border flex flex-col gap-1">
          <span className="text-[10px] font-mono text-gray-400 uppercase">Currently Occupied</span>
          <span className="text-2xl font-black font-mono text-amber-400">{occupiedCount}</span>
          <span className="text-[11px] text-amber-500/80">Active dining sessions</span>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-surface-border flex flex-col gap-1">
          <span className="text-[10px] font-mono text-gray-400 uppercase">Waiter Calls</span>
          <span className={`text-2xl font-black font-mono ${assistanceCount > 0 ? "text-red-400 animate-pulse" : "text-gray-400"}`}>
            {assistanceCount}
          </span>
          <span className="text-[11px] text-gray-500">Service requests</span>
        </div>
      </div>

      {/* Floor Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setFilterMode("ALL")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            filterMode === "ALL"
              ? "bg-primary text-black font-extrabold shadow-sm"
              : "bg-surface-subtle text-gray-300 border border-surface-border"
          }`}
        >
          All Tables ({tablesList.length})
        </button>

        <button
          type="button"
          onClick={() => setFilterMode("AVAILABLE")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
            filterMode === "AVAILABLE"
              ? "bg-emerald-500 text-black font-extrabold shadow-sm"
              : "bg-surface-subtle text-gray-300 border border-surface-border"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Available ({availableCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterMode("OCCUPIED")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
            filterMode === "OCCUPIED"
              ? "bg-amber-500 text-black font-extrabold shadow-sm"
              : "bg-surface-subtle text-gray-300 border border-surface-border"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span>Occupied ({occupiedCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterMode("BILL")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
            filterMode === "BILL"
              ? "bg-sky-500 text-black font-extrabold shadow-sm"
              : "bg-surface-subtle text-gray-300 border border-surface-border"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-sky-400" />
          <span>Bill Requested ({tablesList.filter((t) => t.status === "AWAITING_PAYMENT").length})</span>
        </button>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredTables.map((t) => {
          const isOccupied = t.isOccupied;
          const isAwaitingOtp = t.status === "OPEN";
          const isAwaitingBill = t.status === "AWAITING_PAYMENT";
          const hasAssistance = Boolean(t.assistanceReason);

          return (
            <Card
              key={t.table_id}
              className={`p-4 rounded-2xl flex flex-col justify-between gap-4 border transition-all duration-200 shadow-md ${
                hasAssistance
                  ? "bg-red-500/10 border-red-500/60 shadow-red-500/10"
                  : isOccupied
                  ? "bg-surface border-surface-border hover:border-amber-400/50"
                  : "bg-surface/60 border-surface-border/70 hover:border-emerald-500/50"
              }`}
            >
              {/* Card Top: Number & Status Badge */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-10 h-10 rounded-xl font-black font-display text-sm flex items-center justify-center border shadow-sm ${
                      isOccupied
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                        : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                    }`}
                  >
                    T{t.table_number.replace(/\D/g, "") || t.table_number}
                  </div>
                  <div>
                    <span className="font-bold text-sm text-gray-100 font-display block">
                      {t.table_number}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {isOccupied ? "Active Session" : "Vacant Table"}
                    </span>
                  </div>
                </div>

                <Badge
                  variant={
                    isOccupied
                      ? isAwaitingOtp
                        ? "amber"
                        : isAwaitingBill
                        ? "blue"
                        : "gold"
                      : "success"
                  }
                  size="sm"
                >
                  {isOccupied
                    ? isAwaitingOtp
                      ? "Awaiting OTP"
                      : isAwaitingBill
                      ? "Bill Asked"
                      : "Occupied"
                    : "Available"}
                </Badge>
              </div>

              {/* Service Call Alert Banner if calling */}
              {hasAssistance && (
                <div className="p-2 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center gap-2 text-red-200 text-xs font-bold animate-pulse">
                  <span className="text-sm">🛎️</span>
                  <span className="truncate">"{t.assistanceReason}"</span>
                </div>
              )}

              {/* Middle: Details depending on state */}
              {isOccupied ? (
                <div className="p-3 rounded-xl bg-surface-subtle border border-surface-border/60 flex flex-col gap-1.5 text-xs">
                  <div className="flex justify-between items-center text-gray-300">
                    <span className="text-gray-400">Guest:</span>
                    <span className="font-bold text-gray-100 truncate max-w-[120px]">
                      {t.customerName || "Diner"}
                    </span>
                  </div>
                  {t.guestCount > 0 && (
                    <div className="flex justify-between items-center text-gray-300">
                      <span className="text-gray-400">Covers:</span>
                      <span className="font-mono text-primary font-bold">
                        {t.guestCount} Guests
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-gray-300 pt-1 border-t border-surface-border/40">
                    <span className="text-gray-400">Running Total:</span>
                    <span className="font-mono font-black text-amber-400 text-sm">
                      {formatMoney(t.runningTotalMinor)}
                    </span>
                  </div>
                </div>
              ) : (
                /* Empty Table State: Ready for Walk-in Guests (Issue 7) */
                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex flex-col items-center justify-center text-center gap-1.5 min-h-[90px]">
                  <Utensils className="w-5 h-5 text-emerald-400/80 mb-0.5" />
                  <span className="text-xs font-bold text-emerald-300">
                    Table Ready for Dining
                  </span>
                  <span className="text-[10px] text-gray-400">
                    Guests can scan QR or waiter can seat directly
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1 border-t border-surface-border/60">
                {isOccupied ? (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedTable({
                          tableNumber: t.table_number,
                          tableId: t.table_id,
                          tableToken: t.table_token,
                          sessionId: t.sessionId,
                          status: t.status,
                          customerName: t.customerName,
                          customerPhone: t.customerPhone,
                          guestCount: t.guestCount,
                          isOccupied: true,
                        })
                      }
                      className="flex-1 py-2 px-3 rounded-xl bg-surface-subtle hover:bg-surface-hover border border-surface-border text-gray-200 text-xs font-bold transition-all text-center"
                    >
                      Manage Table
                    </button>

                    <button
                      type="button"
                      onClick={() => router.push(`/staff/orders?table=${t.table_number}`)}
                      className="py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-extrabold transition-all flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Order
                    </button>
                  </>
                ) : (
                  /* Issue 7: Walk-in Seat Guests Button */
                  <button
                    type="button"
                    onClick={() =>
                      setSeatGuestTable({
                        tableNumber: t.table_number,
                        tableId: t.table_id,
                        tableToken: t.table_token,
                      })
                    }
                    className="w-full py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Seat Walk-In Guests</span>
                  </button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* WALK-IN GUEST SEATING MODAL (Issue 7: For customers who don't use smartphones) */}
      {seatGuestTable && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-surface-border rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col gap-4 relative animate-scaleUp">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-display text-gray-100">
                    Seat Guests • {seatGuestTable.tableNumber}
                  </h3>
                  <span className="text-[11px] text-gray-400">
                    Initiate dining session on empty table
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSeatGuestTable(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleStartWalkinSession} className="flex flex-col gap-3.5">
              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">
                  Number of Guests (Covers)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 4, 6].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setWalkinGuestCount(num)}
                      className={`py-2 rounded-xl text-xs font-mono font-bold border transition-all ${
                        walkinGuestCount === num
                          ? "bg-emerald-500 text-black border-emerald-400 shadow-sm"
                          : "bg-surface-subtle text-gray-300 border-surface-border"
                      }`}
                    >
                      {num} {num === 1 ? "Person" : "Guests"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">
                  Guest Name (Optional)
                </label>
                <input
                  type="text"
                  value={walkinName}
                  onChange={(e) => setWalkinName(e.target.value)}
                  placeholder="e.g. Walk-in Diner"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-subtle border border-surface-border text-sm text-gray-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">
                  Mobile Number (Optional)
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={walkinPhone}
                    onChange={(e) => setWalkinPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-surface-subtle border border-surface-border text-sm text-gray-100 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  <Phone className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  This creates an immediately verified session. You can take orders on behalf of guests who do not have a smartphone.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSeatGuestTable(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSeating}
                >
                  {isSeating ? "Seating Table..." : "Seat & Activate Table"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TABLE MANAGEMENT DRAWER */}
      <Drawer
        isOpen={Boolean(selectedTable)}
        onClose={() => {
          setSelectedTable(null);
          setShowForceCloseConfirm(false);
        }}
        title={`Table Operations — ${selectedTable?.tableNumber}`}
      >
        {selectedTable && (
          <div className="flex flex-col gap-5 text-gray-100">
            {/* Status Strip */}
            <div className="p-4 rounded-2xl bg-surface-subtle border border-surface-border flex items-center justify-between">
              <div>
                <span className="text-xs text-gray-400 block font-mono">
                  Current Session
                </span>
                <span className="font-bold text-gray-100 text-sm">
                  {selectedTable.customerName || "Diner Guest"}
                </span>
              </div>
              <Badge variant="amber" size="sm">
                {humanizeStatus(selectedTable.status || "ACTIVE")}
              </Badge>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  router.push(`/staff/orders?table=${selectedTable.tableNumber}`);
                }}
                leftIcon={<Plus className="w-4 h-4" />}
                className="font-bold"
              >
                Add Dishes
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  router.push(`/staff/payments`);
                }}
                leftIcon={<Receipt className="w-4 h-4" />}
              >
                Collect Bill
              </Button>
            </div>

            {/* Verify First Order OTP Section */}
            {selectedTable.status === "OPEN" && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col gap-3">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4" />
                  Verify Table OTP
                </span>
                <p className="text-xs text-gray-300">
                  Ask guests for the 4-digit code on their screen or bypass for staff-attended tables.
                </p>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter 4-digit OTP or BYPASS"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    className="flex-1 font-mono text-sm"
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={isVerifying || !otpInput.trim()}
                    onClick={handleVerifyOtp}
                  >
                    {isVerifying ? "Verifying..." : "Verify"}
                  </Button>
                </div>
              </div>
            )}

            {/* Force Close Table Emergency Action */}
            <div className="pt-4 border-t border-surface-border flex flex-col gap-2">
              <span className="text-xs text-gray-400 font-mono uppercase">
                Floor Controls
              </span>
              {!showForceCloseConfirm ? (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setShowForceCloseConfirm(true)}
                  leftIcon={<ShieldAlert className="w-4 h-4" />}
                >
                  Clear & Force Close Table
                </Button>
              ) : (
                <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 flex flex-col gap-2.5">
                  <span className="text-xs font-bold text-red-300">
                    Confirm Force Close? Table will be freed.
                  </span>
                  <input
                    type="text"
                    placeholder="Reason (e.g. Guest walked out, cash paid offline)"
                    value={forceCloseReason}
                    onChange={(e) => setForceCloseReason(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-black border border-red-500/40 text-xs text-gray-100"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowForceCloseConfirm(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={isClosing}
                      onClick={handleForceClose}
                    >
                      {isClosing ? "Closing..." : "Yes, Force Clear"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
