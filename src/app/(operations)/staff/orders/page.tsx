"use client";

import React, { useState } from "react";
import {
  useGetPendingOrdersQuery,
  useAcceptOrderMutation,
  useGetStaffTablesQuery,
  usePlaceStaffOrderMutation,
  useConfirmPaymentMutation,
  useVerifyFirstOrderMutation,
  useForceCloseSessionMutation,
  useStaffVerifyExitMutation,
  useStaffDismissAssistanceMutation,
  PendingOrderEntry,
} from "@/store/api/staffApi";
import {
  useGetKitchenQueueQuery,
  useUpdateKitchenStatusMutation,
} from "@/store/api/kitchenApi";
import { useGetPublicMenuItemsQuery } from "@/store/api/publicApi";
import { formatMoney } from "@/lib/money";
import { humanizeStatus } from "@/lib/statusLabels";
import { addToast } from "@/store/slices/uiSlice";
import { useAppDispatch, useAppSelector } from "@/store";
import { translateBackendError } from "@/lib/errors";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { OrderItem, CartItem, MenuItem } from "@/types/domain";
import { PaymentMethod } from "@/types/enums";
import { formatDestination } from "@/lib/location";
import { generateUUID } from "@/lib/idempotency";
import {
  CheckCircle2,
  Clock,
  Utensils,
  RefreshCw,
  Bell,
  ChefHat,
  BellRing,
  Users,
  User,
  Phone,
  Banknote,
  CreditCard,
  Plus,
  Minus,
  Search,
  ShoppingCart,
  Layers,
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  Receipt,
  X,
  Flame,
  Ticket,
  QrCode,
  Check,
  LogOut,
  Droplets,
  HelpCircle,
  Sparkles,
} from "lucide-react";

function getTimeElapsed(placedAtStr?: string): string {
  if (!placedAtStr) return "recently";
  const elapsedSecs = Math.max(
    0,
    Math.floor((Date.now() - new Date(placedAtStr).getTime()) / 1000)
  );
  if (elapsedSecs < 60) return `${elapsedSecs}s ago`;
  const mins = Math.floor(elapsedSecs / 60);
  return `${mins}m ${elapsedSecs % 60}s ago`;
}

function getItemTotalMinor(item: OrderItem): number {
  if (typeof item.line_total === "number") {
    return item.line_total;
  }
  return item.line_total?.amount_minor_units || 0;
}

function getOrderTotalMinor(total: any): number {
  if (typeof total === "number") return total;
  return total?.amount_minor_units || 0;
}

type WaiterTab =
  | "sessions"
  | "service_calls"
  | "bill_requests"
  | "gate_passes"
  | "pending"
  | "ready_pickup"
  | "kitchen_status";

interface CartDraftItem {
  menuItem: MenuItem;
  quantity: number;
  specialInstructions: string;
}

export default function WaiterOrderScreenPage() {
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);
  const restaurantId = auth.restaurantId || undefined;

  const [activeTab, setActiveTab] = useState<WaiterTab>("sessions");
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);

  // Take Order Modal State
  const [takeOrderTable, setTakeOrderTable] = useState<{
    sessionId: string;
    tableNumber: string;
    customerName: string;
  } | null>(null);
  const [orderCart, setOrderCart] = useState<Record<string, CartDraftItem>>({});
  const [menuSearch, setMenuSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  // Payment Settlement Modal State
  const [paymentTable, setPaymentTable] = useState<{
    sessionId: string;
    tableNumber: string;
    customerName: string;
    totalMinor: number;
  } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    PaymentMethod.CASH
  );
  const [isSettling, setIsSettling] = useState(false);

  // Gate Pass / Exit Pass Approval State
  const [approvePassTable, setApprovePassTable] = useState<{
    sessionId: string;
    tableNumber: string;
    customerName: string;
  } | null>(null);
  const [passOtpInput, setPassOtpInput] = useState("");
  const [isApprovingPass, setIsApprovingPass] = useState(false);

  // OTP Verification Modal State
  const [otpVerifyTable, setOtpVerifyTable] = useState<{
    sessionId: string;
    tableNumber: string;
  } | null>(null);
  const [otpInput, setOtpInput] = useState("");
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  // End Session Confirmation
  const [endSessionTable, setEndSessionTable] = useState<{
    sessionId: string;
    tableNumber: string;
  } | null>(null);
  const [endSessionReason, setEndSessionReason] = useState("");
  const [isEndingSession, setIsEndingSession] = useState(false);

  // RTK Query hooks
  const {
    data: tablesData,
    isLoading: isTablesLoading,
    refetch: refetchTables,
  } = useGetStaffTablesQuery(restaurantId, { pollingInterval: 3500 });

  const {
    data: pendingOrders,
    isLoading: isPendingLoading,
    refetch: refetchPending,
  } = useGetPendingOrdersQuery(undefined, { pollingInterval: 3000 });

  const { data: kitchenQueue, refetch: refetchKitchen } =
    useGetKitchenQueueQuery(restaurantId, { pollingInterval: 3500 });

  const { data: menuItems } = useGetPublicMenuItemsQuery(
    { restaurantId },
    { skip: !takeOrderTable }
  );

  // Mutations
  const [acceptOrder] = useAcceptOrderMutation();
  const [updateKitchenStatus] = useUpdateKitchenStatusMutation();
  const [placeStaffOrder, { isLoading: isSubmittingOrder }] =
    usePlaceStaffOrderMutation();
  const [confirmPayment] = useConfirmPaymentMutation();
  const [verifyFirstOrder] = useVerifyFirstOrderMutation();
  const [forceCloseSession] = useForceCloseSessionMutation();
  const [staffVerifyExit] = useStaffVerifyExitMutation();
  const [staffDismissAssistance] = useStaffDismissAssistanceMutation();
  const [dismissingAssistSessionId, setDismissingAssistSessionId] = useState<string | null>(null);

  const allTables = tablesData || [];
  const activeSessionsList = allTables.filter((t) => t.is_occupied || t.active_session_id);
  const serviceCallsList = activeSessionsList.filter(
    (t) => Boolean(t.assistance_reason)
  );
  const billRequestsList = activeSessionsList.filter(
    (t) => t.session_status === "AWAITING_PAYMENT"
  );
  const gatePassList = activeSessionsList.filter(
    (t) => t.session_status === "PAID"
  );
  const pendingList = pendingOrders || [];
  const allKitchenOrders = kitchenQueue || [];

  const handleDismissAssistance = async (sessionId: string, tableNumber: string) => {
    setDismissingAssistSessionId(sessionId);
    try {
      await staffDismissAssistance({ sessionId }).unwrap();
      dispatch(
        addToast({
          type: "success",
          title: `Table ${tableNumber} Attended ✅`,
          message: "Service request marked completed.",
          durationMs: 2500,
        })
      );
      refetchTables();
    } catch (err) {
      console.error("Failed to dismiss assistance:", err);
      dispatch(
        addToast({
          type: "error",
          title: "Action Failed",
          message: translateBackendError(err),
        })
      );
    } finally {
      setDismissingAssistSessionId(null);
    }
  };

  const readyForPickupList = allKitchenOrders.filter(
    (ord) => ord.status === "READY"
  );
  const inKitchenList = allKitchenOrders.filter(
    (ord) =>
      ord.status === "ACCEPTED" ||
      ord.status === "PREPARING" ||
      ord.status === "PLACED_VERIFIED"
  );

  const handleRefreshAll = async () => {
    await Promise.all([refetchTables(), refetchPending(), refetchKitchen()]);
    dispatch(
      addToast({
        type: "info",
        title: "Floor Synchronized",
        message: "Real-time orders, sessions, and kitchen tickets updated.",
        durationMs: 1500,
      })
    );
  };

  const handleAcceptOrder = async (orderId: string, tableNumber: string) => {
    setProcessingOrderId(orderId);
    try {
      await acceptOrder({ orderId }).unwrap();
      dispatch(
        addToast({
          type: "success",
          title: "Order Accepted!",
          message: `Table ${tableNumber} order dispatched to the kitchen queue.`,
        })
      );
      await Promise.all([refetchPending(), refetchKitchen(), refetchTables()]);
    } catch (err: any) {
      console.error("Failed to accept order:", err);
      dispatch(
        addToast({
          type: "error",
          title: "Order Acceptance Failed",
          message: err?.data?.error || "Could not accept order.",
        })
      );
    } finally {
      setProcessingOrderId(null);
    }
  };

  const handleMarkServed = async (orderId: string, tableNumber: string) => {
    setProcessingOrderId(orderId);
    try {
      await updateKitchenStatus({
        orderId,
        data: { status: "SERVED" as any },
      }).unwrap();
      dispatch(
        addToast({
          type: "success",
          title: "Order Served!",
          message: `Order delivered to ${tableNumber} by ${auth.userName || "Waiter"}.`,
        })
      );
      refetchKitchen();
      refetchTables();
    } catch (err: any) {
      console.error("Failed to mark served:", err);
      dispatch(
        addToast({
          type: "error",
          title: "Failed",
          message: err?.data?.error || "Could not mark order as served.",
        })
      );
    } finally {
      setProcessingOrderId(null);
    }
  };

  // Cart Handlers for Take Order
  const handleAddToCart = (item: MenuItem) => {
    setOrderCart((prev) => {
      const existing = prev[item.id];
      const newQty = existing ? existing.quantity + 1 : 1;
      return {
        ...prev,
        [item.id]: {
          menuItem: item,
          quantity: newQty,
          specialInstructions: existing?.specialInstructions || "",
        },
      };
    });
  };

  const handleUpdateCartQty = (itemId: string, delta: number) => {
    setOrderCart((prev) => {
      const existing = prev[itemId];
      if (!existing) return prev;
      const newQty = existing.quantity + delta;
      if (newQty <= 0) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      return {
        ...prev,
        [itemId]: { ...existing, quantity: newQty },
      };
    });
  };

  const handleUpdateCartNote = (itemId: string, note: string) => {
    setOrderCart((prev) => {
      const existing = prev[itemId];
      if (!existing) return prev;
      return {
        ...prev,
        [itemId]: { ...existing, specialInstructions: note },
      };
    });
  };

  const handleSubmitStaffOrder = async () => {
    if (!takeOrderTable) return;
    const cartItemsList: CartItem[] = Object.values(orderCart).map((draft) => ({
      menu_item_id: draft.menuItem.id,
      quantity: draft.quantity,
      special_instructions: draft.specialInstructions || undefined,
    }));

    if (cartItemsList.length === 0) {
      dispatch(
        addToast({
          type: "warning",
          title: "Empty Order",
          message: "Please add at least one dish to submit.",
        })
      );
      return;
    }

    try {
      await placeStaffOrder({
        sessionId: takeOrderTable.sessionId,
        items: cartItemsList,
      }).unwrap();

      dispatch(
        addToast({
          type: "success",
          title: "Order Dispatched!",
          message: `Order for Table ${takeOrderTable.tableNumber} added and sent to kitchen.`,
        })
      );
      setTakeOrderTable(null);
      setOrderCart({});
      handleRefreshAll();
    } catch (err) {
      console.error("Staff order submission failed:", err);
      dispatch(
        addToast({
          type: "error",
          title: "Order Failed",
          message: translateBackendError(err),
        })
      );
    }
  };

  // Payment Settlement Handler
  const handleSettlePayment = async () => {
    if (!paymentTable) return;
    setIsSettling(true);
    try {
      await confirmPayment({
        data: {
          session_id: paymentTable.sessionId,
          amount_minor: paymentTable.totalMinor,
          method: paymentMethod,
        },
        idempotencyKey: generateUUID(),
      }).unwrap();

      dispatch(
        addToast({
          type: "success",
          title: "Payment Settled! 💳",
          message: `Table ${paymentTable.tableNumber} bill of ${formatMoney(
            paymentTable.totalMinor
          )} marked PAID. Exit pass issued.`,
        })
      );
      const settledTable = { ...paymentTable };
      setPaymentTable(null);
      handleRefreshAll();

      // Automatically open Gate Pass approval dialog for convenience
      setApprovePassTable({
        sessionId: settledTable.sessionId,
        tableNumber: settledTable.tableNumber,
        customerName: settledTable.customerName,
      });
    } catch (err) {
      console.error("Payment settlement error:", err);
      dispatch(
        addToast({
          type: "error",
          title: "Settlement Failed",
          message: translateBackendError(err),
        })
      );
    } finally {
      setIsSettling(false);
    }
  };

  const [directExitingSessionId, setDirectExitingSessionId] = useState<string | null>(null);

  // 1-Click Direct Manual Exit Handler (No QR / code needed)
  const handleDirectManualExit = async (sessionId: string, tableNumber: string) => {
    setDirectExitingSessionId(sessionId);
    try {
      const resp = await staffVerifyExit({
        sessionId,
        otpCode: "DIRECT_STAFF",
      }).unwrap();

      if (resp.result === "APPROVED") {
        dispatch(
          addToast({
            type: "success",
            title: `Table ${tableNumber} Exited 🚪`,
            message: `Table ${tableNumber} marked exited & table cleared. Ready for new diners.`,
          })
        );
        handleRefreshAll();
      } else {
        dispatch(
          addToast({
            type: "error",
            title: "Manual Exit Failed",
            message: `Status: ${resp.reason || "Could not clear table"}`,
          })
        );
      }
    } catch (err) {
      console.error("Manual exit error:", err);
      dispatch(
        addToast({
          type: "error",
          title: "Manual Exit Failed",
          message: translateBackendError(err),
        })
      );
    } finally {
      setDirectExitingSessionId(null);
    }
  };

  // Gate Pass / Exit Pass Approval Handler
  const handleApproveGatePass = async (overrideBypass = false) => {
    if (!approvePassTable) return;
    setIsApprovingPass(true);
    try {
      const codeToSend = overrideBypass ? "DIRECT_STAFF" : (passOtpInput.trim() || "DIRECT_STAFF");
      const resp = await staffVerifyExit({
        sessionId: approvePassTable.sessionId,
        otpCode: codeToSend,
      }).unwrap();

      if (resp.result === "APPROVED") {
        dispatch(
          addToast({
            type: "success",
            title: "Gate Pass Approved! 🎟️",
            message: `Table ${approvePassTable.tableNumber} exit pass verified. Table is now cleared & completed.`,
          })
        );
        setApprovePassTable(null);
        setPassOtpInput("");
        handleRefreshAll();
      } else {
        dispatch(
          addToast({
            type: "error",
            title: "Gate Pass Verification Failed",
            message: `Status: ${resp.reason || "Invalid pass or session not paid"}`,
          })
        );
      }
    } catch (err) {
      console.error("Gate pass verification error:", err);
      dispatch(
        addToast({
          type: "error",
          title: "Gate Pass Error",
          message: translateBackendError(err),
        })
      );
    } finally {
      setIsApprovingPass(false);
    }
  };

  // OTP Verification Handler
  const handleVerifyOtp = async () => {
    if (!otpVerifyTable || !otpInput.trim()) return;
    setIsVerifyingOtp(true);
    try {
      await verifyFirstOrder({
        sessionId: otpVerifyTable.sessionId,
        data: { otp: otpInput.trim() },
      }).unwrap();

      dispatch(
        addToast({
          type: "success",
          title: "Table Verified!",
          message: `Table ${otpVerifyTable.tableNumber} is verified and unlocked for kitchen prep.`,
        })
      );
      setOtpVerifyTable(null);
      setOtpInput("");
      handleRefreshAll();
    } catch (err) {
      console.error("OTP verification error:", err);
      dispatch(
        addToast({
          type: "error",
          title: "Invalid OTP",
          message: translateBackendError(err),
        })
      );
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Force Close Session Handler
  const handleEndSession = async () => {
    if (!endSessionTable) return;
    setIsEndingSession(true);
    try {
      await forceCloseSession({
        sessionId: endSessionTable.sessionId,
        data: { reason: endSessionReason || "Waiter completed dining session" },
        idempotencyKey: generateUUID(),
      }).unwrap();

      dispatch(
        addToast({
          type: "warning",
          title: "Session Ended",
          message: `Table ${endSessionTable.tableNumber} has been freed and reset for new diners.`,
        })
      );
      setEndSessionTable(null);
      setEndSessionReason("");
      handleRefreshAll();
    } catch (err) {
      console.error("End session error:", err);
      dispatch(
        addToast({
          type: "error",
          title: "Failed to End Session",
          message: translateBackendError(err),
        })
      );
    } finally {
      setIsEndingSession(false);
    }
  };

  // Categories extraction for Menu Pad
  const categoriesList = React.useMemo(() => {
    if (!menuItems) return [];
    const set = new Set<string>();
    menuItems.forEach((m) => {
      if (m.category_name) set.add(m.category_name);
    });
    return Array.from(set);
  }, [menuItems]);

  const filteredMenuItems = React.useMemo(() => {
    if (!menuItems) return [];
    return menuItems.filter((item) => {
      const matchCat =
        selectedCategory === "ALL" || item.category_name === selectedCategory;
      const matchSearch =
        !menuSearch.trim() ||
        item.name.toLowerCase().includes(menuSearch.toLowerCase()) ||
        item.description?.toLowerCase().includes(menuSearch.toLowerCase());
      return matchCat && matchSearch && item.is_available;
    });
  }, [menuItems, selectedCategory, menuSearch]);

  const cartTotalMinor = Object.values(orderCart).reduce(
    (sum, draft) =>
      sum +
      (draft.menuItem.price?.amount_minor_units || 0) * draft.quantity,
    0
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Waiter Header & Live Shift Summary */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-surface to-surface-elevated border border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-bold border border-primary/30">
            <Utensils className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-100 font-display">
              {auth.userName || "Floor Waiter"}{" "}
              <span className="text-xs text-gray-400 font-mono ml-1">
                {auth.employeeId || ""}
              </span>
            </p>
            <p className="text-[11px] text-gray-400">
              Floor & Order Management • {auth.restaurantName || "Restaurant"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="subtle"
            size="sm"
            onClick={handleRefreshAll}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Sync Floor
          </Button>
        </div>
      </div>

      {/* Tab Navigation (7 unified tabs) */}
      <div className="flex flex-wrap gap-2">
        {/* Tab 1: Active Tables / Sessions */}
        <button
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all border ${
            activeTab === "sessions"
              ? "bg-primary/20 text-primary border-primary/50 shadow-glow"
              : "bg-surface text-gray-400 border-surface-border hover:border-gray-500"
          }`}
          onClick={() => setActiveTab("sessions")}
        >
          <div className="flex items-center gap-1.5">
            <Layers className="w-4 h-4" />
            Active Sessions
            {activeSessionsList.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-primary text-background font-mono">
                {activeSessionsList.length}
              </span>
            )}
          </div>
        </button>

        {/* Tab 2: Service Calls (Water, Cutlery, Cleaning) */}
        <button
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all border ${
            activeTab === "service_calls"
              ? "bg-sky-500/20 text-sky-300 border-sky-500/60 shadow-glow"
              : "bg-surface text-gray-400 border-surface-border hover:border-gray-500"
          }`}
          onClick={() => setActiveTab("service_calls")}
        >
          <div className="flex items-center gap-1.5">
            <Bell className={`w-4 h-4 ${serviceCallsList.length > 0 ? "text-amber-400 animate-bounce" : ""}`} />
            Service Calls
            {serviceCallsList.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500 text-black font-mono animate-pulse">
                {serviceCallsList.length} PING
              </span>
            )}
          </div>
        </button>

        {/* Tab 3: Bill Requests / Settle (Highlighted Alert) */}
        <button
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all border ${
            activeTab === "bill_requests"
              ? "bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-glow"
              : "bg-surface text-gray-400 border-surface-border hover:border-gray-500"
          }`}
          onClick={() => setActiveTab("bill_requests")}
        >
          <div className="flex items-center gap-1.5">
            <Bell className={`w-4 h-4 ${billRequestsList.length > 0 ? "text-amber-400 animate-bounce" : ""}`} />
            Bill Requests
            {billRequestsList.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500 text-black font-mono animate-pulse">
                {billRequestsList.length} PING
              </span>
            )}
          </div>
        </button>

        {/* Tab 3: Gate Passes / Exit Clearance */}
        <button
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all border ${
            activeTab === "gate_passes"
              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/60 shadow-glow"
              : "bg-surface text-gray-400 border-surface-border hover:border-gray-500"
          }`}
          onClick={() => setActiveTab("gate_passes")}
        >
          <div className="flex items-center gap-1.5">
            <Ticket className="w-4 h-4" />
            Gate Passes
            {gatePassList.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500 text-black font-mono animate-pulse">
                {gatePassList.length} PAID
              </span>
            )}
          </div>
        </button>

        {/* Tab 4: New Orders */}
        <button
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all border ${
            activeTab === "pending"
              ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
              : "bg-surface text-gray-400 border-surface-border hover:border-gray-500"
          }`}
          onClick={() => setActiveTab("pending")}
        >
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            New Orders
            {pendingList.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500 text-black font-mono">
                {pendingList.length}
              </span>
            )}
          </div>
        </button>

        {/* Tab 5: Ready for Pickup */}
        <button
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all border ${
            activeTab === "ready_pickup"
              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-glow"
              : "bg-surface text-gray-400 border-surface-border hover:border-gray-500"
          }`}
          onClick={() => setActiveTab("ready_pickup")}
        >
          <div className="flex items-center gap-1.5">
            <BellRing className="w-4 h-4" />
            Ready for Pickup
            {readyForPickupList.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500 text-black font-mono animate-pulse">
                {readyForPickupList.length}
              </span>
            )}
          </div>
        </button>

        {/* Tab 6: In Kitchen */}
        <button
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all border ${
            activeTab === "kitchen_status"
              ? "bg-sky-500/20 text-sky-300 border-sky-500/50"
              : "bg-surface text-gray-400 border-surface-border hover:border-gray-500"
          }`}
          onClick={() => setActiveTab("kitchen_status")}
        >
          <div className="flex items-center gap-1.5">
            <ChefHat className="w-4 h-4" />
            In Kitchen
            {inKitchenList.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-sky-500 text-black font-mono">
                {inKitchenList.length}
              </span>
            )}
          </div>
        </button>
      </div>

      {/* TAB 1: ACTIVE SESSIONS & OCCUPIED TABLES */}
      {activeTab === "sessions" && (
        <div className="flex flex-col gap-4">
          {isTablesLoading ? (
            <div className="py-20 text-center text-gray-500 text-xs font-mono bg-surface rounded-2xl border border-surface-border p-6 animate-pulse">
              Loading active dining tables...
            </div>
          ) : activeSessionsList.length === 0 ? (
            <div className="py-20 text-center bg-surface rounded-2xl border border-surface-border p-6">
              <Layers className="w-10 h-10 text-gray-500 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-gray-200 font-display mb-1">
                No Active Sessions
              </h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                No diners are currently seated. Seated diners will show up here with live totals, ordering pad, payment collection, and gate pass approvals.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeSessionsList.map((t) => {
                const isUnverified = t.session_status === "OPEN";
                const isAwaitingPayment = t.session_status === "AWAITING_PAYMENT";
                const isPaid = t.session_status === "PAID";
                const isVerified = t.session_status === "OPEN_VERIFIED";
                const totalMinor = t.running_total_minor || 0;
                const custName = t.customer_name || "Guest Diner";

                return (
                  <Card
                    key={t.table_id}
                    className={`p-5 flex flex-col justify-between gap-4 transition-all shadow-lg ${
                      isPaid
                        ? "border-emerald-500/80 bg-emerald-500/[0.04] shadow-glow"
                        : isAwaitingPayment
                        ? "border-amber-500 bg-amber-500/5 shadow-glow"
                        : isUnverified
                        ? "border-amber-500/60 bg-surface"
                        : "border-surface-border bg-surface"
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-xl font-black font-display text-base flex items-center justify-center border ${
                          isPaid
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                            : isAwaitingPayment
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                            : "bg-primary/20 text-primary border-primary/40"
                        }`}>
                          {t.table_number}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-gray-100 font-display flex items-center gap-2">
                            Table {t.table_number}
                          </h3>
                          <div className="flex items-center gap-1.5 text-xs text-gray-300 font-medium mt-0.5">
                            <span className="text-primary font-semibold">{custName}</span>
                            <span className="text-gray-600">•</span>
                            <span className="text-gray-400 font-mono text-[11px] flex items-center gap-1">
                              <Users className="w-3 h-3 text-primary" />
                              {t.guest_count || 2}p
                            </span>
                          </div>
                        </div>
                      </div>

                      <Badge
                        variant={
                          isPaid
                            ? "success"
                            : isAwaitingPayment
                            ? "gold"
                            : isVerified
                            ? "success"
                            : isUnverified
                            ? "amber"
                            : "default"
                        }
                        size="sm"
                        dot
                      >
                        {isPaid
                          ? "🎟️ PAID • Exit Pass"
                          : isAwaitingPayment
                          ? "🔔 Bill Requested"
                          : isUnverified
                          ? "Needs OTP"
                          : humanizeStatus(t.session_status || "ACTIVE")}
                      </Badge>
                    </div>

                    {/* Financial Summary */}
                    <div className="p-3 rounded-xl bg-surface-subtle border border-surface-border flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 uppercase font-semibold">
                          {isPaid ? "Settled Total" : "Current Running Bill"}
                        </span>
                        <span className="text-lg font-black font-mono text-primary">
                          {formatMoney(totalMinor)}
                        </span>
                      </div>
                      <Receipt className="w-6 h-6 text-gray-500" />
                    </div>

                    {/* Live Waiter Service Call Alert */}
                    {t.assistance_reason && (
                      <div className="p-3 rounded-xl bg-amber-500/20 border-2 border-amber-500/80 shadow-glow flex items-center justify-between gap-2 animate-pulse-subtle">
                        <div className="flex items-center gap-2 min-w-0">
                          <Bell className="w-5 h-5 text-amber-400 shrink-0 animate-bounce" />
                          <div className="min-w-0">
                            <span className="text-[10px] uppercase font-mono font-black tracking-wider text-amber-300 flex items-center gap-1">
                              Service Call 🛎️
                            </span>
                            <p className="text-xs font-bold text-white truncate">
                              {t.assistance_reason}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="gold"
                          size="sm"
                          isLoading={dismissingAssistSessionId === t.active_session_id}
                          onClick={() =>
                            handleDismissAssistance(t.active_session_id!, t.table_number)
                          }
                          leftIcon={<Check className="w-3.5 h-3.5" />}
                          className="font-bold text-xs shrink-0 shadow-sm"
                        >
                          Attended ✅
                        </Button>
                      </div>
                    )}

                    {/* Waiter Actions Matrix */}
                    <div className="flex flex-col gap-2 pt-2 border-t border-surface-border/50">
                      {isPaid ? (
                        /* When session is PAID, show primary 1-Click Manual Exit button */
                        <div className="flex flex-col gap-2">
                          <Button
                            variant="primary"
                            size="md"
                            isLoading={directExitingSessionId === t.active_session_id}
                            onClick={() =>
                              handleDirectManualExit(t.active_session_id!, t.table_number)
                            }
                            leftIcon={<LogOut className="w-4 h-4" />}
                            className="w-full font-bold shadow-md shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-500 text-white"
                          >
                            1-Click Manual Exit 🚪
                          </Button>
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() =>
                                setApprovePassTable({
                                  sessionId: t.active_session_id!,
                                  tableNumber: t.table_number,
                                  customerName: custName,
                                })
                              }
                              leftIcon={<Ticket className="w-3.5 h-3.5" />}
                              className="text-xs"
                            >
                              Pass Code 🎟️
                            </Button>
                            <Button
                              variant="subtle"
                              size="sm"
                              onClick={() => {
                                setTakeOrderTable({
                                  sessionId: t.active_session_id!,
                                  tableNumber: t.table_number,
                                  customerName: custName,
                                });
                                setOrderCart({});
                              }}
                              leftIcon={<Plus className="w-3.5 h-3.5" />}
                              className="text-xs"
                            >
                              Add Dishes
                            </Button>
                          </div>
                        </div>
                      ) : (
                        /* When session is OPEN or AWAITING PAYMENT */
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setTakeOrderTable({
                                sessionId: t.active_session_id!,
                                tableNumber: t.table_number,
                                customerName: custName,
                              });
                              setOrderCart({});
                            }}
                            leftIcon={<Plus className="w-3.5 h-3.5" />}
                            className="font-bold text-xs"
                          >
                            Take Order
                          </Button>

                          <Button
                            variant={isAwaitingPayment ? "gold" : "primary"}
                            size="sm"
                            onClick={() => {
                              setPaymentTable({
                                sessionId: t.active_session_id!,
                                tableNumber: t.table_number,
                                customerName: custName,
                                totalMinor: totalMinor,
                              });
                            }}
                            leftIcon={<Banknote className="w-3.5 h-3.5" />}
                            className="font-bold text-xs shadow-sm"
                          >
                            {isAwaitingPayment ? "Collect Bill 💳" : "Settle Bill"}
                          </Button>
                        </div>
                      )}

                      {/* Secondary Actions: OTP, Direct Gate Pass, & Free Table */}
                      <div className="flex items-center justify-between text-xs pt-1">
                        {isUnverified ? (
                          <button
                            onClick={() =>
                              setOtpVerifyTable({
                                sessionId: t.active_session_id!,
                                tableNumber: t.table_number,
                              })
                            }
                            className="text-amber-400 font-bold hover:underline flex items-center gap-1 text-[11px]"
                          >
                            <KeyRound className="w-3.5 h-3.5" /> Verify OTP
                          </button>
                        ) : isPaid ? (
                          <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> Paid & Ready for Exit
                          </span>
                        ) : (
                          <button
                            onClick={() =>
                              setApprovePassTable({
                                sessionId: t.active_session_id!,
                                tableNumber: t.table_number,
                                customerName: custName,
                              })
                            }
                            className="text-gray-400 hover:text-emerald-300 font-mono text-[11px] flex items-center gap-1"
                          >
                            <Ticket className="w-3 h-3 text-emerald-400" /> Gate Pass
                          </button>
                        )}

                        <button
                          onClick={() =>
                            setEndSessionTable({
                              sessionId: t.active_session_id!,
                              tableNumber: t.table_number,
                            })
                          }
                          className="text-red-400 hover:text-red-300 font-mono text-[11px]"
                        >
                          End Session
                        </button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SERVICE CALLS (WATER, CUTLERY, CLEANING, ETC.) */}
      {activeTab === "service_calls" && (
        <div className="flex flex-col gap-4">
          {serviceCallsList.length === 0 ? (
            <div className="py-20 text-center bg-surface rounded-2xl border border-surface-border p-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-gray-200 font-display mb-1">
                No Pending Service Calls
              </h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                When diners request water refills, cutlery, plate clearing, or table assistance, their calls appear here in real time.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {serviceCallsList.map((t) => {
                const totalMinor = t.running_total_minor || 0;
                const custName = t.customer_name || "Guest Diner";

                return (
                  <Card
                    key={t.table_id}
                    className="p-5 flex flex-col justify-between gap-4 border-amber-500/80 bg-gradient-to-br from-amber-500/10 via-surface to-surface shadow-glow animate-pulse-subtle"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-300 font-black font-display text-lg flex items-center justify-center border border-amber-500/40">
                          {t.table_number}
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-gray-100 font-display">
                            Table {t.table_number}
                          </h3>
                          <div className="flex items-center gap-1.5 text-xs text-gray-300 font-medium mt-0.5">
                            <span className="text-amber-300 font-semibold">{custName}</span>
                            <span className="text-gray-600">•</span>
                            <span className="text-gray-400 font-mono text-[11px]">{t.guest_count || 2}p</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant="gold" size="sm" dot>
                        RINGING
                      </Badge>
                    </div>

                    <div className="p-3.5 rounded-xl bg-surface-subtle border border-amber-500/30 flex items-center gap-3">
                      <Bell className="w-6 h-6 text-amber-400 shrink-0 animate-bounce" />
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-mono font-bold text-amber-300">
                          Assistance Requested:
                        </span>
                        <span className="text-sm font-bold text-gray-100">
                          {t.assistance_reason}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="gold"
                        size="md"
                        isLoading={dismissingAssistSessionId === t.active_session_id}
                        onClick={() =>
                          handleDismissAssistance(t.active_session_id!, t.table_number)
                        }
                        leftIcon={<Check className="w-4 h-4" />}
                        className="w-full font-bold shadow-md shadow-amber-500/20"
                      >
                        Attended ✅
                      </Button>
                      <Button
                        variant="secondary"
                        size="md"
                        onClick={() => {
                          setTakeOrderTable({
                            sessionId: t.active_session_id!,
                            tableNumber: t.table_number,
                            customerName: custName,
                          });
                          setOrderCart({});
                        }}
                        leftIcon={<Plus className="w-4 h-4" />}
                        className="w-full font-bold text-xs"
                      >
                        Add Dishes ➕
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: BILL REQUESTS (CUSTOMER CALLED SERVER) */}
      {activeTab === "bill_requests" && (
        <div className="flex flex-col gap-4">
          {billRequestsList.length === 0 ? (
            <div className="py-20 text-center bg-surface rounded-2xl border border-surface-border p-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-gray-200 font-display mb-1">
                No Pending Bill Requests
              </h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                When customers at tables tap "Request Bill / Call Waiter", their tables will immediately flash here for payment collection.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {billRequestsList.map((t) => {
                const totalMinor = t.running_total_minor || 0;
                const custName = t.customer_name || "Guest Diner";

                return (
                  <Card
                    key={t.table_id}
                    className="p-5 flex flex-col justify-between gap-4 border-amber-500 bg-gradient-to-br from-amber-500/10 via-surface to-surface shadow-glow animate-pulse-subtle"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-300 font-black font-display text-lg flex items-center justify-center border border-amber-500/40">
                          {t.table_number}
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-gray-100 font-display">
                            Table {t.table_number}
                          </h3>
                          <p className="text-xs text-amber-300 font-semibold mt-0.5">
                            Customer requested payment collection
                          </p>
                        </div>
                      </div>
                      <Badge variant="gold" size="sm" dot>
                        RINGING
                      </Badge>
                    </div>

                    <div className="p-3.5 rounded-xl bg-surface-subtle border border-amber-500/30 flex items-center justify-between">
                      <span className="text-xs text-gray-300 font-medium">
                        Balance Payable:
                      </span>
                      <span className="text-xl font-black font-mono text-primary">
                        {formatMoney(totalMinor)}
                      </span>
                    </div>

                    <Button
                      variant="gold"
                      size="md"
                      onClick={() => {
                        setPaymentTable({
                          sessionId: t.active_session_id!,
                          tableNumber: t.table_number,
                          customerName: custName,
                          totalMinor: totalMinor,
                        });
                      }}
                      leftIcon={<Banknote className="w-4 h-4" />}
                      className="w-full font-bold shadow-lg shadow-amber-500/20"
                    >
                      Collect & Settle Payment ({formatMoney(totalMinor)})
                    </Button>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: GATE PASSES / PAID SESSIONS */}
      {activeTab === "gate_passes" && (
        <div className="flex flex-col gap-4">
          {gatePassList.length === 0 ? (
            <div className="py-20 text-center bg-surface rounded-2xl border border-surface-border p-6">
              <Ticket className="w-10 h-10 text-gray-500 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-gray-200 font-display mb-1">
                No Paid Sessions Awaiting Gate Pass
              </h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Once a table's bill is marked PAID, it appears here for 1-click Exit Pass approval and table clearance.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {gatePassList.map((t) => {
                const totalMinor = t.running_total_minor || 0;
                const custName = t.customer_name || "Guest Diner";

                return (
                  <Card
                    key={t.table_id}
                    className="p-5 flex flex-col justify-between gap-4 border-emerald-500/70 bg-gradient-to-br from-emerald-500/10 via-surface to-surface shadow-glow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-300 font-black font-display text-lg flex items-center justify-center border border-emerald-500/40">
                          {t.table_number}
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-gray-100 font-display">
                            Table {t.table_number}
                          </h3>
                          <p className="text-xs text-emerald-300 font-semibold mt-0.5">
                            {custName} • Paid {formatMoney(totalMinor)}
                          </p>
                        </div>
                      </div>
                      <Badge variant="success" size="sm" dot>
                        PAID
                      </Badge>
                    </div>

                    <div className="p-3.5 rounded-xl bg-surface-subtle border border-emerald-500/30 flex items-center justify-between text-xs text-gray-300">
                      <span>Exit Pass issued & active</span>
                      <span className="font-mono text-emerald-400 font-bold">Ready for Departure</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Button
                        variant="primary"
                        size="md"
                        isLoading={directExitingSessionId === t.active_session_id}
                        onClick={() =>
                          handleDirectManualExit(t.active_session_id!, t.table_number)
                        }
                        leftIcon={<LogOut className="w-4 h-4" />}
                        className="w-full font-bold shadow-lg shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
                      >
                        1-Click Manual Exit 🚪
                      </Button>
                      <Button
                        variant="secondary"
                        size="md"
                        onClick={() => {
                          setApprovePassTable({
                            sessionId: t.active_session_id!,
                            tableNumber: t.table_number,
                            customerName: custName,
                          });
                        }}
                        leftIcon={<Ticket className="w-4 h-4" />}
                        className="w-full font-bold text-xs"
                      >
                        Enter Pass Code / QR 🎟️
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: PENDING ORDERS REQUIRING ACCEPTANCE */}
      {activeTab === "pending" && (
        <div className="flex flex-col gap-4">
          {isPendingLoading ? (
            <div className="py-20 text-center text-gray-500 text-xs font-mono bg-surface rounded-2xl border border-surface-border p-6 animate-pulse">
              Loading incoming orders...
            </div>
          ) : pendingList.length === 0 ? (
            <div className="py-20 text-center bg-surface rounded-2xl border border-surface-border p-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-gray-200 font-display mb-1">
                All Orders Accepted
              </h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                No unaccepted tickets waiting. New orders placed by diners will appear here in real time.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingList.map((entry: PendingOrderEntry) => {
                const ord = entry.order;
                const customerName = (ord as any).customer_name || entry.customer_name || "Guest Diner";
                const guestCount = (ord as any).guest_count || entry.guest_count || 1;
                const vehicleNumber = entry.vehicle_number || (ord as any).vehicle_number;
                const dest = formatDestination(
                  entry.table_number || (ord as any).table_number,
                  vehicleNumber,
                  customerName,
                  guestCount
                );
                const isAccepting = processingOrderId === ord.id;
                const totalMinor = getOrderTotalMinor(ord.total);

                return (
                  <Card
                    key={ord.id}
                    className="p-5 flex flex-col justify-between gap-4 border-amber-500/50 bg-amber-500/[0.03] shadow-glow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl font-bold font-display flex items-center justify-center text-sm border bg-amber-500/20 text-amber-300 border-amber-500/40">
                          {dest.shortBadge}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-gray-100 font-display">
                            {dest.display} • Order #{ord.sequence_number}
                          </h3>
                          <div className="flex items-center gap-1.5 text-xs text-gray-300 font-medium mt-0.5">
                            <span className="text-amber-300 font-semibold">{customerName}</span>
                            <span className="text-gray-600">•</span>
                            <span className="text-[11px] text-amber-400 font-mono flex items-center gap-0.5">
                              <Clock className="w-3 h-3" />
                              {getTimeElapsed(ord.placed_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Badge variant="amber" size="sm">Action Required</Badge>
                    </div>

                    <div className="flex flex-col gap-2 p-3 rounded-xl bg-surface-subtle border border-surface-border/60 text-xs">
                      {ord.items && ord.items.length > 0 ? (
                        ord.items.map((item: OrderItem) => (
                          <div key={item.id} className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2">
                              <span className="font-mono font-bold text-amber-400">{item.quantity}x</span>
                              <div>
                                <span className="text-gray-200 font-medium">{item.item_name_snapshot}</span>
                                {item.special_instructions && (
                                  <span className="block text-[10px] text-amber-300 italic">
                                    Note: {item.special_instructions}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="font-mono font-bold text-gray-300">
                              {formatMoney(getItemTotalMinor(item))}
                            </span>
                          </div>
                        ))
                      ) : (
                        <span className="text-gray-500 text-[11px]">Guest Dining Items</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-surface-border/60">
                      <span className="text-base font-extrabold font-mono text-primary">
                        {formatMoney(totalMinor)}
                      </span>
                      <Button
                        variant="gold"
                        size="sm"
                        isLoading={isAccepting}
                        onClick={() => handleAcceptOrder(ord.id, dest.display)}
                        leftIcon={<CheckCircle2 className="w-4 h-4" />}
                        className="font-bold shadow-md shadow-amber-500/20"
                      >
                        Accept & Route to Kitchen
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: READY FOR PICKUP */}
      {activeTab === "ready_pickup" && (
        <div className="flex flex-col gap-4">
          {readyForPickupList.length === 0 ? (
            <div className="py-20 text-center bg-surface rounded-2xl border border-surface-border p-6">
              <ChefHat className="w-10 h-10 text-gray-500 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-gray-200 font-display mb-1">
                No Orders Ready for Pickup
              </h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Orders plated and marked ready by chefs in the kitchen will show up here for table delivery.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {readyForPickupList.map((ord) => {
                const totalMinor = getOrderTotalMinor(ord.total);
                const customerName = (ord as any).customer_name || "Guest Diner";
                const guestCount = (ord as any).guest_count || 1;
                const dest = formatDestination(
                  (ord as any).table_number,
                  (ord as any).vehicle_number,
                  customerName,
                  guestCount
                );
                const isProcessing = processingOrderId === ord.id;

                return (
                  <Card
                    key={ord.id}
                    className="p-5 flex flex-col justify-between gap-4 border-emerald-500/50 bg-emerald-500/[0.03] shadow-glow animate-pulse-subtle"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl font-bold font-display flex items-center justify-center text-sm border bg-emerald-500/20 text-emerald-300 border-emerald-500/40">
                          {dest.shortBadge}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-gray-100 font-display">
                            {dest.display} • Order #{ord.sequence_number}
                          </h3>
                          <div className="flex items-center gap-1.5 text-xs text-gray-300 font-medium mt-0.5">
                            <span className="text-emerald-400 font-bold">Deliver to {customerName}</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant="success" size="sm">🔔 READY</Badge>
                    </div>

                    <div className="flex flex-col gap-2 p-3 rounded-xl bg-surface-subtle border border-emerald-500/20 text-xs">
                      {ord.items?.map((item: any) => (
                        <div key={item.id} className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2">
                            <span className="font-mono font-bold text-emerald-400">{item.quantity}x</span>
                            <span className="text-gray-200 font-medium">{item.item_name_snapshot}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-surface-border/60">
                      <span className="text-base font-extrabold font-mono text-primary">
                        {formatMoney(totalMinor)}
                      </span>
                      <Button
                        variant="primary"
                        size="sm"
                        isLoading={isProcessing}
                        onClick={() => handleMarkServed(ord.id, dest.display)}
                        leftIcon={<Utensils className="w-4 h-4" />}
                        className="font-bold shadow-md shadow-emerald-500/20"
                      >
                        Mark Served to Table ✅
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: IN KITCHEN */}
      {activeTab === "kitchen_status" && (
        <div className="flex flex-col gap-4">
          {inKitchenList.length === 0 ? (
            <div className="py-20 text-center text-gray-500 text-xs font-mono bg-surface rounded-2xl border border-surface-border p-6">
              No active tickets currently cooking in kitchen.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inKitchenList.map((ord) => {
                const totalMinor = getOrderTotalMinor(ord.total);
                const customerName = (ord as any).customer_name || "Guest Diner";
                const guestCount = (ord as any).guest_count || 1;
                const dest = formatDestination(
                  (ord as any).table_number,
                  (ord as any).vehicle_number,
                  customerName,
                  guestCount
                );
                return (
                  <Card
                    key={ord.id}
                    className="p-5 flex flex-col justify-between gap-3 border-surface-border bg-surface"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl font-bold font-display flex items-center justify-center text-sm border bg-surface-subtle text-primary border-surface-border">
                          {dest.shortBadge}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-gray-100 font-display">
                            {dest.display} • Order #{ord.sequence_number}
                          </h3>
                          <div className="flex items-center gap-1.5 text-xs text-gray-300 font-medium mt-0.5">
                            <span className="text-primary font-semibold">{customerName}</span>
                            <span className="text-gray-600">•</span>
                            <span className="text-[11px] text-gray-400 font-mono">
                              Accepted {getTimeElapsed(ord.accepted_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Badge variant={ord.status === "PREPARING" ? "amber" : "blue"}>
                        {humanizeStatus(ord.status)}
                      </Badge>
                    </div>

                    <div className="p-3 rounded-xl bg-surface-subtle text-xs flex flex-col gap-1.5">
                      {ord.items?.map((item: any) => (
                        <div key={item.id} className="flex justify-between text-gray-300">
                          <span>
                            <strong className="text-primary font-mono">{item.quantity}x</strong>{" "}
                            {item.item_name_snapshot}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-surface-border/50 text-gray-400">
                      <span className="text-[11px] flex items-center gap-1 text-sky-400">
                        <Flame className="w-3.5 h-3.5" /> Cooking on station
                      </span>
                      <span className="font-mono font-bold text-gray-200">
                        {formatMoney(totalMinor)}
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ----------------- MODAL: TAKE ORDER PAD ----------------- */}
      {takeOrderTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col border-primary/40 bg-[#12151D] shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-surface-border flex items-center justify-between bg-surface">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-bold font-display">
                  T{takeOrderTable.tableNumber}
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-100 font-display flex items-center gap-2">
                    Take Order • Table {takeOrderTable.tableNumber}
                  </h3>
                  <p className="text-xs text-gray-400">
                    Diner: <strong className="text-primary">{takeOrderTable.customerName}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setTakeOrderTable(null)}
                className="w-8 h-8 rounded-lg bg-surface-subtle hover:bg-surface-border flex items-center justify-center text-gray-400 hover:text-gray-100 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Body: Split 2-column on desktop (Menu List + Cart Summary) */}
            <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-surface-border">
              {/* Left Column: Menu Catalog Search & Selection */}
              <div className="lg:col-span-2 flex flex-col overflow-hidden p-4 gap-3.5">
                {/* Search & Category Filter */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
                    <Input
                      placeholder="Search menu items..."
                      value={menuSearch}
                      onChange={(e) => setMenuSearch(e.target.value)}
                      className="pl-9 text-xs"
                    />
                  </div>
                  <div className="flex gap-1 overflow-x-auto pb-1 max-w-full">
                    <button
                      onClick={() => setSelectedCategory("ALL")}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg shrink-0 border ${
                        selectedCategory === "ALL"
                          ? "bg-primary text-background border-primary"
                          : "bg-surface text-gray-400 border-surface-border"
                      }`}
                    >
                      All
                    </button>
                    {categoriesList.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg shrink-0 border ${
                          selectedCategory === cat
                            ? "bg-primary text-background border-primary"
                            : "bg-surface text-gray-400 border-surface-border"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Items Grid */}
                <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[380px]">
                  {filteredMenuItems.map((item) => {
                    const inCartQty = orderCart[item.id]?.quantity || 0;
                    const priceMinor = item.price?.amount_minor_units || 0;

                    return (
                      <div
                        key={item.id}
                        onClick={() => handleAddToCart(item)}
                        className={`p-3 rounded-xl border flex items-start justify-between gap-2 cursor-pointer transition-all ${
                          inCartQty > 0
                            ? "border-primary/60 bg-primary/5 shadow-sm"
                            : "border-surface-border bg-surface hover:border-gray-500"
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-gray-200 truncate">
                            {item.name}
                          </h4>
                          <span className="text-xs font-mono font-bold text-primary">
                            {formatMoney(priceMinor)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {inCartQty > 0 ? (
                            <span className="px-2 py-0.5 rounded-md bg-primary text-background font-mono text-xs font-bold">
                              {inCartQty} in cart
                            </span>
                          ) : (
                            <Button size="sm" variant="subtle" className="h-7 px-2 text-xs">
                              <Plus className="w-3.5 h-3.5" /> Add
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Order Summary & Dispatch */}
              <div className="flex flex-col justify-between p-4 bg-surface-subtle overflow-y-auto max-h-[480px]">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-surface-border pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                      <ShoppingCart className="w-4 h-4 text-primary" />
                      Order Pad ({Object.keys(orderCart).length} dishes)
                    </span>
                    <span className="text-xs font-mono font-bold text-primary">
                      {formatMoney(cartTotalMinor)}
                    </span>
                  </div>

                  {Object.keys(orderCart).length === 0 ? (
                    <div className="py-12 text-center text-xs text-gray-500">
                      Tap dishes on the left to add to table order ticket.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      {Object.values(orderCart).map((draft) => (
                        <div
                          key={draft.menuItem.id}
                          className="p-2.5 rounded-lg bg-surface border border-surface-border flex flex-col gap-1.5 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-gray-200 truncate max-w-[150px]">
                              {draft.menuItem.name}
                            </span>
                            <span className="font-mono font-bold text-gray-300">
                              {formatMoney(
                                (draft.menuItem.price?.amount_minor_units || 0) *
                                  draft.quantity
                              )}
                            </span>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleUpdateCartQty(draft.menuItem.id, -1)}
                                className="w-6 h-6 rounded bg-surface-subtle border border-surface-border flex items-center justify-center text-gray-300 hover:text-white"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-6 text-center font-mono font-bold text-primary">
                                {draft.quantity}
                              </span>
                              <button
                                onClick={() => handleUpdateCartQty(draft.menuItem.id, 1)}
                                className="w-6 h-6 rounded bg-surface-subtle border border-surface-border flex items-center justify-center text-gray-300 hover:text-white"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            <input
                              type="text"
                              placeholder="Kitchen instruction..."
                              value={draft.specialInstructions}
                              onChange={(e) =>
                                handleUpdateCartNote(
                                  draft.menuItem.id,
                                  e.target.value
                                )
                              }
                              className="text-[11px] px-2 py-1 rounded bg-surface-subtle border border-surface-border text-gray-300 w-32"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Dispatch Button */}
                <div className="pt-4 border-t border-surface-border flex flex-col gap-2">
                  <div className="flex items-center justify-between text-sm font-bold text-gray-100">
                    <span>Order Subtotal:</span>
                    <span className="font-mono text-primary text-base font-black">
                      {formatMoney(cartTotalMinor)}
                    </span>
                  </div>
                  <Button
                    variant="gold"
                    size="lg"
                    isLoading={isSubmittingOrder}
                    disabled={Object.keys(orderCart).length === 0}
                    onClick={handleSubmitStaffOrder}
                    className="w-full font-bold shadow-lg shadow-amber-500/20"
                  >
                    Send Order to Kitchen 🚀
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ----------------- MODAL: SETTLE / MARK PAYMENT ----------------- */}
      {paymentTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <Card className="w-full max-w-md p-6 flex flex-col gap-4 border-emerald-500/50 bg-[#151922] shadow-2xl">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-100 font-display">
                    Settle Bill • Table {paymentTable.tableNumber}
                  </h3>
                  <p className="text-xs text-gray-400">
                    Diner: <strong className="text-emerald-300">{paymentTable.customerName}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPaymentTable(null)}
                className="text-gray-400 hover:text-gray-100 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Bill Amount Display */}
            <div className="p-4 rounded-xl bg-surface-subtle border border-surface-border flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-semibold">
                  Amount Received / Collected
                </span>
                <div className="text-2xl font-black font-mono text-primary">
                  {formatMoney(paymentTable.totalMinor)}
                </div>
              </div>
              <Receipt className="w-8 h-8 text-gray-500" />
            </div>

            {/* Payment Method Options */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Payment Tender Method:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPaymentMethod(PaymentMethod.CASH)}
                  className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all ${
                    paymentMethod === PaymentMethod.CASH
                      ? "border-emerald-500 bg-emerald-500/20 text-emerald-300"
                      : "border-surface-border bg-surface text-gray-400"
                  }`}
                >
                  <Banknote className="w-4 h-4" /> Cash Handover
                </button>

                <button
                  onClick={() => setPaymentMethod(PaymentMethod.RESTAURANT_POS)}
                  className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all ${
                    paymentMethod === PaymentMethod.RESTAURANT_POS
                      ? "border-sky-500 bg-sky-500/20 text-sky-300"
                      : "border-surface-border bg-surface text-gray-400"
                  }`}
                >
                  <CreditCard className="w-4 h-4" /> Card POS Swiped
                </button>
              </div>
            </div>

            {/* Confirmation & Exit Pass trigger */}
            <Button
              variant="primary"
              size="lg"
              isLoading={isSettling}
              onClick={handleSettlePayment}
              className="w-full font-bold mt-2 shadow-lg shadow-emerald-500/20"
            >
              Confirm Received & Issue Exit Pass ✅
            </Button>
          </Card>
        </div>
      )}

      {/* ----------------- MODAL: APPROVE GATE PASS / EXIT CLEARANCE ----------------- */}
      {approvePassTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <Card className="w-full max-w-md p-6 flex flex-col gap-4 border-emerald-500/70 bg-[#131a22] shadow-2xl">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-100 font-display">
                    Approve Gate Pass • Table {approvePassTable.tableNumber}
                  </h3>
                  <p className="text-xs text-gray-400">
                    Diner: <strong className="text-emerald-300">{approvePassTable.customerName}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setApprovePassTable(null)}
                className="text-gray-400 hover:text-gray-100 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-subtle border border-emerald-500/30 flex items-center gap-3">
              <QrCode className="w-8 h-8 text-emerald-400 shrink-0" />
              <p className="text-xs text-gray-300">
                Verify the customer's Exit Pass to release the table and finalize their dining visit.
              </p>
            </div>

            {/* Optional OTP Code input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Customer Exit Pass Code (Optional if directly verifying):
              </label>
              <Input
                placeholder="0000"
                value={passOtpInput}
                onChange={(e) => setPassOtpInput(e.target.value)}
                maxLength={6}
                className="font-mono text-center tracking-widest text-xl font-black text-emerald-400"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2.5 pt-2">
              <Button
                variant="primary"
                size="lg"
                isLoading={isApprovingPass}
                onClick={() => handleApproveGatePass(true)}
                className="w-full font-bold shadow-lg shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-500 text-white"
                leftIcon={<LogOut className="w-4 h-4" />}
              >
                1-Click Manual Exit (Clear Table Now) 🚪
              </Button>

              {passOtpInput.trim() && (
                <Button
                  variant="secondary"
                  size="md"
                  isLoading={isApprovingPass}
                  onClick={() => handleApproveGatePass(false)}
                  className="w-full font-bold text-xs"
                  leftIcon={<Check className="w-4 h-4" />}
                >
                  Verify Entered Code: {passOtpInput}
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setApprovePassTable(null)}
                className="w-full text-xs text-gray-400 hover:text-gray-200"
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ----------------- MODAL: VERIFY FIRST ORDER OTP ----------------- */}
      {otpVerifyTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <Card className="w-full max-w-sm p-6 flex flex-col gap-4 border-amber-500/50 bg-[#161922] shadow-2xl">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-gray-100 font-display">
                  Verify Table {otpVerifyTable.tableNumber} OTP
                </h3>
              </div>
              <button
                onClick={() => setOtpVerifyTable(null)}
                className="text-gray-400 hover:text-gray-100 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-300">
              Enter the 4-digit table verification code displayed on the diner's screen:
            </p>

            <Input
              placeholder="0000"
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value)}
              maxLength={4}
              className="font-mono text-center tracking-widest text-2xl font-black text-primary"
            />

            <Button
              variant="gold"
              size="md"
              isLoading={isVerifyingOtp}
              disabled={otpInput.length !== 4}
              onClick={handleVerifyOtp}
              className="w-full font-bold"
            >
              Verify Table & Send to Kitchen
            </Button>
          </Card>
        </div>
      )}

      {/* ----------------- MODAL: END / FREE SESSION ----------------- */}
      {endSessionTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <Card className="w-full max-w-sm p-6 flex flex-col gap-4 border-red-500/50 bg-[#181416] shadow-2xl">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-400" />
                <h3 className="text-sm font-bold text-gray-100 font-display">
                  End Table {endSessionTable.tableNumber} Session
                </h3>
              </div>
              <button
                onClick={() => setEndSessionTable(null)}
                className="text-gray-400 hover:text-gray-100 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-red-300">
              Are you sure you want to close this session and free the table?
            </p>

            <Input
              placeholder="Reason (e.g. Completed, Walkout)"
              value={endSessionReason}
              onChange={(e) => setEndSessionReason(e.target.value)}
              className="text-xs"
            />

            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1"
                onClick={() => setEndSessionTable(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                className="flex-1 font-bold"
                isLoading={isEndingSession}
                onClick={handleEndSession}
              >
                End & Free Table
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
