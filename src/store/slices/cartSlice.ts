import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { MenuItem, MenuItemVariant } from "@/types/domain";

export interface CartItem {
  menuItem: MenuItem;
  variant?: MenuItemVariant;
  quantity: number;
  specialInstructions?: string;
}

export const cartKeyFor = (menuItemId: string, variantId?: string) =>
  variantId ? `${menuItemId}:${variantId}` : menuItemId;

interface CartState {
  items: Record<string, CartItem>; // keyed by menuItem.id or menuItem.id:variantId
}

const loadInitialCart = (): Record<string, CartItem> => {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem("tableos_cart");
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore parsing failure
  }
  return {};
};

const saveCartToStorage = (items: Record<string, CartItem>) => {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("tableos_cart", JSON.stringify(items));
    } catch {
      // ignore storage failure
    }
  }
};

const initialState: CartState = {
  items: loadInitialCart(),
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addItem(
      state,
      action: PayloadAction<{
        menuItem: MenuItem;
        variant?: MenuItemVariant;
        quantity?: number;
        specialInstructions?: string;
      }>
    ) {
      const { menuItem, variant, quantity = 1, specialInstructions } = action.payload;
      const key = cartKeyFor(menuItem.id, variant?.id);
      const existing = state.items[key];
      if (existing) {
        existing.quantity += quantity;
        if (specialInstructions !== undefined) {
          existing.specialInstructions = specialInstructions;
        }
      } else {
        state.items[key] = {
          menuItem,
          variant,
          quantity,
          specialInstructions,
        };
      }
      saveCartToStorage(state.items);
    },
    updateQuantity(
      state,
      action: PayloadAction<{ menuItemId: string; variantId?: string; quantity: number }>
    ) {
      const key = cartKeyFor(action.payload.menuItemId, action.payload.variantId);
      const quantity = action.payload.quantity;
      if (quantity <= 0) {
        delete state.items[key];
      } else if (state.items[key]) {
        state.items[key].quantity = quantity;
      }
      saveCartToStorage(state.items);
    },
    updateInstructions(
      state,
      action: PayloadAction<{ menuItemId: string; variantId?: string; instructions: string }>
    ) {
      const key = cartKeyFor(action.payload.menuItemId, action.payload.variantId);
      if (state.items[key]) {
        state.items[key].specialInstructions = action.payload.instructions;
      }
      saveCartToStorage(state.items);
    },
    removeItem(state, action: PayloadAction<{ menuItemId: string; variantId?: string } | string>) {
      const key =
        typeof action.payload === "string"
          ? action.payload
          : cartKeyFor(action.payload.menuItemId, action.payload.variantId);
      delete state.items[key];
      saveCartToStorage(state.items);
    },
    clearCart(state) {
      state.items = {};
      saveCartToStorage(state.items);
    },
  },
});

export const {
  addItem,
  updateQuantity,
  updateInstructions,
  removeItem,
  clearCart,
} = cartSlice.actions;

// Selectors
export const selectCartItemsList = (state: { cart: CartState }) =>
  Object.values(state.cart.items);

export const selectCartTotalCount = (state: { cart: CartState }) =>
  Object.values(state.cart.items).reduce((acc, item) => acc + item.quantity, 0);

export const cartItemUnitPriceMinor = (item: CartItem) =>
  item.variant?.price?.amount_minor_units ??
  item.menuItem.price.amount_minor_units;

export const cartItemDisplayName = (item: CartItem) =>
  item.variant ? `${item.menuItem.name} (${item.variant.name})` : item.menuItem.name;

export const selectCartSubtotalMinor = (state: { cart: CartState }) =>
  Object.values(state.cart.items).reduce(
    (acc, item) => acc + cartItemUnitPriceMinor(item) * item.quantity,
    0
  );

export default cartSlice.reducer;
