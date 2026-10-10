"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  useGetInventoryQuery,
  useCreateInventoryItemMutation,
  useDeleteInventoryItemMutation,
  useLogStockMovementMutation,
  useGetInventoryLogsQuery,
  useGetDishMarginsQuery,
  useGetRecipeQuery,
  useSaveRecipeMutation,
} from "@/store/api/restaurantApi";
import { formatCurrencyMinor } from "@/lib/formatters";
import { InventoryChangeType, InventoryItem } from "@/types/domain";
import { FranchiseOutletFilterSelect } from "@/components/franchise/FranchiseOutletFilterSelect";
import { Modal } from "@/components/ui/Modal";

type TabMode = "STOCK" | "LOGS" | "RECIPES";

export default function RestaurantInventoryPage() {
  const [activeTab, setActiveTab] = useState<TabMode>("STOCK");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isStockMoveOpen, setIsStockMoveOpen] = useState(false);
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);

  // Add Item form
  const [itemName, setItemName] = useState("");
  const [itemCategory, setItemCategory] = useState("Pantry");
  const [itemUnit, setItemUnit] = useState("kg");
  const [itemCurrentStock, setItemCurrentStock] = useState("");
  const [itemMinThreshold, setItemMinThreshold] = useState("");
  const [itemUnitCostRupees, setItemUnitCostRupees] = useState("");

  // Stock Movement form
  const [selectedStockItem, setSelectedStockItem] = useState<InventoryItem | null>(null);
  const [moveType, setMoveType] = useState<InventoryChangeType>("STOCK_IN");
  const [moveQuantity, setMoveQuantity] = useState("");
  const [moveReference, setMoveReference] = useState("");

  // Recipe editing state
  const [selectedMenuItem, setSelectedMenuItem] = useState<{ id: string; name: string } | null>(null);
  const [recipeIngredients, setRecipeIngredients] = useState<
    Array<{ inventory_item_id: string; quantity_required: number }>
  >([]);

  const { data: inventoryData, isLoading, refetch } = useGetInventoryQuery();
  const { data: inventoryLogs = [] } = useGetInventoryLogsQuery();
  const { data: dishMargins = [], refetch: refetchDishMargins } = useGetDishMarginsQuery();

  const [createItem, { isLoading: isCreatingItem }] = useCreateInventoryItemMutation();
  const [deleteItem, { isLoading: isDeletingItem }] = useDeleteInventoryItemMutation();
  const [logStock, { isLoading: isLoggingStock }] = useLogStockMovementMutation();
  const [saveRecipeMutation, { isLoading: isSavingRecipe }] = useSaveRecipeMutation();

  const items = inventoryData?.items || [];
  const lowStockCount = inventoryData?.low_stock_items_count || 0;
  const totalValuation = inventoryData?.total_valuation?.amount_minor_units || 0;

  // Filter items
  const filteredItems = items.filter(
    (it) =>
      it.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      it.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle Add Item
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const costRupees = parseFloat(itemUnitCostRupees) || 0;
    try {
      await createItem({
        name: itemName.trim(),
        category: itemCategory,
        unit: itemUnit,
        current_stock: parseFloat(itemCurrentStock) || 0,
        min_threshold: parseFloat(itemMinThreshold) || 0,
        unit_cost_minor: Math.round(costRupees * 100),
      }).unwrap();

      setIsAddItemOpen(false);
      setItemName("");
      setItemCurrentStock("");
      setItemMinThreshold("");
      setItemUnitCostRupees("");
      refetch();
    } catch (err) {
      console.error("Failed to add inventory item:", err);
    }
  };

  // Quick Stock Adjustment
  const handleQuickAdjust = (item: InventoryItem, type: InventoryChangeType) => {
    setSelectedStockItem(item);
    setMoveType(type);
    setMoveQuantity("1");
    setMoveReference(type === "STOCK_IN" ? "Delivery receipt" : "Daily kitchen wastage");
    setIsStockMoveOpen(true);
  };

  const handleStockMoveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStockItem) return;
    const qty = parseFloat(moveQuantity);
    if (isNaN(qty) || qty <= 0) return;

    try {
      await logStock({
        itemId: selectedStockItem.id,
        change_type: moveType,
        quantity: qty,
        reference: moveReference.trim() || undefined,
      }).unwrap();

      setIsStockMoveOpen(false);
      setSelectedStockItem(null);
      setMoveQuantity("");
      refetch();
    } catch (err) {
      console.error("Failed to log stock movement:", err);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm("Remove this ingredient from stock catalog?")) return;
    try {
      await deleteItem({ id }).unwrap();
      refetch();
    } catch (err) {
      console.error("Failed to delete inventory item:", err);
    }
  };

  return (
    <>
      {/* Header Bar */}
      <div className="hd">
        <div>
          <h1>Stock</h1>
          <p>Ingredients on hand and what is running low</p>
        </div>
        <div className="sp"></div>
        <FranchiseOutletFilterSelect />
        <button className="btn" onClick={() => setIsAddItemOpen(true)}>
          <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
          Add ingredient
        </button>
      </div>

      {/* KPI Cards */}
      <div className="g g4">
        <div className="cd st" style={{ "--c": "var(--admin-am)" } as any}>
          <small>Ingredients</small>
          <b>{items.length}</b>
          <span>Tracked in pantry</span>
        </div>

        <div className="cd st" style={{ "--c": lowStockCount > 0 ? "var(--admin-red)" : "var(--admin-grn)" } as any}>
          <small>Running low</small>
          <b>{lowStockCount}</b>
          <span>{lowStockCount > 0 ? "At or below minimum" : "All levels healthy"}</span>
        </div>

        <div className="cd st" style={{ "--c": "var(--admin-grn)" } as any}>
          <small>Stock value</small>
          <b>{formatCurrencyMinor(totalValuation)}</b>
          <span>At current unit costs</span>
        </div>
      </div>

      {/* Navigation Tabs and Search */}
      <div className="bar mt">
        <div className="ch">
          {[
            { id: "STOCK", label: `Stock on Hand (${items.length})` },
            { id: "LOGS", label: `Movement Logs (${inventoryLogs.length})` },
            { id: "RECIPES", label: "Dish Recipes & Margins" },
          ].map((t) => (
            <button
              key={t.id}
              className="chip"
              aria-pressed={activeTab === t.id}
              onClick={() => setActiveTab(t.id as TabMode)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="sp"></div>

        {activeTab === "STOCK" && (
          <input
            placeholder="Search ingredient or category"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        )}
      </div>

      {/* TAB 1: Stock on Hand Table */}
      {activeTab === "STOCK" && (
        <div className="cd tw mt">
          <table>
            <thead>
              <tr>
                <th>Ingredient</th>
                <th className="n">On Hand</th>
                <th className="n">Minimum</th>
                <th className="n">Stock Value</th>
                <th>Status</th>
                <th className="ac" style={{ minWidth: 290, width: 290 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="em">
                    <b>Loading stock records…</b>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="em">
                    <b>No ingredients found</b>
                    Add pantry staples, dairy, meats, and produce to monitor low stock.
                  </td>
                </tr>
              ) : (
                filteredItems.map((it) => {
                  const isLow = it.current_stock <= it.min_threshold;
                  const itemValueMinor = Math.round(
                    it.current_stock * (it.unit_cost?.amount_minor_units || 0)
                  );

                  return (
                    <tr key={it.id}>
                      <td>
                        <b>{it.name}</b>
                        <small>
                          {it.category} · {formatCurrencyMinor(it.unit_cost?.amount_minor_units || 0)}/{it.unit}
                        </small>
                      </td>
                      <td className="n">
                        <b>{it.current_stock}</b> {it.unit}
                      </td>
                      <td className="n">
                        {it.min_threshold} {it.unit}
                      </td>
                      <td className="n">
                        <b>{formatCurrencyMinor(itemValueMinor)}</b>
                      </td>
                      <td>
                        <span className={`pill ${isLow ? "c-r" : "c-g"}`}>
                          {isLow ? "Low" : "OK"}
                        </span>
                      </td>
                      <td className="ac" style={{ minWidth: 290, width: 290 }}>
                        <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "flex-end", gap: 8, flexWrap: "nowrap" }}>
                          <button
                            className="btn g sm"
                            onClick={() => handleQuickAdjust(it, "STOCK_IN")}
                          >
                            + Received
                          </button>
                          <button
                            className="btn s sm"
                            onClick={() => handleQuickAdjust(it, "WASTAGE")}
                          >
                            − Wasted
                          </button>
                          <button
                            className="btn r sm"
                            onClick={() => handleDeleteItem(it.id)}
                            title="Delete ingredient"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: Movement Logs Table */}
      {activeTab === "LOGS" && (
        <div className="cd tw mt">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Ingredient</th>
                <th>Type</th>
                <th className="n">Change Qty</th>
                <th>Reference</th>
              </tr>
            </thead>
            <tbody>
              {inventoryLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="em">
                    <b>No movement history recorded yet</b>
                    Adjustments, supplier deliveries, and waste write-offs will appear here.
                  </td>
                </tr>
              ) : (
                inventoryLogs.map((log) => {
                  const isStockIn = log.change_type === "STOCK_IN";
                  const isWastage = log.change_type === "WASTAGE";

                  return (
                    <tr key={log.id}>
                      <td>
                        <b>
                          {new Date(log.logged_at || Date.now()).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                          })}
                        </b>
                        <small>
                          {new Date(log.logged_at || Date.now()).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </small>
                      </td>
                      <td>
                        <b>{log.item_name || "Ingredient"}</b>
                      </td>
                      <td>
                        <span className={`pill ${isStockIn ? "c-g" : isWastage ? "c-r" : "c-b"}`}>
                          {log.change_type}
                        </span>
                      </td>
                      <td className="n">
                        <b style={{ color: isStockIn ? "var(--admin-grn)" : "var(--admin-red)" }}>
                          {isStockIn ? "+" : "-"}
                          {log.quantity} {log.unit || ""}
                        </b>
                      </td>
                      <td>{log.reference || "Internal adjustment"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: Recipe Costing & Margins */}
      {activeTab === "RECIPES" && (
        <div className="cd tw mt">
          <div style={{ marginBottom: 12 }}>
            <h2>Dish Recipe Costing</h2>
            <p className="sub" style={{ margin: 0 }}>
              Ingredients mapped to menu items for real-time theoretical food cost and gross margins.
            </p>
          </div>

          <table>
            <thead>
              <tr>
                <th>Menu Item</th>
                <th className="n">Selling Price</th>
                <th className="n">Recipe Cost</th>
                <th className="n">Gross Profit</th>
                <th className="n">Margin</th>
              </tr>
            </thead>
            <tbody>
              {dishMargins.length === 0 ? (
                <tr>
                  <td colSpan={5} className="em">
                    <b>No recipe data available</b>
                    Ensure menu items are added in the Menu tab.
                  </td>
                </tr>
              ) : (
                dishMargins.map((dm) => {
                  const sellingMinor = dm.selling_price?.amount_minor_units || 0;
                  const costMinor = dm.cost_price?.amount_minor_units || 0;
                  const profitMinor = dm.gross_profit?.amount_minor_units || (sellingMinor - costMinor);
                  const marginPct = dm.margin_pct || 0;
                  const hasCost = costMinor > 0;

                  return (
                    <tr key={dm.menu_item_id || dm.menu_item_name}>
                      <td>
                        <b>{dm.menu_item_name}</b>
                        {dm.category_name && <small>{dm.category_name}</small>}
                      </td>
                      <td className="n">
                        <b>{formatCurrencyMinor(sellingMinor)}</b>
                      </td>
                      <td className="n">
                        {hasCost ? formatCurrencyMinor(costMinor) : "—"}
                      </td>
                      <td className="n">
                        <b>{formatCurrencyMinor(profitMinor)}</b>
                      </td>
                      <td className="n">
                        {hasCost ? (
                          <span className={`pill ${marginPct >= 65 ? "c-g" : marginPct >= 35 ? "c-a" : "c-r"}`}>
                            {marginPct.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="pill c-a">No recipe linked</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Ingredient Modal */}
      {isAddItemOpen && (
        <Modal
          isOpen={isAddItemOpen}
          onClose={() => setIsAddItemOpen(false)}
          title="Add ingredient"
          closeDisabled={isCreatingItem}
        >
            <form onSubmit={handleAddItem}>
              <div className="mf">
                <label className="w">
                  Ingredient Name
                  <input
                    required
                    placeholder="e.g. Basmati Rice, Paneer, Cooking Oil"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                  />
                </label>

                <label>
                  Category
                  <select
                    value={itemCategory}
                    onChange={(e) => setItemCategory(e.target.value)}
                  >
                    <option value="Pantry">Pantry &amp; Dry</option>
                    <option value="Dairy">Dairy</option>
                    <option value="Meat">Meat &amp; Poultry</option>
                    <option value="Vegetables">Vegetables &amp; Produce</option>
                    <option value="Spices">Spices &amp; Seasoning</option>
                  </select>
                </label>

                <label>
                  Unit
                  <select
                    value={itemUnit}
                    onChange={(e) => setItemUnit(e.target.value)}
                  >
                    <option value="kg">Kilograms (kg)</option>
                    <option value="l">Liters (l)</option>
                    <option value="g">Grams (g)</option>
                    <option value="pcs">Pieces (pcs)</option>
                  </select>
                </label>

                <label>
                  Initial Stock
                  <input
                    required
                    type="number"
                    step="0.01"
                    placeholder="e.g. 25"
                    value={itemCurrentStock}
                    onChange={(e) => setItemCurrentStock(e.target.value)}
                  />
                </label>

                <label>
                  Low Stock Alert Level
                  <input
                    required
                    type="number"
                    step="0.01"
                    placeholder="e.g. 5"
                    value={itemMinThreshold}
                    onChange={(e) => setItemMinThreshold(e.target.value)}
                  />
                </label>

                <label className="w">
                  Unit Cost (₹)
                  <input
                    required
                    type="number"
                    step="0.01"
                    placeholder="e.g. 240 (per kg/l)"
                    value={itemUnitCostRupees}
                    onChange={(e) => setItemUnitCostRupees(e.target.value)}
                  />
                </label>
              </div>

              <div className="ac" style={{ marginTop: 20 }}>
                <button
                  type="button"
                  className="btn s"
                  onClick={() => setIsAddItemOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn" disabled={isCreatingItem}>
                  {isCreatingItem ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
        </Modal>
      )}

      {/* Quick Stock Movement Modal */}
      {isStockMoveOpen && selectedStockItem && (
        <Modal
          isOpen={isStockMoveOpen && !!selectedStockItem}
          onClose={() => setIsStockMoveOpen(false)}
          title={moveType === "STOCK_IN" ? "Receive Stock" : "Log Stock Wastage"}
          description={`${selectedStockItem.name} · Current: ${selectedStockItem.current_stock} ${selectedStockItem.unit}`}
          closeDisabled={isLoggingStock}
        >
            <form onSubmit={handleStockMoveSubmit}>
              <div className="mf">
                <label className="w">
                  Quantity ({selectedStockItem.unit})
                  <input
                    required
                    type="number"
                    step="0.01"
                    placeholder="e.g. 5"
                    value={moveQuantity}
                    onChange={(e) => setMoveQuantity(e.target.value)}
                  />
                </label>

                <label className="w">
                  Reason or Reference
                  <input
                    placeholder="e.g. Delivery bill #402 or Kitchen Spoilage"
                    value={moveReference}
                    onChange={(e) => setMoveReference(e.target.value)}
                  />
                </label>
              </div>

              <div className="ac" style={{ marginTop: 20 }}>
                <button
                  type="button"
                  className="btn s"
                  onClick={() => setIsStockMoveOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`btn ${moveType === "WASTAGE" ? "r" : "g"}`}
                  disabled={isLoggingStock}
                >
                  {isLoggingStock ? "Updating…" : moveType === "STOCK_IN" ? "Add to Stock" : "Write Off Loss"}
                </button>
              </div>
            </form>
        </Modal>
      )}
    </>
  );
}
