"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useAppSelector } from "@/store";
import {
  useGetMenuCategoriesQuery,
  useGetMenuItemsQuery,
  useGetRestaurantTablesQuery,
  useGetRestaurantSettingsQuery,
} from "@/store/api/restaurantApi";
import {
  useStartStaffSessionMutation,
  usePlaceStaffOrderMutation,
  useConfirmPaymentMutation,
} from "@/store/api/staffApi";
import { MenuItem, MenuCategory, MenuItemVariant } from "@/types/domain";
import { PaymentMethod } from "@/types/enums";
import { formatMoney } from "@/lib/money";
import { ThermalReceipt, ThermalReceiptProps } from "@/components/billing/ThermalReceipt";
import { QuickSettlementModal } from "@/components/billing/QuickSettlementModal";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Printer,
  Zap,
  ShoppingBag,
  Utensils,
  CheckCircle2,
  AlertCircle,
  Eye,
  X,
  FileText,
} from "lucide-react";

interface CartLine {
  menuItemId: string;
  name: string;
  variantId?: string;
  variantName?: string;
  unitPriceMinor: number;
  quantity: number;
  notes?: string;
}

export default function QuickBillingPage() {
  const restaurantName = useAppSelector((state) => state.auth.restaurantName) || "TableOS Restaurant";
  const userName = useAppSelector((state) => state.auth.userName) || "Manager";

  // API Queries
  const { data: categories = [], isLoading: isCatLoading } = useGetMenuCategoriesQuery();
  const { data: menuItems = [], isLoading: isMenuLoading } = useGetMenuItemsQuery();
  const { data: tables = [], isLoading: isTablesLoading } = useGetRestaurantTablesQuery();
  const { data: settings } = useGetRestaurantSettingsQuery();

  // API Mutations
  const [startSession, { isLoading: isStartingSession }] = useStartStaffSessionMutation();
  const [placeOrder, { isLoading: isPlacingOrder }] = usePlaceStaffOrderMutation();
  const [confirmPayment, { isLoading: isPaying }] = useConfirmPaymentMutation();

  // Component States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("ALL");
  const [orderType, setOrderType] = useState<"TAKEAWAY" | "DINE_IN">("TAKEAWAY");
  const [selectedTableId, setSelectedTableId] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [paperSize, setPaperSize] = useState<"80mm" | "58mm">("80mm");

  // Modals & Print States
  const [variantItem, setVariantItem] = useState<MenuItem | null>(null);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<ThermalReceiptProps | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Set default table when tables load
  useEffect(() => {
    if (tables.length > 0 && !selectedTableId) {
      setSelectedTableId(tables[0].id);
    }
  }, [tables, selectedTableId]);

  // Toast Auto-Dismiss
  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => setSuccessToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successToast]);

  // Filtered Menu Items
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesCategory =
        selectedCategoryId === "ALL" || item.category_id === selectedCategoryId;
      const matchesSearch =
        searchQuery.trim() === "" ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [menuItems, selectedCategoryId, searchQuery]);

  // Cart Calculations
  const subtotalMinor = useMemo(() => {
    return cart.reduce((acc, line) => acc + line.unitPriceMinor * line.quantity, 0);
  }, [cart]);

  const cgstMinor = Math.round(subtotalMinor * 0.025);
  const sgstMinor = Math.round(subtotalMinor * 0.025);
  const grandTotalMinor = subtotalMinor + cgstMinor + sgstMinor;

  // Add Item to Cart
  const handleItemClick = (item: MenuItem) => {
    if (item.variants && item.variants.length > 0) {
      setVariantItem(item);
      return;
    }

    const priceMinor = item.price?.amount_minor_units || 0;
    setCart((prev) => {
      const existing = prev.find((line) => line.menuItemId === item.id && !line.variantId);
      if (existing) {
        return prev.map((line) =>
          line === existing ? { ...line, quantity: line.quantity + 1 } : line
        );
      }
      return [
        ...prev,
        {
          menuItemId: item.id,
          name: item.name,
          unitPriceMinor: priceMinor,
          quantity: 1,
        },
      ];
    });
  };

  // Add Variant Item to Cart
  const handleAddVariant = (item: MenuItem, variant: MenuItemVariant) => {
    const priceMinor = variant.price?.amount_minor_units || item.price?.amount_minor_units || 0;

    setCart((prev) => {
      const existing = prev.find(
        (line) => line.menuItemId === item.id && line.variantId === variant.id
      );
      if (existing) {
        return prev.map((line) =>
          line === existing ? { ...line, quantity: line.quantity + 1 } : line
        );
      }
      return [
        ...prev,
        {
          menuItemId: item.id,
          name: item.name,
          variantId: variant.id,
          variantName: variant.name,
          unitPriceMinor: priceMinor,
          quantity: 1,
        },
      ];
    });
    setVariantItem(null);
  };

  // Quantity Stepper
  const updateQuantity = (index: number, delta: number) => {
    setCart((prev) => {
      const target = prev[index];
      if (!target) return prev;
      const newQty = target.quantity + delta;
      if (newQty <= 0) {
        return prev.filter((_, i) => i !== index);
      }
      return prev.map((line, i) => (i === index ? { ...line, quantity: newQty } : line));
    });
  };

  // Remove Item
  const removeItem = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  // Selected Table Details
  const selectedTable = useMemo(() => {
    return tables.find((t) => t.id === selectedTableId);
  }, [tables, selectedTableId]);

  // Clean Print Trigger
  const triggerPrint = useCallback((receiptData: ThermalReceiptProps) => {
    setActiveReceipt(receiptData);
    setTimeout(() => {
      window.print();
    }, 100);
  }, []);

  // Quick KOT Print
  const handlePrintKOT = () => {
    if (cart.length === 0) return;

    const kotData: ThermalReceiptProps = {
      type: "KOT",
      paperSize,
      restaurantName,
      orderNumber: "KOT-" + Math.floor(100000 + Math.random() * 900000),
      orderType,
      tableNumber: selectedTable?.table_number || selectedTable?.tableNumber,
      customerName: customerName || undefined,
      customerPhone: customerPhone || undefined,
      cashierName: userName,
      date: new Date(),
      items: cart.map((c) => ({
        name: c.name,
        variantName: c.variantName,
        quantity: c.quantity,
        unitPriceMinor: c.unitPriceMinor,
        totalMinor: c.unitPriceMinor * c.quantity,
        notes: c.notes,
      })),
      subtotalMinor,
      cgstMinor,
      sgstMinor,
      grandTotalMinor,
    };

    triggerPrint(kotData);
  };

  // Settle Payment Execution
  const handleSettlePayment = async (payment: {
    method: "CASH" | "UPI" | "CARD";
    tenderedMinor: number;
    changeMinor: number;
  }) => {
    if (cart.length === 0) return;
    setErrorMessage(null);

    try {
      // 1. Determine or start session
      let targetTableObj = selectedTable;
      if (!targetTableObj && tables.length > 0) {
        targetTableObj = tables[0];
      }

      const tableIdToUse = targetTableObj?.id;
      const tableNumToUse = targetTableObj?.table_number || targetTableObj?.tableNumber || "1";

      const sessionResp = await startSession({
        table_id: tableIdToUse,
        table_number: tableNumToUse,
        customer_name: customerName || (orderType === "TAKEAWAY" ? "Takeaway Guest" : "Dine-in Guest"),
        customer_phone: customerPhone || undefined,
        guest_count: 1,
      }).unwrap();

      const sessionId = sessionResp.id;

      // 2. Place Order
      const orderPayloadItems = cart.map((c) => ({
        menu_item_id: c.menuItemId,
        variant_id: c.variantId,
        quantity: c.quantity,
        instructions: c.notes,
      }));

      const orderResp = await placeOrder({
        sessionId,
        items: orderPayloadItems,
      }).unwrap();

      const createdOrderId = orderResp.order?.id || "ORD-" + Date.now();

      // 3. Confirm Payment
      const backendPaymentMethod =
        payment.method === "CASH"
          ? PaymentMethod.CASH
          : payment.method === "UPI"
          ? PaymentMethod.UPI_QR
          : PaymentMethod.POS_CARD;

      await confirmPayment({
        data: {
          session_id: sessionId,
          amount_minor: grandTotalMinor,
          method: backendPaymentMethod,
        },
      }).unwrap();

      // 4. Generate Thermal Receipt Data
      const receiptData: ThermalReceiptProps = {
        type: "BILL",
        paperSize,
        restaurantName: restaurantName,
        orderNumber: createdOrderId,
        orderType,
        tableNumber: tableNumToUse,
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        cashierName: userName,
        date: new Date(),
        items: cart.map((c) => ({
          name: c.name,
          variantName: c.variantName,
          quantity: c.quantity,
          unitPriceMinor: c.unitPriceMinor,
          totalMinor: c.unitPriceMinor * c.quantity,
          notes: c.notes,
        })),
        subtotalMinor,
        cgstMinor,
        sgstMinor,
        grandTotalMinor,
        paymentMethod: payment.method,
        tenderedMinor: payment.tenderedMinor,
        changeMinor: payment.changeMinor,
      };

      // 5. Close Modal, Trigger Print, & Reset Cart
      setIsSettleModalOpen(false);
      setSuccessToast(`Bill settled successfully (${formatMoney(grandTotalMinor)})!`);
      triggerPrint(receiptData);

      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
    } catch (err: any) {
      console.error("Quick Billing Settlement Error:", err);
      setErrorMessage(err?.data?.message || err?.message || "Failed to complete billing transaction.");
    }
  };

  const isMutating = isStartingSession || isPlacingOrder || isPaying;

  return (
    <div>
      {/* Toast & Error Banner */}
      {successToast && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "24px",
            background: "#10B981",
            color: "#FFFFFF",
            padding: "12px 20px",
            borderRadius: "10px",
            boxShadow: "0 8px 24px rgba(16, 185, 129, 0.3)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontWeight: "700",
            zIndex: 9999,
          }}
        >
          <CheckCircle2 size={20} />
          {successToast}
        </div>
      )}

      {errorMessage && (
        <div
          style={{
            marginBottom: "14px",
            background: "rgba(220, 38, 38, 0.1)",
            border: "1.5px solid #DC2626",
            borderRadius: "10px",
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: "#DC2626",
            fontWeight: "600",
            fontSize: "0.9rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <AlertCircle size={18} />
            {errorMessage}
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            style={{ background: "none", border: "none", color: "#DC2626", cursor: "pointer" }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* POS Workspace Container */}
      <div className="pos-workspace">
        {/* Left Catalog Pane */}
        <div className="pos-catalog-pane">
          {/* Header Bar */}
          <div className="pos-catalog-header">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h1 style={{ fontSize: "1.3rem", fontWeight: "900", margin: 0, color: "var(--text)" }}>
                  Quick Billing Point-of-Sale
                </h1>
                <span style={{ fontSize: "0.82rem", color: "var(--text-sub)" }}>
                  Fast counter billing & instant thermal receipt generation
                </span>
              </div>

              {/* Thermal Paper Toggle */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "0.82rem", fontWeight: "700", color: "var(--text-sub)" }}>
                  Roll:
                </span>
                <button
                  type="button"
                  className={`pos-cat-pill ${paperSize === "80mm" ? "active" : ""}`}
                  style={{ padding: "4px 10px", fontSize: "0.78rem" }}
                  onClick={() => setPaperSize("80mm")}
                >
                  80mm (3")
                </button>
                <button
                  type="button"
                  className={`pos-cat-pill ${paperSize === "58mm" ? "active" : ""}`}
                  style={{ padding: "4px 10px", fontSize: "0.78rem" }}
                  onClick={() => setPaperSize("58mm")}
                >
                  58mm (2")
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="pos-search-wrapper">
              <Search className="pos-search-icon" size={18} />
              <input
                type="text"
                placeholder="Search menu dishes, starters, drinks... (press '/' to focus)"
                className="pos-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  style={{
                    position: "absolute",
                    right: "12px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-sub)",
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="pos-cat-scroll">
              <button
                type="button"
                className={`pos-cat-pill ${selectedCategoryId === "ALL" ? "active" : ""}`}
                onClick={() => setSelectedCategoryId("ALL")}
              >
                All Items ({menuItems.length})
              </button>
              {categories.map((cat: MenuCategory) => {
                const count = menuItems.filter((i) => i.category_id === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    className={`pos-cat-pill ${selectedCategoryId === cat.id ? "active" : ""}`}
                    onClick={() => setSelectedCategoryId(cat.id)}
                  >
                    {cat.name} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Items Scrollable Grid */}
          <div className="pos-items-scroll">
            {isMenuLoading || isCatLoading ? (
              <div style={{ textAlign: "center", padding: "40px", color: "var(--text-sub)" }}>
                Loading menu catalog...
              </div>
            ) : filteredItems.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: "var(--text-sub)" }}>
                No menu items match your search.
              </div>
            ) : (
              <div className="pos-grid">
                {filteredItems.map((item: MenuItem) => {
                  const priceMinor = item.price?.amount_minor_units || 0;
                  const hasVariants = item.variants && item.variants.length > 0;
                  const inCartCount = cart
                    .filter((c) => c.menuItemId === item.id)
                    .reduce((sum, c) => sum + c.quantity, 0);

                  return (
                    <div
                      key={item.id}
                      className="pos-item-card"
                      onClick={() => handleItemClick(item)}
                    >
                      <div>
                        <div className="pos-item-name">{item.name}</div>
                        <div className="pos-item-cat">
                          {hasVariants ? "Multiple Sizes" : formatMoney(priceMinor)}
                        </div>
                      </div>

                      <div className="pos-item-footer">
                        <div className="pos-item-price">
                          {hasVariants ? `From ${formatMoney(priceMinor)}` : formatMoney(priceMinor)}
                        </div>
                        <div className="pos-item-add-badge">
                          {inCartCount > 0 ? inCartCount : <Plus size={16} />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Cart & Bill Pane */}
        <div className="pos-cart-pane">
          {/* Cart Header */}
          <div className="pos-cart-header">
            {/* Mode Switcher */}
            <div className="pos-mode-toggle">
              <button
                type="button"
                className={`pos-mode-btn ${orderType === "TAKEAWAY" ? "active" : ""}`}
                onClick={() => setOrderType("TAKEAWAY")}
              >
                <ShoppingBag size={16} />
                Takeaway / Counter
              </button>
              <button
                type="button"
                className={`pos-mode-btn ${orderType === "DINE_IN" ? "active" : ""}`}
                onClick={() => setOrderType("DINE_IN")}
              >
                <Utensils size={16} />
                Dine-In Table
              </button>
            </div>

            {/* Dine-In Table Picker */}
            {orderType === "DINE_IN" && (
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "700", color: "var(--text-sub)", marginBottom: "4px" }}>
                  Select Table:
                </label>
                <select
                  className="pos-table-select"
                  value={selectedTableId}
                  onChange={(e) => setSelectedTableId(e.target.value)}
                >
                  {tables.map((t) => (
                    <option key={t.id} value={t.id}>
                      Table {t.table_number || t.tableNumber} (Seats {t.capacity})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Customer Inputs (Optional) */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <input
                type="text"
                placeholder="Guest Name (opt)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                style={{
                  padding: "6px 10px",
                  borderRadius: "7px",
                  border: "1px solid var(--border)",
                  background: "var(--bg)",
                  fontSize: "0.82rem",
                  color: "var(--text)",
                  outline: "none",
                }}
              />
              <input
                type="tel"
                placeholder="Phone (opt)"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                style={{
                  padding: "6px 10px",
                  borderRadius: "7px",
                  border: "1px solid var(--border)",
                  background: "var(--bg)",
                  fontSize: "0.82rem",
                  color: "var(--text)",
                  outline: "none",
                }}
              />
            </div>
          </div>

          {/* Cart Item Rows */}
          <div className="pos-cart-items">
            {cart.length === 0 ? (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text-sub)",
                  gap: "10px",
                  textAlign: "center",
                  padding: "40px 20px",
                }}
              >
                <ShoppingBag size={40} style={{ opacity: 0.35 }} />
                <div style={{ fontSize: "0.95rem", fontWeight: "700" }}>Cart is Empty</div>
                <div style={{ fontSize: "0.82rem" }}>
                  Tap menu dishes on the left to start generating a quick bill.
                </div>
              </div>
            ) : (
              cart.map((line, idx) => (
                <div key={idx} className="pos-cart-row">
                  <div className="pos-cart-info">
                    <div className="pos-cart-title">{line.name}</div>
                    {line.variantName && (
                      <div className="pos-cart-variant">Size: {line.variantName}</div>
                    )}
                    <div className="pos-cart-price-unit">
                      {formatMoney(line.unitPriceMinor)} each
                    </div>
                  </div>

                  <div className="pos-cart-ctrl">
                    <div className="pos-cart-row-total">
                      {formatMoney(line.unitPriceMinor * line.quantity)}
                    </div>
                    <div className="pos-stepper">
                      <button
                        type="button"
                        className="pos-stepper-btn"
                        onClick={() => updateQuantity(idx, -1)}
                      >
                        {line.quantity === 1 ? <Trash2 size={13} color="#DC2626" /> : <Minus size={13} />}
                      </button>
                      <span className="pos-stepper-val">{line.quantity}</span>
                      <button
                        type="button"
                        className="pos-stepper-btn"
                        onClick={() => updateQuantity(idx, 1)}
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Summary & Actions */}
          <div className="pos-cart-footer">
            <div className="pos-bill-lines">
              <div className="pos-bill-line">
                <span>Subtotal ({cart.reduce((a, b) => a + b.quantity, 0)} items):</span>
                <span>{formatMoney(subtotalMinor)}</span>
              </div>
              <div className="pos-bill-line">
                <span>CGST (2.5%):</span>
                <span>{formatMoney(cgstMinor)}</span>
              </div>
              <div className="pos-bill-line">
                <span>SGST (2.5%):</span>
                <span>{formatMoney(sgstMinor)}</span>
              </div>
              <div className="pos-bill-total">
                <span>Net Total:</span>
                <span>{formatMoney(grandTotalMinor)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pos-action-btns">
              <button
                type="button"
                className="pos-btn-kot"
                onClick={handlePrintKOT}
                disabled={cart.length === 0 || isMutating}
                title="Print Kitchen Order Ticket"
              >
                <FileText size={16} />
                KOT
              </button>

              <button
                type="button"
                className="pos-btn-settle"
                onClick={() => setIsSettleModalOpen(true)}
                disabled={cart.length === 0 || isMutating}
              >
                <Zap size={18} />
                Settle & Print ({formatMoney(grandTotalMinor)})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Variant Selection Modal */}
      {variantItem && (
        <div className="pos-variant-modal-overlay" onClick={() => setVariantItem(null)}>
          <div className="pos-variant-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: "800", margin: 0, color: "var(--text)" }}>
                Select Variant: {variantItem.name}
              </h3>
              <button
                onClick={() => setVariantItem(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-sub)" }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {variantItem.variants?.map((v) => {
                const varPriceMinor =
                  v.price?.amount_minor_units || variantItem.price?.amount_minor_units || 0;

                return (
                  <button
                    key={v.id}
                    type="button"
                    className="btn s"
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px 16px",
                      fontWeight: "700",
                    }}
                    onClick={() => handleAddVariant(variantItem, v)}
                  >
                    <span>{v.name}</span>
                    <span style={{ color: "var(--accent)", fontWeight: "800" }}>
                      {formatMoney(varPriceMinor)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Settlement Tender Modal */}
      <QuickSettlementModal
        isOpen={isSettleModalOpen}
        onClose={() => setIsSettleModalOpen(false)}
        totalMinorUnits={grandTotalMinor}
        onConfirm={handleSettlePayment}
        isLoading={isMutating}
      />

      {/* Print Slip (Attached directly for @media print execution) */}
      {activeReceipt && (
        <ThermalReceipt {...activeReceipt} />
      )}
    </div>
  );
}
