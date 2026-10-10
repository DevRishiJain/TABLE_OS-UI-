"use client";

import React, { useState } from "react";
import {
  useGetMenuCategoriesQuery,
  useGetMenuItemsQuery,
  useCreateMenuCategoryMutation,
  useCreateMenuItemMutation,
  useReplaceMenuItemVariantsMutation,
  useUploadAiMenuCatalogMutation,
} from "@/store/api/restaurantApi";
import { formatMoney } from "@/lib/money";
import { MenuItem } from "@/types/domain";
import { FranchiseOutletFilterSelect } from "@/components/franchise/FranchiseOutletFilterSelect";
import { Modal } from "@/components/ui/Modal";

export default function RestaurantMenuStudioPage() {
  const { data: categories = [], refetch: refetchCategories } = useGetMenuCategoriesQuery();
  const { data: items = [], refetch: refetchItems } = useGetMenuItemsQuery();

  const [createCategory, { isLoading: isCreatingCat }] = useCreateMenuCategoryMutation();
  const [createItem, { isLoading: isCreatingItem }] = useCreateMenuItemMutation();
  const [uploadAiMenu, { isLoading: isOcrUploading }] = useUploadAiMenuCatalogMutation();
  const [replaceVariants, { isLoading: isSavingVariants }] = useReplaceMenuItemVariantsMutation();

  const [activeCategoryId, setActiveCategoryId] = useState<string>("ALL");
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false);
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);

  // Form states
  const [categoryName, setCategoryName] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemPriceRupees, setItemPriceRupees] = useState("");
  const [itemCategorySelect, setItemCategorySelect] = useState("");
  const [itemHasPortions, setItemHasPortions] = useState(false);
  const [itemPortions, setItemPortions] = useState<{ name: string; priceRupees: string; is_available: boolean }[]>([
    { name: "Half", priceRupees: "", is_available: true },
    { name: "Full", priceRupees: "", is_available: true },
  ]);

  // Portions editor state
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editPortions, setEditPortions] = useState<{ name: string; priceRupees: string; is_available: boolean }[]>([]);
  const [portionError, setPortionError] = useState<string | null>(null);

  // AI OCR state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [ocrStep, setOcrStep] = useState<number>(0);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) return;
    try {
      await createCategory({ name: categoryName.trim() }).unwrap();
      setCategoryName("");
      setIsNewCategoryModalOpen(false);
      refetchCategories();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const portions = itemHasPortions
      ? itemPortions
          .filter((v) => v.name.trim())
          .map((v) => ({
            name: v.name.trim(),
            price_minor: Math.round((parseFloat(v.priceRupees) || 0) * 100),
            is_available: v.is_available,
          }))
          .filter((v) => v.price_minor > 0)
      : undefined;
    const priceMinor = Math.round((parseFloat(itemPriceRupees) || 0) * 100);
    if (!itemName.trim()) return;
    if (priceMinor <= 0 && (!portions || portions.length === 0)) return;

    try {
      await createItem({
        name: itemName.trim(),
        price_minor: priceMinor,
        category_id: itemCategorySelect || categories[0]?.id || "",
        variants: portions && portions.length > 0 ? portions : undefined,
      }).unwrap();

      setIsNewItemModalOpen(false);
      setItemName("");
      setItemPriceRupees("");
      setItemHasPortions(false);
      setItemPortions([
        { name: "Half", priceRupees: "", is_available: true },
        { name: "Full", priceRupees: "", is_available: true },
      ]);
      refetchItems();
    } catch (err) {
      console.error(err);
    }
  };

  const openPortionsEditor = (item: MenuItem) => {
    setEditingItem(item);
    setPortionError(null);
    setEditPortions(
      (item.variants || []).map((v) => ({
        name: v.name,
        priceRupees: ((v.price?.amount_minor_units || 0) / 100).toString(),
        is_available: v.is_available !== false,
      }))
    );
  };

  const handleSavePortions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    const variants = editPortions
      .filter((v) => v.name.trim())
      .map((v, i) => ({
        name: v.name.trim(),
        price_minor: Math.round((parseFloat(v.priceRupees) || 0) * 100),
        is_available: v.is_available,
        display_order: i,
      }));
    if (variants.some((v) => v.price_minor <= 0)) {
      setPortionError("Every portion needs a price greater than 0.");
      return;
    }
    try {
      await replaceVariants({ id: editingItem.id, variants }).unwrap();
      setEditingItem(null);
      refetchItems();
    } catch (err: any) {
      setPortionError(err?.data?.error || "Failed to save portions");
    }
  };

  const handleUploadOcr = async () => {
    if (!selectedFile) return;
    try {
      setOcrStep(1);
      const formData = new FormData();
      formData.append("file", selectedFile);
      await uploadAiMenu(formData).unwrap();
      setOcrStep(2);
      refetchCategories();
      refetchItems();
      setTimeout(() => {
        setIsAiModalOpen(false);
        setOcrStep(0);
        setSelectedFile(null);
      }, 1500);
    } catch (err) {
      console.error(err);
      setOcrStep(0);
    }
  };

  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const filteredItems = items.filter((it) => {
    if (activeCategoryId === "ALL") return true;
    return it.category_id === activeCategoryId;
  });

  return (
    <>
      {/* Header Bar */}
      <div className="hd">
        <div>
          <h1>Menu</h1>
          <p>Dishes, prices and availability</p>
        </div>
        <div className="sp"></div>
        <FranchiseOutletFilterSelect />
        <button className="btn s" onClick={() => setIsAiModalOpen(true)}>
          Scan menu photo
        </button>
        <button className="btn s" onClick={() => setIsNewCategoryModalOpen(true)}>
          Add category
        </button>
        <button className="btn" onClick={() => setIsNewItemModalOpen(true)}>
          <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
          Add dish
        </button>
      </div>

      {/* Category Chips Bar */}
      <div className="bar">
        <div className="ch">
          <button
            className="chip"
            aria-pressed={activeCategoryId === "ALL"}
            onClick={() => setActiveCategoryId("ALL")}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              className="chip"
              aria-pressed={activeCategoryId === c.id}
              onClick={() => setActiveCategoryId(c.id)}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <p className="sub" style={{ color: "var(--admin-mute)", margin: "0 0 16px" }}>
        GST 5% (2.5% CGST + 2.5% SGST) applies to all dishes. Tap Available to pause a dish.
      </p>

      {/* Dish Cards Grid */}
      <div
        className="g"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}
      >
        {filteredItems.length === 0 ? (
          <div className="cd em" style={{ gridColumn: "1 / -1" }}>
            <b>No dishes in this category</b>
            Click "+ Add dish" or "Scan menu photo" to auto-extract items with Gemini AI.
          </div>
        ) : (
          filteredItems.map((item) => {
            const catName = categoryMap.get(item.category_id) || "General";
            const isAvail = item.is_available ?? true;

            return (
              <div
                key={item.id}
                className={`cd mc ${isAvail ? "" : "off"}`}
              >
                <div className="nm">{item.name}</div>
                <small style={{ color: "var(--admin-mute)" }}>{catName}</small>
                <div className="pr">
                  {formatMoney(item.price?.amount_minor_units || 0)}
                </div>
                {item.variants && item.variants.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, margin: "6px 0" }}>
                    {item.variants.map((v) => (
                      <span
                        key={v.id}
                        className="pill"
                        style={{ fontSize: "0.68rem", opacity: v.is_available === false ? 0.5 : 1 }}
                      >
                        {v.name} {formatMoney(v.price?.amount_minor_units || 0)}
                      </span>
                    ))}
                  </div>
                )}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button
                    className="chip"
                    aria-pressed={isAvail}
                    onClick={() => {
                      // Toggle local state
                      item.is_available = !isAvail;
                      refetchItems();
                    }}
                  >
                    {isAvail ? "Available" : "Paused"}
                  </button>
                  <button className="chip" onClick={() => openPortionsEditor(item)}>
                    Edit portions
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Category Modal */}
      {isNewCategoryModalOpen && (
        <Modal
          isOpen={isNewCategoryModalOpen}
          onClose={() => setIsNewCategoryModalOpen(false)}
          title="Add category"
          closeDisabled={isCreatingCat}
        >
            <form onSubmit={handleCreateCategory}>
              <div className="mf">
                <label className="w">
                  Category Name
                  <input
                    required
                    placeholder="e.g. Starters, Tandoor, Beverages, Desserts"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                  />
                </label>
              </div>
              <div className="ac" style={{ marginTop: 20 }}>
                <button
                  type="button"
                  className="btn s"
                  onClick={() => setIsNewCategoryModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn" disabled={isCreatingCat}>
                  {isCreatingCat ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
        </Modal>
      )}

      {/* Add Dish Modal */}
      {isNewItemModalOpen && (
        <Modal
          isOpen={isNewItemModalOpen}
          onClose={() => setIsNewItemModalOpen(false)}
          title="Add dish"
          closeDisabled={isCreatingItem}
        >
            <form onSubmit={handleCreateItem}>
              <div className="mf">
                <label className="w">
                  Dish Name
                  <input
                    required
                    placeholder="e.g. Butter Chicken, Paneer Tikka"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                  />
                </label>

                <label>
                  Price (₹){itemHasPortions ? " (optional — max portion price used)" : ""}
                  <input
                    required={!itemHasPortions}
                    type="number"
                    step="0.01"
                    placeholder="e.g. 280"
                    value={itemPriceRupees}
                    onChange={(e) => setItemPriceRupees(e.target.value)}
                  />
                </label>

                <label className="w" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={itemHasPortions}
                    onChange={(e) => setItemHasPortions(e.target.checked)}
                    style={{ width: "auto" }}
                  />
                  Has portions (Half / Full)
                </label>

                {itemHasPortions && (
                  <div className="w" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {itemPortions.map((v, idx) => (
                      <div key={idx} style={{ display: "flex", gap: 6 }}>
                        <input
                          placeholder="Portion name"
                          value={v.name}
                          onChange={(e) =>
                            setItemPortions((prev) =>
                              prev.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x))
                            )
                          }
                          style={{ flex: 1 }}
                        />
                        <input
                          type="number"
                          step="0.01"
                          placeholder="₹"
                          value={v.priceRupees}
                          onChange={(e) =>
                            setItemPortions((prev) =>
                              prev.map((x, i) => (i === idx ? { ...x, priceRupees: e.target.value } : x))
                            )
                          }
                          style={{ width: 90 }}
                        />
                        {itemPortions.length > 1 && (
                          <button
                            type="button"
                            className="btn s sm"
                            onClick={() => setItemPortions((prev) => prev.filter((_, i) => i !== idx))}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      className="btn s sm"
                      style={{ alignSelf: "flex-start" }}
                      onClick={() => setItemPortions((prev) => [...prev, { name: "", priceRupees: "", is_available: true }])}
                    >
                      + Add portion
                    </button>
                  </div>
                )}

                <label>
                  Category
                  <select
                    value={itemCategorySelect}
                    onChange={(e) => setItemCategorySelect(e.target.value)}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="ac" style={{ marginTop: 20 }}>
                <button
                  type="button"
                  className="btn s"
                  onClick={() => setIsNewItemModalOpen(false)}
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

      {/* Edit Portions Modal */}
      {editingItem && (
        <Modal
          isOpen={!!editingItem}
          onClose={() => setEditingItem(null)}
          title={`Portions — ${editingItem.name}`}
          description="Define portion sizes with their own prices. Save replaces the full set; empty list removes all portions."
          closeDisabled={isSavingVariants}
        >
            <form onSubmit={handleSavePortions}>
              <div className="mf" style={{ flexDirection: "column" }}>
                {editPortions.map((v, idx) => (
                  <div key={idx} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <input
                      placeholder="Portion name (e.g. Half)"
                      value={v.name}
                      onChange={(e) =>
                        setEditPortions((prev) =>
                          prev.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x))
                        )
                      }
                      style={{ flex: 1 }}
                    />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="₹"
                      value={v.priceRupees}
                      onChange={(e) =>
                        setEditPortions((prev) =>
                          prev.map((x, i) => (i === idx ? { ...x, priceRupees: e.target.value } : x))
                        )
                      }
                      style={{ width: 90 }}
                    />
                    <button
                      type="button"
                      className="chip"
                      aria-pressed={v.is_available}
                      onClick={() =>
                        setEditPortions((prev) =>
                          prev.map((x, i) => (i === idx ? { ...x, is_available: !x.is_available } : x))
                        )
                      }
                    >
                      {v.is_available ? "On" : "Off"}
                    </button>
                    <button
                      type="button"
                      className="btn s sm"
                      onClick={() => setEditPortions((prev) => prev.filter((_, i) => i !== idx))}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn s sm"
                  style={{ alignSelf: "flex-start" }}
                  onClick={() => setEditPortions((prev) => [...prev, { name: "", priceRupees: "", is_available: true }])}
                >
                  + Add portion
                </button>
                {portionError && (
                  <div className="pill c-r" style={{ display: "block", padding: "8px 12px" }}>
                    {portionError}
                  </div>
                )}
              </div>
              <div className="ac" style={{ marginTop: 20 }}>
                <button type="button" className="btn s" onClick={() => setEditingItem(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn" disabled={isSavingVariants}>
                  {isSavingVariants ? "Saving…" : "Save portions"}
                </button>
              </div>
            </form>
        </Modal>
      )}

      {/* Scan Menu Photo Modal */}
      {isAiModalOpen && (
        <Modal
          isOpen={isAiModalOpen}
          onClose={() => setIsAiModalOpen(false)}
          title="Scan menu photo"
          description="Upload a physical photo of your restaurant menu. Gemini 3.6 Flash will extract dishes, categories, and prices automatically."
          closeDisabled={isOcrUploading}
        >

            <div style={{ marginTop: 14 }}>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                style={{ height: "auto", padding: "12px 14px" }}
              />
            </div>

            {ocrStep === 1 && (
              <div className="al w mt">
                <div>
                  <b>Analyzing menu with Gemini AI…</b>
                  <small>Detecting dish names, descriptions, and INR prices.</small>
                </div>
              </div>
            )}

            {ocrStep === 2 && (
              <div className="al mt" style={{ borderColor: "rgba(47,154,98,0.4)", background: "rgba(47,154,98,0.08)", "--c": "var(--admin-grn)" } as any}>
                <div>
                  <b>Menu extracted successfully!</b>
                  <small>Categories and dishes synced to catalog.</small>
                </div>
              </div>
            )}

            <div className="ac" style={{ marginTop: 20 }}>
              <button
                type="button"
                className="btn s"
                onClick={() => setIsAiModalOpen(false)}
              >
                Close
              </button>
              <button
                type="button"
                className="btn"
                onClick={handleUploadOcr}
                disabled={!selectedFile || isOcrUploading}
              >
                {isOcrUploading ? "Scanning…" : "Scan & Extract"}
              </button>
            </div>
        </Modal>
      )}
    </>
  );
}
