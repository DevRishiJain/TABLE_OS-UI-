"use client";

import React, { useState } from "react";
import {
  useGetMenuCategoriesQuery,
  useGetMenuItemsQuery,
  useCreateMenuCategoryMutation,
  useCreateMenuItemMutation,
  useUploadAiMenuCatalogMutation,
} from "@/store/api/restaurantApi";
import { formatMoney } from "@/lib/money";
import { MenuItem } from "@/types/domain";
import { FranchiseOutletFilterSelect } from "@/components/franchise/FranchiseOutletFilterSelect";

export default function RestaurantMenuStudioPage() {
  const { data: categories = [], refetch: refetchCategories } = useGetMenuCategoriesQuery();
  const { data: items = [], refetch: refetchItems } = useGetMenuItemsQuery();

  const [createCategory, { isLoading: isCreatingCat }] = useCreateMenuCategoryMutation();
  const [createItem, { isLoading: isCreatingItem }] = useCreateMenuItemMutation();
  const [uploadAiMenu, { isLoading: isOcrUploading }] = useUploadAiMenuCatalogMutation();

  const [activeCategoryId, setActiveCategoryId] = useState<string>("ALL");
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false);
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);

  // Form states
  const [categoryName, setCategoryName] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemPriceRupees, setItemPriceRupees] = useState("");
  const [itemCategorySelect, setItemCategorySelect] = useState("");

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
    const priceMinor = Math.round((parseFloat(itemPriceRupees) || 0) * 100);
    if (!itemName.trim() || priceMinor <= 0) return;

    try {
      await createItem({
        name: itemName.trim(),
        price_minor: priceMinor,
        category_id: itemCategorySelect || categories[0]?.id || "",
      }).unwrap();

      setIsNewItemModalOpen(false);
      setItemName("");
      setItemPriceRupees("");
      refetchItems();
    } catch (err) {
      console.error(err);
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
              </div>
            );
          })
        )}
      </div>

      {/* Add Category Modal */}
      {isNewCategoryModalOpen && (
        <div
          className="ov on"
          onClick={(e) => {
            if ((e.target as HTMLElement).classList.contains("ov")) setIsNewCategoryModalOpen(false);
          }}
        >
          <div className="md">
            <h3>Add category</h3>
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
          </div>
        </div>
      )}

      {/* Add Dish Modal */}
      {isNewItemModalOpen && (
        <div
          className="ov on"
          onClick={(e) => {
            if ((e.target as HTMLElement).classList.contains("ov")) setIsNewItemModalOpen(false);
          }}
        >
          <div className="md">
            <h3>Add dish</h3>
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
                  Price (₹)
                  <input
                    required
                    type="number"
                    step="0.01"
                    placeholder="e.g. 280"
                    value={itemPriceRupees}
                    onChange={(e) => setItemPriceRupees(e.target.value)}
                  />
                </label>

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
          </div>
        </div>
      )}

      {/* Scan Menu Photo Modal */}
      {isAiModalOpen && (
        <div
          className="ov on"
          onClick={(e) => {
            if ((e.target as HTMLElement).classList.contains("ov")) setIsAiModalOpen(false);
          }}
        >
          <div className="md">
            <h3>Scan menu photo</h3>
            <p className="sub" style={{ marginTop: -6, color: "var(--admin-mute)" }}>
              Upload a physical photo of your restaurant menu. Gemini 3.6 Flash will extract dishes, categories, and prices automatically.
            </p>

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
          </div>
        </div>
      )}
    </>
  );
}
