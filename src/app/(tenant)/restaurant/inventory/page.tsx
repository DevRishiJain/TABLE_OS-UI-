"use client";

import React, { useState } from "react";
import {
  Package,
  Plus,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Clock,
  Trash2,
  Edit,
  Search,
  CheckCircle2,
  X,
  RefreshCw,
  Layers,
  ChefHat,
  Percent,
} from "lucide-react";
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

type TabMode = "STOCK" | "LOGS" | "RECIPES";

export default function RestaurantInventoryPage() {
  const [activeTab, setActiveTab] = useState<TabMode>("STOCK");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isStockMoveOpen, setIsStockMoveOpen] = useState(false);
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);

  // Add Item form
  const [itemName, setItemName] = useState("");
  const [itemCategory, setItemCategory] = useState("Vegetables");
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

  const { data: inventoryData, isLoading, isFetching, refetch } = useGetInventoryQuery();
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
    } catch (err: any) {
      alert(err?.data?.error || "Failed to create raw material item");
    }
  };

  // Handle Stock Movement
  const handleLogStockMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStockItem) return;
    const qty = parseFloat(moveQuantity);
    if (!qty || qty <= 0) {
      alert("Please enter a valid quantity");
      return;
    }

    try {
      await logStock({
        itemId: selectedStockItem.id,
        change_type: moveType,
        quantity: qty,
        reference: moveReference.trim(),
      }).unwrap();

      setIsStockMoveOpen(false);
      setSelectedStockItem(null);
      setMoveQuantity("");
      setMoveReference("");
    } catch (err: any) {
      alert(err?.data?.error || "Failed to log stock movement");
    }
  };

  // Open stock movement for specific item
  const openMoveModal = (item: InventoryItem, defaultType: InventoryChangeType = "STOCK_IN") => {
    setSelectedStockItem(item);
    setMoveType(defaultType);
    setMoveQuantity("");
    setMoveReference("");
    setIsStockMoveOpen(true);
  };

  // Open recipe editor
  const openRecipeEditor = async (dish: { menu_item_id: string; menu_item_name: string }) => {
    setSelectedMenuItem({ id: dish.menu_item_id, name: dish.menu_item_name });
    try {
      const res = await fetch(`/api/v1/restaurant/recipes/${dish.menu_item_id}`);
      if (res.ok) {
        const data = await res.json();
        setRecipeIngredients(
          data.map((d: any) => ({
            inventory_item_id: d.inventory_item_id,
            quantity_required: d.quantity_required,
          }))
        );
      } else {
        setRecipeIngredients([]);
      }
    } catch {
      setRecipeIngredients([]);
    }
    setIsRecipeModalOpen(true);
  };

  // Save recipe
  const handleSaveRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMenuItem) return;

    try {
      await saveRecipeMutation({
        menuItemId: selectedMenuItem.id,
        ingredients: recipeIngredients.filter((r) => r.inventory_item_id && r.quantity_required > 0),
      }).unwrap();

      setIsRecipeModalOpen(false);
      refetchDishMargins();
    } catch (err: any) {
      alert(err?.data?.error || "Failed to update recipe ingredients");
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-8 animate-fade-in text-gray-100">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-surface-border">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display text-white">
              Inventory & Raw Materials
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Live Stock Control
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            Maintain stock on hand, record supplier deliveries, monitor spoilage, and calculate dish food cost.
          </p>
        </div>

        <button
          onClick={() => setIsAddItemOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-black font-bold text-xs hover:bg-primary-hover transition-colors shadow-md shadow-primary/20 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Raw Material</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-surface border border-surface-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Items Cataloged</span>
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white mt-3">{items.length}</div>
          <p className="text-xs text-gray-400 mt-1">Ingredients & supplies in pantry</p>
        </div>

        <div className="bg-surface border border-surface-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Critical Low Stock
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl sm:text-3xl font-black mt-3 ${lowStockCount > 0 ? "text-amber-400" : "text-white"}`}>
            {lowStockCount}
          </div>
          <p className="text-xs text-gray-400 mt-1">Items at or below minimum threshold</p>
        </div>

        <div className="bg-surface border border-surface-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Inventory Valuation
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-3">
            {formatCurrencyMinor(totalValuation)}
          </div>
          <p className="text-xs text-gray-400 mt-1">Estimated asset value of current stock</p>
        </div>
      </div>

      {/* Tab Switcher & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="bg-[#12151B] p-1 rounded-xl border border-surface-border flex items-center gap-1 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("STOCK")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "STOCK"
                ? "bg-primary text-black shadow-md shadow-primary/20"
                : "text-gray-400 hover:text-white hover:bg-surface-hover"
            }`}
          >
            Stock on Hand ({items.length})
          </button>
          <button
            onClick={() => setActiveTab("LOGS")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "LOGS"
                ? "bg-primary text-black shadow-md shadow-primary/20"
                : "text-gray-400 hover:text-white hover:bg-surface-hover"
            }`}
          >
            Movement & Wastage Logs
          </button>
          <button
            onClick={() => setActiveTab("RECIPES")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "RECIPES"
                ? "bg-primary text-black shadow-md shadow-primary/20"
                : "text-gray-400 hover:text-white hover:bg-surface-hover"
            }`}
          >
            Dish Recipe Costing & Margins
          </button>
        </div>

        {activeTab === "STOCK" && (
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search ingredient or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface border border-surface-border rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-primary"
            />
          </div>
        )}
      </div>

      {/* Tab 1: Stock on Hand */}
      {activeTab === "STOCK" && (
        <div className="bg-surface border border-surface-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-surface-border bg-[#12151B] text-gray-400 font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Raw Material Name</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4 text-right">Current Stock</th>
                  <th className="py-3.5 px-4 text-right">Min Threshold</th>
                  <th className="py-3.5 px-4 text-right">Unit Cost</th>
                  <th className="py-3.5 px-4 text-right">Stock Valuation</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-500">
                      Loading inventory...
                    </td>
                  </tr>
                ) : filteredItems.length > 0 ? (
                  filteredItems.map((item) => {
                    const isLow = item.min_threshold > 0 && item.current_stock <= item.min_threshold;
                    const valMinor = Math.round(item.current_stock * item.unit_cost.amount_minor_units);

                    return (
                      <tr key={item.id} className="hover:bg-surface-hover/50 transition-colors">
                        <td className="py-3 px-4 font-semibold text-white">{item.name}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[11px] bg-surface-border text-gray-300">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-white">
                          {item.current_stock.toFixed(2)} <span className="text-gray-400 font-normal">{item.unit}</span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-gray-400">
                          {item.min_threshold > 0 ? `${item.min_threshold.toFixed(2)} ${item.unit}` : "—"}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-gray-300">
                          {formatCurrencyMinor(item.unit_cost.amount_minor_units)}/{item.unit}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-400">
                          {formatCurrencyMinor(valMinor)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {item.current_stock < 0 ? (
                            <span
                              className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30"
                              title="Stock depleted by cooking before arrival invoice was entered"
                            >
                              Negative ({item.current_stock.toFixed(2)})
                            </span>
                          ) : isLow ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              Low Stock
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              In Stock
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openMoveModal(item, "STOCK_IN")}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 font-semibold text-[11px] transition-colors"
                              title="Stock In"
                            >
                              + In
                            </button>
                            <button
                              onClick={() => openMoveModal(item, "WASTAGE")}
                              className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 font-semibold text-[11px] transition-colors"
                              title="Record Wastage"
                            >
                              - Waste
                            </button>
                            <button
                              onClick={async () => {
                                if (confirm(`Delete raw material "${item.name}"?`)) {
                                  await deleteItem({ id: item.id });
                                }
                              }}
                              className="p-1 rounded-lg text-gray-500 hover:text-rose-400 transition-colors"
                              title="Delete Item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-500">
                      No raw materials found. Click "Add Raw Material" to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Movement Logs */}
      {activeTab === "LOGS" && (
        <div className="bg-surface border border-surface-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-surface-border bg-[#12151B] text-gray-400 font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Date / Time</th>
                  <th className="py-3.5 px-4">Raw Material</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4 text-right">Quantity</th>
                  <th className="py-3.5 px-4 text-right">Unit Cost</th>
                  <th className="py-3.5 px-4 text-right">Total Impact</th>
                  <th className="py-3.5 px-4">Reference / Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border/60">
                {inventoryLogs.length > 0 ? (
                  inventoryLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-surface-hover/50 transition-colors">
                      <td className="py-3 px-4 font-mono text-gray-400">
                        {new Date(log.logged_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-semibold text-white">{log.item_name || "—"}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            log.change_type === "STOCK_IN"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : log.change_type === "WASTAGE"
                              ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              : log.change_type === "ORDER_CONSUMPTION"
                              ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                              : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          }`}
                        >
                          {log.change_type === "ORDER_CONSUMPTION" ? "COOKING CONSUMPTION" : log.change_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-white">
                        {log.change_type === "STOCK_IN" ? "+" : "-"}
                        {log.quantity.toFixed(2)} {log.unit}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-gray-300">
                        {formatCurrencyMinor(log.unit_cost.amount_minor_units)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-white">
                        {formatCurrencyMinor(log.total_cost.amount_minor_units)}
                      </td>
                      <td className="py-3 px-4 text-gray-300">
                        <div className="flex items-center gap-1.5">
                          <span>{log.reference || "—"}</span>
                          {log.expense_id && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-primary/10 text-primary border border-primary/20">
                              Linked Expense
                            </span>
                          )}
                          {log.order_id && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                              Order Recipe
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-500">
                      No stock movements recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Dish Recipe Costing & Margins */}
      {activeTab === "RECIPES" && (
        <div className="bg-surface border border-surface-border rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 bg-[#12151B] border-b border-surface-border flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Bill of Materials (BOM) & Menu Profitability</h3>
              <p className="text-xs text-gray-400">
                Link raw ingredients to menu items to automatically calculate dish cost and gross profit margin.
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-surface-border bg-[#12151B] text-gray-400 font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Menu Dish Name</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4 text-right">Selling Price</th>
                  <th className="py-3.5 px-4 text-right">Ingredient Cost</th>
                  <th className="py-3.5 px-4 text-right">Gross Profit</th>
                  <th className="py-3.5 px-4 text-right">Margin %</th>
                  <th className="py-3.5 px-4 text-center">Recipe Setup</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border/60">
                {dishMargins.length > 0 ? (
                  dishMargins.map((dish) => (
                    <tr key={dish.menu_item_id} className="hover:bg-surface-hover/50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-white">{dish.menu_item_name}</td>
                      <td className="py-3 px-4 text-gray-400">{dish.category_name}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-white">
                        {formatCurrencyMinor(dish.selling_price.amount_minor_units)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-gray-300">
                        {dish.cost_price.amount_minor_units > 0
                          ? formatCurrencyMinor(dish.cost_price.amount_minor_units)
                          : "Unset (₹0)"}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                        {formatCurrencyMinor(dish.gross_profit.amount_minor_units)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                            dish.margin_pct >= 65
                              ? "bg-emerald-500/10 text-emerald-400"
                              : dish.margin_pct >= 45
                              ? "bg-amber-500/10 text-amber-400"
                              : "bg-gray-800 text-gray-400"
                          }`}
                        >
                          {dish.margin_pct > 0 ? `${dish.margin_pct.toFixed(1)}%` : "0%"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => openRecipeEditor(dish)}
                          className="px-3 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 font-semibold text-[11px] transition-colors"
                        >
                          Configure Ingredients
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-500">
                      No menu dishes found. Create menu items first.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Raw Material Modal */}
      {isAddItemOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12151B] border border-surface-border rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-6 animate-scale-up">
            <div className="flex items-center justify-between pb-4 border-b border-surface-border">
              <h3 className="text-lg font-bold text-white">Add Raw Material to Inventory</h3>
              <button
                onClick={() => setIsAddItemOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-surface-hover"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-400 font-semibold mb-1">Item Name *</label>
                <input
                  type="text"
                  required
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="e.g. Fresh Chicken Breast, Basmati Rice, Paneer"
                  className="w-full bg-background border border-surface-border rounded-xl px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Category</label>
                  <select
                    value={itemCategory}
                    onChange={(e) => setItemCategory(e.target.value)}
                    className="w-full bg-background border border-surface-border rounded-xl px-3 py-2 text-white focus:outline-none focus:border-primary"
                  >
                    <option value="Vegetables">Vegetables</option>
                    <option value="Meat">Meat & Poultry</option>
                    <option value="Dairy">Dairy</option>
                    <option value="Pantry">Pantry & Spices</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Packaging">Packaging</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Unit of Measure</label>
                  <select
                    value={itemUnit}
                    onChange={(e) => setItemUnit(e.target.value)}
                    className="w-full bg-background border border-surface-border rounded-xl px-3 py-2 text-white focus:outline-none focus:border-primary"
                  >
                    <option value="kg">Kilogram (kg)</option>
                    <option value="g">Gram (g)</option>
                    <option value="l">Liter (l)</option>
                    <option value="ml">Milliliter (ml)</option>
                    <option value="pcs">Pieces (pcs)</option>
                    <option value="packs">Packs</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Current Stock</label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    required
                    value={itemCurrentStock}
                    onChange={(e) => setItemCurrentStock(e.target.value)}
                    placeholder="e.g. 25.0"
                    className="w-full bg-background border border-surface-border rounded-xl px-3 py-2 text-white focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Min Alert Qty</label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={itemMinThreshold}
                    onChange={(e) => setItemMinThreshold(e.target.value)}
                    placeholder="e.g. 5.0"
                    className="w-full bg-background border border-surface-border rounded-xl px-3 py-2 text-white focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Cost Per Unit (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={itemUnitCostRupees}
                    onChange={(e) => setItemUnitCostRupees(e.target.value)}
                    placeholder="e.g. 240.00"
                    className="w-full bg-background border border-surface-border rounded-xl px-3 py-2 text-white focus:outline-none focus:border-primary font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-border">
                <button
                  type="button"
                  onClick={() => setIsAddItemOpen(false)}
                  className="px-4 py-2 rounded-xl text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingItem}
                  className="px-5 py-2 rounded-xl bg-primary text-black font-bold text-xs hover:bg-primary-hover shadow-md shadow-primary/20 disabled:opacity-50"
                >
                  {isCreatingItem ? "Saving..." : "Create Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Movement Modal */}
      {isStockMoveOpen && selectedStockItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12151B] border border-surface-border rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-6 animate-scale-up">
            <div className="flex items-center justify-between pb-4 border-b border-surface-border">
              <div>
                <h3 className="text-lg font-bold text-white">Log Stock Movement</h3>
                <p className="text-xs text-primary font-semibold mt-0.5">
                  {selectedStockItem.name} (Current: {selectedStockItem.current_stock} {selectedStockItem.unit})
                </p>
              </div>
              <button
                onClick={() => setIsStockMoveOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-surface-hover"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLogStockMovement} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-400 font-semibold mb-1">Movement Type</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setMoveType("STOCK_IN")}
                    className={`py-2 px-2 rounded-xl font-bold border transition-all text-center ${
                      moveType === "STOCK_IN"
                        ? "bg-emerald-500 text-black border-emerald-500"
                        : "bg-surface border-surface-border text-gray-400 hover:text-white"
                    }`}
                  >
                    + Stock In
                  </button>
                  <button
                    type="button"
                    onClick={() => setMoveType("WASTAGE")}
                    className={`py-2 px-2 rounded-xl font-bold border transition-all text-center ${
                      moveType === "WASTAGE"
                        ? "bg-rose-500 text-white border-rose-500"
                        : "bg-surface border-surface-border text-gray-400 hover:text-white"
                    }`}
                  >
                    - Wastage
                  </button>
                  <button
                    type="button"
                    onClick={() => setMoveType("ADJUSTMENT")}
                    className={`py-2 px-2 rounded-xl font-bold border transition-all text-center ${
                      moveType === "ADJUSTMENT"
                        ? "bg-blue-500 text-white border-blue-500"
                        : "bg-surface border-surface-border text-gray-400 hover:text-white"
                    }`}
                  >
                    = Set Balance
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-gray-400 font-semibold mb-1">
                  Quantity ({selectedStockItem.unit}) *
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  required
                  value={moveQuantity}
                  onChange={(e) => setMoveQuantity(e.target.value)}
                  placeholder={`e.g. 10.5`}
                  className="w-full bg-background border border-surface-border rounded-xl px-3 py-2 text-white font-bold text-sm focus:outline-none focus:border-primary"
                />
              </div>

              {moveType === "WASTAGE" && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-center justify-between text-xs animate-fade-in">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Auto-logged as <strong>Kitchen Spoilage Expense</strong></span>
                  </div>
                  <span className="font-mono font-bold text-white shrink-0">
                    Loss: {formatCurrencyMinor(Math.round((parseFloat(moveQuantity) || 0) * (selectedStockItem.unit_cost?.amount_minor_units || 0)))}
                  </span>
                </div>
              )}

              {moveType === "STOCK_IN" && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center gap-2 text-xs">
                  <Package className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    New stock logged at unit cost <strong>{formatCurrencyMinor(selectedStockItem.unit_cost?.amount_minor_units || 0)}/{selectedStockItem.unit}</strong>
                  </span>
                </div>
              )}

              <div>
                <label className="block text-gray-400 font-semibold mb-1">Reference / Note</label>
                <input
                  type="text"
                  value={moveReference}
                  onChange={(e) => setMoveReference(e.target.value)}
                  placeholder="e.g. Mandi Purchase Bill #104 or Spoilage"
                  className="w-full bg-background border border-surface-border rounded-xl px-3 py-2 text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-border">
                <button
                  type="button"
                  onClick={() => setIsStockMoveOpen(false)}
                  className="px-4 py-2 rounded-xl text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoggingStock}
                  className="px-5 py-2 rounded-xl bg-primary text-black font-bold text-xs hover:bg-primary-hover shadow-md shadow-primary/20 disabled:opacity-50"
                >
                  {isLoggingStock ? "Logging..." : "Apply Movement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Recipe Editor Modal */}
      {isRecipeModalOpen && selectedMenuItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12151B] border border-surface-border rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-6 animate-scale-up">
            <div className="flex items-center justify-between pb-4 border-b border-surface-border">
              <div>
                <h3 className="text-lg font-bold text-white">Recipe Ingredients (BOM)</h3>
                <p className="text-xs text-primary font-semibold mt-0.5">{selectedMenuItem.name}</p>
              </div>
              <button
                onClick={() => setIsRecipeModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-surface-hover"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRecipe} className="space-y-4 text-xs">
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {recipeIngredients.map((ing, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-background p-2.5 rounded-xl border border-surface-border">
                    <select
                      value={ing.inventory_item_id}
                      onChange={(e) => {
                        const updated = [...recipeIngredients];
                        updated[idx].inventory_item_id = e.target.value;
                        setRecipeIngredients(updated);
                      }}
                      className="flex-1 bg-surface border border-surface-border rounded-lg px-2.5 py-1.5 text-white"
                    >
                      <option value="">Select Raw Ingredient...</option>
                      {items.map((it) => (
                        <option key={it.id} value={it.id}>
                          {it.name} ({it.unit} @ {formatCurrencyMinor(it.unit_cost.amount_minor_units)}/{it.unit})
                        </option>
                      ))}
                    </select>

                    <div className="flex items-center gap-1 w-28">
                      <input
                        type="number"
                        step="0.001"
                        min="0.001"
                        placeholder="Qty"
                        value={ing.quantity_required || ""}
                        onChange={(e) => {
                          const updated = [...recipeIngredients];
                          updated[idx].quantity_required = parseFloat(e.target.value) || 0;
                          setRecipeIngredients(updated);
                        }}
                        className="w-full bg-surface border border-surface-border rounded-lg px-2 py-1.5 text-white font-bold"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setRecipeIngredients(recipeIngredients.filter((_, i) => i !== idx));
                      }}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    setRecipeIngredients([
                      ...recipeIngredients,
                      { inventory_item_id: items[0]?.id || "", quantity_required: 0.1 },
                    ]);
                  }}
                  className="w-full py-2 border border-dashed border-surface-border rounded-xl text-gray-400 hover:text-white hover:border-primary transition-colors flex items-center justify-center gap-1.5 font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Another Ingredient</span>
                </button>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-border">
                <button
                  type="button"
                  onClick={() => setIsRecipeModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingRecipe}
                  className="px-5 py-2 rounded-xl bg-primary text-black font-bold text-xs hover:bg-primary-hover shadow-md shadow-primary/20 disabled:opacity-50"
                >
                  {isSavingRecipe ? "Saving..." : "Save Recipe"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
