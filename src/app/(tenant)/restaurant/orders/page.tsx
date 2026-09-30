"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useGetRestaurantOrdersQuery } from "@/store/api/restaurantApi";
import { useAppSelector } from "@/store";
import { formatMoney } from "@/lib/money";
import { Order, OrderItem } from "@/types/domain";
import { OrderState } from "@/types/enums";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { Modal } from "@/components/ui/Modal";
import {
  ShoppingBag,
  Search,
  Calendar,
  Clock,
  CheckCircle2,
  ChefHat,
  BellRing,
  Utensils,
  Receipt,
  Eye,
  RefreshCw,
  Users,
  Car,
  Filter,
  TrendingUp,
  XCircle,
  FileSpreadsheet,
} from "lucide-react";

const formatDateInput = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export default function RestaurantOrderHistoryPage() {
  const restaurantId = useAppSelector((state) => state.auth.restaurantId);
  const restaurantName = useAppSelector((state) => state.auth.restaurantName) || "The Spice Route";

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [datePreset, setDatePreset] = useState<string>("TODAY");
  const [startDate, setStartDate] = useState<string>(() => formatDateInput(new Date()));
  const [endDate, setEndDate] = useState<string>(() => formatDateInput(new Date()));

  const handlePresetChange = (preset: string) => {
    setDatePreset(preset);
    const now = new Date();
    if (preset === "ALL") {
      setStartDate("");
      setEndDate("");
    } else if (preset === "TODAY") {
      const today = formatDateInput(now);
      setStartDate(today);
      setEndDate(today);
    } else if (preset === "7D") {
      const past = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      setStartDate(formatDateInput(past));
      setEndDate(formatDateInput(now));
    } else if (preset === "30D") {
      const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      setStartDate(formatDateInput(past));
      setEndDate(formatDateInput(now));
    }
  };

  const queryArgs = useMemo(() => {
    if (!restaurantId) return undefined;
    return {
      restaurantId,
      limit: 200,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    };
  }, [restaurantId, startDate, endDate]);

  const { data: orders, isLoading, refetch, isFetching } = useGetRestaurantOrdersQuery(
    queryArgs,
    { pollingInterval: 5000 }
  );

  const allOrders = orders || [];

  // Summary Metrics
  const metrics = useMemo(() => {
    let totalGmvMinor = 0;
    let completedCount = 0;
    let cookingCount = 0;
    let cancelledCount = 0;

    allOrders.forEach((o) => {
      const amount = o.total?.amount_minor_units || 0;
      if (o.status !== OrderState.CANCELLED) {
        totalGmvMinor += amount;
      }
      if (o.status === OrderState.SERVED) completedCount++;
      else if (o.status === OrderState.PREPARING || o.status === OrderState.ACCEPTED) cookingCount++;
      else if (o.status === OrderState.CANCELLED) cancelledCount++;
    });

    return {
      totalOrders: allOrders.length,
      totalGmvMinor,
      completedCount,
      cookingCount,
      cancelledCount,
    };
  }, [allOrders]);

  // Filtered list
  const filteredOrders = useMemo(() => {
    return allOrders.filter((o) => {
      // Status filter
      if (selectedStatus !== "ALL" && o.status !== selectedStatus) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const seqMatch = String(o.sequence_number).includes(query);
        const tableMatch = (o.table_number || "").toLowerCase().includes(query);
        const nameMatch = (o.customer_name || "").toLowerCase().includes(query);
        const phoneMatch = (o.customer_phone || "").includes(query);
        const itemMatch = o.items?.some((it: OrderItem) =>
          it.item_name_snapshot.toLowerCase().includes(query)
        );
        return seqMatch || tableMatch || nameMatch || phoneMatch || itemMatch;
      }

      return true;
    });
  }, [allOrders, selectedStatus, searchQuery]);

  const getStatusBadge = (status: OrderState | string) => {
    switch (status) {
      case OrderState.SERVED:
      case "SERVED":
        return <Badge variant="success" size="sm">SERVED ✅</Badge>;
      case OrderState.READY:
      case "READY":
        return <Badge variant="gold" size="sm">READY ON PASS 🛎️</Badge>;
      case OrderState.PREPARING:
      case "PREPARING":
        return <Badge variant="amber" size="sm">COOKING 🔥</Badge>;
      case OrderState.ACCEPTED:
      case OrderState.PLACED_VERIFIED:
      case "ACCEPTED":
      case "PLACED_VERIFIED":
        return <Badge variant="blue" size="sm">ACCEPTED 📋</Badge>;
      case OrderState.PLACED_UNVERIFIED:
      case "PLACED_UNVERIFIED":
        return <Badge variant="warning" size="sm">PENDING ⏳</Badge>;
      case OrderState.CANCELLED:
      case "CANCELLED":
        return <Badge variant="error" size="sm">CANCELLED ✕</Badge>;
      default:
        return <Badge variant="default" size="sm">{status}</Badge>;
    }
  };

  const statusOptions = [
    { id: "ALL", label: "All Orders", count: allOrders.length },
    { id: OrderState.SERVED, label: "Served", count: metrics.completedCount },
    { id: OrderState.PREPARING, label: "Cooking", count: metrics.cookingCount },
    { id: OrderState.READY, label: "Ready on Pass", count: allOrders.filter(o => o.status === OrderState.READY).length },
    { id: OrderState.CANCELLED, label: "Cancelled", count: metrics.cancelledCount },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-gray-100 flex items-center gap-2.5">
            <ShoppingBag className="w-6 h-6 text-primary" />
            Order History & Logs
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Audit trail, dining tickets, itemized receipts and lifetime fulfillment history for {restaurantName}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => refetch()}
            isLoading={isFetching}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />}
          >
            Refresh Logs
          </Button>
          <Link href="/kitchen/queue">
            <Button
              variant="gold"
              size="sm"
              leftIcon={<ChefHat className="w-3.5 h-3.5" />}
            >
              Kitchen KDS
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Total Recorded Orders
            </span>
            <div className="p-2 rounded-xl bg-primary/20 text-primary">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black font-mono text-gray-100">
              {metrics.totalOrders}
            </div>
            <span className="text-[11px] text-gray-400 mt-0.5 block">
              Across all floor tables & drive-in bays
            </span>
          </div>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Gross Order Value
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black font-mono text-emerald-400">
              {formatMoney(metrics.totalGmvMinor)}
            </div>
            <span className="text-[11px] text-emerald-400/80 mt-0.5 block">
              Cumulative non-cancelled sales
            </span>
          </div>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Completed & Served
            </span>
            <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black font-mono text-sky-400">
              {metrics.completedCount}
            </div>
            <span className="text-[11px] text-gray-400 mt-0.5 block">
              Successfully fulfilled by kitchen & staff
            </span>
          </div>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Live Cooking / Pending
            </span>
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <ChefHat className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black font-mono text-amber-400">
              {metrics.cookingCount}
            </div>
            <span className="text-[11px] text-gray-400 mt-0.5 block">
              Active tickets on kitchen display
            </span>
          </div>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-4 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Order #, Table, Diner Name, Dish Name..."
              leftIcon={<Search className="w-4 h-4 text-gray-400" />}
              className="bg-surface text-xs"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {statusOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setSelectedStatus(opt.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  selectedStatus === opt.id
                    ? "bg-primary text-background shadow-md shadow-primary/20 scale-[1.02]"
                    : "bg-surface-subtle text-gray-400 hover:text-white border border-surface-border hover:border-gray-500"
                }`}
              >
                <span>{opt.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    selectedStatus === opt.id
                      ? "bg-background/20 text-background font-black"
                      : "bg-surface text-gray-300"
                  }`}
                >
                  {opt.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Date Filter Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-surface-border/60 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mr-1">
              <Calendar className="w-3.5 h-3.5 text-primary" /> Date Filter:
            </span>
            {[
              { id: "TODAY", label: "Today" },
              { id: "7D", label: "Last 7 Days" },
              { id: "30D", label: "Last 30 Days" },
              { id: "ALL", label: "All Time" },
              { id: "CUSTOM", label: "Custom" },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePresetChange(p.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  datePreset === p.id
                    ? "bg-primary text-background font-bold shadow-sm"
                    : "bg-surface-subtle text-gray-400 hover:text-white border border-surface-border hover:border-gray-500"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-surface-subtle px-2.5 py-1 rounded-lg border border-surface-border">
              <span className="text-[10px] text-gray-400 font-semibold uppercase">From</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDatePreset("CUSTOM");
                }}
                className="bg-transparent text-gray-200 text-xs border-none outline-none focus:ring-0 p-0 font-mono [color-scheme:dark]"
              />
            </div>
            <div className="flex items-center gap-1.5 bg-surface-subtle px-2.5 py-1 rounded-lg border border-surface-border">
              <span className="text-[10px] text-gray-400 font-semibold uppercase">To</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDatePreset("CUSTOM");
                }}
                className="bg-transparent text-gray-200 text-xs border-none outline-none focus:ring-0 p-0 font-mono [color-scheme:dark]"
              />
            </div>
            {datePreset !== "TODAY" && (
              <button
                type="button"
                onClick={() => handlePresetChange("TODAY")}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-surface border border-surface-border transition-colors flex items-center gap-1 text-[11px]"
                title="Reset to Today"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto rounded-xl border border-surface-border">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0F1218] border-b border-surface-border text-gray-400 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Ticket / Seq</th>
                <th className="py-3 px-4">Destination</th>
                <th className="py-3 px-4">Diner Details</th>
                <th className="py-3 px-4">Items Summary</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Placed At</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/60 bg-surface/40">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8} className="py-3.5 px-4">
                      <Skeleton className="h-5 w-full rounded" />
                    </td>
                  </tr>
                ))
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 px-4 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ShoppingBag className="w-8 h-8 text-gray-500" />
                      <p className="text-sm font-bold text-gray-300">No orders found</p>
                      <p className="text-xs text-gray-500">
                        {searchQuery || selectedStatus !== "ALL"
                          ? "Try clearing your filters or search keyword."
                          : "Orders placed by diners or staff will appear here."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => {
                  const placedDate = new Date(ord.placed_at);
                  const timeFormatted = placedDate.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  const dateFormatted = placedDate.toLocaleDateString([], {
                    month: "short",
                    day: "numeric",
                  });
                  const totalMinor =
                    ord.total?.amount_minor_units ||
                    (typeof ord.total === "number" ? ord.total : 0);

                  const itemsCount = ord.items?.reduce((acc: number, it: OrderItem) => acc + (it.quantity || 1), 0) || 0;
                  const isCar = (ord.table_number || "").toLowerCase().includes("car");

                  return (
                    <tr
                      key={ord.id}
                      className="hover:bg-surface-hover/50 transition-colors"
                    >
                      {/* Ticket / Seq */}
                      <td className="py-3.5 px-4 font-mono font-bold text-primary">
                        #{ord.sequence_number}
                      </td>

                      {/* Destination */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          {isCar ? (
                            <Car className="w-3.5 h-3.5 text-amber-400" />
                          ) : (
                            <Utensils className="w-3.5 h-3.5 text-primary" />
                          )}
                          <span className="font-bold text-gray-100">
                            {ord.table_number || "Table 1"}
                          </span>
                        </div>
                      </td>

                      {/* Diner Details */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-200">
                            {ord.customer_name || "Guest Diner"}
                          </span>
                          {ord.customer_phone && (
                            <span className="text-[10px] text-gray-400 font-mono">
                              {ord.customer_phone}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Items Summary */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-300 truncate">
                            {ord.items && ord.items.length > 0
                              ? ord.items.map((it: OrderItem) => `${it.quantity}x ${it.item_name_snapshot}`).join(", ")
                              : "Standard Course"}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {itemsCount} {itemsCount === 1 ? "item" : "items"} total
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {getStatusBadge(ord.status)}
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                        {formatMoney(totalMinor)}
                      </td>

                      {/* Placed At */}
                      <td className="py-3.5 px-4 text-gray-400">
                        <div className="flex flex-col text-[11px]">
                          <span className="text-gray-200">{timeFormatted}</span>
                          <span className="text-[10px] text-gray-400">{dateFormatted}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedOrder(ord)}
                          className="text-primary hover:text-white"
                          leftIcon={<Eye className="w-3.5 h-3.5" />}
                        >
                          Details
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Order Details Modal */}
      {selectedOrder && (
        <Modal
          isOpen={Boolean(selectedOrder)}
          onClose={() => setSelectedOrder(null)}
          title={`Order #${selectedOrder.sequence_number} Details`}
        >
          <div className="flex flex-col gap-4 text-xs">
            {/* Metadata Bar */}
            <div className="p-3.5 rounded-xl bg-surface-subtle border border-surface-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-200 text-sm">
                  {selectedOrder.table_number || "Table 1"}
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-300">
                  {selectedOrder.customer_name || "Guest Diner"}
                </span>
              </div>
              <div>{getStatusBadge(selectedOrder.status)}</div>
            </div>

            {/* Timestamps */}
            <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-400">
              <div className="p-2.5 rounded-lg bg-surface border border-surface-border/60">
                <span className="block text-gray-500 font-bold uppercase text-[9px]">
                  Placed At
                </span>
                <span className="text-gray-200 font-mono">
                  {new Date(selectedOrder.placed_at).toLocaleString()}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-surface border border-surface-border/60">
                <span className="block text-gray-500 font-bold uppercase text-[9px]">
                  Accepted At
                </span>
                <span className="text-gray-200 font-mono">
                  {selectedOrder.accepted_at
                    ? new Date(selectedOrder.accepted_at).toLocaleString()
                    : "Immediate"}
                </span>
              </div>
            </div>

            {/* Itemized Dishes List */}
            <div className="flex flex-col gap-2">
              <h4 className="font-bold text-gray-200 uppercase tracking-wider text-[11px]">
                Ordered Dishes ({selectedOrder.items?.length || 0})
              </h4>
              <div className="divide-y divide-surface-border/60 rounded-xl border border-surface-border bg-surface p-2 flex flex-col gap-1.5">
                {selectedOrder.items?.map((it, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between pt-1.5 first:pt-0"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-primary/20 text-primary font-bold flex items-center justify-center text-[10px]">
                        {it.quantity}x
                      </span>
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-100">
                          {it.item_name_snapshot}
                        </span>
                        {it.specialInstructions && (
                          <span className="text-[10px] text-amber-300 italic">
                            Note: {it.specialInstructions}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="font-mono font-bold text-gray-200">
                      {formatMoney(it.line_total?.amount_minor_units || 0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bill Financial Summary */}
            <div className="p-3 rounded-xl bg-surface-subtle border border-surface-border flex flex-col gap-1.5">
              <div className="flex justify-between text-gray-400">
                <span>Subtotal</span>
                <span className="font-mono text-gray-200">
                  {formatMoney(selectedOrder.subtotal?.amount_minor_units || 0)}
                </span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Taxes & GST</span>
                <span className="font-mono text-gray-200">
                  {formatMoney(selectedOrder.tax_total?.amount_minor_units || 0)}
                </span>
              </div>
              <div className="flex justify-between font-bold text-sm text-gray-100 pt-1.5 border-t border-surface-border">
                <span>Grand Total</span>
                <span className="font-mono text-primary">
                  {formatMoney(selectedOrder.total?.amount_minor_units || 0)}
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedOrder(null)}
              >
                Close Ticket
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
