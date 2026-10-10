"use client";

import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useAppSelector } from "@/store";
import {
  useGetMenuCategoriesQuery,
  useGetMenuItemsQuery,
  useGetRestaurantTablesQuery,
} from "@/store/api/restaurantApi";
import {
  useQuickBillingCheckoutMutation,
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
  Printer,
  Loader2,
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

function getPortionTabLabel(name: string): string {
  const lower = name.toLowerCase().trim();
  if (lower === "quarter") return "Qtr";
  return name;
}

export default function QuickBillingPage() {
  const restaurantName = useAppSelector((state) => state.auth.restaurantName) || "TableOS Restaurant";
  const userName = useAppSelector((state) => state.auth.userName) || "Manager";

  // API Queries
  const { data: categories = [], isLoading: isCatLoading } = useGetMenuCategoriesQuery();
  const { data: menuItems = [], isLoading: isMenuLoading } = useGetMenuItemsQuery();
  const { data: tables = [], isLoading: isTablesLoading } = useGetRestaurantTablesQuery();

  // API Mutations
  const [quickBillingCheckout, { isLoading: isCheckingOut }] = useQuickBillingCheckoutMutation();

  // Component States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("ALL");
  const [orderType, setOrderType] = useState<"TAKEAWAY" | "DINE_IN">("TAKEAWAY");
  const [selectedTableId, setSelectedTableId] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [paperSize, setPaperSize] = useState<"80mm" | "58mm">("80mm");
  const [selectedPortions, setSelectedPortions] = useState<Record<string, string>>({});
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "UPI" | "CARD">("CASH");
  const [sendToKitchen, setSendToKitchen] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("tableos_pos_send_to_kitchen");
      return saved !== null ? saved === "true" : true;
    }
    return true;
  });

  const toggleSendToKitchen = () => {
    setSendToKitchen((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("tableos_pos_send_to_kitchen", String(next));
      }
      return next;
    });
  };

  // Refs
  const searchRef = useRef<HTMLInputElement>(null);

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

  // Decrement or remove specific portion from cart directly from card
  const handleDecrementPortion = (item: MenuItem, portion: PortionOption, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    const isBaseFull = portion.id === "base" || portion.id === "base-full";
    const variantIdToUse = isBaseFull ? undefined : portion.id;

    setCart((prev) => {
      const existing = prev.find(
        (line) => line.menuItemId === item.id && line.variantId === variantIdToUse
      );
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        return prev.filter((line) => line !== existing);
      }
      return prev.map((line) =>
        line === existing ? { ...line, quantity: line.quantity - 1 } : line
      );
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
    // Allow DOM to fully paint the receipt before opening browser print dialog
    setTimeout(() => {
      window.print();
    }, 200);
  }, []);

  // Ensure activeReceipt is never empty when browser print is triggered directly (e.g. Ctrl+P)
  useEffect(() => {
    const handleBeforePrint = () => {
      setActiveReceipt((current) => {
        if (current) return current;
        if (cart.length > 0) {
          return {
            type: "BILL",
            paperSize,
            restaurantName,
            orderNumber: "BILL-" + Math.floor(1000 + Math.random() * 9000),
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
            paymentMethod: "CASH",
          };
        }
        return {
          type: "BILL",
          paperSize,
          restaurantName,
          orderNumber: "SAMPLE-9901",
          orderType: "TAKEAWAY",
          cashierName: userName,
          date: new Date(),
          items: [
            { name: "Paneer Butter Masala (Full)", quantity: 1, unitPriceMinor: 28000, totalMinor: 28000 },
            { name: "Butter Naan", quantity: 2, unitPriceMinor: 4500, totalMinor: 9000 },
          ],
          subtotalMinor: 37000,
          cgstMinor: 925,
          sgstMinor: 925,
          grandTotalMinor: 38850,
          paymentMethod: "CASH",
        };
      });
    };

    window.addEventListener("beforeprint", handleBeforePrint);
    return () => {
      window.removeEventListener("beforeprint", handleBeforePrint);
    };
  }, [cart, paperSize, restaurantName, orderType, selectedTable, customerName, customerPhone, userName, subtotalMinor, cgstMinor, sgstMinor, grandTotalMinor]);

  // Quick Test Print Sample Slip
  const handleTestPrint = () => {
    const testData: ThermalReceiptProps = {
      type: "COMBINED",
      paperSize,
      restaurantName,
      restaurantAddress: "Shop 12, Ground Floor, Sector 18\nNoida, Uttar Pradesh - 201301",
      restaurantPhone: "+91 98765 43210",
      gstin: "07AAAAA0000A1Z5",
      fssai: "10019011000123",
      orderNumber: "TEST-" + Math.floor(1000 + Math.random() * 9000),
      orderType: "TAKEAWAY",
      cashierName: userName,
      date: new Date(),
      items: [
        {
          name: "Paneer Butter Masala (Full)",
          quantity: 1,
          unitPriceMinor: 28000,
          totalMinor: 28000,
        },
        {
          name: "Butter Naan",
          quantity: 3,
          unitPriceMinor: 4500,
          totalMinor: 13500,
        },
        {
          name: "Fresh Lime Soda",
          quantity: 2,
          unitPriceMinor: 7000,
          totalMinor: 14000,
        },
      ],
      subtotalMinor: 55500,
      cgstMinor: 1388,
      sgstMinor: 1388,
      grandTotalMinor: 58276,
      paymentMethod: "CASH",
      tenderedMinor: 60000,
      changeMinor: 1724,
    };
    triggerPrint(testData);
  };

  // Quick Bill Print without settlement (pro-forma / estimate bill)
  const handlePrintBill = () => {
    if (cart.length === 0) return;

    const billData: ThermalReceiptProps = {
      type: "BILL",
      paperSize,
      restaurantName,
      orderNumber: "BILL-" + Math.floor(100000 + Math.random() * 900000),
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
      paymentMethod: "CASH",
    };

    triggerPrint(billData);
  };

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

  // Settle Payment Execution (Atomic Dedicated Quick Billing API)
  const handleSettlePayment = async (payment: {
    method: "CASH" | "UPI" | "CARD";
    tenderedMinor: number;
    changeMinor: number;
  }) => {
    if (cart.length === 0) return;
    setErrorMessage(null);

    try {
      let tableIdToUse: string | undefined = undefined;
      let tableNumToUse: string | undefined = undefined;

      if (orderType === "DINE_IN") {
        let targetTableObj = selectedTable;
        if (!targetTableObj && tables.length > 0) {
          targetTableObj = tables[0];
        }
        tableIdToUse = targetTableObj?.id;
        tableNumToUse = targetTableObj?.table_number || targetTableObj?.tableNumber || "Dine-In";
      } else {
        // Takeaway orders must NOT block or link to dining room tables
        tableIdToUse = undefined;
        tableNumToUse = "Takeaway";
      }

      const resp = await quickBillingCheckout({
        order_type: orderType,
        table_id: tableIdToUse,
        table_number: tableNumToUse,
        customer_name: customerName || (orderType === "TAKEAWAY" ? "Takeaway Guest" : "Dine-in Guest"),
        customer_phone: customerPhone || undefined,
        send_to_kitchen: sendToKitchen,
        items: cart.map((c) => ({
          menu_item_id: c.menuItemId,
          variant_id: c.variantId,
          quantity: c.quantity,
          instructions: c.notes,
        })),
        payment: {
          method: payment.method,
          amount_minor: grandTotalMinor,
          tendered_minor: payment.tenderedMinor,
          change_minor: payment.changeMinor,
        },
      }).unwrap();

      // Generate Thermal Receipt Data using authoritative server-calculated figures
      const receiptData: ThermalReceiptProps = {
        type: sendToKitchen ? "COMBINED" : "BILL",
        paperSize,
        restaurantName: restaurantName,
        orderNumber: resp.order_number || resp.order_id,
        orderType: (resp.order_type as "TAKEAWAY" | "DINE_IN") || orderType,
        tableNumber: orderType === "TAKEAWAY" ? undefined : (resp.table_number || tableNumToUse),
        customerName: resp.customer_name || customerName || undefined,
        customerPhone: resp.customer_phone || customerPhone || undefined,
        cashierName: resp.cashier_name || userName,
        date: new Date(resp.created_at || Date.now()),
        items: resp.items?.length
          ? resp.items.map((i) => ({
              name: i.name,
              variantName: i.variant_name,
              quantity: i.quantity,
              unitPriceMinor: i.unit_price_minor,
              totalMinor: i.total_minor,
              notes: i.notes,
            }))
          : cart.map((c) => ({
              name: c.name,
              variantName: c.variantName,
              quantity: c.quantity,
              unitPriceMinor: c.unitPriceMinor,
              totalMinor: c.unitPriceMinor * c.quantity,
              notes: c.notes,
            })),
        subtotalMinor: resp.subtotal_minor ?? subtotalMinor,
        cgstMinor: resp.cgst_minor ?? cgstMinor,
        sgstMinor: resp.sgst_minor ?? sgstMinor,
        grandTotalMinor: resp.grand_total_minor ?? grandTotalMinor,
        paymentMethod: payment.method,
        tenderedMinor: resp.tendered_minor ?? payment.tenderedMinor,
        changeMinor: resp.change_minor ?? payment.changeMinor,
      };

      // Close Modal, Trigger Print, & Reset Cart
      setIsSettleModalOpen(false);
      setSuccessToast(`Bill settled successfully (${formatMoney(resp.grand_total_minor || grandTotalMinor)})!`);
      triggerPrint(receiptData);

      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
    } catch (err: any) {
      console.error("Quick Billing Settlement Error:", err);
      setErrorMessage(err?.data?.message || err?.message || "Failed to complete billing transaction.");
    }
  };

  // Direct 1-Click Settle & Print with attached backend API call
  const handleDirectSettleAndPrint = async () => {
    if (cart.length === 0 || isCheckingOut) return;
    await handleSettlePayment({
      method: paymentMethod,
      tenderedMinor: grandTotalMinor,
      changeMinor: 0,
    });
  };

  // POS Fast Keyboard Shortcuts: / to search, F2 or Ctrl+Enter to settle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (
        (e.key === "F2" || (e.ctrlKey && e.key === "Enter")) &&
        cart.length > 0 &&
        !isCheckingOut
      ) {
        e.preventDefault();
        handleDirectSettleAndPrint();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cart.length, isCheckingOut, handleDirectSettleAndPrint]);

  const isMutating = isCheckingOut;

  return (
    <div className="pos-fullwidth">
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

        {/* Test Print Button & Thermal Roll Selector */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn s sm"
            onClick={handleTestPrint}
            title="Print a sample receipt to test printer alignment and font rendering"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <Printer size={15} />
            Test Print
          </button>

          <span style={{ fontSize: "0.82rem", fontWeight: "700", color: "var(--admin-mute)", marginLeft: "4px" }}>
            Roll:
          </span>
          <button
            type="button"
            className="chip"
            aria-pressed={paperSize === "80mm"}
            onClick={() => setPaperSize("80mm")}
            style={{ height: "34px", padding: "0 12px", fontSize: "0.8rem" }}
          >
            80mm (3")
          </button>
          <button
            type="button"
            className="chip"
            aria-pressed={paperSize === "58mm"}
            onClick={() => setPaperSize("58mm")}
            style={{ height: "34px", padding: "0 12px", fontSize: "0.8rem" }}
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
              ref={searchRef}
              type="text"
              placeholder="Search dishes, starters, desserts, beverages... (press '/' to focus)"
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

                const currentPortionId = selectedPortions[item.id] || portions[0]?.id || "base";
                const currentPortion = portions.find((p) => p.id === currentPortionId) || portions[0];

                const currentPortionCount = cart
                  .filter(
                    (c) =>
                      c.menuItemId === item.id &&
                      (c.variantId === currentPortion?.id || (currentPortion?.id.startsWith("base") && !c.variantId))
                  )
                  .reduce((sum, c) => sum + c.quantity, 0);

                return (
                  <div
                    key={item.id}
                    className="pos-dish-card"
                    onClick={() => {
                      if (currentPortion) handleAddPortion(item, currentPortion);
                    }}
                  >
                    {/* Dish Info Header */}
                    <div className="pos-dish-card-header">
                      <div>
                        <div className="pos-dish-name">{item.name}</div>
                        <div className="pos-dish-cat">
                          {item.category_name || (categories.find((c) => c.id === item.category_id)?.name) || "General"}
                        </div>
                      </div>
                      {inCartTotalCount > 0 && (
                        <span className="pos-dish-total-badge" title={`${inCartTotalCount} items in order`}>
                          {inCartTotalCount}
                        </span>
                      )}
                    </div>

                    {/* Middle: Segmented Portion Selector if multiple portions exist */}
                    {hasMultiplePortions && (
                      <div className="pos-portion-segmented-bar" onClick={(e) => e.stopPropagation()}>
                        {portions.map((p) => {
                          const isSelected = p.id === currentPortion?.id;
                          const pCount = cart
                            .filter(
                              (c) =>
                                c.menuItemId === item.id &&
                                (c.variantId === p.id || (p.id.startsWith("base") && !c.variantId))
                            )
                            .reduce((sum, c) => sum + c.quantity, 0);

                          return (
                            <button
                              key={p.id}
                              type="button"
                              className={`pos-segment-tab ${isSelected ? "active" : ""}`}
                              title={p.name}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPortions((prev) => ({ ...prev, [item.id]: p.id }));
                                handleAddPortion(item, p, e);
                              }}
                            >
                              <span>{getPortionTabLabel(p.name)}</span>
                              {pCount > 0 && <span className="pos-tab-dot">{pCount}</span>}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Bottom: Dedicated Full-Width Action Row */}
                    <div className="pos-card-action-bar">
                      {currentPortionCount > 0 && currentPortion ? (
                        <div className="pos-action-stepper" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className="pos-stepper-btn-action"
                            onClick={(e) => handleDecrementPortion(item, currentPortion, e)}
                            title={`Remove 1 ${currentPortion.name}`}
                          >
                            <Minus size={15} />
                          </button>
                          <div className="pos-stepper-center-info">
                            <span className="action-portion-tag">
                              {hasMultiplePortions ? currentPortion.name : "Qty"}
                            </span>
                            <span className="action-portion-qty">{currentPortionCount}</span>
                            <span className="action-portion-price">
                              ({formatMoney(currentPortion.priceMinor * currentPortionCount)})
                            </span>
                          </div>
                          <button
                            type="button"
                            className="pos-stepper-btn-action"
                            onClick={(e) => handleAddPortion(item, currentPortion, e)}
                            title={`Add 1 more ${currentPortion.name}`}
                          >
                            <Plus size={15} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="pos-action-add-btn"
                          onClick={(e) => {
                            if (currentPortion) handleAddPortion(item, currentPortion, e);
                          }}
                        >
                          <span className="action-add-label">
                            <Plus size={15} />
                            <span>Add {hasMultiplePortions && currentPortion ? currentPortion.name : ""}</span>
                          </span>
                          <span className="action-add-price">
                            {formatMoney(currentPortion?.priceMinor || 0)}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Cart & Bill Panel */}
        <div className="pos-cart-box">
          {/* Cart Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontWeight: "800", fontSize: "0.95rem", color: "var(--admin-ink)" }}>
              Current Order {cart.length > 0 && `(${cart.reduce((a, b) => a + b.quantity, 0)})`}
            </div>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={() => setCart([])}
                className="btn r sm"
                style={{ height: "26px", padding: "0 8px", fontSize: "0.72rem", gap: "4px" }}
                title="Clear all items from cart"
              >
                <Trash2 size={12} /> Clear
              </button>
            )}
          </div>

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

            {/* Kitchen Dispatch / KOT Toggle Flag */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "10px",
                padding: "8px 10px",
                borderRadius: "10px",
                background: sendToKitchen ? "color-mix(in srgb, var(--admin-am) 14%, var(--admin-pa))" : "var(--admin-pa)",
                border: "1.5px solid var(--admin-ln)",
                transition: "all 0.15s ease",
              }}
            >
              <div>
                <div style={{ fontSize: "0.82rem", fontWeight: "800", color: "var(--admin-ink)" }}>
                  Kitchen Ticket (KOT)
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--admin-mute)" }}>
                  {sendToKitchen ? "Combined KOT + Bill & kitchen dispatch" : "Customer bill only (kitchen skipped)"}
                </div>
              </div>
              <button
                type="button"
                className={`chip ${sendToKitchen ? "active" : ""}`}
                onClick={toggleSendToKitchen}
                style={{ height: "30px", padding: "0 10px", fontSize: "0.76rem", fontWeight: "800" }}
              >
                {sendToKitchen ? "🍳 KOT ON" : "🚫 KOT OFF"}
              </button>
            </div>

            {/* Payment Method Selector */}
            <div style={{ display: "flex", gap: "6px", marginBottom: "10px" }}>
              {(["CASH", "UPI", "CARD"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  className={`btn s ${paymentMethod === m ? "" : "outline"}`}
                  style={{
                    flex: 1,
                    padding: "6px 4px",
                    fontSize: "0.82rem",
                    fontWeight: "800",
                    background: paymentMethod === m ? "var(--admin-ink)" : "var(--admin-pa)",
                    color: paymentMethod === m ? "var(--admin-pa)" : "var(--admin-ink)",
                    borderColor: paymentMethod === m ? "var(--admin-ink)" : "var(--admin-ln)",
                    transition: "all 0.15s ease",
                  }}
                  onClick={() => setPaymentMethod(m)}
                >
                  {m === "CASH" ? "💵 Cash" : m === "UPI" ? "📱 UPI" : "💳 Card"}
                </button>
              ))}
            </div>

            {/* Action Buttons: Settle & Print (Direct Backend Call) */}
            <div>
              <button
                type="button"
                className="btn"
                onClick={handleDirectSettleAndPrint}
                disabled={cart.length === 0 || isMutating}
                style={{
                  width: "100%",
                  height: "46px",
                  fontSize: "0.95rem",
                  fontWeight: "800",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                {isMutating ? (
                  <>
                    <Loader2 className="spinner" size={18} />
                    <span>Settling & Printing...</span>
                  </>
                ) : (
                  <>
                    <Zap size={18} />
                    <span>
                      Settle & Print {sendToKitchen ? "(KOT + Bill)" : "(Bill Only)"} ({formatMoney(grandTotalMinor)})
                    </span>
                  </>
                )}
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
      <div id="pos-thermal-print-area">
        {activeReceipt && (
          <ThermalReceipt {...activeReceipt} />
        )}
      </div>
    </div>
  );
}
