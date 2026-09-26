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
import { addToast } from "@/store/slices/uiSlice";
import { useAppDispatch, useAppSelector } from "@/store";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import {
  Sparkles,
  UploadCloud,
  Plus,
  UtensilsCrossed,
  CheckCircle2,
  Loader2,
  FileText,
  Layers,
} from "lucide-react";

export default function RestaurantMenuStudioPage() {
  const dispatch = useAppDispatch();
  const storedRestaurantId = useAppSelector((state) => state.auth.restaurantId);
  const restaurantId =
    storedRestaurantId || process.env.NEXT_PUBLIC_DEFAULT_RESTAURANT_ID || "";

  const { data: categories, refetch: refetchCategories } =
    useGetMenuCategoriesQuery();
  const { data: items, refetch: refetchItems } = useGetMenuItemsQuery();

  const [createCategory, { isLoading: isCreatingCat }] =
    useCreateMenuCategoryMutation();
  const [createItem, { isLoading: isCreatingItem }] =
    useCreateMenuItemMutation();
  const [uploadAiMenu, { isLoading: isOcrUploading }] =
    useUploadAiMenuCatalogMutation();

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

  const handleCreateCategory = async () => {
    if (!categoryName.trim()) return;
    try {
      await createCategory({ name: categoryName.trim() }).unwrap();
      dispatch(
        addToast({
          type: "success",
          title: "Category Created",
          message: `Category "${categoryName}" has been added.`,
        })
      );
      setCategoryName("");
      setIsNewCategoryModalOpen(false);
      refetchCategories();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateItem = async () => {
    if (!itemName.trim() || !itemPriceRupees || !itemCategorySelect) return;
    try {
      const priceMinor = Math.round(parseFloat(itemPriceRupees) * 100);
      await createItem({
        category_id: itemCategorySelect,
        name: itemName.trim(),
        price: priceMinor,
        cgst_rate_bps: 250,
        sgst_rate_bps: 250,
      }).unwrap();

      dispatch(
        addToast({
          type: "success",
          title: "Dish Created",
          message: `Dish "${itemName}" is now live on table menus.`,
        })
      );
      setItemName("");
      setItemPriceRupees("");
      setIsNewItemModalOpen(false);
      refetchItems();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAiMenuUpload = async () => {
    if (!selectedFile) return;
    setOcrStep(1); // Uploading to MinIO
    try {
      const formData = new FormData();
      formData.append("menu_image", selectedFile);
      formData.append("restaurant_id", restaurantId);

      setTimeout(() => setOcrStep(2), 1500); // Gemini 3.6 Flash extracting

      const resp = await uploadAiMenu(formData).unwrap();
      setOcrStep(3); // Complete

      dispatch(
        addToast({
          type: "success",
          title: "AI Cataloging Complete!",
          message: `Extracted ${resp?.items?.length || "all"} dishes & saved to PostgreSQL!`,
        })
      );
      refetchCategories();
      refetchItems();
      setTimeout(() => {
        setIsAiModalOpen(false);
        setOcrStep(0);
        setSelectedFile(null);
      }, 1500);
    } catch (err) {
      console.error("AI Menu upload failed:", err);
      dispatch(
        addToast({
          type: "error",
          title: "AI Extraction Error",
          message: "Failed to OCR menu image with Gemini. Please try again.",
        })
      );
      setOcrStep(0);
    }
  };

  const filteredItems =
    activeCategoryId === "ALL"
      ? items || []
      : items?.filter((i) => i.category_id === activeCategoryId) || [];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-gray-100 flex items-center gap-2">
            <UtensilsCrossed className="w-6 h-6 text-primary" />
            Menu & AI Cataloging Studio
          </h1>
          <p className="text-xs text-gray-400">
            Manage categories, dishes, and instantly digitize physical menu photos with Gemini
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="gold"
            size="sm"
            onClick={() => setIsAiModalOpen(true)}
            leftIcon={<Sparkles className="w-4 h-4" />}
          >
            Scan Physical Menu with AI
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsNewCategoryModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Category
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsNewItemModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Dish
          </Button>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Category List */}
        <Card className="p-4 flex flex-col gap-2 h-fit">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
            Menu Categories
          </span>
          <button
            onClick={() => setActiveCategoryId("ALL")}
            className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
              activeCategoryId === "ALL"
                ? "bg-primary text-background"
                : "text-gray-300 hover:bg-surface-hover"
            }`}
          >
            <span>All Dishes</span>
            <span className="font-mono text-[11px]">{items?.length || 0}</span>
          </button>

          {categories?.map((cat) => {
            const count = items?.filter((i) => i.category_id === cat.id).length || 0;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategoryId(cat.id)}
                className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-between ${
                  activeCategoryId === cat.id
                    ? "bg-primary text-background font-bold"
                    : "text-gray-400 hover:bg-surface-hover hover:text-white"
                }`}
              >
                <span>{cat.name}</span>
                <span className="font-mono text-[11px] opacity-75">{count}</span>
              </button>
            );
          })}
        </Card>

        {/* Right Dishes Grid */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredItems.map((dish) => (
              <Card
                key={dish.id}
                className="p-4 flex flex-col justify-between gap-3 border-surface-border hover:border-surface-border/80"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <Badge variant="success" size="sm">
                      Available
                    </Badge>
                    <span className="text-[10px] text-gray-500 font-mono">
                      GST: 5% (2.5+2.5)
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-gray-100 font-display mt-2">
                    {dish.name}
                  </h3>
                  {dish.description && (
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                      {dish.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-surface-border/50">
                  <span className="text-base font-extrabold font-mono text-primary">
                    {formatMoney(dish.price.amount_minor_units)}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    SAC: {dish.hsn_sac_code || "996331"}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* AI Menu Photo OCR Upload Modal */}
      <Modal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        title="AI Menu Photo OCR Studio"
        description="Upload a physical paper menu photo to automatically parse categories, dishes, prices, and GST rates into PostgreSQL and MinIO."
      >
        <div className="flex flex-col gap-4">
          {/* Drag and Drop Zone */}
          <div className="p-8 rounded-2xl border-2 border-dashed border-primary/40 bg-surface-subtle flex flex-col items-center justify-center text-center gap-3">
            <UploadCloud className="w-10 h-10 text-primary animate-pulse" />
            <div>
              <p className="text-xs font-bold text-gray-200">
                {selectedFile ? selectedFile.name : "Select or Drop Menu Photo"}
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                PNG, JPG, WEBP up to 10MB
              </p>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setSelectedFile(e.target.files[0]);
                }
              }}
              className="text-xs text-gray-400 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-background hover:file:bg-primary-hover cursor-pointer"
            />
          </div>

          {/* Steps Progress */}
          {ocrStep > 0 && (
            <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-surface border border-surface-border text-xs">
              <div
                className={`flex items-center gap-2 ${
                  ocrStep >= 1 ? "text-primary font-bold" : "text-gray-500"
                }`}
              >
                {ocrStep > 1 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                <span>1. Uploading image to MinIO Object Storage...</span>
              </div>
              <div
                className={`flex items-center gap-2 ${
                  ocrStep >= 2 ? "text-primary font-bold" : "text-gray-500"
                }`}
              >
                {ocrStep > 2 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : ocrStep === 2 ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span className="w-4" />
                )}
                <span>2. Google Gemini 3.6 Flash parsing dishes & prices...</span>
              </div>
              <div
                className={`flex items-center gap-2 ${
                  ocrStep >= 3 ? "text-emerald-400 font-bold" : "text-gray-500"
                }`}
              >
                {ocrStep === 3 && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                <span>3. Records created in PostgreSQL!</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              onClick={() => setIsAiModalOpen(false)}
              disabled={isOcrUploading}
            >
              Cancel
            </Button>
            <Button
              variant="gold"
              onClick={handleAiMenuUpload}
              isLoading={isOcrUploading}
              disabled={!selectedFile}
              leftIcon={<Sparkles className="w-4 h-4" />}
            >
              Start AI Cataloging
            </Button>
          </div>
        </div>
      </Modal>

      {/* New Category Modal */}
      <Modal
        isOpen={isNewCategoryModalOpen}
        onClose={() => setIsNewCategoryModalOpen(false)}
        title="Add Menu Category"
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Category Name"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            placeholder="e.g. SOUPS & SALADS"
          />
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              onClick={() => setIsNewCategoryModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateCategory}
              isLoading={isCreatingCat}
            >
              Save Category
            </Button>
          </div>
        </div>
      </Modal>

      {/* New Dish Modal */}
      <Modal
        isOpen={isNewItemModalOpen}
        onClose={() => setIsNewItemModalOpen(false)}
        title="Add New Dish"
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Dish Name"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder="e.g. Malai Kofta"
          />
          <Input
            label="Price in Rupees (₹)"
            type="number"
            value={itemPriceRupees}
            onChange={(e) => setItemPriceRupees(e.target.value)}
            placeholder="e.g. 380.00"
          />
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
              Category
            </label>
            <select
              value={itemCategorySelect}
              onChange={(e) => setItemCategorySelect(e.target.value)}
              className="w-full rounded-xl bg-surface-subtle border border-surface-border text-gray-100 text-sm py-2.5 px-3 focus:outline-none focus:border-primary"
            >
              <option value="">Select Category...</option>
              {categories?.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              onClick={() => setIsNewItemModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateItem}
              isLoading={isCreatingItem}
            >
              Create Dish
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
