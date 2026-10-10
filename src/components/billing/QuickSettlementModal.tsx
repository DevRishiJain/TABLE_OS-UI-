"use client";

import React, { useState, useEffect, useMemo } from "react";
import { formatMoney } from "@/lib/money";
import { Banknote, QrCode, CreditCard, X, Check, Loader2 } from "lucide-react";

export interface QuickSettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalMinorUnits: number;
  onConfirm: (payment: {
    method: "CASH" | "UPI" | "CARD";
    tenderedMinor: number;
    changeMinor: number;
  }) => Promise<void>;
  isLoading?: boolean;
}

export const QuickSettlementModal: React.FC<QuickSettlementModalProps> = ({
  isOpen,
  onClose,
  totalMinorUnits,
  onConfirm,
  isLoading = false,
}) => {
  const [method, setMethod] = useState<"CASH" | "UPI" | "CARD">("CASH");
  const [tenderedMajorStr, setTenderedMajorStr] = useState<string>("");

  const totalMajor = Math.round(totalMinorUnits / 100);

  // Default tendered to exact total when modal opens or total changes
  useEffect(() => {
    if (isOpen) {
      setTenderedMajorStr(String(totalMajor));
      setMethod("CASH");
    }
  }, [isOpen, totalMajor]);

  const tenderedMinor = useMemo(() => {
    const val = parseFloat(tenderedMajorStr);
    if (isNaN(val) || val < 0) return totalMinorUnits;
    return Math.round(val * 100);
  }, [tenderedMajorStr, totalMinorUnits]);

  const changeMinor = Math.max(0, tenderedMinor - totalMinorUnits);
  const remainingMinor = Math.max(0, totalMinorUnits - tenderedMinor);

  // Common denominations higher than total
  const denominations = useMemo(() => {
    const list = [totalMajor, 100, 200, 500, 1000, 2000];
    const unique = Array.from(new Set(list))
      .filter((d) => d >= totalMajor || d === totalMajor)
      .slice(0, 5);
    return unique;
  }, [totalMajor]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    await onConfirm({
      method,
      tenderedMinor: method === "CASH" ? tenderedMinor : totalMinorUnits,
      changeMinor: method === "CASH" ? changeMinor : 0,
    });
  };

  return (
    <div className="pos-variant-modal-overlay" onClick={onClose}>
      <div
        className="pos-variant-modal"
        style={{ maxWidth: "460px" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: "12px" }}>
          <div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: "800", margin: 0, color: "var(--text)" }}>
              Settle Payment
            </h3>
            <span style={{ fontSize: "0.85rem", color: "var(--text-sub)" }}>
              Select payment method & complete bill
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-sub)",
              padding: "4px",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Bill Total Card */}
        <div
          style={{
            background: "var(--bg)",
            border: "1.5px solid var(--border)",
            borderRadius: "12px",
            padding: "16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: "0.95rem", fontWeight: "600", color: "var(--text-sub)" }}>
            Total Net Payable
          </span>
          <span style={{ fontSize: "1.6rem", fontWeight: "900", color: "var(--accent)" }}>
            {formatMoney(totalMinorUnits)}
          </span>
        </div>

        {/* Payment Methods */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
          <button
            type="button"
            className={`btn ${method === "CASH" ? "p" : "s"}`}
            onClick={() => setMethod("CASH")}
            style={{
              padding: "10px 8px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "6px",
              fontSize: "0.85rem",
              fontWeight: "700",
            }}
          >
            <Banknote size={20} />
            Cash
          </button>

          <button
            type="button"
            className={`btn ${method === "UPI" ? "p" : "s"}`}
            onClick={() => setMethod("UPI")}
            style={{
              padding: "10px 8px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "6px",
              fontSize: "0.85rem",
              fontWeight: "700",
            }}
          >
            <QrCode size={20} />
            UPI / QR
          </button>

          <button
            type="button"
            className={`btn ${method === "CARD" ? "p" : "s"}`}
            onClick={() => setMethod("CARD")}
            style={{
              padding: "10px 8px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "6px",
              fontSize: "0.85rem",
              fontWeight: "700",
            }}
          >
            <CreditCard size={20} />
            Card / POS
          </button>
        </div>

        {/* Cash Calculation UI */}
        {method === "CASH" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "var(--text-sub)", marginBottom: "6px" }}>
                Amount Tendered by Customer (₹)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                className="pos-search-input"
                style={{ padding: "10px 14px", fontSize: "1.1rem", fontWeight: "700" }}
                value={tenderedMajorStr}
                onChange={(e) => setTenderedMajorStr(e.target.value)}
                autoFocus
              />
            </div>

            {/* Quick Denomination Chips */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {denominations.map((denom) => (
                <button
                  key={denom}
                  type="button"
                  className="pos-cat-pill"
                  style={{
                    fontWeight: "700",
                    background: Number(tenderedMajorStr) === denom ? "var(--accent)" : "var(--bg)",
                    color: Number(tenderedMajorStr) === denom ? "#FFFFFF" : "var(--text)",
                    borderColor: Number(tenderedMajorStr) === denom ? "var(--accent)" : "var(--border)",
                  }}
                  onClick={() => setTenderedMajorStr(String(denom))}
                >
                  {denom === totalMajor ? `Exact (₹${denom})` : `₹${denom}`}
                </button>
              ))}
            </div>

            {/* Change / Due Feedback */}
            <div
              style={{
                background: changeMinor > 0 ? "rgba(16, 185, 129, 0.1)" : "var(--bg)",
                border: `1.5px solid ${changeMinor > 0 ? "#10B981" : "var(--border)"}`,
                borderRadius: "10px",
                padding: "12px 14px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: "0.9rem", fontWeight: "600", color: changeMinor > 0 ? "#065F46" : "var(--text-sub)" }}>
                {remainingMinor > 0 ? "Short by / Due:" : "Change to Return:"}
              </span>
              <span
                style={{
                  fontSize: "1.2rem",
                  fontWeight: "900",
                  color: remainingMinor > 0 ? "#DC2626" : "#059669",
                }}
              >
                {remainingMinor > 0 ? formatMoney(remainingMinor) : formatMoney(changeMinor)}
              </span>
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: "20px",
              textAlign: "center",
              background: "var(--bg)",
              borderRadius: "10px",
              border: "1px dashed var(--border)",
              color: "var(--text-sub)",
              fontSize: "0.9rem",
            }}
          >
            {method === "UPI"
              ? "Confirm customer scanned outlet UPI QR code or completed UPI transaction."
              : "Confirm EDC Card swipe / tap completed on credit/debit POS terminal."}
          </div>
        )}

        {/* Footer Actions */}
        <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
          <button
            type="button"
            className="btn s"
            onClick={onClose}
            disabled={isLoading}
            style={{ flex: 1, padding: "12px" }}
          >
            Cancel
          </button>

          <button
            type="button"
            className="btn p"
            onClick={handleSubmit}
            disabled={isLoading || (method === "CASH" && remainingMinor > 0)}
            style={{
              flex: 2,
              padding: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Check size={18} />
                Settle & Print Receipt
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
