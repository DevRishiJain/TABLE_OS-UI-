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
import { MenuItem, MenuCategory } from "@/types/domain";
import { PaymentMethod } from "@/types/enums";
import { formatMoney } from "@/lib/money";
import { ThermalReceipt, ThermalReceiptProps } from "@/components/billing/ThermalReceipt";
import { QuickSettlementModal } from "@/components/billing/QuickSettlementModal";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Zap,
  ShoppingBag,
  Utensils,
  CheckCircle2,
  AlertCircle,
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

interface PortionOption {
  id: string;
  name: string;
  priceMinor: number;
}

// Computes portion options ensuring "Full" is always available alongside "Half", "Quarter", etc.
function getDishPortions(item: MenuItem): PortionOption[] {
  const basePriceMinor = item.price?.amount_minor_units || 0;
  const variants = item.variants || [];

  if (variants.length === 0) {
    return [{ id: "base", name: "Full", priceMinor: basePriceMinor }];
  }

  const hasFullVariant = variants.some(
    (v) => v.name.toLowerCase().trim() === "full"
  );

  const options: PortionOption[] = [];

  // If no variant is named "Full", provide "Full" using the base item's price
  if (!hasFullVariant && basePriceMinor > 0) {
    options.push({
      id: "base-full",
      name: "Full",
      priceMinor: basePriceMinor,
    });
  }

  // Add all other configured portions (Half, Quarter, etc.)
  variants.forEach((v) => {
    const pMinor = v.price?.amount_minor_units || basePriceMinor;
    options.push({
      id: v.id,
      name: v.name,
      priceMinor: pMinor,
    });
  });

  return options;
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

  // Modals & Feedback
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<ThermalReceiptProps | null>(null);
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

  // Add Specific Portion directly to cart (1 tap, NO MODAL)
  const handleAddPortion = (item: MenuItem, portion: PortionOption, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    const isBaseFull = portion.id === "base" || portion.id === "base-full";
    const variantIdToUse = isBaseFull ? undefined : portion.id;
    const variantNameToUse = portion.name;

    setCart((prev) => {
      const existing = prev.find(
        (line) => line.menuItemId === item.id && line.variantId === variantIdToUse
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
          variantId: variantIdToUse,
          variantName: variantNameToUse,
          unitPriceMinor: portion.priceMinor,
          quantity: 1,
        },
      ];
    });
  };

  // Default click on dish card: adds the primary portion (Full) directly to cart
  const handleCardClick = (item: MenuItem) => {
    const portions = getDishPortions(item);
    const primaryPortion = portions[0];
    if (primaryPortion) {
      handleAddPortion(item, primaryPortion);
    }
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
    <>
      {/* Toast Alert */}
      {successToast && (
        <div className="toast on" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <CheckCircle2 size={18} />
          {successToast}
        </div>
      )}

      {/* Header Bar matching standard TableOS style */}
      <div className="hd">
        <div>
          <h1>Quick Billing</h1>
          <p>Instant counter orders, fast size selection & thermal slip printing</p>
        </div>
        <div className="sp"></div>

        {/* Thermal Roll Selector */}
        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          <span style={{ fontSize: "0.82rem", fontWeight: "700", color: "var(--admin-mute)", marginRight: "4px" }}>
            Thermal Roll:
          </span>
          <button
            type="button"
            className="chip"
            aria-pressed={paperSize === "80mm"}
            onClick={() => setPaperSize("80mm")}
            style={{ height: "36px", padding: "0 12px", fontSize: "0.8rem" }}
          >
            80mm (3")
          </button>
          <button
            type="button"
            className="chip"
            aria-pressed={paperSize === "58mm"}
            onClick={() => setPaperSize("58mm")}
            style={{ height: "36px", padding: "0 12px", fontSize: "0.8rem" }}
          >
            58mm (2")
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div
          className="al r mt"
          style={{
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(192, 57, 43, 0.1)",
            borderColor: "var(--admin-red)",
            color: "var(--admin-red)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "700" }}>
            <AlertCircle size={18} />
            {errorMessage}
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            style={{ background: "none", border: "none", color: "inherit", cursor: "pointer" }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Main Split Layout */}
      <div className="pos-layout">
        {/* Left Catalog Section */}
        <div className="pos-catalog-box">
          {/* Search Bar */}
          <div className="pos-search-bar">
            <Search className="pos-search-icon-pos" size={18} />
            <input
              type="text"
              placeholder="Search dishes, starters, desserts, beverages..."
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
                  color: "var(--admin-mute)",
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Category Chips Bar */}
          <div className="bar" style={{ margin: 0 }}>
            <div className="ch" style={{ flexWrap: "wrap" }}>
              <button
                type="button"
                className="chip"
                aria-pressed={selectedCategoryId === "ALL"}
                onClick={() => setSelectedCategoryId("ALL")}
              >
                All ({menuItems.length})
              </button>
              {categories.map((cat: MenuCategory) => {
                const count = menuItems.filter((i) => i.category_id === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    className="chip"
                    aria-pressed={selectedCategoryId === cat.id}
                    onClick={() => setSelectedCategoryId(cat.id)}
                  >
                    {cat.name} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dish Cards Grid */}
          {isMenuLoading || isCatLoading ? (
            <div className="em">
              <b>Loading dishes…</b>
              Fetching latest menu prices and portion options.
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="em">
              <b>No dishes found</b>
              Try adjusting your search query or select another category.
            </div>
          ) : (
            <div className="pos-dish-grid">
              {filteredItems.map((item: MenuItem) => {
                const portions = getDishPortions(item);
                const hasMultiplePortions = portions.length > 1;
                const inCartTotalCount = cart
                  .filter((c) => c.menuItemId === item.id)
                  .reduce((sum, c) => sum + c.quantity, 0);

                return (
                  <div
                    key={item.id}
                    className="pos-dish-card"
                    onClick={() => handleCardClick(item)}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div className="pos-dish-name">{item.name}</div>
                        {inCartTotalCount > 0 && (
                          <span
                            className="pill c-b"
                            style={{
                              marginLeft: "6px",
                              padding: "2px 7px",
                              fontSize: "0.75rem",
                              fontWeight: "900",
                            }}
                          >
                            {inCartTotalCount}
                          </span>
                        )}
                      </div>
                      <div className="pos-dish-cat">
                        {item.category_name || (categories.find((c) => c.id === item.category_id)?.name) || "General"}
                      </div>
                    </div>

                    {/* Portions Available Right On Card (No Modal Popup!) */}
                    {hasMultiplePortions ? (
                      <div className="pos-portion-list">
                        {portions.map((p) => {
                          const portionCartCount = cart
                            .filter((c) => c.menuItemId === item.id && (c.variantId === p.id || (p.id.startsWith("base") && !c.variantId)))
                            .reduce((sum, c) => sum + c.quantity, 0);

                          return (
                            <button
                              key={p.id}
                              type="button"
                              className="pos-portion-btn"
                              onClick={(e) => handleAddPortion(item, p, e)}
                              title={`Add ${p.name} ${item.name}`}
                            >
                              <span>{p.name}</span>
                              <em>{formatMoney(p.priceMinor)}</em>
                              {portionCartCount > 0 && (
                                <b style={{ color: "var(--admin-ink)", marginLeft: "2px" }}>
                                  ({portionCartCount})
                                </b>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="pos-single-add-btn"
                        onClick={(e) => handleAddPortion(item, portions[0], e)}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <Plus size={15} /> Add
                        </span>
                        <span className="price-tag">
                          {formatMoney(portions[0]?.priceMinor || 0)}
                        </span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Cart & Bill Panel */}
        <div className="pos-cart-box">
          {/* Order Type Toggle using TableOS chips */}
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "12px" }}>
              <button
                type="button"
                className="chip"
                aria-pressed={orderType === "TAKEAWAY"}
                onClick={() => setOrderType("TAKEAWAY")}
                style={{ height: "42px", justifyContent: "center" }}
              >
                <ShoppingBag size={16} />
                Takeaway
              </button>
              <button
                type="button"
                className="chip"
                aria-pressed={orderType === "DINE_IN"}
                onClick={() => setOrderType("DINE_IN")}
                style={{ height: "42px", justifyContent: "center" }}
              >
                <Utensils size={16} />
                Dine-In
              </button>
            </div>

            {/* Table Selector if Dine-In */}
            {orderType === "DINE_IN" && (
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "800", color: "var(--admin-mute)", marginBottom: "4px" }}>
                  Assigned Table:
                </label>
                <select
                  value={selectedTableId}
                  onChange={(e) => setSelectedTableId(e.target.value)}
                  style={{ width: "100%", height: "44px" }}
                >
                  {tables.map((t) => (
                    <option key={t.id} value={t.id}>
                      Table {t.table_number || t.tableNumber} (Capacity: {t.capacity || 4})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Customer Inputs (Optional) */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
              <input
                type="text"
                placeholder="Guest Name (opt)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                style={{ height: "40px", fontSize: "0.82rem", padding: "0 10px" }}
              />
              <input
                type="tel"
                placeholder="Phone (opt)"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                style={{ height: "40px", fontSize: "0.82rem", padding: "0 10px" }}
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="pos-cart-rows">
            {cart.length === 0 ? (
              <div
                style={{
                  padding: "36px 12px",
                  textAlign: "center",
                  color: "var(--admin-mute)",
                }}
              >
                <ShoppingBag size={36} style={{ opacity: 0.35, margin: "0 auto 8px" }} />
                <div style={{ fontWeight: "800", color: "var(--admin-ink)" }}>Bill is Empty</div>
                <div style={{ fontSize: "0.82rem", marginTop: "2px" }}>
                  Tap dishes or portion sizes on the left to add items.
                </div>
              </div>
            ) : (
              cart.map((line, idx) => (
                <div key={idx} className="pos-cart-line-item">
                  <div style={{ flex: 1, paddingRight: "10px" }}>
                    <div className="pos-cart-item-title">{line.name}</div>
                    {line.variantName && (
                      <span className="pos-cart-item-portion">
                        Size: {line.variantName}
                      </span>
                    )}
                    <div className="pos-cart-item-price-unit">
                      {formatMoney(line.unitPriceMinor)} each
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
                    <div style={{ font: "400 1.25rem/1 var(--admin-serif)", color: "var(--admin-ink)" }}>
                      {formatMoney(line.unitPriceMinor * line.quantity)}
                    </div>
                    <div className="pos-stepper-box">
                      <button
                        type="button"
                        className="pos-stepper-btn"
                        onClick={() => updateQuantity(idx, -1)}
                      >
                        {line.quantity === 1 ? <Trash2 size={13} color="var(--admin-red)" /> : <Minus size={13} />}
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

          {/* Financial Breakdown */}
          <div style={{ borderTop: "1.5px dashed var(--admin-ln)", paddingTop: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.86rem", color: "var(--admin-mute)", marginBottom: "4px" }}>
              <span>Subtotal ({cart.reduce((a, b) => a + b.quantity, 0)} items):</span>
              <span style={{ fontWeight: "700", color: "var(--admin-ink)" }}>{formatMoney(subtotalMinor)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", color: "var(--admin-mute)", marginBottom: "2px" }}>
              <span>CGST (2.5%):</span>
              <span>{formatMoney(cgstMinor)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", color: "var(--admin-mute)", marginBottom: "10px" }}>
              <span>SGST (2.5%):</span>
              <span>{formatMoney(sgstMinor)}</span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                borderTop: "1.5px solid var(--admin-ln)",
                paddingTop: "10px",
                marginBottom: "16px",
              }}
            >
              <span style={{ fontWeight: "800", fontSize: "1rem", color: "var(--admin-ink)" }}>
                Net Payable:
              </span>
              <span className="pos-cart-grand-total">
                {formatMoney(grandTotalMinor)}
              </span>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                className="btn s"
                onClick={handlePrintKOT}
                disabled={cart.length === 0 || isMutating}
                title="Print Kitchen Order Ticket"
                style={{ flex: 1, padding: "0 10px" }}
              >
                <FileText size={16} />
                KOT
              </button>

              <button
                type="button"
                className="btn"
                onClick={() => setIsSettleModalOpen(true)}
                disabled={cart.length === 0 || isMutating}
                style={{ flex: 2 }}
              >
                <Zap size={18} />
                Settle & Print ({formatMoney(grandTotalMinor)})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tender & Payment Settlement Modal */}
      <QuickSettlementModal
        isOpen={isSettleModalOpen}
        onClose={() => setIsSettleModalOpen(false)}
        totalMinorUnits={grandTotalMinor}
        onConfirm={handleSettlePayment}
        isLoading={isMutating}
      />

      {/* Thermal Print Slip Output */}
      {activeReceipt && (
        <ThermalReceipt {...activeReceipt} />
      )}
    </>
  );
}
