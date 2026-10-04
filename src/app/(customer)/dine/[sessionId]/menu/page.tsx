"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
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
  ChevronRight,
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
  const [vegOnly, setVegOnly] = useState(false);
  const [selectedDish, setSelectedDish] = useState<MenuItem | null>(null);
  const [dishInstructions, setDishInstructions] = useState("");
  const [dishModalQty, setDishModalQty] = useState(1);
  const [highlightedDishId, setHighlightedDishId] = useState<string | null>(null);

  const customerName =
    useAppSelector((state) => state.auth.customerName) ||
    sessionDetail?.session?.customer_name ||
    "";

  // Check for active order round
  const activeOrder = (sessionDetail?.orders || []).find(
    (o) => o.status !== "SERVED" && o.status !== "CANCELLED"
  );
  const activeOrderText = activeOrder
    ? activeOrder.status === "PREPARING"
      ? "Chefs are cooking your order"
      : activeOrder.status === "READY"
      ? "Order is ready at pass"
      : "Order received in kitchen"
    : null;

  const isDishVeg = (dish: MenuItem) => {
    const text = (dish.name + " " + (dish.description || "")).toLowerCase();
    const nonVegKeywords = ["chicken", "mutton", "lamb", "fish", "prawn", "egg", "beef", "pork", "meat", "tikka chicken"];
    if (nonVegKeywords.some((k) => text.includes(k))) return false;
    return (
      text.includes("paneer") ||
      text.includes("corn") ||
      text.includes("dal") ||
      text.includes("naan") ||
      text.includes("roti") ||
      text.includes("veg") ||
      text.includes("jamun") ||
      text.includes("kebab") ||
      text.includes("sabzi") ||
      text.includes("palak") ||
      text.includes("aloo") ||
      text.includes("chaat") ||
      true
    );
  };

  const isDishSpicy = (dish: MenuItem) => {
    const text = (dish.name + " " + (dish.description || "")).toLowerCase();
    return text.includes("tikka") || text.includes("crispy") || text.includes("spicy") || text.includes("chilli") || text.includes("mirch") || text.includes("masala");
  };

  // Filter items
  const filteredItems = useMemo(() => {
    if (!items) return [];
    return items.filter((item) => {
      const matchesCategory =
        activeCategoryId === "ALL"
          ? true
          : activeCategoryId === "POPULAR"
          ? item.name.toLowerCase().includes("crispy") || item.name.toLowerCase().includes("butter") || item.name.toLowerCase().includes("tikka") || item.name.toLowerCase().includes("naan")
          : item.category_id === activeCategoryId;

      const matchesVeg = !vegOnly || isDishVeg(item);

      const matchesSearch =
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description &&
          item.description.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesCategory && matchesVeg && matchesSearch;
    });
  }, [items, activeCategoryId, vegOnly, searchQuery]);

  // Chef's picks for horizontal carousel
  const chefsPicks = useMemo(() => {
    if (!items) return [];
    return items.slice(0, 5);
  }, [items]);

  // Group items by category when ALL is selected and no active search
  const categorizedGroups = useMemo(() => {
    if (activeCategoryId !== "ALL" || searchQuery.trim() || !categories || categories.length === 0) {
      return null;
    }
    const groups: { categoryName: string; categoryId: string; items: MenuItem[] }[] = [];
    categories.forEach((cat) => {
      const catItems = filteredItems.filter((dish) => dish.category_id === cat.id);
      if (catItems.length > 0) {
        groups.push({ categoryName: cat.name, categoryId: cat.id, items: catItems });
      }
    });
    const knownCatIds = new Set(categories.map((c) => c.id));
    const others = filteredItems.filter((dish) => !dish.category_id || !knownCatIds.has(dish.category_id));
    if (others.length > 0) {
      groups.push({ categoryName: "Chef Specials & Mains", categoryId: "others", items: others });
    }
    return groups.length > 0 ? groups : null;
  }, [categories, filteredItems, activeCategoryId, searchQuery]);

  // Map of cart quantities
  const cartQuantityMap = useMemo(() => {
    const map: Record<string, number> = {};
    cartItems.forEach((ci) => {
      map[ci.menuItem.id] = ci.quantity;
    });
    return map;
  }, [cartItems]);

  const handleAddDish = (dish: MenuItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    dispatch(addItem({ menuItem: dish, quantity: 1 }));
    dispatch(
      addToast({
        type: "success",
        message: `${dish.name} added to order`,
        durationMs: 2000,
      })
    );
  };

  const handleUpdateQty = (dishId: string, newQty: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    dispatch(updateQuantity({ menuItemId: dishId, quantity: newQty }));
  };

  const handleOpenDishModal = (dish: MenuItem) => {
    setSelectedDish(dish);
    const existing = cartItems.find((ci) => ci.menuItem.id === dish.id);
    setDishInstructions(existing?.specialInstructions || "");
    setDishModalQty(existing?.quantity || 1);
  };

  const handleConfirmCustomDish = () => {
    if (selectedDish) {
      if (dishModalQty <= 0) {
        dispatch(updateQuantity({ menuItemId: selectedDish.id, quantity: 0 }));
      } else {
        dispatch(
          addItem({
            menuItem: selectedDish,
            quantity: dishModalQty,
            specialInstructions: dishInstructions.trim() || undefined,
          })
        );
        dispatch(
          addToast({
            type: "success",
            message: `${selectedDish.name} updated`,
            durationMs: 2000,
          })
        );
      }
      setSelectedDish(null);
    }
  };

  const getDishHue = (categoryName?: string) => {
    const cat = (categoryName || "").toLowerCase();
    if (cat.includes("starter") || cat.includes("appetizer")) return "#C98A3D";
    if (cat.includes("main") || cat.includes("curry") || cat.includes("gravy")) return "#B5654A";
    if (cat.includes("bread") || cat.includes("roti") || cat.includes("rice")) return "#B59A62";
    if (cat.includes("dessert") || cat.includes("sweet") || cat.includes("drink")) return "#B0607A";
    return "var(--ac)";
  };

  const getDishIcon = (categoryName?: string) => {
    const cat = (categoryName || "").toLowerCase();
    if (cat.includes("starter") || cat.includes("appetizer")) {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: "1.75rem", height: "1.75rem" }}>
          <path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z" />
        </svg>
      );
    }
    if (cat.includes("main") || cat.includes("curry")) {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: "1.75rem", height: "1.75rem" }}>
          <path d="M6 14a4 4 0 1 1 2-7 4 4 0 0 1 8 0 4 4 0 1 1 2 7v6H6z" />
        </svg>
      );
    }
    if (cat.includes("bread") || cat.includes("roti")) {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: "1.75rem", height: "1.75rem" }}>
          <path d="M4 15a8 6 0 0 1 16 0v3H4zM9 11l-1 3M13 10l-1 4M17 11l-1 3" />
        </svg>
      );
    }
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: "1.75rem", height: "1.75rem" }}>
        <path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
      </svg>
    );
  };

  const renderDishRow = (dish: MenuItem, categoryName?: string) => {
    const qty = cartQuantityMap[dish.id] || 0;
    const isVeg = isDishVeg(dish);
    const isSpicy = isDishSpicy(dish);
    const hue = getDishHue(categoryName);

    return (
      <div key={dish.id} className={`mi ${qty > 0 ? "has" : ""}`}>
        <button
          className="mo"
          type="button"
          onClick={() => handleOpenDishModal(dish)}
          aria-label={`${dish.name}, see details`}
        >
          <span className="pt" style={{ "--h": hue } as React.CSSProperties}>
            {getDishIcon(categoryName)}
          </span>
          <span className="mt">
            <span className="nm">
              <i
                className={`vg ${isVeg ? "" : "n"}`}
                title={isVeg ? "Vegetarian" : "Non-vegetarian"}
              />
              {dish.name}
            </span>
            {dish.description && <small>{dish.description}</small>}
          </span>
        </button>

        <div className="mr">
          <span className="pr">{formatMoney(dish.price.amount_minor_units)}</span>
          {isSpicy && <span className="sp">Spicy</span>}
          <span className="sx" />

          {qty > 0 ? (
            <div className="sp2">
              <button
                type="button"
                onClick={(e) => handleUpdateQty(dish.id, qty - 1, e)}
                aria-label={`Remove one ${dish.name}`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "1.1rem", height: "1.1rem" }}>
                  <path d="M5 12h14" />
                </svg>
              </button>
              <span>{qty}</span>
              <button
                type="button"
                onClick={(e) => handleUpdateQty(dish.id, qty + 1, e)}
                aria-label={`Add one ${dish.name}`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "1.1rem", height: "1.1rem" }}>
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="ad"
              onClick={(e) => handleAddDish(dish, e)}
              aria-label={`Add ${dish.name}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "1.2rem", height: "1.2rem" }}>
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ paddingTop: 6 }}>
      {/* Greeting Header */}
      <div>
        <h2>{customerName ? `Namaste, ${customerName}` : "Namaste"}</h2>
        <p className="mu" style={{ margin: "4px 0 0" }}>
          What would you like today?
        </p>
      </div>

      {/* Live Order Banner */}
      {activeOrder && (
        <Link
          href={`/dine/${sessionId}/orders`}
          className="nl live"
          style={{ textDecoration: "none" }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: "1.35rem", height: "1.35rem", color: "var(--ok)" }}>
            <path d="M6 14a4 4 0 1 1 2-7 4 4 0 0 1 8 0 4 4 0 1 1 2 7v6H6z" />
          </svg>
          <span>
            <b>{activeOrderText}</b>
            <small>Round active · Tap to track food live</small>
          </span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "1.1rem", height: "1.1rem", color: "var(--mu)" }}>
            <path d="M9 6l6 6-6 6" />
          </svg>
        </Link>
      )}

      {/* AI Menu Helper Banner */}
      <button
        className="nl"
        type="button"
        onClick={() => dispatch(setAiDrawerOpen(true))}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: "1.35rem", height: "1.35rem", color: "var(--ac)" }}>
          <path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
        </svg>
        <span>
          <b>Not sure what to order?</b>
          <small>Ask the menu helper</small>
        </span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "1.1rem", height: "1.1rem", color: "var(--mu)" }}>
          <path d="M9 6l6 6-6 6" />
        </svg>
      </button>

      {/* Sticky Search & Category Bar */}
      <div className="st">
        <div className="sr">
          <input
            id="q"
            className="in"
            type="search"
            placeholder="Search dishes"
            aria-label="Search dishes"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            type="button"
            className="vt"
            aria-pressed={vegOnly}
            onClick={() => setVegOnly(!vegOnly)}
            aria-label="Vegetarian only"
          >
            <i />
            Veg
          </button>
        </div>

        <div className="tabs">
          <button
            type="button"
            className="tab"
            aria-pressed={activeCategoryId === "ALL"}
            onClick={() => setActiveCategoryId("ALL")}
          >
            All
          </button>
          <button
            type="button"
            className="tab"
            aria-pressed={activeCategoryId === "POPULAR"}
            onClick={() => setActiveCategoryId("POPULAR")}
          >
            Popular
          </button>
          {categories?.map((c) => (
            <button
              key={c.id}
              type="button"
              className="tab"
              aria-pressed={activeCategoryId === c.id}
              onClick={() => setActiveCategoryId(c.id)}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Chef's Picks Carousel (When on ALL and no query) */}
      {activeCategoryId === "ALL" && !searchQuery && chefsPicks.length > 0 && (
        <>
          <div className="sec">Chef's picks</div>
          <div className="hs">
            {chefsPicks.map((m) => {
              const qty = cartQuantityMap[m.id] || 0;
              const hue = getDishHue(m.name);
              return (
                <div key={m.id} className="pk">
                  <button
                    className="mo"
                    type="button"
                    onClick={() => handleOpenDishModal(m)}
                    aria-label={`${m.name}, see details`}
                  >
                    <span className="pt lg" style={{ "--h": hue } as React.CSSProperties}>
                      {getDishIcon(m.name)}
                    </span>
                    <b>{m.name}</b>
                  </button>
                  <div className="mr" style={{ padding: "0 2px" }}>
                    <span className="pr">{formatMoney(m.price.amount_minor_units)}</span>
                    <span className="sx" />
                    {qty > 0 ? (
                      <div className="sp2">
                        <button
                          type="button"
                          onClick={(e) => handleUpdateQty(m.id, qty - 1, e)}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "1rem", height: "1rem" }}>
                            <path d="M5 12h14" />
                          </svg>
                        </button>
                        <span>{qty}</span>
                        <button
                          type="button"
                          onClick={(e) => handleUpdateQty(m.id, qty + 1, e)}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "1rem", height: "1rem" }}>
                            <path d="M12 5v14M5 12h14" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="ad"
                        onClick={(e) => handleAddDish(m, e)}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "1.2rem", height: "1.2rem" }}>
                          <path d="M12 5v14M5 12h14" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Dish List */}
      <div id="dl">
        {isItemsLoading ? (
          <div className="g" style={{ marginTop: 14 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="cd" style={{ height: 100, opacity: 0.5 }} />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="em">
            <b>No dishes found</b>
            Try another word or ask the menu helper.
          </div>
        ) : categorizedGroups && categorizedGroups.length > 0 ? (
          categorizedGroups.map((group) => (
            <div key={group.categoryId}>
              <div className="sec">{group.categoryName}</div>
              {group.items.map((dish) => renderDishRow(dish, group.categoryName))}
            </div>
          ))
        ) : (
          filteredItems.map((dish) => renderDishRow(dish, categories?.find((c) => c.id === dish.category_id)?.name))
        )}
      </div>

      {/* Dish Detail Bottom Sheet */}
      {selectedDish && (
        <div
          className="ov"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedDish(null);
          }}
        >
          <div className="sh">
            <div className="shb" style={{ padding: "0 0 8px", gap: 0 }}>
              {/* Hero Banner */}
              <div className="hero" style={{ "--h": getDishHue(selectedDish.name) } as React.CSSProperties}>
                {getDishIcon(selectedDish.name)}
                <button
                  type="button"
                  className="b i"
                  onClick={() => setSelectedDish(null)}
                  aria-label="Close"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: "1.2rem", height: "1.2rem" }}>
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>

              {/* Dish info */}
              <div style={{ padding: "18px 20px 0", display: "grid", gap: 14 }}>
                <div className="px">
                  <h2>{selectedDish.name}</h2>
                  <span className="pr" style={{ fontSize: "1.8rem" }}>
                    {formatMoney(selectedDish.price.amount_minor_units)}
                  </span>
                </div>

                <div className="tags">
                  <span className="tag">
                    <i
                      className={`vg ${isDishVeg(selectedDish) ? "" : "n"}`}
                      style={{ marginRight: 4 }}
                    />
                    {isDishVeg(selectedDish) ? "Vegetarian" : "Non-vegetarian"}
                  </span>
                  <span className="tag">
                    {isDishSpicy(selectedDish) ? "Spicy" : "Mild"}
                  </span>
                  <span className="tag">Chef Special</span>
                </div>

                {selectedDish.description && (
                  <p className="mu" style={{ margin: 0 }}>
                    {selectedDish.description}
                  </p>
                )}

                <div>
                  <label htmlFor="dish-note" style={{ fontSize: "0.85rem", color: "var(--mu)" }}>
                    Cooking instructions
                  </label>
                  <input
                    id="dish-note"
                    className="in"
                    placeholder="Cooking note, e.g. less spicy, extra butter"
                    aria-label="Cooking note"
                    value={dishInstructions}
                    onChange={(e) => setDishInstructions(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="shf">
              <div className="sp2">
                <button
                  type="button"
                  onClick={() => setDishModalQty((q) => Math.max(0, q - 1))}
                  aria-label="One less"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "1.1rem", height: "1.1rem" }}>
                    <path d="M5 12h14" />
                  </svg>
                </button>
                <span>{dishModalQty}</span>
                <button
                  type="button"
                  onClick={() => setDishModalQty((q) => q + 1)}
                  aria-label="One more"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "1.1rem", height: "1.1rem" }}>
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>
              </div>

              <button
                type="button"
                className="b p"
                onClick={handleConfirmCustomDish}
              >
                {dishModalQty === 0
                  ? "Remove from order"
                  : cartQuantityMap[selectedDish.id]
                  ? `Update order · ${formatMoney(selectedDish.price.amount_minor_units * dishModalQty)}`
                  : `Add to order · ${formatMoney(selectedDish.price.amount_minor_units * dishModalQty)}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Dining Search Concierge Drawer */}
      <AIMenuSearchDrawer
        isOpen={isAiDrawerOpen}
        onClose={() => dispatch(setAiDrawerOpen(false))}
        restaurantId={restaurantId}
        onSelectHighlightItem={(dish) => {
          setHighlightedDishId(dish.id);
          setSelectedDish(dish);
          setTimeout(() => setHighlightedDishId(null), 4000);
        }}
      />
    </div>
  );
}

