"use client";

import React from "react";
import { formatMoney } from "@/lib/money";

export interface ThermalReceiptItem {
  name: string;
  variantName?: string;
  quantity: number;
  unitPriceMinor: number;
  totalMinor: number;
  notes?: string;
}

export interface ThermalReceiptProps {
  type?: "BILL" | "KOT" | "COMBINED";
  paperSize?: "80mm" | "58mm";
  restaurantName: string;
  restaurantAddress?: string;
  restaurantPhone?: string;
  gstin?: string;
  fssai?: string;
  orderNumber: string;
  orderType: "TAKEAWAY" | "DINE_IN";
  tableNumber?: string;
  customerName?: string;
  customerPhone?: string;
  cashierName?: string;
  date?: Date;
  items: ThermalReceiptItem[];
  subtotalMinor: number;
  cgstMinor: number;
  sgstMinor: number;
  discountMinor?: number;
  grandTotalMinor: number;
  paymentMethod?: "CASH" | "UPI" | "CARD";
  tenderedMinor?: number;
  changeMinor?: number;
  isPreview?: boolean;
}

export const ThermalReceipt: React.FC<ThermalReceiptProps> = ({
  type = "BILL",
  paperSize = "80mm",
  restaurantName,
  restaurantAddress,
  restaurantPhone,
  gstin,
  fssai,
  orderNumber,
  orderType,
  tableNumber,
  customerName,
  customerPhone,
  cashierName = "Cashier",
  date = new Date(),
  items,
  subtotalMinor,
  cgstMinor,
  sgstMinor,
  discountMinor = 0,
  grandTotalMinor,
  paymentMethod = "CASH",
  tenderedMinor,
  changeMinor,
  isPreview = false,
}) => {
  const is58mm = paperSize === "58mm";
  const formattedDate = date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const formattedTime = date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const baseClassName = isPreview
    ? `receipt-preview-card ${is58mm ? "size-58mm" : "size-80mm"}`
    : `tableos-thermal-receipt ${is58mm ? "size-58mm" : ""}`;

  const renderKOTSection = () => (
    <div className="receipt-kot-section">
      <div style={{ textAlign: "center", borderBottom: "2px dashed #000", paddingBottom: "6px", marginBottom: "8px" }}>
        <div style={{ fontSize: is58mm ? "14px" : "16px", fontWeight: "900", letterSpacing: "1px" }}>
          *** K.O.T. TICKET ***
        </div>
        <div style={{ fontSize: is58mm ? "10px" : "12px", marginTop: "2px", fontWeight: "700" }}>
          {orderType === "DINE_IN" ? `TABLE: ${tableNumber || "DINE-IN"}` : "TAKEAWAY / COUNTER"}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: is58mm ? "9px" : "10px", marginBottom: "6px" }}>
        <span>Order: #{orderNumber.slice(-6).toUpperCase()}</span>
        <span>{formattedTime}</span>
      </div>

      {customerName && (
        <div style={{ fontSize: is58mm ? "9px" : "10px", marginBottom: "6px" }}>
          Guest: {customerName}
        </div>
      )}

      <div style={{ borderTop: "1px dashed #000", borderBottom: "1px dashed #000", padding: "4px 0", margin: "6px 0", display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: is58mm ? "9px" : "10.5px" }}>
        <span style={{ flex: 1 }}>ITEM</span>
        <span style={{ width: "35px", textAlign: "right" }}>QTY</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "6px", margin: "8px 0" }}>
        {items.map((item, idx) => (
          <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ flex: 1, paddingRight: "6px" }}>
              <div style={{ fontWeight: "bold", fontSize: is58mm ? "10px" : "12px" }}>
                {item.name}
              </div>
              {item.variantName && (
                <div style={{ fontSize: is58mm ? "8.5px" : "9.5px", opacity: 0.85 }}>
                  ({item.variantName})
                </div>
              )}
              {item.notes && (
                <div style={{ fontSize: is58mm ? "8px" : "9px", fontStyle: "italic", marginTop: "1px" }}>
                  *Note: {item.notes}
                </div>
              )}
            </div>
            <div style={{ width: "35px", textAlign: "right", fontWeight: "900", fontSize: is58mm ? "12px" : "14px" }}>
              x{item.quantity}
            </div>
          </div>
        ))}
      </div>

      <div style={{ borderTop: "2px dashed #000", paddingTop: "6px", marginTop: "10px", textAlign: "center", fontSize: is58mm ? "8px" : "9px", fontWeight: "700" }}>
        Items: {items.reduce((acc, it) => acc + it.quantity, 0)} · Kitchen Dispatch
      </div>
    </div>
  );

  const renderBillSection = () => (
    <div className="receipt-bill-section">
      {/* Restaurant Header */}
      <div style={{ textAlign: "center", borderBottom: "1px dashed #000", paddingBottom: "8px", marginBottom: "6px" }}>
        <div style={{ fontSize: is58mm ? "14px" : "16px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          {restaurantName}
        </div>
        {restaurantAddress && (
          <div style={{ fontSize: is58mm ? "8.5px" : "10px", marginTop: "2px", whiteSpace: "pre-line" }}>
            {restaurantAddress}
          </div>
        )}
        {restaurantPhone && (
          <div style={{ fontSize: is58mm ? "8.5px" : "9.5px", marginTop: "1px" }}>
            Tel: {restaurantPhone}
          </div>
        )}
        {gstin && (
          <div style={{ fontSize: is58mm ? "8.5px" : "9.5px", marginTop: "1px", fontWeight: "bold" }}>
            GSTIN: {gstin}
          </div>
        )}
        {fssai && (
          <div style={{ fontSize: is58mm ? "8px" : "9px", marginTop: "1px" }}>
            FSSAI Lic: {fssai}
          </div>
        )}
        <div style={{ fontSize: is58mm ? "9px" : "10.5px", fontWeight: "bold", marginTop: "4px", letterSpacing: "1px" }}>
          ** TAX INVOICE **
        </div>
      </div>

      {/* Bill Meta */}
      <div style={{ fontSize: is58mm ? "8.5px" : "9.5px", display: "flex", flexDirection: "column", gap: "2px", marginBottom: "6px" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Bill No: #{orderNumber.slice(-8).toUpperCase()}</span>
          <span>{formattedDate}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>
            {orderType === "DINE_IN"
              ? `Table: ${tableNumber || "Dine-In"}`
              : "Type: Counter / Takeaway"}
          </span>
          <span>{formattedTime}</span>
        </div>
        {customerName && (
          <div>Guest: {customerName} {customerPhone ? `(${customerPhone})` : ""}</div>
        )}
        <div>Cashier: {cashierName}</div>
      </div>

      {/* Item Table Header */}
      <div
        style={{
          borderTop: "1px dashed #000",
          borderBottom: "1px dashed #000",
          padding: "3px 0",
          display: "flex",
          justifyContent: "space-between",
          fontSize: is58mm ? "8.5px" : "9.5px",
          fontWeight: "bold",
          marginBottom: "4px",
        }}
      >
        <span style={{ flex: 1 }}>ITEM</span>
        <span style={{ width: "24px", textAlign: "center" }}>QTY</span>
        <span style={{ width: "42px", textAlign: "right" }}>RATE</span>
        <span style={{ width: "50px", textAlign: "right" }}>AMT</span>
      </div>

      {/* Item Rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: "3px", marginBottom: "6px" }}>
        {items.map((it, idx) => (
          <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: is58mm ? "8.5px" : "9.5px" }}>
            <div style={{ flex: 1, paddingRight: "4px" }}>
              <div style={{ fontWeight: "600" }}>{it.name}</div>
              {it.variantName && (
                <div style={{ fontSize: is58mm ? "7.5px" : "8.5px", opacity: 0.8 }}>
                  ({it.variantName})
                </div>
              )}
            </div>
            <div style={{ width: "24px", textAlign: "center" }}>{it.quantity}</div>
            <div style={{ width: "42px", textAlign: "right" }}>
              {formatMoney(it.unitPriceMinor)}
            </div>
            <div style={{ width: "50px", textAlign: "right", fontWeight: "600" }}>
              {formatMoney(it.totalMinor)}
            </div>
          </div>
        ))}
      </div>

      {/* Bill Breakdown */}
      <div style={{ borderTop: "1px dashed #000", paddingTop: "4px", fontSize: is58mm ? "8.5px" : "9.5px", display: "flex", flexDirection: "column", gap: "2px" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Subtotal:</span>
          <span>{formatMoney(subtotalMinor)}</span>
        </div>

        {discountMinor > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Discount:</span>
            <span>-{formatMoney(discountMinor)}</span>
          </div>
        )}

        {cgstMinor > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>CGST (2.5%):</span>
            <span>{formatMoney(cgstMinor)}</span>
          </div>
        )}

        {sgstMinor > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>SGST (2.5%):</span>
            <span>{formatMoney(sgstMinor)}</span>
          </div>
        )}

        <div
          style={{
            borderTop: "1.5px solid #000",
            borderBottom: "1.5px solid #000",
            padding: "4px 0",
            margin: "3px 0",
            display: "flex",
            justifyContent: "space-between",
            fontSize: is58mm ? "11px" : "13px",
            fontWeight: "900",
          }}
        >
          <span>NET PAYABLE:</span>
          <span>{formatMoney(grandTotalMinor)}</span>
        </div>

        {/* Payment Summary */}
        <div style={{ marginTop: "2px", display: "flex", justifyContent: "space-between" }}>
          <span>Paid By:</span>
          <span style={{ fontWeight: "bold" }}>{paymentMethod}</span>
        </div>

        {paymentMethod === "CASH" && tenderedMinor !== undefined && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Cash Tendered:</span>
              <span>{formatMoney(tenderedMinor)}</span>
            </div>
            {changeMinor !== undefined && changeMinor > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold" }}>
                <span>Change Returned:</span>
                <span>{formatMoney(changeMinor)}</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{ borderTop: "1px dashed #000", marginTop: "8px", paddingTop: "6px", textAlign: "center", fontSize: is58mm ? "8px" : "9px" }}>
        <div>Thank you for dining with us!</div>
        <div style={{ marginTop: "2px", opacity: 0.75 }}>Powered by TableOS</div>
      </div>
    </div>
  );

  return (
    <div className={baseClassName} aria-hidden={!isPreview}>
      {type === "KOT" && renderKOTSection()}
      {type === "BILL" && renderBillSection()}
      {type === "COMBINED" && (
        <>
          {renderKOTSection()}
          <div
            className="receipt-tear-divider"
            style={{
              borderTop: "2px dashed #000",
              borderBottom: "2px dashed #000",
              padding: "6px 0",
              margin: "16px 0",
              textAlign: "center",
              fontSize: is58mm ? "8.5px" : "10px",
              fontWeight: "900",
              letterSpacing: "0.5px",
            }}
          >
            - - - ✂ TEAR HERE (KITCHEN COPY) ✂ - - -
          </div>
          {renderBillSection()}
        </>
      )}
    </div>
  );
};
