"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAppSelector } from "@/store";
import {
  useGetRestaurantTablesQuery,
  useCreateRestaurantTableMutation,
} from "@/store/api/restaurantApi";
import { QRCodeCanvas } from "qrcode.react";

interface TableItem {
  id: string;
  tableNumber: string;
  capacity: number;
  status: "AVAILABLE" | "OCCUPIED" | "BILL_REQUESTED";
  token: string;
}

export default function RestaurantTablesQRPage() {
  const restaurantName = useAppSelector((state) => state.auth.restaurantName) || "The Spice Route";
  const restaurantSlug = useAppSelector((state) => state.auth.restaurantSlug) || "spiceroute";
  const userRole = useAppSelector((state) => state.auth.staffRole);

  const { data: backendTables, refetch: refetchTables } = useGetRestaurantTablesQuery();
  const [createTableApi, { isLoading: isCreating }] = useCreateRestaurantTableMutation();

  const [tables, setTables] = useState<TableItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTableNum, setNewTableNum] = useState("");
  const [newCapacity, setNewCapacity] = useState(4);
  const [printingTable, setPrintingTable] = useState<TableItem | null>(null);
  const [isPrintingAll, setIsPrintingAll] = useState(false);

  // Sync and deduplicate tables from backend
  useEffect(() => {
    if (backendTables && Array.isArray(backendTables)) {
      const seenNumbers = new Set<string>();
      const deduped: TableItem[] = [];

      for (let idx = 0; idx < backendTables.length; idx++) {
        const bt = backendTables[idx];
        const rawNum = String(bt.table_number || `Table ${idx + 1}`).trim();
        const normKey = rawNum.toLowerCase();

        if (!seenNumbers.has(normKey)) {
          seenNumbers.add(normKey);
          deduped.push({
            id: bt.id || `tbl-${idx + 1}`,
            tableNumber: rawNum,
            capacity: bt.capacity || (idx % 2 === 0 ? 4 : 2),
            status: "AVAILABLE",
            token: bt.table_token || `TBL-${String(idx + 1).padStart(3, "0")}`,
          });
        }
      }

      setTables(deduped);
    } else if (!backendTables) {
      const initial = Array.from({ length: 4 }).map((_, idx) => {
        const num = idx + 1;
        return {
          id: `tbl-${num}`,
          tableNumber: `T${num}`,
          capacity: num % 2 === 0 ? 2 : 4,
          status: "AVAILABLE" as const,
          token: `TBL-${String(num).padStart(3, "0")}`,
        };
      });
      setTables(initial);
    }
  }, [backendTables]);

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableNum.trim()) return;

    try {
      await createTableApi({
        table_number: newTableNum.trim(),
        capacity: newCapacity,
      }).unwrap();

      setShowAddModal(false);
      setNewTableNum("");
      refetchTables();
    } catch {
      // Optimistic local add
      const newEntry: TableItem = {
        id: `tbl-local-${Date.now()}`,
        tableNumber: newTableNum.trim(),
        capacity: newCapacity,
        status: "AVAILABLE",
        token: `TBL-${String(tables.length + 1).padStart(3, "0")}`,
      };
      setTables((prev) => [...prev, newEntry]);
      setShowAddModal(false);
      setNewTableNum("");
    }
  };

  const handlePrintSingleTable = (table: TableItem) => {
    setIsPrintingAll(false);
    setPrintingTable(table);

    const onAfterPrint = () => {
      setPrintingTable(null);
      window.removeEventListener("afterprint", onAfterPrint);
    };
    window.addEventListener("afterprint", onAfterPrint);

    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handlePrintAll = () => {
    setPrintingTable(null);
    setIsPrintingAll(true);

    const onAfterPrint = () => {
      setIsPrintingAll(false);
      window.removeEventListener("afterprint", onAfterPrint);
    };
    window.addEventListener("afterprint", onAfterPrint);

    setTimeout(() => {
      window.print();
    }, 150);
  };

  const freeCount = tables.filter((t) => t.status === "AVAILABLE").length;
  const occupiedCount = tables.length - freeCount;

  return (
    <>
      {/* Header Bar */}
      <div className="hd">
        <div>
          <h1>Tables &amp; QR</h1>
          <p>Table tents for contactless ordering</p>
        </div>
        <button className="btn s" onClick={handlePrintAll}>
          Print all QR
        </button>
        {userRole === "FRANCHISE_OWNER" ? (
          <div className="pill font-mono text-[11px] bg-amber-500/10 text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5">
            🔒 Read-Only: Tables managed by venue Store Managers
          </div>
        ) : (
          <button className="btn" onClick={() => setShowAddModal(true)}>
            <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
            Add table
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="g g4">
        <div className="cd st" style={{ "--c": "var(--admin-am)" } as any}>
          <small>Tables</small>
          <b>{tables.length}</b>
          <span>QR codes active</span>
        </div>

        <div className="cd st" style={{ "--c": "var(--admin-grn)" } as any}>
          <small>Free</small>
          <b>{freeCount}</b>
          <span>Ready for guests</span>
        </div>

        <div className="cd st" style={{ "--c": "var(--admin-blu)" } as any}>
          <small>Occupied</small>
          <b>{occupiedCount}</b>
          <span>Dining sessions</span>
        </div>
      </div>

      {/* Table QR Cards Grid */}
      <div
        className="tg mt"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}
      >
        {tables.map((t) => {
          const baseUrl =
            typeof window !== "undefined"
              ? window.location.origin
              : "http://localhost:3000";
          const orderUrl = `${baseUrl}/t/${t.token}`;

          return (
            <div
              key={t.id}
              className="cd"
              style={{
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div
                className="row"
                style={{
                  border: 0,
                  padding: 0,
                  width: "100%",
                  justifyContent: "space-between",
                }}
              >
                <b style={{ font: "400 1.8rem var(--admin-serif)" }}>
                  {t.tableNumber}
                </b>
                <span className={`pill ${t.status === "AVAILABLE" ? "c-g" : "c-b"}`}>
                  {t.status === "AVAILABLE" ? "Free" : "Occupied"}
                </span>
              </div>

              <div className="qr" style={{ margin: "14px auto" }}>
                <QRCodeCanvas
                  value={orderUrl}
                  size={112}
                  level="M"
                  includeMargin={true}
                  className="qr-code-canvas"
                />
              </div>

              <small style={{ color: "var(--admin-mute)", display: "block" }}>
                Seats {t.capacity} · preview code
              </small>

              <div
                className="ac"
                style={{
                  textAlign: "center",
                  marginTop: 12,
                  display: "flex",
                  gap: 8,
                  width: "100%",
                }}
              >
                <a
                  href={orderUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn s sm"
                  style={{ flex: 1 }}
                >
                  Test
                </a>
                <button
                  type="button"
                  className="btn s sm"
                  style={{ flex: 1 }}
                  onClick={() => handlePrintSingleTable(t)}
                  title={`Print QR standee for Table ${t.tableNumber}`}
                >
                  Print
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Table Modal */}
      {showAddModal && (
        <div
          className="ov on"
          onClick={(e) => {
            if ((e.target as HTMLElement).classList.contains("ov")) setShowAddModal(false);
          }}
        >
          <div className="md">
            <h3>Add table</h3>
            <form onSubmit={handleAddTable}>
              <div className="mf">
                <label className="w">
                  Table Identifier
                  <input
                    required
                    placeholder="e.g. T6, Table 12, Patio 3"
                    value={newTableNum}
                    onChange={(e) => setNewTableNum(e.target.value)}
                  />
                </label>

                <label className="w">
                  Seating Capacity
                  <select
                    value={newCapacity}
                    onChange={(e) => setNewCapacity(Number(e.target.value))}
                  >
                    <option value={2}>2 Guests</option>
                    <option value={4}>4 Guests</option>
                    <option value={6}>6 Guests</option>
                    <option value={8}>8 Guests</option>
                  </select>
                </label>
              </div>

              <div className="ac" style={{ marginTop: 20 }}>
                <button
                  type="button"
                  className="btn s"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn" disabled={isCreating}>
                  {isCreating ? "Adding…" : "Add Table"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print-Only Single Table QR Standee Tent Card */}
      {printingTable && (
        <div className="tableos-print-standee" aria-hidden="true">
          <div className="standee-rest">{restaurantName}</div>
          <div className="standee-tbl">Table {printingTable.tableNumber}</div>
          <div className="standee-sub">Seats {printingTable.capacity} Guests · Direct Ordering</div>
          <div className="standee-qr-box">
            <QRCodeCanvas
              value={`${typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}/t/${printingTable.token}`}
              size={180}
              level="H"
              includeMargin={true}
              className="qr-print-canvas"
            />
          </div>
          <div className="standee-inst">Scan with camera to order</div>
          <div className="standee-inst-sub">Browse menu, order food &amp; pay seamlessly</div>
          <div className="standee-ft">
            <span className="standee-brand">Table<em>OS</em></span>
            <span>Token: {printingTable.token}</span>
          </div>
        </div>
      )}

      {/* Print-Only Multi-Standee Grid for All Tables */}
      {isPrintingAll && (
        <div className="tableos-print-all-grid" aria-hidden="true">
          {tables.map((tbl) => (
            <div key={tbl.id} className="tableos-print-standee" style={{ display: "block", marginBottom: 30, pageBreakAfter: "always" }}>
              <div className="standee-rest">{restaurantName}</div>
              <div className="standee-tbl">Table {tbl.tableNumber}</div>
              <div className="standee-sub">Seats {tbl.capacity} Guests · Direct Ordering</div>
              <div className="standee-qr-box">
                <QRCodeCanvas
                  value={`${typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}/t/${tbl.token}`}
                  size={180}
                  level="H"
                  includeMargin={true}
                  className="qr-print-canvas"
                />
              </div>
              <div className="standee-inst">Scan with camera to order</div>
              <div className="standee-inst-sub">Browse menu, order food &amp; pay seamlessly</div>
              <div className="standee-ft">
                <span className="standee-brand">Table<em>OS</em></span>
                <span>Token: {tbl.token}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
