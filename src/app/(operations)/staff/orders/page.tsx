"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useGetStaffTablesQuery,
  useGetPendingOrdersQuery,
  usePlaceStaffOrderMutation,
  useAcceptOrderMutation,
  useCancelStaffOrderMutation,
  useConfirmPaymentMutation,
  useForceCloseSessionMutation,
  useStaffVerifyExitMutation,
  useStaffDismissAssistanceMutation,
  useStartStaffSessionMutation,
  useVerifyFirstOrderMutation,
} from "@/store/api/staffApi";
import {
  useGetKitchenQueueQuery,
  useUpdateKitchenStatusMutation,
} from "@/store/api/kitchenApi";
import {
  useGetPublicMenuItemsQuery,
  useGetPublicMenuCategoriesQuery,
} from "@/store/api/publicApi";
import { useAppDispatch, useAppSelector } from "@/store";
import { addToast } from "@/store/slices/uiSlice";
import { logoutStaff } from "@/store/slices/authSlice";
import { translateBackendError } from "@/lib/errors";
import { generateUUID } from "@/lib/idempotency";
import { PaymentMethod } from "@/types/enums";
import "../floor.css";

// SVG path dictionary matching TableOS – Floor Final specification
const P: Record<string, string> = {
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10 21h4"/>',
  rec: '<path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2zM9 8h6M9 12h6"/>',
  ok: '<path d="M5 12l5 5 9-10"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  min: '<path d="M5 12h14"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  pot: '<path d="M6 14a4 4 0 1 1 2-7 4 4 0 0 1 8 0 4 4 0 1 1 2 7v6H6z"/>',
  tbl: '<rect x="3" y="4" width="18" height="6" rx="2"/><path d="M6 10v10M18 10v10"/>',
  send: '<path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  up: '<path d="M6 15l6-6 6 6"/>',
  car: '<path d="M5 17H3v-5l2-5h14l2 5v5h-2M3 12h18M5 17a2 2 0 1 0 4 0M15 17a2 2 0 1 0 4 0M9 17h6"/>',
  card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
  cash: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/>',
  pass: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
};

const SVGIcon = ({ name }: { name: string }) => {
  const path = P[name] || "";
  return (
    <svg
      viewBox="0 0 24 24"
      dangerouslySetInnerHTML={{ __html: path }}
      style={{ display: "inline-block", verticalAlign: "middle" }}
    />
  );
};

// Seating arrangements for 2, 4, 6 & 8 seat tables
const SEAT: Record<number, number[][]> = {
  2: [
    [50, 11],
    [50, 89],
  ],
  4: [
    [50, 11],
    [89, 50],
    [50, 89],
    [11, 50],
  ],
  6: [
    [28, 12],
    [50, 12],
    [72, 12],
    [28, 88],
    [50, 88],
    [72, 88],
  ],
  8: [
    [20, 12],
    [40, 12],
    [60, 12],
    [80, 12],
    [20, 88],
    [40, 88],
    [60, 88],
    [80, 88],
  ],
};

const R = (n: number) =>
  "₹" +
  n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
const R0 = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

function getAgoString(timestampMs: number): string {
  if (!timestampMs) return "";
  const s = Math.max(0, Math.floor((Date.now() - timestampMs) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600)
    return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

interface TableModel {
  id: string; // e.g. "T1", "T2", "C1"
  rawNumber: string;
  tableId: string;
  kind: "table" | "car";
  cap: number;
  guest?: string;
  pax: number;
  st: "free" | "dining";
  sessionStatus?: string;
  runningTotalMinor: number;
  call?: string;
  callT?: number;
  bill?: boolean;
  billT?: number;
  vehicle?: string;
  plate?: string;
  col?: string;
  sessionId?: string;
  orders: Array<{
    id: string;
    rawId: string;
    s: "new" | "kitchen" | "ready" | "served";
    t: number;
    items: Array<[string, number, number]>; // [name, price, qty]
  }>;
}

type FloorFilterMode =
  | "ALL"
  | "SESSIONS"
  | "CALLS"
  | "BILLS"
  | "GATE_PASS"
  | "NEW_ORDERS"
  | "READY_PICKUP"
  | "KITCHEN";

const CATEGORY_GRADIENTS: Record<string, [string, string]> = {
  Starters: ["#f4b23e", "#a2561b"],
  Mains: ["#d4562c", "#5a1f10"],
  Breads: ["#e8d2a0", "#8c6a2c"],
  Desserts: ["#e0356a", "#5a1530"],
  Beverages: ["#38bdf8", "#0369a1"],
  Drinks: ["#38bdf8", "#0369a1"],
  default: ["#E9B24C", "#D4562C"],
};

export default function WaiterFloorScreenPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);
  const restaurantId = auth.restaurantId || undefined;
  const userName = auth.userName || "Vikram";
  const userFirstName = userName.split(" ")[0] || "Vikram";
  const restaurantName = auth.restaurantName || "The Spice Route";

  // Real-time Queries (Driven by WebSocket push)
  const { data: tablesData, refetch: refetchTables } = useGetStaffTablesQuery();
  const { data: pendingOrders, refetch: refetchPending } = useGetPendingOrdersQuery();
  const { data: kitchenQueue, refetch: refetchKitchen } = useGetKitchenQueueQuery();
  const { data: menuItemsData } = useGetPublicMenuItemsQuery({ restaurantId });
  const { data: menuCategoriesData } = useGetPublicMenuCategoriesQuery({
    restaurantId,
  });

  // Mutations
  const [acceptOrder] = useAcceptOrderMutation();
  const [cancelStaffOrder] = useCancelStaffOrderMutation();
  const [updateKitchenStatus] = useUpdateKitchenStatusMutation();
  const [placeStaffOrder, { isLoading: isPlacingOrder }] =
    usePlaceStaffOrderMutation();
  const [confirmPayment, { isLoading: isSettlingPayment }] =
    useConfirmPaymentMutation();
  const [forceCloseSession] = useForceCloseSessionMutation();
  const [staffVerifyExit, { isLoading: isVerifyingExit }] =
    useStaffVerifyExitMutation();
  const [staffDismissAssistance] = useStaffDismissAssistanceMutation();
  const [startStaffSession, { isLoading: isStartingSession }] =
    useStartStaffSessionMutation();
  const [verifyFirstOrder] = useVerifyFirstOrderMutation();

  // Screen State
  const [view, setView] = useState<"floor" | "queue">("floor");
  const [floorFilter, setFloorFilter] = useState<FloorFilterMode>("ALL");
  const [zone, setZone] = useState<"dine" | "car">("dine");
  const [activeSheet, setActiveSheet] = useState<
    "table" | "order" | "pick" | "settle" | "gate" | "guest" | null
  >(null);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [menuSearch, setMenuSearch] = useState<string>("");
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [currentTimeTick, setCurrentTimeTick] = useState(Date.now());
  const [carPlateInput, setCarPlateInput] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Settlement Method Selection
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    PaymentMethod.CASH
  );

  // Walk-in seating form state inside table sheet when table is free
  const [seatingPax, setSeatingPax] = useState<number>(2);
  const [seatingGuestName, setSeatingGuestName] = useState<string>("");
  const [seatingPhone, setSeatingPhone] = useState<string>("");

  // OTP Verification for unverified tables
  const [otpVerifyInput, setOtpVerifyInput] = useState<string>("");
  const [isVerifyingOtp, setIsVerifyingOtp] = useState<boolean>(false);

  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2400);
  };

  // Update clock tick every second for relative timestamps
  useEffect(() => {
    const timer = setInterval(() => setCurrentTimeTick(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Listen for query params e.g. /staff/orders?table=3
  useEffect(() => {
    const tableParam = searchParams.get("table");
    if (tableParam) {
      const match = (tablesData || []).find(
        (t) =>
          t.table_number.toLowerCase() === tableParam.toLowerCase() ||
          t.table_number.replace(/\D/g, "") === tableParam.replace(/\D/g, "")
      );
      if (match) {
        setSelectedTableId(match.table_number);
        setActiveSheet("table");
      }
    }
  }, [searchParams, tablesData]);

  // Transform backend models into Floor tables list (STRICTLY matching active sessions - NO hardcoded or orphaned data)
  const tablesList: TableModel[] = useMemo(() => {
    const rawTables = tablesData || [];
    const pending = pendingOrders || [];
    const kitchen = kitchenQueue || [];

    return rawTables.map((t, idx) => {
      const isCar =
        (t as any).table_type === "CAR_SERVICE" ||
        (t as any).kind === "car" ||
        /^C\d+/i.test(t.table_number) ||
        /^Bay/i.test(t.table_number);

      const tableFormattedId = isCar
        ? t.table_number.startsWith("C") || t.table_number.startsWith("c")
          ? t.table_number.toUpperCase()
          : `C${t.table_number.replace(/\D/g, "") || idx + 1}`
        : t.table_number.startsWith("T") || t.table_number.startsWith("t")
        ? t.table_number.toUpperCase()
        : `T${t.table_number.replace(/\D/g, "") || idx + 1}`;

      const isOccupied = Boolean(t.is_occupied || t.active_session_id);
      const guestName =
        t.customer_name || (isOccupied ? "Walk-in guest" : undefined);
      const paxCount = t.guest_count || (isOccupied ? 2 : 0);

      // ONLY match orders IF this table has an active session!
      // Free tables must never inherit past orders.
      const associatedOrders: TableModel["orders"] = [];

      if (t.active_session_id) {
        // Pending orders
        pending.forEach((po) => {
          const ord = po.order;
          if (!ord) return;
          if (ord.session_id === t.active_session_id) {
            const itemsMap: [string, number, number][] = (ord.items || []).map(
              (it) => [
                it.item_name_snapshot,
                it.unit_price_snapshot?.amount_minor_units
                  ? it.unit_price_snapshot.amount_minor_units / 100
                  : it.line_total?.amount_minor_units
                  ? it.line_total.amount_minor_units / (100 * (it.quantity || 1))
                  : 0,
                it.quantity,
              ]
            );
            associatedOrders.push({
              id: ord.id.slice(-4).toUpperCase(),
              rawId: ord.id,
              s: "new",
              t: ord.placed_at ? new Date(ord.placed_at).getTime() : Date.now(),
              items: itemsMap,
            });
          }
        });

        // Kitchen queue orders
        kitchen.forEach((ko) => {
          const orderId = ko.id || (ko as any).order_id;
          if (ko.session_id === t.active_session_id) {
            if (associatedOrders.some((o) => o.rawId === orderId)) return;
            const statusLower = ko.status.toLowerCase();
            let s: TableModel["orders"][0]["s"] = "kitchen";
            if (statusLower === "ready") s = "ready";
            else if (statusLower === "served") s = "served";
            else if (statusLower === "placed_unverified") s = "new";

            const itemsMap: [string, number, number][] = (ko.items || []).map(
              (it) => [
                it.item_name_snapshot,
                it.unit_price_snapshot?.amount_minor_units
                  ? it.unit_price_snapshot.amount_minor_units / 100
                  : it.line_total?.amount_minor_units
                  ? it.line_total.amount_minor_units / (100 * (it.quantity || 1))
                  : 0,
                it.quantity,
              ]
            );
            associatedOrders.push({
              id: orderId.slice(-4).toUpperCase(),
              rawId: orderId,
              s,
              t: ko.placed_at ? new Date(ko.placed_at).getTime() : Date.now(),
              items: itemsMap,
            });
          }
        });
      }

      const hasBillReq = isOccupied && t.session_status === "AWAITING_PAYMENT";
      const hasCall = isOccupied && Boolean(t.assistance_reason);

      return {
        id: tableFormattedId,
        rawNumber: t.table_number,
        tableId: t.table_id,
        kind: isCar ? "car" : "table",
        cap: t.capacity || (t as any).table?.capacity || 4,
        guest: guestName,
        pax: paxCount,
        st: isOccupied ? "dining" : "free",
        sessionStatus: t.session_status || (isOccupied ? "OPEN" : "FREE"),
        runningTotalMinor: isOccupied ? t.running_total_minor || 0 : 0,
        call: hasCall ? t.assistance_reason! : undefined,
        callT: hasCall ? Date.now() - 45000 : undefined,
        bill: hasBillReq,
        billT: hasBillReq ? Date.now() - 60000 : undefined,
        vehicle: (t as any).vehicle_info || (isCar ? "Car" : undefined),
        plate: (t as any).vehicle_plate || (isCar ? "" : undefined),
        col: isCar ? "#ece8df" : undefined,
        sessionId: t.active_session_id || undefined,
        orders: associatedOrders,
      };
    });
  }, [tablesData, pendingOrders, kitchenQueue]);

  // Current selected table model
  const currentTable = useMemo(() => {
    if (!selectedTableId) return null;
    return (
      tablesList.find(
        (t) =>
          t.id.toLowerCase() === selectedTableId.toLowerCase() ||
          t.rawNumber === selectedTableId
      ) || null
    );
  }, [tablesList, selectedTableId]);

  // Helper calculation functions
  const isCarTable = (t: TableModel) => t.kind === "car";
  const getTableDisplayName = (t: TableModel) =>
    (isCarTable(t) ? "Bay " : "Table ") + t.id.replace(/\D/g, "");

  const sumOrder = (o: TableModel["orders"][0]) =>
    o.items.reduce((s, i) => s + i[1] * i[2], 0);

  // If runningTotalMinor is present from backend session, use it; otherwise compute from orders
  const subTotalTable = (t: TableModel) => {
    if (t.st === "free") return 0;
    if (t.runningTotalMinor > 0) return t.runningTotalMinor / 100;
    return t.orders.reduce((s, o) => s + sumOrder(o), 0);
  };
  const gstTable = (t: TableModel) =>
    t.st === "free" ? 0 : Math.round(subTotalTable(t) * 5) / 100;
  const totalTable = (t: TableModel) =>
    t.st === "free" ? 0 : subTotalTable(t) + gstTable(t);

  // Status computation for table card
  const getTableStatus = (t: TableModel): [string, string, string] => {
    if (t.st === "free")
      return ["free", isCarTable(t) ? "Empty" : "Free", "--mute"];
    if (t.call)
      return ["call", isCarTable(t) ? "Arrived" : "Calling", "--red"];
    if (t.bill) return ["bill", "Bill asked", "--b"];
    if (t.sessionStatus === "PAID") return ["paid", "Paid (Exit)", "--grn"];
    const o = t.orders;
    if (o.some((x) => x.s === "new")) return ["new", "New order", "--b"];
    if (o.some((x) => x.s === "ready"))
      return ["ready", isCarTable(t) ? "Deliver now" : "Food ready", "--grn"];
    if (o.some((x) => x.s === "kitchen")) return ["kit", "Cooking", "--blu"];
    return ["din", "Dining", "--mute"];
  };

  // Operational Lists & Counts
  const activeSessionsList = useMemo(
    () => tablesList.filter((t) => t.st === "dining"),
    [tablesList]
  );
  const serviceCallsList = useMemo(
    () => activeSessionsList.filter((t) => Boolean(t.call)),
    [activeSessionsList]
  );
  const billRequestsList = useMemo(
    () => activeSessionsList.filter((t) => Boolean(t.bill)),
    [activeSessionsList]
  );
  const gatePassList = useMemo(
    () => activeSessionsList.filter((t) => t.sessionStatus === "PAID"),
    [activeSessionsList]
  );
  const pendingOrdersList = pendingOrders || [];
  const kitchenQueueList = kitchenQueue || [];
  const readyPickupList = useMemo(
    () => kitchenQueueList.filter((k) => k.status.toUpperCase() === "READY"),
    [kitchenQueueList]
  );
  const inKitchenList = useMemo(
    () =>
      kitchenQueueList.filter(
        (k) =>
          k.status.toUpperCase() === "ACCEPTED" ||
          k.status.toUpperCase() === "PREPARING" ||
          k.status.toUpperCase() === "PLACED_VERIFIED"
      ),
    [kitchenQueueList]
  );

  // Inbox queue items for "Needs you"
  const queueItems = useMemo(() => {
    const list: Array<{
      k: "call" | "bill" | "new" | "ready" | "kit" | "paid";
      t: TableModel;
      o?: TableModel["orders"][0];
      ts: number;
      u: number;
    }> = [];

    tablesList.forEach((t) => {
      if (t.call)
        list.push({ k: "call", t, ts: t.callT || Date.now(), u: 0 });
      if (t.bill)
        list.push({ k: "bill", t, ts: t.billT || Date.now(), u: 1 });
      if (t.sessionStatus === "PAID")
        list.push({ k: "paid", t, ts: Date.now() - 30000, u: 2 });

      t.orders.forEach((o) => {
        if (o.s === "new") list.push({ k: "new", t, o, ts: o.t, u: 3 });
        else if (o.s === "ready")
          list.push({ k: "ready", t, o, ts: o.t, u: 4 });
        else if (o.s === "kitchen")
          list.push({ k: "kit", t, o, ts: o.t, u: 5 });
      });
    });

    return list.sort((a, b) => a.u - b.u || a.ts - b.ts);
  }, [tablesList]);

  const urgentQueueItems = useMemo(
    () => queueItems.filter((x) => x.k !== "kit"),
    [queueItems]
  );

  // Grouped queue items
  const groupedQueue = useMemo(() => {
    const groups: Record<
      string,
      Array<(typeof queueItems)[0]>
    > = {
      Urgent: [],
      "New orders": [],
      "Ready to serve": [],
      Cooking: [],
    };
    queueItems.forEach((item) => {
      if (item.k === "call" || item.k === "bill" || item.k === "paid")
        groups["Urgent"].push(item);
      else if (item.k === "new") groups["New orders"].push(item);
      else if (item.k === "ready") groups["Ready to serve"].push(item);
      else if (item.k === "kit") groups["Cooking"].push(item);
    });
    return groups;
  }, [queueItems]);

  // Tables partitioned by zone
  const diningTables = useMemo(
    () => tablesList.filter((t) => !isCarTable(t)),
    [tablesList]
  );
  const carTables = useMemo(
    () => tablesList.filter((t) => isCarTable(t)),
    [tablesList]
  );

  // Filtered tables based on operational tab
  const displayedTables = useMemo(() => {
    if (floorFilter === "SESSIONS") return activeSessionsList;
    if (floorFilter === "CALLS") return serviceCallsList;
    if (floorFilter === "BILLS") return billRequestsList;
    if (floorFilter === "GATE_PASS") return gatePassList;
    if (floorFilter === "NEW_ORDERS") {
      const tableIdsWithNew = new Set(
        tablesList.filter((t) => t.orders.some((o) => o.s === "new")).map((t) => t.id)
      );
      return tablesList.filter((t) => tableIdsWithNew.has(t.id));
    }
    if (floorFilter === "READY_PICKUP") {
      const tableIdsWithReady = new Set(
        tablesList.filter((t) => t.orders.some((o) => o.s === "ready")).map((t) => t.id)
      );
      return tablesList.filter((t) => tableIdsWithReady.has(t.id));
    }
    if (floorFilter === "KITCHEN") {
      const tableIdsWithKitchen = new Set(
        tablesList.filter((t) => t.orders.some((o) => o.s === "kitchen")).map((t) => t.id)
      );
      return tablesList.filter((t) => tableIdsWithKitchen.has(t.id));
    }
    return zone === "car" ? carTables : diningTables;
  }, [
    floorFilter,
    zone,
    diningTables,
    carTables,
    activeSessionsList,
    serviceCallsList,
    billRequestsList,
    gatePassList,
    tablesList,
  ]);

  const occupiedZoneTables = displayedTables.filter((t) => t.st === "dining");
  const totalZoneAmount = occupiedZoneTables.reduce(
    (s, t) => s + totalTable(t),
    0
  );

  // Category Formatter
  const formatCategoryName = (name: string): string => {
    const upper = name.trim().toUpperCase();
    if (
      upper === "APPETIZERS" ||
      upper === "APPETIZER" ||
      upper === "STARTER" ||
      upper === "STARTERS"
    ) {
      return "Starters";
    }
    if (
      upper === "MAIN COURSE" ||
      upper === "MAIN COURSES" ||
      upper === "MAINS" ||
      upper === "MAIN"
    ) {
      return "Mains";
    }
    if (upper === "BREADS" || upper === "BREAD") {
      return "Breads";
    }
    if (upper === "DESSERTS" || upper === "DESSERT") {
      return "Desserts";
    }
    if (upper === "BEVERAGES" || upper === "BEVERAGE" || upper === "DRINKS") {
      return "Beverages";
    }
    return name
      .toLowerCase()
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  const categoryMap = useMemo(() => {
    const map: Record<string, string> = {};
    (menuCategoriesData || []).forEach((c) => {
      map[c.id] = formatCategoryName(c.name);
    });
    return map;
  }, [menuCategoriesData]);

  // Menu items list formatted for order sheet (deduplicated)
  const availableMenuDishes = useMemo(() => {
    const raw = menuItemsData || [];
    const seenNames = new Set<string>();
    const dishes: Array<{
      id: string;
      name: string;
      price: number;
      category: string;
      categoryId?: string;
      isVeg: boolean;
    }> = [];

    for (const item of raw) {
      const normalizedName = (item.name || "").trim().toLowerCase();
      if (!normalizedName || seenNames.has(normalizedName)) {
        continue;
      }
      seenNames.add(normalizedName);

      let cat =
        (item.category_id && categoryMap[item.category_id]) ||
        (item.category_name && formatCategoryName(item.category_name));

      if (!cat) {
        const lower = normalizedName;
        if (
          lower.includes("tikka") ||
          lower.includes("corn") ||
          lower.includes("starter") ||
          lower.includes("kebab") ||
          lower.includes("fry") ||
          lower.includes("roll")
        ) {
          cat = "Starters";
        } else if (
          lower.includes("roti") ||
          lower.includes("naan") ||
          lower.includes("bread") ||
          lower.includes("paratha")
        ) {
          cat = "Breads";
        } else if (
          lower.includes("jamun") ||
          lower.includes("dessert") ||
          lower.includes("halwa") ||
          lower.includes("sweet") ||
          lower.includes("ice cream")
        ) {
          cat = "Desserts";
        } else if (
          lower.includes("drink") ||
          lower.includes("beverage") ||
          lower.includes("water") ||
          lower.includes("soda") ||
          lower.includes("cola")
        ) {
          cat = "Beverages";
        } else {
          cat = "Mains";
        }
      }

      dishes.push({
        id: item.id,
        name: item.name.trim(),
        price: (item.price?.amount_minor_units || 0) / 100,
        category: cat,
        categoryId: item.category_id,
        isVeg: Boolean(
          (item as any).is_vegetarian ??
            !(
              normalizedName.includes("chicken") ||
              normalizedName.includes("mutton") ||
              normalizedName.includes("meat") ||
              normalizedName.includes("fish") ||
              normalizedName.includes("egg")
            )
        ),
      });
    }

    return dishes;
  }, [menuItemsData, categoryMap]);

  const menuCategories = useMemo(() => {
    const list = ["All"];
    (menuCategoriesData || []).forEach((c) => {
      const formatted = formatCategoryName(c.name);
      if (!list.includes(formatted)) {
        list.push(formatted);
      }
    });

    availableMenuDishes.forEach((d) => {
      if (d.category && !list.includes(d.category)) {
        list.push(d.category);
      }
    });

    return list;
  }, [menuCategoriesData, availableMenuDishes]);

  const filteredDishes = useMemo(() => {
    const q = menuSearch.toLowerCase().trim();
    return availableMenuDishes.filter((m) => {
      const matchesCat =
        selectedCategory === "All" || m.category === selectedCategory;
      const matchesSearch = !q || m.name.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [availableMenuDishes, selectedCategory, menuSearch]);

  const cartEntries = Object.entries(cart).filter(([_, qty]) => qty > 0);
  const cartTotalQty = cartEntries.reduce((s, [_, q]) => s + q, 0);
  const cartTotalAmount = cartEntries.reduce((s, [name, q]) => {
    const item = availableMenuDishes.find((m) => m.name === name);
    return s + (item ? item.price * q : 0);
  }, 0);

  // SVG Table Graphics Generator
  const renderTableGraphic = (t: TableModel) => {
    const n = t.cap === 2 ? 2 : t.cap === 6 ? 6 : t.cap === 8 ? 8 : 4;
    const p = SEAT[n] || SEAT[4];
    const o = t.st === "free" ? 0 : Math.min(t.pax || 2, n);

    return (
      <svg viewBox="0 0 100 100" className="tg">
        {p.map((c, i) => {
          const v = n === 4 && i % 2 !== 0;
          const w = v ? 12 : 16;
          const h = v ? 16 : 12;
          return (
            <rect
              key={i}
              x={c[0] - w / 2}
              y={c[1] - h / 2}
              width={w}
              height={h}
              rx="5"
              className={`ch ${i < o ? "on" : ""}`}
            />
          );
        })}
        {n === 6 || n === 8 ? (
          <rect x="18" y="27" width="64" height="46" rx="16" className="tp" />
        ) : (
          <circle cx="50" cy="50" r="25" className="tp" />
        )}
      </svg>
    );
  };

  // SVG Car Graphics Generator
  const renderCarGraphic = (t: TableModel) => {
    const isFree = t.st === "free";
    const carColor = t.col || "#c9c3b6";

    return (
      <svg viewBox="0 0 100 100" className="tg">
        <path d="M10 6v88M90 6v88" className="bl" />
        {isFree ? (
          <text x="50" y="62" textAnchor="middle" className="pk">
            P
          </text>
        ) : (
          <>
            <rect x="27" y="20" width="7" height="16" rx="3" fill="#050403" />
            <rect x="66" y="20" width="7" height="16" rx="3" fill="#050403" />
            <rect x="27" y="64" width="7" height="16" rx="3" fill="#050403" />
            <rect x="66" y="64" width="7" height="16" rx="3" fill="#050403" />
            <rect
              x="31"
              y="9"
              width="38"
              height="82"
              rx="15"
              fill={carColor}
            />
            <path d="M36 31l3-9h22l3 9z" fill="#0d0a07b8" />
            <rect
              x="36"
              y="43"
              width="28"
              height="17"
              rx="6"
              fill="#0000001f"
            />
            <rect
              x="36"
              y="68"
              width="28"
              height="9"
              rx="4"
              fill="#0d0a07b8"
            />
          </>
        )}
      </svg>
    );
  };

  // ACTION HANDLERS
  const handleOpenTableSheet = (tableId: string) => {
    const t = tablesList.find(
      (item) => item.id === tableId || item.rawNumber === tableId
    );
    if (t && t.st === "free") {
      setSeatingGuestName("");
      setSeatingPax(Math.min(2, t.cap || 4));
      setSeatingPhone("");
      setCarPlateInput("");
      handleOpenOrderPad(t.id);
      return;
    }
    setSelectedTableId(tableId);
    setActiveSheet("table");
  };

  const handleCloseSheet = () => {
    setActiveSheet(null);
    setSelectedTableId(null);
    setCart({});
    setCarPlateInput("");
    setOtpVerifyInput("");
  };

  const handleOpenOrderPad = (tableId: string) => {
    setSelectedTableId(tableId);
    setCart({});
    setSelectedCategory("All");
    setMenuSearch("");
    setActiveSheet("order");
  };

  const handleSelectTableForNewOrder = (t: TableModel) => {
    setSelectedTableId(t.id);
    if (t.st === "free") {
      setSeatingGuestName("");
      setSeatingPax(Math.min(2, t.cap || 4));
      setSeatingPhone("");
      setCarPlateInput("");
      handleOpenOrderPad(t.id);
    } else {
      setSeatingGuestName(t.guest || "");
      setSeatingPax(t.pax || Math.min(2, t.cap || 4));
      handleOpenOrderPad(t.id);
    }
  };

  const handleConfirmGuestAndOpenOrder = () => {
    if (!selectedTableId || !currentTable) return;
    const maxCap = currentTable.cap || 4;
    if (seatingPax > maxCap) {
      showToast(
        `Cannot seat ${seatingPax} guests. Maximum capacity for ${getTableDisplayName(currentTable)} is ${maxCap} seats.`
      );
      return;
    }
    handleOpenOrderPad(selectedTableId);
  };

  const handleAttendCall = async (t: TableModel) => {
    if (!t.sessionId) return;
    try {
      await staffDismissAssistance({ sessionId: t.sessionId }).unwrap();
      showToast(`${getTableDisplayName(t)} attended`);
      refetchTables();
    } catch (err) {
      showToast(translateBackendError(err) || "Failed to attend");
    }
  };

  const handleAcceptOrderAction = async (t: TableModel, orderId: string) => {
    try {
      await acceptOrder({ orderId }).unwrap();
      showToast("Sent to kitchen");
      refetchPending();
      refetchKitchen();
      refetchTables();
    } catch (err) {
      showToast(translateBackendError(err) || "Failed to accept order");
    }
  };

  const handleCancelOrderAction = async (
    t: TableModel,
    orderId: string,
    status: "new" | "kitchen" | "ready" | "served"
  ) => {
    try {
      const isCookingOrReady = status === "kitchen" || status === "ready";
      const reason = isCookingOrReady
        ? `Force-closed by staff (${status === "ready" ? "Prepared" : "Cooking"} item - Food Wastage)`
        : "Cancelled by staff before cooking started (Kitchen notified)";

      await cancelStaffOrder({ orderId, reason }).unwrap();
      showToast(
        isCookingOrReady
          ? "Item force-closed and recorded as food wastage (kitchen notified)"
          : "Order cancelled before cooking started (kitchen notified)"
      );
      refetchPending();
      refetchKitchen();
      refetchTables();
    } catch (err) {
      showToast(translateBackendError(err) || "Failed to cancel order");
    }
  };

  const handleServeOrderAction = async (t: TableModel, orderId: string) => {
    try {
      await updateKitchenStatus({
        orderId,
        data: { status: "SERVED" as any },
      }).unwrap();
      showToast(
        isCarTable(t) ? "Delivered to car" : "Marked served"
      );
      refetchKitchen();
      refetchTables();
    } catch (err) {
      showToast(translateBackendError(err) || "Failed to mark served");
    }
  };

  // Open Settlement Sheet
  const handleOpenSettlement = (t: TableModel) => {
    if (!t.sessionId) {
      showToast("Table has no active dining session");
      return;
    }
    setSelectedTableId(t.id);
    setActiveSheet("settle");
  };

  // Confirm Settlement Payment
  const handleConfirmSettlement = async () => {
    if (!currentTable || !currentTable.sessionId) return;
    try {
      const amountMinor =
        currentTable.runningTotalMinor > 0
          ? currentTable.runningTotalMinor
          : Math.round(totalTable(currentTable) * 100);

      const activeOrders = currentTable.orders || [];
      const uncookedOrders = activeOrders.filter((o) => o.s === "new");
      const inCookingOrders = activeOrders.filter((o) => o.s === "kitchen");
      const preparedOrders = activeOrders.filter((o) => o.s === "ready");

      await confirmPayment({
        data: {
          session_id: currentTable.sessionId,
          amount_minor: amountMinor,
          method: paymentMethod,
        },
        idempotencyKey: generateUUID(),
      }).unwrap();

      // Ensure all unserved orders are cancelled/force-closed immediately on the client side too
      await Promise.allSettled(
        activeOrders
          .filter((o) => o.s !== "served")
          .map((o) => {
            const isCooking = o.s === "kitchen";
            const isReady = o.s === "ready";
            const reason =
              isCooking || isReady
                ? `Bill settled: force-closed ${isReady ? "prepared" : "cooking"} item (food wastage)`
                : "Bill settled: cancelled unstarted order (kitchen notified)";
            return cancelStaffOrder({ orderId: o.rawId, reason }).unwrap();
          })
      );

      let orderSummaryNote = "";
      if (uncookedOrders.length > 0) {
        orderSummaryNote += ` · ${uncookedOrders.length} unstarted cancelled (kitchen notified)`;
      }
      if (inCookingOrders.length > 0 || preparedOrders.length > 0) {
        const wasteCount = inCookingOrders.length + preparedOrders.length;
        orderSummaryNote += ` · ${wasteCount} force-closed as food wastage`;
      }

      showToast(
        `Bill settled · ${R(amountMinor / 100)} (${paymentMethod}). Exit pass generated${orderSummaryNote}.`
      );
      setActiveSheet(null);
      refetchTables();
      refetchPending();
      refetchKitchen();
    } catch (err) {
      console.error("Payment settlement error:", err);
      showToast(translateBackendError(err) || "Failed to settle payment");
    }
  };

  // Verify First Order OTP
  const handleVerifyOtp = async () => {
    if (!currentTable || !currentTable.sessionId || !otpVerifyInput.trim())
      return;
    setIsVerifyingOtp(true);
    try {
      await verifyFirstOrder({
        sessionId: currentTable.sessionId,
        data: { otp: otpVerifyInput.trim() },
      }).unwrap();
      showToast(`Table ${currentTable.id} verified! Orders unlocked.`);
      setOtpVerifyInput("");
      refetchTables();
    } catch (err) {
      showToast(translateBackendError(err) || "Invalid OTP code");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // End Session / Force Close
  const handleEndSession = async (t: TableModel) => {
    if (!t.sessionId) {
      handleCloseSheet();
      return;
    }
    try {
      await forceCloseSession({
        sessionId: t.sessionId,
        data: { reason: "Waiter completed dining session" },
        idempotencyKey: generateUUID(),
      }).unwrap();
      showToast("Session ended · Table cleared");
      handleCloseSheet();
      refetchTables();
    } catch (err) {
      showToast(translateBackendError(err) || "Failed to end session");
    }
  };

  // 1-Click Gate Pass Exit Verification
  const handleIssueGatePass = async (t: TableModel) => {
    if (!t.sessionId) return;
    try {
      const resp = await staffVerifyExit({
        sessionId: t.sessionId,
        otpCode: "DIRECT_STAFF",
      }).unwrap();
      if (resp.result === "APPROVED") {
        showToast(`Gate pass verified for ${t.id} · Table cleared`);
        handleCloseSheet();
        refetchTables();
      } else {
        showToast(resp.reason || "Gate pass verification failed");
      }
    } catch (err) {
      showToast(translateBackendError(err) || "Gate pass failed");
    }
  };

  // Walk-in seating when table is free
  const handleSeatWalkinDirectly = async (t: TableModel) => {
    try {
      await startStaffSession({
        table_number: t.rawNumber,
        table_id: t.tableId,
        customer_name:
          seatingGuestName.trim() ||
          (isCarTable(t) ? "Car Guest" : "Walk-in Guest"),
        customer_phone: seatingPhone.trim() || undefined,
        guest_count: seatingPax || 2,
      }).unwrap();
      showToast(`${getTableDisplayName(t)} seated (${seatingPax} guests)`);
      setSeatingGuestName("");
      setSeatingPhone("");
      refetchTables();
    } catch (err) {
      showToast(translateBackendError(err) || "Failed to seat table");
    }
  };

  // Send order pad to kitchen
  const handleSendOrderToKitchen = async () => {
    if (!currentTable) return;
    const itemsToSend = cartEntries.map(([dishName, qty]) => {
      const dish = availableMenuDishes.find((m) => m.name === dishName);
      return {
        menu_item_id: dish?.id || "",
        quantity: qty,
      };
    });

    if (itemsToSend.length === 0) {
      showToast("Order pad is empty");
      return;
    }

    try {
      let activeSession = currentTable.sessionId;
      // If table is free, seat it first with the collected guest name and pax
      if (!activeSession) {
        const guestName =
          seatingGuestName.trim() ||
          (isCarTable(currentTable) ? "Car Guest" : "Guest Diner");
        const guestPax = seatingPax || 2;
        const phone = seatingPhone.trim() || undefined;
        const plate = carPlateInput.trim() || undefined;

        const sess = await startStaffSession({
          table_number: currentTable.rawNumber,
          table_id: currentTable.tableId,
          customer_name: guestName,
          customer_phone: phone,
          guest_count: guestPax,
          vehicle_number: plate,
        }).unwrap();
        activeSession = (sess as any).session_id || (sess as any).id;
      }

      if (!activeSession) {
        showToast("Could not determine session for table");
        return;
      }

      const res = await placeStaffOrder({
        sessionId: activeSession,
        items: itemsToSend,
      }).unwrap();

      const createdOrderId =
        (res as any)?.order?.id ||
        (res as any)?.id ||
        (res as any)?.data?.order?.id;

      if (createdOrderId) {
        try {
          await acceptOrder({ orderId: createdOrderId }).unwrap();
        } catch (_) {
          // If already auto-accepted by backend, safely ignore
        }
      }

      showToast(`Order sent directly to kitchen for ${getTableDisplayName(currentTable)}`);
      setCart({});
      setSeatingGuestName("");
      setSeatingPhone("");
      setSeatingPax(2);
      setActiveSheet("table");
      refetchTables();
      refetchPending();
      refetchKitchen();
    } catch (err) {
      showToast(translateBackendError(err) || "Failed to place order");
    }
  };

  // Time of day greeting
  const currentHour = new Date().getHours();
  const timeOfDay =
    currentHour < 12
      ? "morning"
      : currentHour < 17
      ? "afternoon"
      : "evening";

  return (
    <div className="floor-screen">
      {/* Top Bar Header */}
      <header className="top">
        <div className="sp">
          <h1 id="gr">
            Good {timeOfDay}, <em>{userFirstName}</em>
          </h1>
          <p id="gs">
            {restaurantName} ·{" "}
            {urgentQueueItems.length
              ? `${urgentQueueItems.length} ${
                  urgentQueueItems.length === 1 ? "thing needs" : "things need"
                } you`
              : "all clear"}
          </p>
        </div>
        <button
          className="ib dk"
          onClick={() => setActiveSheet("pick")}
          aria-label="New order"
        >
          New order
        </button>
        <button
          className="ib"
          onClick={() => router.push("/kitchen/queue")}
          aria-label="Kitchen display"
        >
          KDS
        </button>
        <div
          className="av"
          onClick={() => setShowUserMenu(!showUserMenu)}
          aria-label={`${userName}, staff`}
        >
          {userFirstName.charAt(0).toUpperCase()}
        </div>
      </header>

      {/* Staff Profile Dropdown */}
      {showUserMenu && (
        <div
          style={{
            position: "fixed",
            top: 70,
            right: 20,
            zIndex: 60,
            background: "var(--paper)",
            border: "1.5px solid var(--line)",
            borderRadius: 16,
            padding: 12,
            boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            minWidth: 180,
          }}
        >
          <div style={{ fontWeight: 800, fontSize: "0.95rem" }}>
            {userName}
          </div>
          <div
            style={{
              color: "var(--mute)",
              fontSize: "0.8rem",
              marginBottom: 8,
            }}
          >
            {auth.staffRole || "WAITER"}
          </div>
          <button
            onClick={() => {
              dispatch(logoutStaff());
              router.push("/staff/login");
            }}
            style={{
              width: "100%",
              height: 38,
              borderRadius: 10,
              background: "#c0392b18",
              border: "1px solid #c0392b40",
              color: "var(--red)",
              fontWeight: 800,
              fontSize: "0.85rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            Sign out
          </button>
        </div>
      )}

      {/* Main 2-Column Responsive Workspace */}
      <main className="app" id="app" data-v={view}>
        {/* FLOOR SECTION */}
        <section id="floor">
          {/* Operational Filter Chips Bar */}
          <div className="chips" style={{ marginBottom: 6 }}>
            <button
              className="chip"
              aria-pressed={floorFilter === "ALL"}
              onClick={() => setFloorFilter("ALL")}
            >
              All Tables <u>{tablesList.length}</u>
            </button>
            <button
              className="chip"
              aria-pressed={floorFilter === "SESSIONS"}
              onClick={() => setFloorFilter("SESSIONS")}
            >
              Active Sessions <u>{activeSessionsList.length}</u>
            </button>
            <button
              className="chip"
              aria-pressed={floorFilter === "CALLS"}
              onClick={() => setFloorFilter("CALLS")}
              style={
                serviceCallsList.length > 0
                  ? { borderColor: "var(--red)", color: "var(--red)" }
                  : {}
              }
            >
              Service Calls{" "}
              <u>
                {serviceCallsList.length > 0
                  ? `${serviceCallsList.length} 🛎️`
                  : 0}
              </u>
            </button>
            <button
              className="chip"
              aria-pressed={floorFilter === "BILLS"}
              onClick={() => setFloorFilter("BILLS")}
              style={
                billRequestsList.length > 0
                  ? { borderColor: "var(--b)", color: "#9A5B00" }
                  : {}
              }
            >
              Bill Requests{" "}
              <u>
                {billRequestsList.length > 0
                  ? `${billRequestsList.length} 💳`
                  : 0}
              </u>
            </button>
            <button
              className="chip"
              aria-pressed={floorFilter === "GATE_PASS"}
              onClick={() => setFloorFilter("GATE_PASS")}
              style={
                gatePassList.length > 0
                  ? { borderColor: "var(--grn)", color: "var(--grn)" }
                  : {}
              }
            >
              Gate Passes <u>{gatePassList.length}</u>
            </button>
            <button
              className="chip"
              aria-pressed={floorFilter === "NEW_ORDERS"}
              onClick={() => setFloorFilter("NEW_ORDERS")}
            >
              New Orders <u>{pendingOrdersList.length}</u>
            </button>
            <button
              className="chip"
              aria-pressed={floorFilter === "READY_PICKUP"}
              onClick={() => setFloorFilter("READY_PICKUP")}
            >
              Ready for Pickup <u>{readyPickupList.length}</u>
            </button>
            <button
              className="chip"
              aria-pressed={floorFilter === "KITCHEN"}
              onClick={() => setFloorFilter("KITCHEN")}
            >
              In Kitchen <u>{inKitchenList.length}</u>
            </button>
          </div>

          <div className="h2">
            <h2>
              {floorFilter === "ALL"
                ? "Floor"
                : floorFilter === "SESSIONS"
                ? "Active Dining Sessions"
                : floorFilter === "CALLS"
                ? "Pending Service Calls"
                : floorFilter === "BILLS"
                ? "Awaiting Payment Settlement"
                : floorFilter === "GATE_PASS"
                ? "Gate Passes (Paid & Clearing)"
                : floorFilter === "NEW_ORDERS"
                ? "New Orders to Accept"
                : floorFilter === "READY_PICKUP"
                ? "Ready for Pickup"
                : "Cooking in Kitchen"}
            </h2>
            <span id="fs">
              {occupiedZoneTables.length} of {displayedTables.length} in use ·{" "}
              {R0(totalZoneAmount)} open
            </span>
          </div>

          {/* Zone Selector: Dining Room vs Car Service (Active in ALL mode) */}
          {floorFilter === "ALL" && (
            <div className="seg" id="zt">
              <button
                onClick={() => setZone("dine")}
                aria-pressed={zone === "dine"}
              >
                <SVGIcon name="tbl" />
                Dining room
                <u>
                  {diningTables.filter((t) => t.st !== "free").length}/
                  {diningTables.length}
                </u>
                {zone !== "dine" &&
                  diningTables.some((t) =>
                    ["call", "bill", "new", "ready"].includes(
                      getTableStatus(t)[0]
                    )
                  ) && <i />}
              </button>
              <button
                onClick={() => setZone("car")}
                aria-pressed={zone === "car"}
              >
                <SVGIcon name="car" />
                Car service
                <u>
                  {carTables.filter((t) => t.st !== "free").length}/
                  {carTables.length}
                </u>
                {zone !== "car" &&
                  carTables.some((t) =>
                    ["call", "bill", "new", "ready"].includes(
                      getTableStatus(t)[0]
                    )
                  ) && <i />}
              </button>
            </div>
          )}

          {/* Table Grid */}
          {displayedTables.length === 0 ? (
            <div className="lst" style={{ marginTop: 12 }}>
              <div className="empty">
                <b>No tables in this view</b>
                {floorFilter === "CALLS"
                  ? "No customers are currently requesting assistance."
                  : floorFilter === "BILLS"
                  ? "No tables currently have pending bill requests."
                  : floorFilter === "GATE_PASS"
                  ? "No tables are currently waiting for exit clearance."
                  : floorFilter === "NEW_ORDERS"
                  ? "No new orders are waiting for staff acceptance."
                  : "All tables are available or in normal dining state."}
              </div>
            </div>
          ) : (
            <div className="grid" id="room">
              {displayedTables.map((t) => {
                const [statusKey, statusLabel, statusColor] =
                  getTableStatus(t);
                const isFree = statusKey === "free";
                const isPulsing = statusKey === "call";
                const activeTs = t.call ? t.callT : t.bill ? t.billT : 0;

                return (
                  <button
                    key={t.id}
                    className={`tc ${isFree ? "free" : ""} ${
                      isPulsing ? "pulse" : ""
                    }`}
                    style={
                      {
                        "--c": `var(${statusColor})`,
                      } as React.CSSProperties
                    }
                    onClick={() => handleOpenTableSheet(t.id)}
                    aria-label={`${getTableDisplayName(t)}, ${statusLabel}`}
                  >
                    <div className="hd">
                      <span className="id">{t.id}</span>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          color: "var(--muted)",
                          fontWeight: 700,
                          background: "var(--paper)",
                          padding: "2px 6px",
                          borderRadius: 6,
                          border: "1px solid var(--line)",
                        }}
                      >
                        {t.cap} {t.cap === 1 ? "seat" : "seats"}
                      </span>
                      <span className="pill">{statusLabel}</span>
                    </div>

                    <div className="stage">
                      {isCarTable(t)
                        ? renderCarGraphic(t)
                        : renderTableGraphic(t)}
                    </div>

                    {isFree ? (
                      <div className="who">
                        {isCarTable(t)
                          ? "Tap when a car arrives"
                          : `Capacity: ${t.cap} · Tap to seat`}
                      </div>
                    ) : (
                      <>
                        <div className="who">
                          {isCarTable(t) ? t.vehicle || "Car" : t.guest}
                        </div>
                        <div className="sub">
                          {isCarTable(t) && t.plate ? `${t.plate} · ` : ""}
                          {t.pax}/{t.cap} guests
                        </div>
                        <div className="ft">
                          <span>{R0(totalTable(t))}</span>
                          <span className="sub">
                            {activeTs ? getAgoString(activeTs) : ""}
                          </span>
                        </div>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* NEEDS YOU QUEUE ASIDE */}
        <aside id="queue">
          <div className="h2">
            <h2>Needs you</h2>
            <span id="qs">{urgentQueueItems.length} open</span>
          </div>

          <div id="ql">
            {queueItems.length === 0 ? (
              <div className="lst">
                <div className="empty">
                  <b>All caught up</b>
                  Nothing is waiting for you.
                </div>
              </div>
            ) : (
              Object.entries(groupedQueue).map(([groupTitle, items]) => {
                if (items.length === 0) return null;
                return (
                  <React.Fragment key={groupTitle}>
                    <div className="gl">{groupTitle}</div>
                    <div className="lst">
                      {items.map((x, idx) => {
                        const isCar = isCarTable(x.t);
                        const rowIconName =
                          isCar && x.k === "call"
                            ? "car"
                            : x.k === "call"
                            ? "bell"
                            : x.k === "bill"
                            ? "rec"
                            : x.k === "paid"
                            ? "pass"
                            : x.k === "new"
                            ? "list"
                            : "pot";

                        const rowTitle =
                          getTableDisplayName(x.t) +
                          " · " +
                          (x.k === "call"
                            ? isCar
                              ? "Car arrived"
                              : "Calling"
                            : x.k === "bill"
                            ? "Wants the bill"
                            : x.k === "paid"
                            ? "Paid · Needs exit pass"
                            : x.k === "new"
                            ? "New order"
                            : x.k === "ready"
                            ? isCar
                              ? "Deliver to car"
                              : "Food is ready"
                            : "Cooking");

                        const rowDesc =
                          (isCar && x.t.plate ? x.t.plate + " · " : "") +
                          (x.k === "call"
                            ? x.t.call
                            : x.k === "bill"
                            ? `Total due ${R(totalTable(x.t))}`
                            : x.k === "paid"
                            ? `Settled ${R(totalTable(x.t))} · Clear table`
                            : x.o?.items
                                .map((i) => `${i[2]}× ${i[0]}`)
                                .join(", "));

                        const buttonLabel =
                          x.k === "call"
                            ? isCar
                              ? "Greeted"
                              : "Attended"
                            : x.k === "bill"
                            ? "Settle"
                            : x.k === "paid"
                            ? "Approve Exit"
                            : x.k === "new"
                            ? "Accept"
                            : x.k === "ready"
                            ? isCar
                              ? "Deliver"
                              : "Served"
                            : "";

                        return (
                          <div key={idx} className={`rw ${x.k}`}>
                            <button
                              className="o"
                              onClick={() => handleOpenTableSheet(x.t.id)}
                            >
                              <span className="ic">
                                <SVGIcon name={rowIconName} />
                              </span>
                              <span style={{ minWidth: 0 }}>
                                <b>{rowTitle}</b>
                                <small>{rowDesc}</small>
                              </span>
                            </button>

                            {buttonLabel ? (
                              <button
                                className="go"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (x.k === "call") handleAttendCall(x.t);
                                  else if (x.k === "bill")
                                    handleOpenSettlement(x.t);
                                  else if (x.k === "paid")
                                    handleIssueGatePass(x.t);
                                  else if (x.k === "new" && x.o)
                                    handleAcceptOrderAction(x.t, x.o.rawId);
                                  else if (x.k === "ready" && x.o)
                                    handleServeOrderAction(x.t, x.o.rawId);
                                }}
                              >
                                {buttonLabel}
                              </button>
                            ) : (
                              <span className="tm">{getAgoString(x.ts)}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </React.Fragment>
                );
              })
            )}
          </div>
        </aside>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="nav" id="nav" aria-label="Main">
        <button
          onClick={() => setView("floor")}
          aria-selected={view === "floor"}
        >
          <SVGIcon name="tbl" />
          Floor
        </button>
        <button
          className="fab"
          onClick={() => setActiveSheet("pick")}
          aria-label="New order"
        >
          <SVGIcon name="plus" />
        </button>
        <button
          onClick={() => setView("queue")}
          aria-selected={view === "queue"}
        >
          <SVGIcon name="bell" />
          Needs you
          {urgentQueueItems.length > 0 && (
            <em>{urgentQueueItems.length}</em>
          )}
        </button>
      </nav>

      {/* MODAL OVERLAY & SHEETS */}
      <div
        className={`ov ${activeSheet ? "on" : ""}`}
        id="ov"
        role="dialog"
        aria-modal="true"
        onClick={(e) => {
          if ((e.target as HTMLElement).id === "ov") handleCloseSheet();
        }}
      >
        {/* TABLE DETAIL SHEET */}
        {activeSheet === "table" && currentTable && (
          <div className="sh" id="sh">
            <div className="sheh">
              <div className="code">{currentTable.id}</div>
              <div>
                <h3>
                  {currentTable.st === "dining"
                    ? currentTable.guest || "Diner"
                    : isCarTable(currentTable)
                    ? "Empty bay"
                    : "Free table"}
                </h3>
                <small>
                  {currentTable.st === "dining"
                    ? isCarTable(currentTable)
                      ? `${currentTable.vehicle || "Car"} · ${
                          currentTable.plate ? currentTable.plate + " · " : ""
                        }${currentTable.pax}/${currentTable.cap} guests · in car`
                      : `${currentTable.pax}/${currentTable.cap} guests · dining (Capacity: ${currentTable.cap})`
                    : isCarTable(currentTable)
                    ? `Capacity: ${currentTable.cap} guests · Waiting for a car`
                    : `Capacity: ${currentTable.cap} guests · Ready to seat`}
                </small>
              </div>
              <button
                className="ib x"
                onClick={handleCloseSheet}
                aria-label="Close"
              >
                <SVGIcon name="x" />
              </button>
            </div>

            <div className="sbody">
              {/* Optional plate input for car bay */}
              {isCarTable(currentTable) && currentTable.st === "free" && (
                <input
                  id="pl"
                  className="pli"
                  placeholder="Car number plate (optional)"
                  aria-label="Car number plate"
                  value={carPlateInput}
                  onChange={(e) =>
                    setCarPlateInput(e.target.value.toUpperCase())
                  }
                />
              )}

              {/* Service Call Alert Banner */}
              {currentTable.call && (
                <div className="al">
                  <SVGIcon name="bell" />
                  <div>
                    <b>{currentTable.call}</b>
                    <small>
                      {currentTable.callT
                        ? getAgoString(currentTable.callT)
                        : "Just now"}
                    </small>
                  </div>
                  <button
                    className="go"
                    onClick={() => handleAttendCall(currentTable)}
                  >
                    Attended
                  </button>
                </div>
              )}

              {/* OTP Verification Prompt if table is unverified */}
              {currentTable.st === "dining" &&
                currentTable.sessionStatus === "OPEN" && (
                  <div
                    style={{
                      padding: 14,
                      borderRadius: 20,
                      background: "#e0a03018",
                      border: "1.5px solid #e0a03066",
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 800,
                        fontSize: "0.9rem",
                        color: "var(--ink)",
                      }}
                    >
                      Verify Table OTP
                    </div>
                    <div
                      style={{ fontSize: "0.8rem", color: "var(--mute)" }}
                    >
                      Enter 4-digit code from customer's phone or BYPASS to
                      release orders to kitchen.
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        style={{
                          flex: 1,
                          height: 42,
                          borderRadius: 12,
                          border: "1px solid var(--line)",
                          padding: "0 12px",
                          background: "var(--paper)",
                          font: "800 1rem var(--sans)",
                        }}
                        value={otpVerifyInput}
                        onChange={(e) => setOtpVerifyInput(e.target.value)}
                        placeholder="e.g. 1234 or BYPASS"
                      />
                      <button
                        className="go"
                        disabled={isVerifyingOtp || !otpVerifyInput.trim()}
                        onClick={handleVerifyOtp}
                      >
                        {isVerifyingOtp ? "..." : "Verify"}
                      </button>
                    </div>
                  </div>
                )}

              {/* RUNNING BILL: STRICTLY rendered ONLY for active dining sessions */}
              {currentTable.st === "dining" && currentTable.sessionId && (
                <div className="bill">
                  <small>RUNNING BILL</small>
                  <div className="tot">{R(totalTable(currentTable))}</div>
                  <div className="r">
                    <span>Subtotal</span>
                    <span>{R(subTotalTable(currentTable))}</span>
                  </div>
                  <div className="r">
                    <span>GST 5%</span>
                    <span>{R(gstTable(currentTable))}</span>
                  </div>
                </div>
              )}

              {/* SEATING FORM: Rendered ONLY when Table is FREE */}
              {currentTable.st === "free" && (
                <div
                  style={{
                    padding: 18,
                    borderRadius: 20,
                    background: "var(--s2)",
                    border: "1px solid var(--line)",
                    display: "grid",
                    gap: 12,
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: "1rem" }}>
                    Seat Guests on {getTableDisplayName(currentTable)}
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "var(--mute)" }}>
                    Select covers to activate this table for diners:
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    {[1, 2, 4, 6].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setSeatingPax(num)}
                        style={{
                          flex: 1,
                          height: 42,
                          borderRadius: 12,
                          border: "1px solid var(--line)",
                          background:
                            seatingPax === num ? "var(--ink)" : "var(--paper)",
                          color:
                            seatingPax === num ? "var(--paper)" : "var(--ink)",
                          fontWeight: 800,
                          fontSize: "0.88rem",
                        }}
                      >
                        {num} Pax
                      </button>
                    ))}
                  </div>

                  <input
                    className="pli"
                    placeholder="Guest Name (Optional, e.g. Verma Family)"
                    value={seatingGuestName}
                    onChange={(e) => setSeatingGuestName(e.target.value)}
                  />

                  <input
                    className="pli"
                    type="tel"
                    placeholder="Guest Mobile (Optional)"
                    value={seatingPhone}
                    onChange={(e) => setSeatingPhone(e.target.value)}
                  />

                  <button
                    type="button"
                    className="pb"
                    disabled={isStartingSession}
                    onClick={() => handleSeatWalkinDirectly(currentTable)}
                    style={{ height: 48 }}
                  >
                    {isStartingSession ? "Activating..." : "Seat & Start Dining"}
                  </button>
                </div>
              )}

              {/* Active Orders List for this session */}
              {currentTable.orders.map((o) => {
                const tagColor =
                  o.s === "ready"
                    ? "--grn"
                    : o.s === "kitchen"
                    ? "--blu"
                    : o.s === "served"
                    ? "--grn"
                    : "--b";

                return (
                  <div key={o.id} className="ol">
                    <div className="h">
                      <span>Order #{o.id}</span>
                      <span
                        className="tag"
                        style={
                          {
                            "--c": `var(${tagColor})`,
                          } as React.CSSProperties
                        }
                      >
                        {o.s.toUpperCase()}
                      </span>
                      {o.s === "new" ? (
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <button
                            className="go"
                            onClick={() =>
                              handleAcceptOrderAction(currentTable, o.rawId)
                            }
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            className="ib"
                            style={{
                              padding: "4px 8px",
                              fontSize: "0.75rem",
                              borderRadius: 8,
                              color: "var(--crimson)",
                              border: "1px solid var(--line)",
                            }}
                            title="Cancel order before cooking starts (kitchen notified)"
                            onClick={() =>
                              handleCancelOrderAction(currentTable, o.rawId, o.s)
                            }
                          >
                            Cancel
                          </button>
                        </div>
                      ) : o.s === "kitchen" ? (
                        <button
                          type="button"
                          className="ib"
                          style={{
                            padding: "4px 8px",
                            fontSize: "0.75rem",
                            borderRadius: 8,
                            color: "var(--crimson)",
                            border: "1px solid var(--line)",
                          }}
                          title="Force close cooking item and record as food wastage (kitchen notified)"
                          onClick={() =>
                            handleCancelOrderAction(currentTable, o.rawId, o.s)
                          }
                        >
                          Force close (Waste)
                        </button>
                      ) : o.s === "ready" ? (
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <button
                            className="go"
                            onClick={() =>
                              handleServeOrderAction(currentTable, o.rawId)
                            }
                          >
                            {isCarTable(currentTable)
                              ? "Deliver to car"
                              : "Mark served"}
                          </button>
                          <button
                            type="button"
                            className="ib"
                            style={{
                              padding: "4px 8px",
                              fontSize: "0.75rem",
                              borderRadius: 8,
                              color: "var(--crimson)",
                              border: "1px solid var(--line)",
                            }}
                            title="Force close prepared item and record as food wastage (kitchen notified)"
                            onClick={() =>
                              handleCancelOrderAction(currentTable, o.rawId, o.s)
                            }
                          >
                            Waste
                          </button>
                        </div>
                      ) : null}
                    </div>

                    {o.items.map((it, idx) => (
                      <div key={idx} className="it">
                        <span>
                          {it[2]}× {it[0]}
                        </span>
                        <span>{R(it[1] * it[2])}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>

            {/* Secondary Actions */}
            {currentTable.st === "dining" && (
              <div className="more">
                <button onClick={() => handleIssueGatePass(currentTable)}>
                  Issue gate pass
                </button>
                <button
                  className="d"
                  onClick={() => handleEndSession(currentTable)}
                >
                  End session
                </button>
              </div>
            )}

            {/* Bottom Primary Actions */}
            <div className="sact">
              <button
                className="sb"
                onClick={() => handleOpenSettlement(currentTable)}
                disabled={
                  currentTable.st === "free" || !currentTable.sessionId
                }
                style={
                  currentTable.st === "free" || !currentTable.sessionId
                    ? { opacity: 0.35, cursor: "not-allowed" }
                    : {}
                }
              >
                Settle bill
              </button>
              <button
                className="pb"
                onClick={() => {
                  if (currentTable.st === "free" && !seatingGuestName.trim()) {
                    setActiveSheet("guest");
                  } else {
                    handleOpenOrderPad(currentTable.id);
                  }
                }}
              >
                <SVGIcon name="plus" />
                Take order
              </button>
            </div>
          </div>
        )}

        {/* PAYMENT SETTLEMENT MODAL */}
        {activeSheet === "settle" && currentTable && (
          <div className="sh" id="sh">
            <div className="sheh">
              <div className="code">{currentTable.id}</div>
              <div>
                <h3>Settle Bill</h3>
                <small>
                  {currentTable.guest || "Diner"} · Session{" "}
                  {currentTable.sessionId?.slice(0, 8)}
                </small>
              </div>
              <button
                className="ib x"
                onClick={handleCloseSheet}
                aria-label="Close"
              >
                <SVGIcon name="x" />
              </button>
            </div>

            <div className="sbody">
              <div className="bill">
                <small>TOTAL PAYABLE AMOUNT</small>
                <div className="tot">{R(totalTable(currentTable))}</div>
                <div className="r">
                  <span>Subtotal</span>
                  <span>{R(subTotalTable(currentTable))}</span>
                </div>
                <div className="r">
                  <span>GST 5%</span>
                  <span>{R(gstTable(currentTable))}</span>
                </div>
              </div>

              <div style={{ fontWeight: 800, fontSize: "0.95rem" }}>
                Select Tender Method:
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setPaymentMethod(PaymentMethod.CASH)}
                  style={{
                    padding: 14,
                    borderRadius: 16,
                    border: `2px solid ${
                      paymentMethod === PaymentMethod.CASH
                        ? "var(--ink)"
                        : "var(--line)"
                    }`,
                    background:
                      paymentMethod === PaymentMethod.CASH
                        ? "var(--paper)"
                        : "var(--s2)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                    fontWeight: 800,
                    fontSize: "0.9rem",
                  }}
                >
                  <SVGIcon name="cash" />
                  <span>Cash Tendered</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setPaymentMethod(PaymentMethod.RESTAURANT_POS)
                  }
                  style={{
                    padding: 14,
                    borderRadius: 16,
                    border: `2px solid ${
                      paymentMethod === PaymentMethod.RESTAURANT_POS
                        ? "var(--ink)"
                        : "var(--line)"
                    }`,
                    background:
                      paymentMethod === PaymentMethod.RESTAURANT_POS
                        ? "var(--paper)"
                        : "var(--s2)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                    fontWeight: 800,
                    fontSize: "0.9rem",
                  }}
                >
                  <SVGIcon name="card" />
                  <span>Card POS Swiped</span>
                </button>
              </div>
            </div>

            <div className="sact" style={{ gridTemplateColumns: "1fr" }}>
              <button
                className="pb"
                disabled={isSettlingPayment}
                onClick={handleConfirmSettlement}
              >
                {isSettlingPayment
                  ? "Settling..."
                  : `Confirm Payment Received (${R(totalTable(currentTable))})`}
              </button>
            </div>
          </div>
        )}

        {/* TAKE ORDER MENU SHEET */}
        {activeSheet === "order" && currentTable && (
          <div className="sh wide" id="sh">
            <div className="sheh">
              <div className="code">{currentTable.id}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  Take order
                  <span
                    style={{
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: 8,
                      background: "var(--s2)",
                      border: "1px solid var(--line)",
                      color: "var(--ink)",
                    }}
                  >
                    {seatingPax || currentTable.pax || 2} pax
                  </span>
                </h3>
                <small style={{ display: "block", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                  {seatingGuestName.trim() || currentTable.guest || "Guest Diner"}
                </small>
              </div>
              <button
                className="ib x"
                onClick={handleCloseSheet}
                aria-label="Close"
              >
                <SVGIcon name="x" />
              </button>
            </div>

            <div className="to">
              {/* Left Column: Menu search & items */}
              <div className="menu">
                <div className="srch">
                  <input
                    id="q"
                    type="search"
                    placeholder="Search dishes"
                    aria-label="Search dishes"
                    value={menuSearch}
                    onChange={(e) => setMenuSearch(e.target.value)}
                  />
                </div>

                <div className="chips" id="cats">
                  {menuCategories.map((c) => (
                    <button
                      key={c}
                      className="chip"
                      aria-pressed={selectedCategory === c}
                      onClick={() => setSelectedCategory(c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>

                <div id="ml">
                  {filteredDishes.length === 0 ? (
                    <div className="empty" style={{ gridColumn: "1/-1" }}>
                      No dishes found
                    </div>
                  ) : (
                    filteredDishes.map((m) => {
                      const qtyInCart = cart[m.name] || 0;
                      const gradient =
                        CATEGORY_GRADIENTS[m.category] ||
                        CATEGORY_GRADIENTS.default;

                      const initials = m.name
                        .split(" ")
                        .map((w) => w[0])
                        .join("")
                        .slice(0, 2);

                      return (
                        <div
                          key={m.id}
                          className={`dt ${qtyInCart ? "has" : ""}`}
                          style={{ cursor: qtyInCart ? "default" : "pointer" }}
                          onClick={() => {
                            if (!qtyInCart) {
                              setCart((prev) => ({
                                ...prev,
                                [m.name]: 1,
                              }));
                            }
                          }}
                        >
                          <div
                            className="art"
                            style={{
                              background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
                            }}
                          >
                            <span
                              className={`vg ${m.isVeg ? "" : "nv"}`}
                            />
                            {initials}
                          </div>

                          <div className="in">
                            <b>{m.name}</b>
                            <small>{R0(m.price)}</small>

                            {qtyInCart ? (
                              <div className="step" onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCart((prev) => ({
                                      ...prev,
                                      [m.name]: Math.max(
                                        0,
                                        (prev[m.name] || 0) - 1
                                      ),
                                    }));
                                  }}
                                  aria-label={`Remove one ${m.name}`}
                                >
                                  <SVGIcon name="min" />
                                </button>
                                <span>{qtyInCart}</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCart((prev) => ({
                                      ...prev,
                                      [m.name]: (prev[m.name] || 0) + 1,
                                    }));
                                  }}
                                  aria-label={`Add one ${m.name}`}
                                >
                                  <SVGIcon name="plus" />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                className="add"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCart((prev) => ({
                                    ...prev,
                                    [m.name]: 1,
                                  }));
                                }}
                              >
                                Add
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Column: Cart Pad */}
              <aside
                className={`cartp ${cartDrawerOpen ? "open" : ""}`}
                id="cp"
              >
                <button
                  className="ct"
                  id="ct"
                  onClick={() => setCartDrawerOpen(!cartDrawerOpen)}
                  aria-label="Toggle order pad"
                >
                  <span>
                    {cartTotalQty
                      ? `${cartTotalQty} ${
                          cartTotalQty === 1 ? "dish" : "dishes"
                        }`
                      : "Order pad"}
                  </span>
                  <b>{R0(cartTotalAmount)}</b>
                  <SVGIcon name="up" />
                </button>

                {currentTable.st === "free" && (
                  <div
                    style={{
                      padding: "10px 14px",
                      background: "var(--paper)",
                      borderBottom: "1px solid var(--line)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          color: "var(--ink)",
                        }}
                      >
                        Guest & Seating
                      </span>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          color: "var(--muted)",
                          fontWeight: 600,
                        }}
                      >
                        Capacity: {currentTable.cap || 4} seats
                      </span>
                    </div>
                    <input
                      className="pli"
                      placeholder="Guest name (optional)"
                      value={seatingGuestName}
                      onChange={(e) => setSeatingGuestName(e.target.value)}
                      style={{
                        height: 36,
                        fontSize: "0.82rem",
                        padding: "0 10px",
                        width: "100%",
                      }}
                    />
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.78rem",
                          fontWeight: 600,
                          color: "var(--ink)",
                        }}
                      >
                        Party: <b>{seatingPax}</b> / {currentTable.cap || 4} guests
                      </span>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <button
                          type="button"
                          className="ib"
                          style={{ width: 28, height: 28, borderRadius: 6 }}
                          onClick={() =>
                            setSeatingPax((p) => Math.max(1, p - 1))
                          }
                          aria-label="Decrease pax"
                        >
                          <SVGIcon name="min" />
                        </button>
                        <button
                          type="button"
                          className="ib"
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 6,
                            opacity:
                              seatingPax >= (currentTable.cap || 4) ? 0.35 : 1,
                            cursor:
                              seatingPax >= (currentTable.cap || 4)
                                ? "not-allowed"
                                : "pointer",
                          }}
                          disabled={seatingPax >= (currentTable.cap || 4)}
                          onClick={() =>
                            setSeatingPax((p) =>
                              Math.min(currentTable.cap || 4, p + 1)
                            )
                          }
                          aria-label="Increase pax"
                        >
                          <SVGIcon name="plus" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="cl" id="cl">
                  {cartEntries.length === 0 ? (
                    <p>Tap dishes to add them to the order.</p>
                  ) : (
                    cartEntries.map(([dishName, qty]) => {
                      const dish = availableMenuDishes.find(
                        (m) => m.name === dishName
                      );
                      const price = dish ? dish.price : 0;
                      return (
                        <div key={dishName}>
                          <span>
                            {qty}× {dishName}
                          </span>
                          <span>{R0(qty * price)}</span>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="cs">
                  <button
                    className="pb"
                    id="sd"
                    disabled={cartTotalQty === 0 || isPlacingOrder}
                    onClick={handleSendOrderToKitchen}
                  >
                    <SVGIcon name="send" />
                    {isPlacingOrder ? "Sending..." : "Send to kitchen"}
                  </button>
                </div>
              </aside>
            </div>
          </div>
        )}

        {/* PICK TABLE MODAL */}
        {activeSheet === "pick" && (
          <div className="sh" id="sh">
            <div className="sheh">
              <div>
                <h3 style={{ font: "400 2rem var(--serif)" }}>Which table?</h3>
                <small>Pick a table to take an order</small>
              </div>
              <button
                className="ib x"
                onClick={handleCloseSheet}
                aria-label="Close"
              >
                <SVGIcon name="x" />
              </button>
            </div>

            <div className="pk">
              {[...tablesList]
                .sort(
                  (a, b) =>
                    (b.st === "dining" ? 1 : 0) - (a.st === "dining" ? 1 : 0)
                )
                .map((t) => (
                  <button
                    key={t.id}
                    className={t.st === "dining" ? "u" : ""}
                    onClick={() => handleSelectTableForNewOrder(t)}
                  >
                    <b>{t.id}</b>
                    <small>{t.st === "dining" ? t.guest : "Free"}</small>
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* NEW ORDER GUEST DETAILS MODAL */}
        {activeSheet === "guest" && currentTable && (
          <div className="sh" id="sh">
            <div className="sheh">
              <div className="code">{currentTable.id}</div>
              <div style={{ flex: 1 }}>
                <h3 style={{ font: "400 1.6rem var(--serif)" }}>
                  New order for {getTableDisplayName(currentTable)}
                </h3>
                <small>Guest details & party size</small>
              </div>
              <button
                className="ib x"
                onClick={handleCloseSheet}
                aria-label="Close"
              >
                <SVGIcon name="x" />
              </button>
            </div>

            <form
              className="sbody"
              onSubmit={(e) => {
                e.preventDefault();
                handleConfirmGuestAndOpenOrder();
              }}
            >
              <div>
                <label
                  htmlFor="guest-name-input"
                  style={{
                    display: "block",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    marginBottom: 6,
                    color: "var(--ink)",
                  }}
                >
                  Guest Name <span style={{ color: "var(--b)" }}>*</span>
                </label>
                <input
                  id="guest-name-input"
                  className="pli"
                  placeholder="e.g. Rahul Sharma or Verma Family"
                  autoFocus
                  required
                  value={seatingGuestName}
                  onChange={(e) => setSeatingGuestName(e.target.value)}
                  style={{ width: "100%" }}
                />
              </div>

              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    marginBottom: 6,
                  }}
                >
                  <label
                    style={{
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      color: "var(--ink)",
                    }}
                  >
                    Number of Guests (Pax) <span style={{ color: "var(--b)" }}>*</span>
                  </label>
                  <span
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--muted)",
                      fontWeight: 600,
                    }}
                  >
                    Table Capacity: <b>{currentTable.cap || 4} seats</b>
                  </span>
                </div>
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  {[1, 2, 3, 4, 5, 6, 8]
                    .filter((num) => num <= (currentTable.cap || 4))
                    .map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setSeatingPax(num)}
                        style={{
                          flex: 1,
                          height: 44,
                          borderRadius: 12,
                          border: "1px solid var(--line)",
                          background:
                            seatingPax === num ? "var(--ink)" : "var(--paper)",
                          color:
                            seatingPax === num ? "var(--paper)" : "var(--ink)",
                          fontWeight: 800,
                          fontSize: "0.95rem",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {num}
                      </button>
                    ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button
                    type="button"
                    className="ib"
                    onClick={() => setSeatingPax((p) => Math.max(1, p - 1))}
                    style={{ width: 40, height: 40, borderRadius: 10 }}
                    aria-label="Decrease guests"
                  >
                    <SVGIcon name="min" />
                  </button>
                  <span
                    style={{
                      font: "800 1.1rem var(--mono)",
                      minWidth: 90,
                      textAlign: "center",
                    }}
                  >
                    {seatingPax} / {currentTable.cap || 4}{" "}
                    {seatingPax === 1 ? "guest" : "guests"}
                  </span>
                  <button
                    type="button"
                    className="ib"
                    disabled={seatingPax >= (currentTable.cap || 4)}
                    onClick={() =>
                      setSeatingPax((p) => Math.min(currentTable.cap || 4, p + 1))
                    }
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      opacity: seatingPax >= (currentTable.cap || 4) ? 0.35 : 1,
                      cursor:
                        seatingPax >= (currentTable.cap || 4)
                          ? "not-allowed"
                          : "pointer",
                    }}
                    aria-label="Increase guests"
                  >
                    <SVGIcon name="plus" />
                  </button>
                </div>
                {seatingPax >= (currentTable.cap || 4) && (
                  <p
                    style={{
                      margin: "6px 0 0",
                      fontSize: "0.75rem",
                      color: "var(--crimson)",
                      fontWeight: 600,
                    }}
                  >
                    Maximum seating capacity reached for this table ({currentTable.cap || 4} seats)
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="guest-phone-input"
                  style={{
                    display: "block",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    marginBottom: 6,
                    color: "var(--ink)",
                  }}
                >
                  Mobile Number <small style={{ color: "var(--mute)", fontWeight: 500 }}>(optional)</small>
                </label>
                <input
                  id="guest-phone-input"
                  className="pli"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={seatingPhone}
                  onChange={(e) => setSeatingPhone(e.target.value)}
                  style={{ width: "100%" }}
                />
              </div>

              {isCarTable(currentTable) && (
                <div>
                  <label
                    htmlFor="guest-plate-input"
                    style={{
                      display: "block",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      marginBottom: 6,
                      color: "var(--ink)",
                    }}
                  >
                    Vehicle Plate Number
                  </label>
                  <input
                    id="guest-plate-input"
                    className="pli"
                    placeholder="e.g. DL 01 AB 1234"
                    value={carPlateInput}
                    onChange={(e) => setCarPlateInput(e.target.value.toUpperCase())}
                    style={{ width: "100%" }}
                  />
                </div>
              )}

              <button
                type="submit"
                className="pb"
                style={{
                  height: 52,
                  marginTop: 8,
                  fontSize: "1rem",
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                }}
              >
                <span>Take Order</span>
                <SVGIcon name="send" />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* FLOATING TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="toast on" role="status">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
