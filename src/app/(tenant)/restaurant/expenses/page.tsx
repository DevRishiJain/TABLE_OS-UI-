"use client";

import React, { useState } from "react";
import {
  Wallet,
  Plus,
  Trash2,
  Filter,
  Calendar,
  Building,
  Receipt,
  AlertCircle,
  CheckCircle2,
  X,
  RefreshCw,
  Package,
  ShoppingBag,
  Eye,
} from "lucide-react";
import {
  useGetExpensesQuery,
  useCreateExpenseMutation,
  useDeleteExpenseMutation,
  useGetInventoryQuery,
  useGetExpenseLineItemsQuery,
} from "@/store/api/restaurantApi";
import { formatCurrencyMinor } from "@/lib/formatters";
import { ExpenseCategory, ExpenseType, Expense } from "@/types/domain";

type DateFilterPreset = "TODAY" | "THIS_MONTH" | "ALL" | "CUSTOM";

function ExpenseItemsModal({
  expense,
  onClose,
}: {
  expense: Expense;
  onClose: () => void;
}) {
  const { data: lineItems = [], isLoading } = useGetExpenseLineItemsQuery({
    id: expense.id,
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#12151B] border border-surface-border rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 animate-scale-up">
        <div className="flex items-center justify-between pb-3 border-b border-surface-border">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              Invoice Line Items
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">{expense.title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-surface-hover"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-xs text-gray-400">Loading line items...</div>
        ) : lineItems.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-400">No line items recorded for this invoice.</div>
        ) : (
          <div className="overflow-x-auto max-h-72">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-surface-border text-gray-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-2 px-3">Item</th>
                  <th className="py-2 px-3 text-right">Quantity</th>
                  <th className="py-2 px-3 text-right">Unit Price</th>
                  <th className="py-2 px-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border/50 font-mono">
                {lineItems.map((it) => (
                  <tr key={it.id}>
                    <td className="py-2 px-3 font-sans font-medium text-white">{it.item_name}</td>
                    <td className="py-2 px-3 text-right text-gray-300">
                      {it.quantity} {it.unit}
                    </td>
                    <td className="py-2 px-3 text-right text-gray-300">
                      {formatCurrencyMinor(it.unit_price.amount_minor_units)}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-emerald-400">
                      {formatCurrencyMinor(it.total_price.amount_minor_units)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end pt-3 border-t border-surface-border">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-surface border border-surface-border text-xs text-gray-300 hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

const CATEGORY_LABELS: Record<string, string> = {
  VEGETABLES: "Vegetables & Greens",
  MEAT_POULTRY: "Meat & Poultry",
  DAIRY: "Dairy & Milk",
  GROCERY_SPICES: "Grocery & Spices",
  PACKAGING: "Packaging & Disposables",
  GAS_UTILITY: "Cooking Gas & LPG",
  SALARY: "Staff Salary",
  RENT: "Property Rent",
  ELECTRICITY: "Electricity & Power",
  MAINTENANCE: "Repairs & Maintenance",
  FOOD_WASTAGE: "Kitchen Spoilage & Wastage",
  OTHER: "Miscellaneous",
};

export default function RestaurantExpensesPage() {
  const [preset, setPreset] = useState<DateFilterPreset>("THIS_MONTH");
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [customStart, setCustomStart] = useState<string>("");
  const [customEnd, setCustomEnd] = useState<string>("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingExpense, setViewingExpense] = useState<Expense | null>(null);
  const [entryMode, setEntryMode] = useState<"SINGLE" | "WHOLESALE">("SINGLE");

  // Single form
  const [formType, setFormType] = useState<ExpenseType>("VARIABLE");
  const [formCategory, setFormCategory] = useState<ExpenseCategory>("VEGETABLES");
  const [formTitle, setFormTitle] = useState("");
  const [formAmountRupees, setFormAmountRupees] = useState("");
  const [formPaidVia, setFormPaidVia] = useState("CASH");
  const [formVendor, setFormVendor] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formNotes, setFormNotes] = useState("");

  // Stock linking for single form
  const [isStockLinked, setIsStockLinked] = useState(false);
  const [selectedInventoryId, setSelectedInventoryId] = useState("");
  const [singleQuantity, setSingleQuantity] = useState("");

  // Wholesale multi-item rows
  const [wholesaleItems, setWholesaleItems] = useState<
    Array<{
      inventory_item_id: string;
      item_name: string;
      quantity: string;
      unit: string;
      unit_price: string;
      total_price: string;
    }>
  >([
    { inventory_item_id: "", item_name: "", quantity: "1", unit: "kg", unit_price: "", total_price: "" },
  ]);

  const { data: inventoryData } = useGetInventoryQuery();
  const inventoryItems = inventoryData?.items || [];

  const computeDateRange = () => {
    const now = new Date();
    const toYMD = (d: Date) => d.toISOString().split("T")[0];

    if (preset === "TODAY") {
      const today = toYMD(now);
      return { startDate: today, endDate: today };
    }
    if (preset === "THIS_MONTH") {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: toYMD(first), endDate: toYMD(now) };
    }
    if (preset === "CUSTOM") {
      return {
        startDate: customStart || undefined,
        endDate: customEnd || undefined,
      };
    }
    return { startDate: undefined, endDate: undefined };
  };

  const { startDate, endDate } = computeDateRange();

  const {
    data: expenses = [],
    isLoading,
    isFetching,
    refetch,
  } = useGetExpensesQuery({
    type: selectedType || undefined,
    category: selectedCategory || undefined,
    startDate,
    endDate,
  });

  const [createExpense, { isLoading: isCreating }] = useCreateExpenseMutation();
  const [deleteExpense, { isLoading: isDeleting }] = useDeleteExpenseMutation();

  // Summary Metrics
  const totalExpenseMinor = expenses.reduce((acc, curr) => acc + curr.amount.amount_minor_units, 0);
  const variableExpenseMinor = expenses
    .filter((e) => e.type === "VARIABLE")
    .reduce((acc, curr) => acc + curr.amount.amount_minor_units, 0);
  const fixedExpenseMinor = expenses
    .filter((e) => e.type === "FIXED")
    .reduce((acc, curr) => acc + curr.amount.amount_minor_units, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (entryMode === "WHOLESALE") {
      const validItems = wholesaleItems.filter(
        (it) => it.item_name.trim() !== "" || it.inventory_item_id !== ""
      );
      if (validItems.length === 0) {
        alert("Please add at least one line item to the wholesale bill");
        return;
      }

      let totalBillMinor = 0;
      const mappedLineItems = validItems.map((it) => {
        const matched = inventoryItems.find((inv) => inv.id === it.inventory_item_id);
        const q = parseFloat(it.quantity) || 1;
        const up = parseFloat(it.unit_price) || 0;
        const tp = parseFloat(it.total_price) || q * up;
        const totalMinor = Math.round(tp * 100);
        totalBillMinor += totalMinor;

        return {
          inventory_item_id: it.inventory_item_id || undefined,
          item_name: it.item_name.trim() || matched?.name || "Raw Material",
          quantity: q,
          unit: it.unit || matched?.unit || "kg",
          unit_price_minor: Math.round(up * 100),
          total_price_minor: totalMinor,
        };
      });

      if (totalBillMinor <= 0) {
        alert("Total bill amount must be greater than zero");
        return;
      }

      try {
        await createExpense({
          type: "VARIABLE",
          category: "GROCERY_SPICES",
          title: formTitle.trim() || `Wholesale Delivery - ${formVendor.trim() || "Supplier"}`,
          amount_minor: totalBillMinor,
          currency: "INR",
          paid_via: formPaidVia,
          vendor_name: formVendor.trim(),
          expense_date: formDate,
          notes: formNotes.trim() || `${mappedLineItems.length} items received in stock`,
          is_stock_purchase: true,
          line_items: mappedLineItems,
        }).unwrap();

        setIsModalOpen(false);
        setFormTitle("");
        setFormVendor("");
        setFormNotes("");
        setWholesaleItems([
          { inventory_item_id: "", item_name: "", quantity: "1", unit: "kg", unit_price: "", total_price: "" },
        ]);
      } catch (err: any) {
        alert(err?.data?.error || "Failed to record wholesale bill");
      }
      return;
    }

    // Single Entry Mode
    const rupees = parseFloat(formAmountRupees);
    if (!rupees || rupees <= 0) {
      alert("Please enter a valid expense amount");
      return;
    }

    let lineItemsPayload = undefined;
    let isStock = false;

    if (isStockLinked && selectedInventoryId) {
      const matched = inventoryItems.find((inv) => inv.id === selectedInventoryId);
      if (matched) {
        isStock = true;
        const qty = parseFloat(singleQuantity) || 1;
        const totalMinor = Math.round(rupees * 100);
        const unitMinor = Math.round((totalMinor / qty));
        lineItemsPayload = [
          {
            inventory_item_id: matched.id,
            item_name: matched.name,
            quantity: qty,
            unit: matched.unit,
            unit_price_minor: unitMinor,
            total_price_minor: totalMinor,
          },
        ];
      }
    }

    try {
      await createExpense({
        type: formType,
        category: formCategory,
        title: formTitle.trim(),
        amount_minor: Math.round(rupees * 100),
        currency: "INR",
        paid_via: formPaidVia,
        vendor_name: formVendor.trim(),
        expense_date: formDate,
        notes: formNotes.trim(),
        is_stock_purchase: isStock,
        line_items: lineItemsPayload,
      }).unwrap();

      setIsModalOpen(false);
      setFormTitle("");
      setFormAmountRupees("");
      setFormVendor("");
      setFormNotes("");
      setIsStockLinked(false);
      setSelectedInventoryId("");
      setSingleQuantity("");
    } catch (err: any) {
      alert(err?.data?.error || "Failed to record expense");
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete expense "${title}"?`)) return;
    try {
      await deleteExpense({ id }).unwrap();
    } catch (err: any) {
      alert(err?.data?.error || "Failed to delete expense");
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-8 animate-fade-in text-gray-100">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-surface-border">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display text-white">
              Expenses & Overhead
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
              Procurement & Fixed Ledger
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            Track daily raw ingredient purchases, gas, packaging, rent, salaries, and operational bills.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-black font-bold text-xs hover:bg-primary-hover transition-colors shadow-md shadow-primary/20 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Log New Expense</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-surface border border-surface-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Filtered Spend</span>
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white mt-3">
            {formatCurrencyMinor(totalExpenseMinor)}
          </div>
          <p className="text-xs text-gray-400 mt-1">{expenses.length} bills recorded</p>
        </div>

        <div className="bg-surface border border-surface-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Variable Food & Supplies
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-300 mt-3">
            {formatCurrencyMinor(variableExpenseMinor)}
          </div>
          <p className="text-xs text-gray-400 mt-1">Vegetables, Meat, Gas & Groceries</p>
        </div>

        <div className="bg-surface border border-surface-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
              Fixed Overhead
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-300 mt-3">
            {formatCurrencyMinor(fixedExpenseMinor)}
          </div>
          <p className="text-xs text-gray-400 mt-1">Rent, Staff Salaries & Electricity</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-surface border border-surface-border rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          {/* Preset Buttons */}
          <div className="bg-[#12151B] p-1 rounded-xl border border-surface-border flex items-center gap-1">
            {(
              [
                { id: "TODAY", label: "Today" },
                { id: "THIS_MONTH", label: "This Month" },
                { id: "ALL", label: "All Time" },
                { id: "CUSTOM", label: "Custom" },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                onClick={() => setPreset(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  preset === p.id
                    ? "bg-primary text-black font-bold shadow-md shadow-primary/20"
                    : "text-gray-400 hover:text-white hover:bg-surface-hover"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-background border border-surface-border rounded-xl px-3 py-1.5 text-gray-300 text-xs"
          >
            <option value="">All Expense Types</option>
            <option value="VARIABLE">Variable (Supplies)</option>
            <option value="FIXED">Fixed (Overhead)</option>
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-background border border-surface-border rounded-xl px-3 py-1.5 text-gray-300 text-xs"
          >
            <option value="">All Categories</option>
            {Object.entries(CATEGORY_LABELS).map(([catKey, label]) => (
              <option key={catKey} value={catKey}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="p-2 rounded-xl border border-surface-border bg-background hover:bg-surface-hover text-gray-300 transition-colors shadow-sm disabled:opacity-50 ml-auto"
          title="Refresh List"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin text-primary" : ""}`} />
        </button>
      </div>

      {/* Custom Date Pickers */}
      {preset === "CUSTOM" && (
        <div className="p-4 rounded-xl border border-surface-border bg-surface flex flex-wrap items-center gap-4 text-xs animate-slide-down">
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Start Date:</span>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="bg-background border border-surface-border rounded-lg px-3 py-1.5 text-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">End Date:</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="bg-background border border-surface-border rounded-lg px-3 py-1.5 text-white"
            />
          </div>
        </div>
      )}

      {/* Expenses Ledger Table */}
      <div className="bg-surface border border-surface-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-surface-border bg-[#12151B] text-gray-400 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Expense Title</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Vendor</th>
                <th className="py-3.5 px-4">Paid Via</th>
                <th className="py-3.5 px-4 text-right">Amount</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-500">
                    Loading expenses...
                  </td>
                </tr>
              ) : expenses.length > 0 ? (
                expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-surface-hover/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-gray-300">
                      {new Date(e.expense_date).toISOString().split("T")[0]}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-semibold text-white">{e.title}</span>
                        {e.is_stock_purchase && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <Package className="w-3 h-3" /> Stock In
                          </span>
                        )}
                        {(e.category === "FOOD_WASTAGE" || e.paid_via === "INVENTORY_WRITE_OFF") && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                            <AlertCircle className="w-3 h-3" /> Spoilage Loss
                          </span>
                        )}
                      </div>
                      {e.notes && <div className="text-[11px] text-gray-500 truncate max-w-xs">{e.notes}</div>}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-surface-border text-gray-300">
                        {CATEGORY_LABELS[e.category] || e.category}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          e.type === "VARIABLE"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}
                      >
                        {e.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-300">{e.vendor_name || "—"}</td>
                    <td className="py-3 px-4 font-mono text-gray-400">{e.paid_via}</td>
                    <td className="py-3 px-4 text-right font-bold text-white text-sm">
                      {formatCurrencyMinor(e.amount.amount_minor_units)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {e.is_stock_purchase && (
                          <button
                            onClick={() => setViewingExpense(e)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors"
                            title="View Invoice Items"
                          >
                            <Receipt className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(e.id, e.title)}
                          disabled={isDeleting}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Delete Expense"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-500">
                    No expense records found for the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={`bg-[#12151B] border border-surface-border rounded-2xl w-full p-6 shadow-2xl space-y-5 animate-scale-up max-h-[90vh] overflow-y-auto ${
              entryMode === "WHOLESALE" ? "max-w-2xl" : "max-w-lg"
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <h3 className="text-lg font-bold text-white">Record Restaurant Expense</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-surface-hover"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex bg-surface border border-surface-border rounded-xl p-1">
              <button
                type="button"
                onClick={() => setEntryMode("SINGLE")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  entryMode === "SINGLE"
                    ? "bg-primary text-black shadow-sm"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Single Item / Expense
              </button>
              <button
                type="button"
                onClick={() => setEntryMode("WHOLESALE")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  entryMode === "WHOLESALE"
                    ? "bg-primary text-black shadow-sm"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Wholesale / Supplier Bill
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {entryMode === "SINGLE" ? (
                <>
                  {/* Type Switcher */}
                  <div>
                    <label className="block text-gray-400 font-semibold mb-1.5">Expense Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setFormType("VARIABLE");
                          setFormCategory("VEGETABLES");
                        }}
                        className={`py-2 px-3 rounded-xl font-bold border transition-all ${
                          formType === "VARIABLE"
                            ? "bg-amber-500 text-black border-amber-500"
                            : "bg-surface border-surface-border text-gray-400 hover:text-white"
                        }`}
                      >
                        Variable (Daily Supplies / COGS)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormType("FIXED");
                          setFormCategory("SALARY");
                          setIsStockLinked(false);
                        }}
                        className={`py-2 px-3 rounded-xl font-bold border transition-all ${
                          formType === "FIXED"
                            ? "bg-rose-500 text-white border-rose-500"
                            : "bg-surface border-surface-border text-gray-400 hover:text-white"
                        }`}
                      >
                        Fixed (Monthly Overhead)
                      </button>
                    </div>
                  </div>

                  {/* Stock Linking (Only for Variable Supplies) */}
                  {formType === "VARIABLE" && (
                    <div className="p-3 rounded-xl bg-background border border-surface-border space-y-3">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isStockLinked}
                          onChange={(e) => setIsStockLinked(e.target.checked)}
                          className="rounded border-surface-border text-primary focus:ring-primary w-4 h-4 bg-surface"
                        />
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5" /> Link to Raw Inventory (Auto-adds stock & updates cost)
                        </span>
                      </label>
                      {isStockLinked && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          <div>
                            <label className="block text-gray-400 text-[11px] font-semibold mb-1">
                              Select Raw Material
                            </label>
                            <select
                              value={selectedInventoryId}
                              onChange={(e) => {
                                const id = e.target.value;
                                setSelectedInventoryId(id);
                                const matched = inventoryItems.find((inv) => inv.id === id);
                                if (matched) {
                                  if (!formTitle) setFormTitle(`${matched.name} Purchase`);
                                  if (!singleQuantity) setSingleQuantity("1");
                                }
                              }}
                              className="w-full bg-surface border border-surface-border rounded-xl px-3 py-2 text-white focus:outline-none focus:border-primary text-xs"
                            >
                              <option value="">-- Choose Raw Material --</option>
                              {inventoryItems.map((inv) => (
                                <option key={inv.id} value={inv.id}>
                                  {inv.name} ({inv.current_stock} {inv.unit} in stock)
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-gray-400 text-[11px] font-semibold mb-1">
                              Quantity Received (
                              {inventoryItems.find((i) => i.id === selectedInventoryId)?.unit || "units"})
                            </label>
                            <input
                              type="number"
                              step="0.001"
                              min="0.001"
                              value={singleQuantity}
                              onChange={(e) => setSingleQuantity(e.target.value)}
                              placeholder="e.g. 10.0"
                              className="w-full bg-surface border border-surface-border rounded-xl px-3 py-2 text-white focus:outline-none focus:border-primary text-xs"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Title & Amount */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-400 font-semibold mb-1">Expense Title *</label>
                      <input
                        type="text"
                        required
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        placeholder="e.g. 10kg Fresh Paneer"
                        className="w-full bg-background border border-surface-border rounded-xl px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 font-semibold mb-1">Amount (₹) *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="1"
                        required
                        value={formAmountRupees}
                        onChange={(e) => setFormAmountRupees(e.target.value)}
                        placeholder="e.g. 3500"
                        className="w-full bg-background border border-surface-border rounded-xl px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-primary font-bold text-sm"
                      />
                    </div>
                  </div>

                  {/* Category & Payment Mode */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-400 font-semibold mb-1">Category</label>
                      <select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value as ExpenseCategory)}
                        className="w-full bg-background border border-surface-border rounded-xl px-3 py-2 text-white focus:outline-none focus:border-primary"
                      >
                        {formType === "VARIABLE" ? (
                          <>
                            <option value="VEGETABLES">Vegetables & Greens</option>
                            <option value="MEAT_POULTRY">Meat & Poultry</option>
                            <option value="DAIRY">Dairy & Milk</option>
                            <option value="GROCERY_SPICES">Grocery & Spices</option>
                            <option value="PACKAGING">Packaging & Disposables</option>
                            <option value="GAS_UTILITY">Cooking Gas & LPG</option>
                            <option value="OTHER">Other Variable</option>
                          </>
                        ) : (
                          <>
                            <option value="SALARY">Staff Salary</option>
                            <option value="RENT">Property Rent</option>
                            <option value="ELECTRICITY">Electricity & Power</option>
                            <option value="MAINTENANCE">Repairs & Maintenance</option>
                            <option value="OTHER">Other Fixed</option>
                          </>
                        )}
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-400 font-semibold mb-1">Paid Via</label>
                      <select
                        value={formPaidVia}
                        onChange={(e) => setFormPaidVia(e.target.value)}
                        className="w-full bg-background border border-surface-border rounded-xl px-3 py-2 text-white focus:outline-none focus:border-primary"
                      >
                        <option value="CASH">Cash</option>
                        <option value="UPI">UPI</option>
                        <option value="BANK_TRANSFER">Bank Transfer / IMPS</option>
                        <option value="CHEQUE">Cheque</option>
                        <option value="CREDIT">Supplier Credit</option>
                      </select>
                    </div>
                  </div>

                  {/* Vendor & Date */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-400 font-semibold mb-1">Vendor / Payee</label>
                      <input
                        type="text"
                        value={formVendor}
                        onChange={(e) => setFormVendor(e.target.value)}
                        placeholder="e.g. Mandi Wholesalers"
                        className="w-full bg-background border border-surface-border rounded-xl px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 font-semibold mb-1">Expense Date</label>
                      <input
                        type="date"
                        required
                        value={formDate}
                        onChange={(e) => setFormDate(e.target.value)}
                        className="w-full bg-background border border-surface-border rounded-xl px-3 py-2 text-white focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-gray-400 font-semibold mb-1">Notes / Invoice #</label>
                    <textarea
                      rows={2}
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      placeholder="Optional notes or invoice number"
                      className="w-full bg-background border border-surface-border rounded-xl px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-primary resize-none"
                    />
                  </div>
                </>
              ) : (
                /* Wholesale Multi-Item Mode */
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-gray-400 font-semibold mb-1">Supplier / Vendor *</label>
                      <input
                        type="text"
                        required
                        value={formVendor}
                        onChange={(e) => setFormVendor(e.target.value)}
                        placeholder="e.g. Azadpur Mandi Traders"
                        className="w-full bg-background border border-surface-border rounded-xl px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 font-semibold mb-1">Invoice Date *</label>
                      <input
                        type="date"
                        required
                        value={formDate}
                        onChange={(e) => setFormDate(e.target.value)}
                        className="w-full bg-background border border-surface-border rounded-xl px-3 py-2 text-white focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 font-semibold mb-1">Paid Via</label>
                      <select
                        value={formPaidVia}
                        onChange={(e) => setFormPaidVia(e.target.value)}
                        className="w-full bg-background border border-surface-border rounded-xl px-3 py-2 text-white focus:outline-none focus:border-primary"
                      >
                        <option value="CASH">Cash</option>
                        <option value="UPI">UPI</option>
                        <option value="CREDIT">Supplier Credit</option>
                        <option value="BANK_TRANSFER">Bank Transfer / IMPS</option>
                        <option value="CHEQUE">Cheque</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-400 font-semibold mb-1">Invoice / Delivery Title</label>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder={`e.g. Daily Mandi Delivery - ${formVendor || "Supplier"}`}
                      className="w-full bg-background border border-surface-border rounded-xl px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-primary"
                    />
                  </div>

                  {/* Multi-Item Table */}
                  <div className="border border-surface-border rounded-xl p-3 bg-background space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs flex items-center gap-1.5">
                        <ShoppingBag className="w-3.5 h-3.5 text-primary" />
                        Wholesale Items Delivered
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setWholesaleItems((prev) => [
                            ...prev,
                            {
                              inventory_item_id: "",
                              item_name: "",
                              quantity: "1",
                              unit: "kg",
                              unit_price: "",
                              total_price: "",
                            },
                          ])
                        }
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 font-bold text-[11px] transition-colors"
                      >
                        <Plus className="w-3 h-3" /> Add Item
                      </button>
                    </div>

                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {wholesaleItems.map((item, idx) => (
                        <div
                          key={idx}
                          className="grid grid-cols-12 gap-2 items-center bg-surface p-2 rounded-xl border border-surface-border"
                        >
                          <div className="col-span-5 sm:col-span-4">
                            <select
                              value={item.inventory_item_id}
                              onChange={(e) => {
                                const id = e.target.value;
                                const matched = inventoryItems.find((inv) => inv.id === id);
                                const updated = [...wholesaleItems];
                                updated[idx] = {
                                  ...updated[idx],
                                  inventory_item_id: id,
                                  item_name: matched ? matched.name : updated[idx].item_name,
                                  unit: matched ? matched.unit : updated[idx].unit,
                                  unit_price: matched
                                    ? (matched.unit_cost.amount_minor_units / 100).toString()
                                    : updated[idx].unit_price,
                                  total_price:
                                    matched && updated[idx].quantity
                                      ? (
                                          parseFloat(updated[idx].quantity) *
                                          (matched.unit_cost.amount_minor_units / 100)
                                        ).toFixed(2)
                                      : updated[idx].total_price,
                                };
                                setWholesaleItems(updated);
                              }}
                              className="w-full bg-background border border-surface-border rounded-lg px-2 py-1.5 text-white text-[11px] focus:outline-none focus:border-primary truncate"
                            >
                              <option value="">-- Pick Raw Item --</option>
                              {inventoryItems.map((inv) => (
                                <option key={inv.id} value={inv.id}>
                                  {inv.name} ({inv.unit})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="col-span-2">
                            <input
                              type="number"
                              step="0.001"
                              min="0.001"
                              placeholder="Qty"
                              value={item.quantity}
                              onChange={(e) => {
                                const q = e.target.value;
                                const updated = [...wholesaleItems];
                                const up = parseFloat(updated[idx].unit_price) || 0;
                                updated[idx] = {
                                  ...updated[idx],
                                  quantity: q,
                                  total_price: up > 0 && q ? (parseFloat(q) * up).toFixed(2) : updated[idx].total_price,
                                };
                                setWholesaleItems(updated);
                              }}
                              className="w-full bg-background border border-surface-border rounded-lg px-2 py-1.5 text-white text-[11px] text-center focus:outline-none focus:border-primary"
                            />
                          </div>

                          <div className="col-span-2 sm:col-span-1">
                            <input
                              type="text"
                              placeholder="Unit"
                              value={item.unit}
                              onChange={(e) => {
                                const updated = [...wholesaleItems];
                                updated[idx].unit = e.target.value;
                                setWholesaleItems(updated);
                              }}
                              className="w-full bg-background border border-surface-border rounded-lg px-1.5 py-1.5 text-white text-[11px] text-center focus:outline-none focus:border-primary"
                            />
                          </div>

                          <div className="col-span-2">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="₹/Unit"
                              value={item.unit_price}
                              onChange={(e) => {
                                const up = e.target.value;
                                const updated = [...wholesaleItems];
                                const q = parseFloat(updated[idx].quantity) || 0;
                                updated[idx] = {
                                  ...updated[idx],
                                  unit_price: up,
                                  total_price: q > 0 && up ? (q * parseFloat(up)).toFixed(2) : updated[idx].total_price,
                                };
                                setWholesaleItems(updated);
                              }}
                              className="w-full bg-background border border-surface-border rounded-lg px-2 py-1.5 text-white text-[11px] text-right focus:outline-none focus:border-primary"
                            />
                          </div>

                          <div className="col-span-1 sm:col-span-2 text-right font-mono font-bold text-white text-[11px] truncate">
                            ₹
                            {item.total_price ||
                              (
                                (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0)
                              ).toFixed(2)}
                          </div>

                          <div className="col-span-12 sm:col-span-1 text-right">
                            {wholesaleItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setWholesaleItems(wholesaleItems.filter((_, i) => i !== idx))
                                }
                                className="p-1 text-gray-500 hover:text-rose-400"
                              >
                                <Trash2 className="w-3.5 h-3.5 inline" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Grand Total Indicator */}
                    <div className="flex items-center justify-between pt-2 border-t border-surface-border text-xs">
                      <span className="text-gray-400">Total Calculated Invoice:</span>
                      <span className="text-sm font-bold text-emerald-400 font-mono">
                        ₹
                        {wholesaleItems
                          .reduce((acc, it) => {
                            const lineTotal =
                              parseFloat(it.total_price) ||
                              (parseFloat(it.quantity) || 0) * (parseFloat(it.unit_price) || 0);
                            return acc + lineTotal;
                          }, 0)
                          .toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-400 font-semibold mb-1">Invoice / Delivery Notes</label>
                    <textarea
                      rows={2}
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      placeholder="e.g. Mandi gate receipt #402, paid in cash on unloading"
                      className="w-full bg-background border border-surface-border rounded-xl px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-primary resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2 rounded-xl bg-primary text-black font-bold text-xs hover:bg-primary-hover transition-colors shadow-md shadow-primary/20 disabled:opacity-50"
                >
                  {isCreating
                    ? "Recording..."
                    : entryMode === "WHOLESALE"
                    ? "Save Invoice & Stock-In"
                    : "Record Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Line Items Modal */}
      {viewingExpense && (
        <ExpenseItemsModal expense={viewingExpense} onClose={() => setViewingExpense(null)} />
      )}
    </div>
  );
}
