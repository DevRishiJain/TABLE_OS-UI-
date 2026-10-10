"use client";

import React, { useState, useEffect, useMemo } from "react";
import { formatMoney } from "@/lib/money";
import { Banknote, QrCode, CreditCard, Check, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Settle Payment"
      description="Select payment tender & print customer bill"
      size="lg"
      closeDisabled={isLoading}
    >

        {/* Bill Total Display */}
        <div
          style={{
            background: "var(--admin-s2)",
            border: "1.5px solid var(--admin-ln)",
            borderRadius: "16px",
            padding: "16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <div>
            <span style={{ fontSize: "0.8rem", fontWeight: "800", color: "var(--admin-mute)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block" }}>
              Net Bill Amount
            </span>
            <span style={{ fontSize: "0.82rem", color: "var(--admin-mute)" }}>
              Incl. 2.5% CGST + 2.5% SGST
            </span>
          </div>
          <span style={{ font: "400 2.2rem/1 var(--admin-serif)", color: "var(--admin-ink)" }}>
            {formatMoney(totalMinorUnits)}
          </span>
        </div>

        {/* Payment Methods */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "16px" }}>
          <button
            type="button"
            className={`chip ${method === "CASH" ? "active" : ""}`}
            aria-pressed={method === "CASH"}
            onClick={() => setMethod("CASH")}
            style={{
              height: "44px",
              justifyContent: "center",
              borderRadius: "14px",
            }}
          >
            <Banknote size={18} />
            Cash
          </button>

          <button
            type="button"
            className={`chip ${method === "UPI" ? "active" : ""}`}
            aria-pressed={method === "UPI"}
            onClick={() => setMethod("UPI")}
            style={{
              height: "44px",
              justifyContent: "center",
              borderRadius: "14px",
            }}
          >
            <QrCode size={18} />
            UPI / QR
          </button>

          <button
            type="button"
            className={`chip ${method === "CARD" ? "active" : ""}`}
            aria-pressed={method === "CARD"}
            onClick={() => setMethod("CARD")}
            style={{
              height: "44px",
              justifyContent: "center",
              borderRadius: "14px",
            }}
          >
            <CreditCard size={18} />
            Card
          </button>
        </div>

        {/* Cash Calculation UI */}
        {method === "CASH" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "700", color: "var(--admin-mute)", marginBottom: "6px" }}>
                Amount Tendered by Customer (₹)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                style={{
                  width: "100%",
                  height: "48px",
                  borderRadius: "12px",
                  border: "1.5px solid var(--admin-ln)",
                  background: "var(--admin-s2)",
                  color: "var(--admin-ink)",
                  padding: "0 14px",
                  fontSize: "1.2rem",
                  fontWeight: "800",
                  outline: "none",
                }}
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
                  className="chip"
                  aria-pressed={Number(tenderedMajorStr) === denom}
                  onClick={() => setTenderedMajorStr(String(denom))}
                  style={{ height: "34px", padding: "0 12px", fontSize: "0.8rem" }}
                >
                  {denom === totalMajor ? `Exact (₹${denom})` : `₹${denom}`}
                </button>
              ))}
            </div>

            {/* Change / Due Feedback */}
            <div
              style={{
                background: changeMinor > 0 ? "rgba(47, 154, 98, 0.12)" : "var(--admin-s2)",
                border: `1.5px solid ${changeMinor > 0 ? "var(--admin-grn)" : "var(--admin-ln)"}`,
                borderRadius: "12px",
                padding: "12px 16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: "0.88rem", fontWeight: "700", color: changeMinor > 0 ? "var(--admin-grn)" : "var(--admin-mute)" }}>
                {remainingMinor > 0 ? "Short by / Due:" : "Change to Return:"}
              </span>
              <span
                style={{
                  font: "400 1.6rem/1 var(--admin-serif)",
                  color: remainingMinor > 0 ? "var(--admin-red)" : changeMinor > 0 ? "var(--admin-grn)" : "var(--admin-ink)",
                }}
              >
                {remainingMinor > 0 ? formatMoney(remainingMinor) : formatMoney(changeMinor)}
              </span>
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: "24px 16px",
              textAlign: "center",
              background: "var(--admin-s2)",
              borderRadius: "14px",
              border: "1.5px dashed var(--admin-ln)",
              color: "var(--admin-mute)",
              fontSize: "0.88rem",
            }}
          >
            {method === "UPI"
              ? "Confirm customer scanned counter UPI QR code or completed UPI transaction."
              : "Confirm EDC Card swipe / tap completed on credit/debit card terminal."}
          </div>
        )}

        {/* Modal Actions */}
        <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
          <button
            type="button"
            className="btn s"
            onClick={onClose}
            disabled={isLoading}
            style={{ flex: 1 }}
          >
            Cancel
          </button>

          <button
            type="button"
            className="btn"
            onClick={handleSubmit}
            disabled={isLoading || (method === "CASH" && remainingMinor > 0)}
            style={{
              flex: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Settling...
              </>
            ) : (
              <>
                <Check size={18} />
                Settle & Print Slip
              </>
            )}
          </button>
        </div>
    </Modal>
  );
};
