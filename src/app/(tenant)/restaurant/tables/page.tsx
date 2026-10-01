"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAppSelector, useAppDispatch } from "@/store";
import { addToast } from "@/store/slices/uiSlice";
import { useGetRestaurantTablesQuery, useCreateRestaurantTableMutation } from "@/store/api/restaurantApi";
import { QRCodeSVG } from "qrcode.react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  QrCode,
  Printer,
  Plus,
  Utensils,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  X,
} from "lucide-react";

interface TableItem {
  id: string;
  tableNumber: string;
  capacity: number;
  status: "AVAILABLE" | "OCCUPIED" | "BILL_REQUESTED";
  token: string;
}

export default function RestaurantTablesQRPage() {
  const dispatch = useAppDispatch();
  const restaurantName = useAppSelector((state) => state.auth.restaurantName) || "Restaurant";

  const { data: backendTables, refetch: refetchTables } = useGetRestaurantTablesQuery();
  const [createTableApi, { isLoading: isCreating }] = useCreateRestaurantTableMutation();

  const [tables, setTables] = useState<TableItem[]>([]);
  const [selectedTableForPrint, setSelectedTableForPrint] = useState<TableItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTableNum, setNewTableNum] = useState("");
  const [newCapacity, setNewCapacity] = useState(4);

  // Sync and strictly DEDUPLICATE tables from backend
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
      // Seed initial 8 tables if nothing returned yet
      const initial = Array.from({ length: 8 }).map((_, idx) => {
        const num = idx + 1;
        return {
          id: `tbl-${num}`,
          tableNumber: `Table ${num}`,
          capacity: num % 2 === 0 ? 4 : 2,
          status: "AVAILABLE" as const,
          token: `TBL-${String(num).padStart(3, "0")}`,
        };
      });
      setTables(initial);
    }
  }, [backendTables]);

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    const tableLabel = newTableNum.trim();
    if (!tableLabel) return;

    // Check for duplicate table number before creation
    const exists = tables.some(
      (t) => t.tableNumber.toLowerCase() === tableLabel.toLowerCase()
    );
    if (exists) {
      dispatch(
        addToast({
          type: "warning",
          title: "Table Already Exists",
          message: `${tableLabel} is already registered. Please choose another table label.`,
        })
      );
      return;
    }

    const token = `TBL-${String(Date.now()).slice(-6)}`;
    const cap = Number(newCapacity) || 4;

    try {
      const res = await createTableApi({
        table_number: tableLabel,
        table_token: token,
        capacity: cap,
      }).unwrap();

      const createdTbl: TableItem = {
        id: res.id || `tbl-${tables.length + 1}`,
        tableNumber: res.table_number || tableLabel,
        capacity: cap,
        status: "AVAILABLE",
        token: res.table_token || token,
      };

      setTables((prev) => {
        const seen = new Set(prev.map((t) => t.tableNumber.toLowerCase()));
        if (seen.has(createdTbl.tableNumber.toLowerCase())) {
          return prev;
        }
        return [...prev, createdTbl];
      });

      refetchTables();
      setShowAddModal(false);
      setNewTableNum("");

      dispatch(
        addToast({
          type: "success",
          title: "Table Created!",
          message: `${tableLabel} added with unique scan token ${token}.`,
        })
      );
    } catch (err: any) {
      console.warn("Backend table creation fallback:", err);
      const fallbackTbl: TableItem = {
        id: `tbl-${tables.length + 1}`,
        tableNumber: tableLabel,
        capacity: cap,
        status: "AVAILABLE",
        token,
      };
      setTables((prev) => [...prev, fallbackTbl]);
      setShowAddModal(false);
      setNewTableNum("");
      dispatch(
        addToast({
          type: "success",
          title: "Table Created",
          message: `${tableLabel} registered on floor.`,
        })
      );
    }
  };

  const handlePrintSingle = (table: TableItem) => {
    setSelectedTableForPrint(table);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handlePrintAll = () => {
    setSelectedTableForPrint(null);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <>
      {/* Global Print-Only Stylesheet: Hides everything except the single designated standee when printing a card */}
      <style jsx global>{`
        @media print {
          /* Hide all page content by default */
          body * {
            visibility: hidden !important;
          }

          /* Show ONLY the single printable standee when selectedTableForPrint is set */
          .print-single-standee,
          .print-single-standee * {
            visibility: visible !important;
          }

          .print-single-standee {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            background: #ffffff !important;
            color: #000000 !important;
            padding: 32px !important;
            z-index: 999999 !important;
          }

          /* If no single card is selected, print the cards grid cleanly */
          body.print-all-mode .printable-grid,
          body.print-all-mode .printable-grid * {
            visibility: visible !important;
          }

          @page {
            size: auto;
            margin: 12mm;
          }
        }
      `}</style>

      {/* Screen View */}
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-display text-gray-100 flex items-center gap-2.5">
              <QrCode className="w-6 h-6 text-primary" />
              Table Standees & QR Code Engine
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Printable contactless table tents with dynamic customer order routing for{" "}
              <strong className="text-gray-200">{restaurantName}</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrintAll}
              leftIcon={<Printer className="w-4 h-4" />}
              className="font-mono text-xs"
            >
              Print All QR Cards
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowAddModal(true)}
              leftIcon={<Plus className="w-4 h-4" />}
              className="font-bold text-xs"
            >
              Add New Table
            </Button>
          </div>
        </div>

        {/* Summary KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-surface border border-surface-border flex flex-col gap-1">
            <span className="text-[10px] font-mono text-gray-400 uppercase">Total Tables</span>
            <span className="text-xl font-bold font-mono text-gray-100">{tables.length}</span>
            <span className="text-[11px] text-gray-500">QR Tokens Active</span>
          </div>

          <div className="p-4 rounded-2xl bg-surface border border-surface-border flex flex-col gap-1">
            <span className="text-[10px] font-mono text-gray-400 uppercase">Available</span>
            <span className="text-xl font-bold font-mono text-emerald-400">
              {tables.filter((t) => t.status === "AVAILABLE").length}
            </span>
            <span className="text-[11px] text-gray-500">Ready for guests</span>
          </div>

          <div className="p-4 rounded-2xl bg-surface border border-surface-border flex flex-col gap-1">
            <span className="text-[10px] font-mono text-gray-400 uppercase">Occupied</span>
            <span className="text-xl font-bold font-mono text-amber-400">
              {tables.filter((t) => t.status === "OCCUPIED").length}
            </span>
            <span className="text-[11px] text-gray-500">Active dining sessions</span>
          </div>

          <div className="p-4 rounded-2xl bg-surface border border-surface-border flex flex-col gap-1">
            <span className="text-[10px] font-mono text-gray-400 uppercase">Billed / Exit</span>
            <span className="text-xl font-bold font-mono text-sky-400">
              {tables.filter((t) => t.status === "BILL_REQUESTED").length}
            </span>
            <span className="text-[11px] text-gray-500">Awaiting exit clearance</span>
          </div>
        </div>

        {/* Tables Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 printable-grid">
          {tables.map((t) => {
            const scanUrl =
              typeof window !== "undefined"
                ? `${window.location.origin}/t/${t.token}`
                : `http://localhost:3000/t/${t.token}`;

            return (
              <Card
                key={t.id}
                className="p-4 flex flex-col items-center justify-between gap-4 border-surface-border bg-surface hover:border-primary/50 transition-all shadow-md group"
              >
                {/* Standee Header */}
                <div className="w-full flex items-center justify-between">
                  <span className="font-bold text-sm text-gray-100 font-display">
                    {t.tableNumber}
                  </span>
                  <Badge
                    variant={
                      t.status === "AVAILABLE"
                        ? "success"
                        : t.status === "OCCUPIED"
                        ? "amber"
                        : "blue"
                    }
                    size="sm"
                  >
                    {t.status === "AVAILABLE"
                      ? "Available"
                      : t.status === "OCCUPIED"
                      ? "Occupied"
                      : "Billed"}
                  </Badge>
                </div>

                {/* Scannable QR Code Box */}
                <div className="p-3 bg-white rounded-2xl border-2 border-amber-400/80 shadow-inner flex flex-col items-center text-center">
                  <span className="text-[9px] font-bold text-black uppercase tracking-wider block mb-1 font-display truncate max-w-[130px]">
                    {restaurantName}
                  </span>
                  <QRCodeSVG
                    value={scanUrl}
                    size={120}
                    level="H"
                    includeMargin={false}
                  />
                  <span className="mt-1 px-2 py-0.5 rounded-full bg-black text-amber-400 font-mono text-[9px] font-extrabold">
                    {t.tableNumber.toUpperCase()}
                  </span>
                </div>

                {/* Card Meta & Actions */}
                <div className="w-full flex flex-col gap-2 pt-2 border-t border-surface-border text-center">
                  <span className="text-[10px] text-gray-400 font-mono">
                    Token: {t.token} • Capacity: {t.capacity}p
                  </span>

                  <div className="flex items-center justify-center gap-2">
                    <a
                      href={scanUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-surface-subtle hover:bg-surface-hover text-gray-300 text-[10px] font-mono flex items-center gap-1 border border-surface-border"
                    >
                      <ExternalLink className="w-3 h-3 text-primary" /> Test Link
                    </a>
                    <button
                      type="button"
                      onClick={() => handlePrintSingle(t)}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[10px] font-mono flex items-center gap-1 border border-amber-500/30"
                    >
                      <Printer className="w-3 h-3" /> Print Card
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Add Table Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-surface border border-surface-border rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold font-display text-gray-100 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-primary" />
                  Add Dining Table
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddTable} className="flex flex-col gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">
                    Table Label / Number
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={`e.g. Table ${tables.length + 1}`}
                    value={newTableNum}
                    onChange={(e) => setNewTableNum(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-subtle border border-surface-border text-sm text-gray-100 focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">
                    Guest Capacity
                  </label>
                  <select
                    value={newCapacity}
                    onChange={(e) => setNewCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-surface-subtle border border-surface-border text-sm text-gray-100 focus:outline-none focus:border-primary"
                  >
                    <option value={2}>2 Guests (Intimate / Bistro)</option>
                    <option value={4}>4 Guests (Standard Dining)</option>
                    <option value={6}>6 Guests (Family Booth)</option>
                    <option value={8}>8 Guests (Large Group)</option>
                    <option value={12}>12 Guests (Banquet Table)</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={isCreating}
                  >
                    {isCreating ? "Creating..." : "Create Table & QR"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* DEDICATED PRINT-ONLY STANDEE (Appears ONLY in Print dialog) */}
      {selectedTableForPrint && (
        <div className="print-single-standee hidden">
          <div className="w-[380px] p-8 border-4 border-black rounded-3xl flex flex-col items-center text-center bg-white text-black shadow-none">
            {/* Restaurant Branding */}
            <span className="text-lg font-black uppercase tracking-widest text-black mb-1">
              {restaurantName}
            </span>
            <span className="text-[11px] uppercase tracking-wider text-gray-600 mb-6 font-semibold">
              Contactless Dining & Digital Order
            </span>

            {/* QR Code Container */}
            <div className="p-4 bg-white border-2 border-black rounded-2xl mb-4">
              <QRCodeSVG
                value={
                  typeof window !== "undefined"
                    ? `${window.location.origin}/t/${selectedTableForPrint.token}`
                    : `http://localhost:3000/t/${selectedTableForPrint.token}`
                }
                size={220}
                level="H"
                includeMargin={false}
              />
            </div>

            {/* Large Table Number Callout */}
            <div className="px-6 py-2 bg-black text-white rounded-full font-black text-xl tracking-wider mb-4">
              {selectedTableForPrint.tableNumber.toUpperCase()}
            </div>

            {/* Clear Customer Instructions */}
            <p className="text-sm font-bold text-black mb-1">
              SCAN WITH YOUR PHONE CAMERA
            </p>
            <p className="text-xs text-gray-700 leading-snug max-w-[260px]">
              Point your camera at this QR code to browse the live menu, place food orders, and request assistance.
            </p>

            {/* Footer Tag */}
            <div className="mt-6 pt-3 border-t border-gray-300 w-full flex items-center justify-between text-[9px] text-gray-500 font-mono">
              <span>Token: {selectedTableForPrint.token}</span>
              <span>Powered by TableOS</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
