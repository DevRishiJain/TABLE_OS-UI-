"use client";

import React, { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  useGetPublicMenuCategoriesQuery,
  useGetPublicMenuItemsQuery,
} from "@/store/api/publicApi";
import { useGetSessionQuery } from "@/store/api/customerApi";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  addItem,
  updateQuantity,
  selectCartItemsList,
} from "@/store/slices/cartSlice";
import { setAiDrawerOpen, addToast } from "@/store/slices/uiSlice";
import { formatMoney } from "@/lib/money";
import { MenuItem } from "@/types/domain";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { AIMenuSearchDrawer } from "@/components/ai/AIMenuSearchDrawer";
import {
  Plus,
  Minus,
  Sparkles,
  Utensils,
  Leaf,
  Flame,
  Search,
} from "lucide-react";

export default function CustomerMenuPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const dispatch = useAppDispatch();

  const { data: sessionDetail } = useGetSessionQuery(sessionId, { skip: !sessionId });
  const storedRestaurantId = useAppSelector((state) => state.auth.restaurantId);
  const restaurantId =
    sessionDetail?.session?.restaurant_id ||
    storedRestaurantId ||
    process.env.NEXT_PUBLIC_DEFAULT_RESTAURANT_ID ||
    "";

  const { data: categories, isLoading: isCategoriesLoading } =
    useGetPublicMenuCategoriesQuery({ restaurantId }, { skip: !restaurantId });
  const { data: items, isLoading: isItemsLoading } =
    useGetPublicMenuItemsQuery({ restaurantId }, { skip: !restaurantId });

  const cartItems = useAppSelector(selectCartItemsList);
  const isAiDrawerOpen = useAppSelector((state) => state.ui.isAiDrawerOpen);

  const [activeCategoryId, setActiveCategoryId] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDish, setSelectedDish] = useState<MenuItem | null>(null);
  const [dishInstructions, setDishInstructions] = useState("");
  const [highlightedDishId, setHighlightedDishId] = useState<string | null>(null);

  // Filter items
  const filteredItems = useMemo(() => {
    if (!items) return [];
    return items.filter((item) => {
      const matchesCategory =
        activeCategoryId === "ALL" || item.category_id === activeCategoryId;
      const matchesSearch =
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description &&
          item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [items, activeCategoryId, searchQuery]);

  // Map of cart quantities
  const cartQuantityMap = useMemo(() => {
    const map: Record<string, number> = {};
    cartItems.forEach((ci) => {
      map[ci.menuItem.id] = ci.quantity;
    });
    return map;
  }, [cartItems]);

  const handleAddDish = (dish: MenuItem) => {
    dispatch(addItem({ menuItem: dish, quantity: 1 }));
    dispatch(
      addToast({
        type: "success",
        message: `Added ${dish.name} to cart`,
        durationMs: 2000,
      })
    );
  };

  const handleOpenDishModal = (dish: MenuItem) => {
    setSelectedDish(dish);
    setDishInstructions("");
  };

  const handleConfirmCustomDish = () => {
    if (selectedDish) {
      dispatch(
        addItem({
          menuItem: selectedDish,
          quantity: 1,
          specialInstructions: dishInstructions.trim() || undefined,
        })
      );
      dispatch(
        addToast({
          type: "success",
          message: `Added ${selectedDish.name} with custom instructions`,
          durationMs: 2000,
        })
      );
      setSelectedDish(null);
    }
  };

  return (
    <div className="flex flex-col gap-5 px-4 pt-4">
      {/* Search and AI Action Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search appetizers, curries, breads..."
            leftIcon={<Search className="w-4 h-4 text-gray-400" />}
            className="text-xs py-2 bg-surface"
          />
        </div>
        <Button
          variant="gold"
          size="sm"
          onClick={() => dispatch(setAiDrawerOpen(true))}
          className="shrink-0 font-bold"
          leftIcon={<Sparkles className="w-4 h-4" />}
        >
          Ask AI
        </Button>
      </div>

      {/* Categories Horizontal Chip Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setActiveCategoryId("ALL")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
            activeCategoryId === "ALL"
              ? "bg-primary text-background shadow-md shadow-primary/20 font-bold"
              : "bg-surface text-gray-300 border border-surface-border hover:border-gray-600"
          }`}
        >
          All Dishes
        </button>

        {isCategoriesLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="w-20 h-7 rounded-full shrink-0" />
            ))
          : categories?.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategoryId(cat.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeCategoryId === cat.id
                    ? "bg-primary text-background shadow-md shadow-primary/20 font-bold"
                    : "bg-surface text-gray-300 border border-surface-border hover:border-gray-600"
                }`}
              >
                {cat.name}
              </button>
            ))}
      </div>

      {/* Menu Dishes List */}
      <div className="flex flex-col gap-3.5">
        {isItemsLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="p-4 rounded-2xl bg-surface border border-surface-border flex gap-4"
            >
              <div className="flex-1 flex flex-col gap-2">
                <Skeleton className="w-32 h-5 rounded-md" />
                <Skeleton className="w-20 h-4 rounded-md" />
                <Skeleton className="w-48 h-3 rounded-md mt-2" />
              </div>
              <Skeleton className="w-20 h-20 rounded-xl shrink-0" />
            </div>
          ))
        ) : filteredItems.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center p-6 bg-surface rounded-2xl border border-surface-border">
            <Utensils className="w-10 h-10 text-gray-500 mb-2" />
            <h4 className="text-sm font-bold text-gray-200">No dishes found</h4>
            <p className="text-xs text-gray-400 mt-1">
              Try adjusting your category filter or search query.
            </p>
          </div>
        ) : (
          filteredItems.map((dish) => {
            const qty = cartQuantityMap[dish.id] || 0;
            const isHighlighted = highlightedDishId === dish.id;

            const isVeg =
              dish.name.toLowerCase().includes("paneer") ||
              dish.name.toLowerCase().includes("corn") ||
              dish.name.toLowerCase().includes("dal") ||
              dish.name.toLowerCase().includes("naan") ||
              dish.name.toLowerCase().includes("roti") ||
              dish.name.toLowerCase().includes("jamun");

            const isSpicy =
              dish.name.toLowerCase().includes("tikka") ||
              dish.name.toLowerCase().includes("crispy");

            return (
              <div
                key={dish.id}
                className={`p-4 rounded-2xl bg-surface border transition-all duration-300 flex items-start justify-between gap-3 ${
                  isHighlighted
                    ? "border-primary shadow-glow bg-primary/5"
                    : "border-surface-border hover:border-surface-border/80"
                }`}
              >
                <div
                  className="flex-1 flex flex-col cursor-pointer"
                  onClick={() => handleOpenDishModal(dish)}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    {isVeg ? (
                      <span className="p-0.5 rounded border border-emerald-500/50 text-emerald-400 inline-block">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 block" />
                      </span>
                    ) : (
                      <span className="p-0.5 rounded border border-red-500/50 text-red-400 inline-block">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 block" />
                      </span>
                    )}

                    {isSpicy && (
                      <Badge variant="amber" size="sm">
                        <Flame className="w-3 h-3 text-amber-400 inline mr-0.5" />
                        Spicy
                      </Badge>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-gray-100 font-display">
                    {dish.name}
                  </h3>

                  <span className="text-sm font-extrabold text-primary font-mono mt-1">
                    {formatMoney(dish.price.amount_minor_units)}
                  </span>

                  {dish.description && (
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                      {dish.description}
                    </p>
                  )}
                </div>

                {/* Add or Quantity Controls */}
                <div className="shrink-0 flex items-center">
                  {qty === 0 ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddDish(dish)}
                      className="font-bold border-primary/40 text-primary hover:bg-primary/10"
                      leftIcon={<Plus className="w-3.5 h-3.5" />}
                    >
                      Add
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2 bg-surface-subtle border border-primary/40 rounded-xl px-1.5 py-1">
                      <button
                        onClick={() =>
                          dispatch(
                            updateQuantity({
                              menuItemId: dish.id,
                              quantity: qty - 1,
                            })
                          )
                        }
                        className="w-6 h-6 rounded-lg bg-surface flex items-center justify-center text-gray-300 hover:text-white"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-bold font-mono px-1">
                        {qty}
                      </span>
                      <button
                        onClick={() =>
                          dispatch(
                            updateQuantity({
                              menuItemId: dish.id,
                              quantity: qty + 1,
                            })
                          )
                        }
                        className="w-6 h-6 rounded-lg bg-primary text-background font-bold flex items-center justify-center"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Dish Customization Modal */}
      {selectedDish && (
        <Modal
          isOpen={!!selectedDish}
          onClose={() => setSelectedDish(null)}
          title={selectedDish.name}
          description={formatMoney(selectedDish.price.amount_minor_units)}
        >
          <div className="flex flex-col gap-4">
            <Input
              label="Special Cooking Instructions"
              value={dishInstructions}
              onChange={(e) => setDishInstructions(e.target.value)}
              placeholder="e.g. Less spicy, extra butter, well done"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                onClick={() => setSelectedDish(null)}
              >
                Cancel
              </Button>
              <Button variant="primary" onClick={handleConfirmCustomDish}>
                Add to Cart • {formatMoney(selectedDish.price.amount_minor_units)}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* AI Dining Search Concierge Drawer */}
      <AIMenuSearchDrawer
        isOpen={isAiDrawerOpen}
        onClose={() => dispatch(setAiDrawerOpen(false))}
        restaurantId={restaurantId}
        onSelectHighlightItem={(dish) => {
          setHighlightedDishId(dish.id);
          setTimeout(() => setHighlightedDishId(null), 4000);
        }}
      />
    </div>
  );
}
