"use client";

import React, { useState, useMemo } from "react";
import {
  useGetExpensesQuery,
  useCreateExpenseMutation,
  useDeleteExpenseMutation,
  useGetExpenseLineItemsQuery,
} from "@/store/api/restaurantApi";
import { formatCurrencyMinor } from "@/lib/formatters";
import { ExpenseCategory, ExpenseType, Expense } from "@/types/domain";
import { FranchiseOutletFilterSelect } from "@/components/franchise/FranchiseOutletFilterSelect";

type DateFilterPreset = "TODAY" | "THIS_MONTH" | "ALL";

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
  OTHER: "General Operations",
};

export default function RestaurantExpensesPage() {
  const [datePreset, setDatePreset] = useState<DateFilterPreset>("THIS_MONTH");
  const [typeFilter, setTypeFilter] = useState<string>("ALL"); // ALL, PURCHASES, WASTAGE
  const [searchQuery, setSearchQuery] = useState("");

  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [selectedExpenseForItems, setSelectedExpenseForItems] = useState<Expense | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState("");
  const [formAmountRupees, setFormAmountRupees] = useState("");
  const [formCategory, setFormCategory] = useState<ExpenseCategory>("GROCERY_SPICES");
  const [formType, setFormType] = useState<ExpenseType>("VARIABLE");
  const [formVendor, setFormVendor] = useState("");
  const [formPaidVia, setFormPaidVia] = useState("UPI");
  const [formNotes, setFormNotes] = useState("");

  const [createExpense, { isLoading: isCreating }] = useCreateExpenseMutation();
  const [deleteExpense, { isLoading: isDeleting }] = useDeleteExpenseMutation();

  const computeDates = () => {
    const now = new Date();
    const toYMD = (d: Date) => d.toISOString().split("T")[0];
    if (datePreset === "TODAY") {
      const t = toYMD(now);
      return { startDate: t, endDate: t };
    }
    if (datePreset === "THIS_MONTH") {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: toYMD(first), endDate: toYMD(now) };
    }
    return { startDate: undefined, endDate: undefined };
  };

  const { startDate, endDate } = computeDates();

  const { data: expenses = [], isLoading, refetch } = useGetExpensesQuery({
    startDate,
    endDate,
  });

  // Filtered List
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const matchesSearch =
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.vendor_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (CATEGORY_LABELS[e.category] || "").toLowerCase().includes(searchQuery.toLowerCase());

      const isWastage = e.category === "FOOD_WASTAGE";
      const matchesType =
        typeFilter === "ALL" ||
        (typeFilter === "PURCHASES" && !isWastage) ||
        (typeFilter === "WASTAGE" && isWastage);

      return matchesSearch && matchesType;
    });
  }, [expenses, searchQuery, typeFilter]);

  // Aggregate Metrics
  const totalFilteredSpend = filteredExpenses.reduce(
    (acc, e) => acc + (e.amount?.amount_minor_units || 0),
    0
  );

  const totalWastage = expenses
    .filter((e) => e.category === "FOOD_WASTAGE")
    .reduce((acc, e) => acc + (e.amount?.amount_minor_units || 0), 0);

  const totalFixed = expenses
    .filter((e) => e.type === "FIXED")
    .reduce((acc, e) => acc + (e.amount?.amount_minor_units || 0), 0);

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountMinor = Math.round((parseFloat(formAmountRupees) || 0) * 100);
    if (!formTitle.trim() || amountMinor <= 0) return;

    try {
      await createExpense({
        title: formTitle.trim(),
        amount_minor: amountMinor,
        category: formCategory,
        type: formType,
        paid_via: formPaidVia,
        vendor_name: formVendor.trim() || "Internal",
        notes: formNotes.trim(),
        expense_date: new Date().toISOString().split("T")[0],
      }).unwrap();

      setIsLogModalOpen(false);
      setFormTitle("");
      setFormAmountRupees("");
      setFormVendor("");
      setFormNotes("");
      refetch();
    } catch (err) {
      console.error("Failed to create expense:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to remove this expense entry?")) return;
    try {
      await deleteExpense({ id }).unwrap();
      refetch();
    } catch (err) {
      console.error("Failed to delete expense:", err);
    }
  };

  return (
    <>
      {/* Header Bar */}
      <div className="hd">
        <div>
          <h1>Expenses</h1>
          <p>Purchases, wastage and operational bills</p>
        </div>
        <div className="sp"></div>
        <FranchiseOutletFilterSelect />
        <button className="btn" onClick={() => setIsLogModalOpen(true)}>
          <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
          Log expense
        </button>
      </div>

      {/* 3 KPI Stat Cards */}
      <div className="g g4">
        <div className="cd st" style={{ "--c": "var(--admin-am)" } as any}>
          <small>Shown spend</small>
          <b>{formatCurrencyMinor(totalFilteredSpend)}</b>
          <span>{filteredExpenses.length} bills in view</span>
        </div>

        <div className="cd st" style={{ "--c": "var(--admin-red)" } as any}>
          <small>Wastage</small>
          <b>{formatCurrencyMinor(totalWastage)}</b>
          <span>Spoiled stock written off</span>
        </div>

        <div className="cd st" style={{ "--c": "var(--admin-blu)" } as any}>
          <small>Fixed overhead</small>
          <b>{formatCurrencyMinor(totalFixed)}</b>
          <span>Rent, salaries, power</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bar mt">
        <input
          placeholder="Search expense, vendor or category"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <div className="ch">
          {[
            { id: "ALL", label: "All" },
            { id: "PURCHASES", label: "Purchases" },
            { id: "WASTAGE", label: "Wastage" },
          ].map((f) => (
            <button
              key={f.id}
              className="chip"
              aria-pressed={typeFilter === f.id}
              onClick={() => setTypeFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="sp"></div>

        <div className="ch">
          {[
            { id: "TODAY", label: "Today" },
            { id: "THIS_MONTH", label: "This month" },
            { id: "ALL", label: "All time" },
          ].map((d) => (
            <button
              key={d.id}
              className="chip"
              aria-pressed={datePreset === d.id}
              onClick={() => setDatePreset(d.id as DateFilterPreset)}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Expenses Table */}
      <div className="cd tw mt">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Expense</th>
              <th>Category</th>
              <th>Vendor</th>
              <th className="n">Amount</th>
              <th className="ac">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="em">
                  <b>Loading expenses…</b>
                  Syncing ledger entries.
                </td>
              </tr>
            ) : filteredExpenses.length === 0 ? (
              <tr>
                <td colSpan={6} className="em">
                  <b>No expenses found</b>
                  Log bills, supplier invoices, or wastage write-offs to track food costs.
                </td>
              </tr>
            ) : (
              filteredExpenses.map((exp) => {
                const isWastage = exp.category === "FOOD_WASTAGE";
                const amountMinor = exp.amount?.amount_minor_units || 0;
                const formattedDate = exp.expense_date
                  ? new Date(exp.expense_date).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                    })
                  : "—";

                return (
                  <tr key={exp.id}>
                    <td>
                      <b>{formattedDate}</b>
                    </td>
                    <td>
                      <b>{exp.title}</b>{" "}
                      {isWastage && <span className="pill c-r">Loss</span>}
                      {exp.notes && <small>{exp.notes}</small>}
                    </td>
                    <td>
                      <span className="pill c-a">
                        {CATEGORY_LABELS[exp.category] || exp.category}
                      </span>
                    </td>
                    <td>{exp.vendor_name || "Internal"}</td>
                    <td className="n">
                      <b>{formatCurrencyMinor(amountMinor)}</b>
                    </td>
                    <td className="ac">
                      <button
                        className="btn s sm"
                        onClick={() => setSelectedExpenseForItems(exp)}
                        style={{ marginRight: 6 }}
                      >
                        Items
                      </button>
                      <button
                        className="btn r sm"
                        onClick={() => handleDelete(exp.id)}
                        title="Delete expense"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Log Expense Modal */}
      {isLogModalOpen && (
        <div
          className="ov on"
          onClick={(e) => {
            if ((e.target as HTMLElement).classList.contains("ov")) setIsLogModalOpen(false);
          }}
        >
          <div className="md">
            <h3>Log expense</h3>
            <form onSubmit={handleSaveExpense}>
              <div className="mf">
                <label className="w">
                  What was it for?
                  <input
                    required
                    placeholder="e.g. Chicken delivery, 10kg Paneer"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                  />
                </label>

                <label>
                  Amount (₹)
                  <input
                    required
                    type="number"
                    step="0.01"
                    placeholder="e.g. 1200"
                    value={formAmountRupees}
                    onChange={(e) => setFormAmountRupees(e.target.value)}
                  />
                </label>

                <label>
                  Type
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as ExpenseType)}
                  >
                    <option value="VARIABLE">Variable (COGS)</option>
                    <option value="FIXED">Fixed (Overhead)</option>
                  </select>
                </label>

                <label>
                  Category
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as ExpenseCategory)}
                  >
                    {Object.entries(CATEGORY_LABELS).map(([catKey, catLabel]) => (
                      <option key={catKey} value={catKey}>
                        {catLabel}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Vendor / Supplier
                  <input
                    placeholder="e.g. Azadpur Mandi, Amul"
                    value={formVendor}
                    onChange={(e) => setFormVendor(e.target.value)}
                  />
                </label>

                <label>
                  Paid Via
                  <select
                    value={formPaidVia}
                    onChange={(e) => setFormPaidVia(e.target.value)}
                  >
                    <option value="UPI">UPI</option>
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CARD">Credit/Debit Card</option>
                  </select>
                </label>

                <label className="w">
                  Notes
                  <input
                    placeholder="Invoice # or comments"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                  />
                </label>
              </div>

              <div className="ac" style={{ marginTop: 20 }}>
                <button
                  type="button"
                  className="btn s"
                  onClick={() => setIsLogModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn" disabled={isCreating}>
                  {isCreating ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Items Modal */}
      {selectedExpenseForItems && (
        <InvoiceItemsModal
          expense={selectedExpenseForItems}
          onClose={() => setSelectedExpenseForItems(null)}
        />
      )}
    </>
  );
}

function InvoiceItemsModal({
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
    <div
      className="ov on"
      onClick={(e) => {
        if ((e.target as HTMLElement).classList.contains("ov")) onClose();
      }}
    >
      <div className="md">
        <h3>Invoice Items</h3>
        <p className="sub" style={{ marginTop: -6, color: "var(--admin-mute)" }}>
          {expense.title} · {expense.vendor_name || "Internal"}
        </p>

        {isLoading ? (
          <div className="em">Loading item details…</div>
        ) : lineItems.length === 0 ? (
          <div className="em">
            <b>No item breakdown</b>
            Logged as single lump-sum expense.
          </div>
        ) : (
          <div className="tw" style={{ maxHeight: 280 }}>
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th className="n">Qty</th>
                  <th className="n">Unit Price</th>
                  <th className="n">Total</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((it) => (
                  <tr key={it.id}>
                    <td>
                      <b>{it.item_name}</b>
                    </td>
                    <td className="n">
                      {it.quantity} {it.unit}
                    </td>
                    <td className="n">
                      {formatCurrencyMinor(it.unit_price.amount_minor_units)}
                    </td>
                    <td className="n">
                      <b>{formatCurrencyMinor(it.total_price.amount_minor_units)}</b>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="ac" style={{ marginTop: 18 }}>
          <button className="btn s" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
