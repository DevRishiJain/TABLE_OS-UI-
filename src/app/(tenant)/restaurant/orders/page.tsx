"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useGetRestaurantOrdersQuery } from "@/store/api/restaurantApi";
import { useUpdateKitchenStatusMutation } from "@/store/api/kitchenApi";
import { useAppSelector } from "@/store";
import { formatMoney } from "@/lib/money";
import { Order, OrderItem } from "@/types/domain";
import { OrderState } from "@/types/enums";
import { formatDestination } from "@/lib/location";
import { FranchiseOutletFilterSelect } from "@/components/franchise/FranchiseOutletFilterSelect";
import { Modal } from "@/components/ui/Modal";

const formatDateInput = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export default function RestaurantOrderHistoryPage() {
  const restaurantId = useAppSelector((state) => state.auth.restaurantId);
  const selectedOutletId = useAppSelector((state) => state.franchise.selectedOutletId);
  const restaurantName = useAppSelector((state) => state.auth.restaurantName) || "The Spice Route";

  const targetRestId = selectedOutletId || restaurantId;

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
    if (!targetRestId) return undefined;
    return {
      restaurantId: targetRestId,
      limit: 200,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    };
  }, [targetRestId, startDate, endDate]);

  const { data: orders, isLoading, refetch, isFetching } = useGetRestaurantOrdersQuery(
    queryArgs
  );
  const [updateKitchenStatus, { isLoading: isUpdatingStatus }] = useUpdateKitchenStatusMutation();

  const handleCompleteOrder = async (orderId: string) => {
    try {
      await updateKitchenStatus({
        orderId,
        data: { status: OrderState.SERVED },
      }).unwrap();
      refetch();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null);
      }
    } catch (err) {
      console.error("Failed to complete order:", err);
    }
  };

  const allOrders = orders || [];

  // Summary Metrics
  const metrics = useMemo(() => {
    let totalGmvMinor = 0;
    let completedCount = 0;
    let cookingCount = 0;
    let cancelledCount = 0;

    allOrders.forEach((o) => {
      const amount = o.total?.amount_minor_units || 0;
      if (o.status !== OrderState.CANCELLED && (o.status as string) !== "CANCELLED") {
        totalGmvMinor += amount;
      }
      if (
        o.status === OrderState.SERVED ||
        (o.status as string) === "SERVED" ||
        (o.status as string) === "COMPLETED"
      ) {
        completedCount++;
      }
      if (
        o.status === OrderState.PREPARING ||
        (o.status as string) === "PREPARING" ||
        o.status === OrderState.ACCEPTED ||
        (o.status as string) === "ACCEPTED" ||
        o.status === OrderState.PLACED_VERIFIED ||
        (o.status as string) === "PLACED_VERIFIED"
      ) {
        cookingCount++;
      }
      if (o.status === OrderState.CANCELLED || (o.status as string) === "CANCELLED") {
        cancelledCount++;
      }
    });

    return {
      totalOrders: allOrders.length,
      totalGmvMinor,
      completedCount,
      cookingCount,
      cancelledCount,
    };
  }, [allOrders]);

  // Filter Orders
  const filteredOrders = useMemo(() => {
    return allOrders.filter((ord) => {
      const q = searchQuery.toLowerCase().trim();
      const tableMatch = (ord as any).table_number?.toLowerCase().includes(q);
      const vehicleMatch = (ord as any).vehicle_number?.toLowerCase().includes(q);
      const dinerMatch = (ord as any).customer_name?.toLowerCase().includes(q);
      const seqMatch = String(ord.sequence_number).includes(q);
      const itemMatch = ord.items?.some((it) =>
        it.item_name_snapshot.toLowerCase().includes(q)
      );

      const matchesSearch = !q || tableMatch || vehicleMatch || dinerMatch || seqMatch || itemMatch;

      const matchesStatus =
        selectedStatus === "ALL" ||
        (selectedStatus === "SERVED" &&
          (ord.status === OrderState.SERVED ||
            (ord.status as string) === "SERVED" ||
            (ord.status as string) === "COMPLETED")) ||
        (selectedStatus === "READY" && (ord.status === OrderState.READY || (ord.status as string) === "READY")) ||
        (selectedStatus === "PREPARING" &&
          (ord.status === OrderState.PREPARING ||
            (ord.status as string) === "PREPARING" ||
            ord.status === OrderState.ACCEPTED ||
            (ord.status as string) === "ACCEPTED")) ||
        (selectedStatus === "CANCELLED" && (ord.status === OrderState.CANCELLED || (ord.status as string) === "CANCELLED"));

      return matchesSearch && matchesStatus;
    });
  }, [allOrders, searchQuery, selectedStatus]);

  const renderStatusPill = (status: string) => {
    switch (status) {
      case "SERVED":
      case "COMPLETED":
        return <span className="pill c-g">{status === "COMPLETED" ? "Completed" : "Served"}</span>;
      case "READY":
        return <span className="pill c-a">Ready</span>;
      case "PREPARING":
      case "ACCEPTED":
      case "PLACED_VERIFIED":
        return <span className="pill c-b">Cooking</span>;
      case "CANCELLED":
        return <span className="pill c-r">Cancelled</span>;
      default:
        return <span className="pill">{status}</span>;
    }
  };

  const statusFilters = [
    { id: "ALL", label: "All" },
    { id: "READY", label: "Ready" },
    { id: "PREPARING", label: "Cooking" },
    { id: "SERVED", label: "Served" },
    { id: "CANCELLED", label: "Cancelled" },
  ];

  return (
    <>
      {/* Header */}
      <div className="hd">
        <div>
          <h1>Orders</h1>
          <p>All tickets, searchable · {metrics.totalOrders} total recorded</p>
        </div>
        <div className="sp"></div>
        <FranchiseOutletFilterSelect />
        <button
          className="btn s sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          {isFetching ? "Refreshing…" : "Refresh"}
        </button>
        <Link href="/kitchen/queue" className="btn sm">
          Kitchen display
        </Link>
      </div>

      {/* KPI Metrics */}
      <div className="g g4">
        <div className="cd st" style={{ "--c": "var(--admin-am)" } as any}>
          <small>Gross sales</small>
          <b>{formatMoney(metrics.totalGmvMinor)}</b>
          <span>Non-cancelled orders total</span>
        </div>

        <div className="cd st" style={{ "--c": "var(--admin-grn)" } as any}>
          <small>Completed</small>
          <b>{metrics.completedCount}</b>
          <span>Fulfilled & served</span>
        </div>

        <div className="cd st" style={{ "--c": "var(--admin-blu)" } as any}>
          <small>Live tickets</small>
          <b>{metrics.cookingCount}</b>
          <span>Active in kitchen</span>
        </div>

        <div className="cd st" style={{ "--c": metrics.cancelledCount > 0 ? "var(--admin-red)" : "var(--admin-mute)" } as any}>
          <small>Cancelled</small>
          <b>{metrics.cancelledCount}</b>
          <span>Voided orders</span>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bar mt">
        <input
          placeholder="Search table, guest or dish"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <div className="ch">
          {statusFilters.map((s) => (
            <button
              key={s.id}
              className="chip"
              aria-pressed={selectedStatus === s.id}
              onClick={() => setSelectedStatus(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="sp"></div>

        <div className="ch">
          {[
            { id: "TODAY", label: "Today" },
            { id: "7D", label: "7 days" },
            { id: "30D", label: "30 days" },
            { id: "ALL", label: "All time" },
          ].map((d) => (
            <button
              key={d.id}
              className="chip"
              aria-pressed={datePreset === d.id}
              onClick={() => handlePresetChange(d.id)}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="cd tw mt">
        <table>
          <thead>
            <tr>
              <th>Ticket</th>
              <th>Table</th>
              <th>Guest & items</th>
              <th>Status</th>
              <th className="n">Amount</th>
              <th>Time</th>
              <th className="ac">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="em">
                  <b>Loading tickets…</b>
                  Syncing live order ledger.
                </td>
              </tr>
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="em">
                  <b>No matching orders</b>
                  Try changing your status filter, search query, or date range.
                </td>
              </tr>
            ) : (
              filteredOrders.map((ord) => {
                const dest = formatDestination(
                  (ord as any).table_number,
                  (ord as any).vehicle_number,
                  (ord as any).customer_name,
                  (ord as any).guest_count
                );
                const itemsSummary =
                  ord.items
                    ?.map((it) => `${it.quantity} ${it.item_name_snapshot}`)
                    .join(", ") || "No items recorded";
                const totalMinor = ord.total?.amount_minor_units || 0;
                const placedTime = ord.placed_at
                  ? new Date(ord.placed_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "—";

                return (
                  <tr key={ord.id}>
                    <td>
                      <b>#{ord.sequence_number}</b>
                    </td>
                    <td>
                      <b>{dest.shortBadge || (ord as any).table_number || "—"}</b>
                    </td>
                    <td>
                      <b>{(ord as any).customer_name || "Guest Diner"}</b>
                      <small>{itemsSummary}</small>
                    </td>
                    <td>{renderStatusPill(ord.status as string)}</td>
                    <td className="n">
                      <b>{formatMoney(totalMinor)}</b>
                    </td>
                    <td>
                      {placedTime}
                      <small>
                        {ord.placed_at
                          ? new Date(ord.placed_at).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                            })
                          : ""}
                      </small>
                    </td>
                    <td className="ac" style={{ display: "flex", gap: "6px", justifyContent: "flex-end", alignItems: "center" }}>
                      {(ord.status === OrderState.READY || (ord.status as string) === "READY") && (
                        <button
                          className="btn s sm"
                          style={{
                            background: "#2F8F5B",
                            color: "#ffffff",
                            borderColor: "#2F8F5B",
                            fontWeight: 700,
                          }}
                          disabled={isUpdatingStatus}
                          onClick={() => handleCompleteOrder(ord.id)}
                          title="Mark Handed Over / Completed"
                        >
                          ✓ Complete
                        </button>
                      )}
                      <button
                        className="btn s sm"
                        onClick={() => setSelectedOrder(ord)}
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Ticket Details Modal */}
      {selectedOrder && (
        <Modal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={`Ticket #${selectedOrder.sequence_number}`}
          description={
            selectedOrder.placed_at
              ? new Date(selectedOrder.placed_at).toLocaleString([], {
                  dateStyle: "medium",
                  timeStyle: "short",
                })
              : undefined
          }
        >

            <div className="row" style={{ borderTop: 0 }}>
              <div>
                <b>Table & Guest</b>
                <small>
                  {(selectedOrder as any).table_number
                    ? `Table ${(selectedOrder as any).table_number}`
                    : "Floor table"}{" "}
                  · {(selectedOrder as any).customer_name || "Guest Diner"}
                </small>
              </div>
              {renderStatusPill(selectedOrder.status as string)}
            </div>

            <div style={{ marginTop: 14 }}>
              <b style={{ fontSize: "0.88rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--admin-mute)" }}>
                Order Items
              </b>
              <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 6 }}>
                {selectedOrder.items?.map((it, idx) => (
                  <div
                    key={idx}
                    className="row"
                    style={{ padding: "8px 0" }}
                  >
                    <div>
                      <b>
                        {it.quantity}x {it.item_name_snapshot}
                      </b>
                      {(it.special_instructions || it.specialInstructions) && (
                        <small style={{ color: "var(--admin-am)" }}>
                          Note: {it.special_instructions || it.specialInstructions}
                        </small>
                      )}
                    </div>
                    <b className="n">
                      {formatMoney(it.line_total?.amount_minor_units || 0)}
                    </b>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="row"
              style={{
                marginTop: 14,
                paddingTop: 12,
                borderTop: "1.5px solid var(--admin-ln)",
                fontWeight: 800,
                fontSize: "1.1rem",
              }}
            >
              <div>Total</div>
              <div className="n">
                {formatMoney(selectedOrder.total?.amount_minor_units || 0)}
              </div>
            </div>

            <div className="ac" style={{ marginTop: 18, display: "flex", gap: "10px", justifyContent: "center" }}>
              {(selectedOrder.status === OrderState.READY || (selectedOrder.status as string) === "READY") && (
                <button
                  className="btn pr"
                  style={{
                    background: "#2F8F5B",
                    borderColor: "#2F8F5B",
                    color: "#ffffff",
                    fontWeight: 700,
                  }}
                  disabled={isUpdatingStatus}
                  onClick={() => handleCompleteOrder(selectedOrder.id)}
                >
                  ✓ Complete & Hand Over
                </button>
              )}
              <button className="btn s" onClick={() => setSelectedOrder(null)}>
                Close
              </button>
            </div>
        </Modal>
      )}
    </>
  );
}
