import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { MenuItem } from "@/types/domain";

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  specialInstructions?: string;
}

interface CartState {
  items: Record<string, CartItem>; // keyed by menuItem.id
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
        quantity?: number;
        specialInstructions?: string;
      }>
    ) {
      const { menuItem, quantity = 1, specialInstructions } = action.payload;
      const existing = state.items[menuItem.id];
      if (existing) {
        existing.quantity += quantity;
        if (specialInstructions !== undefined) {
          existing.specialInstructions = specialInstructions;
        }
      } else {
        state.items[menuItem.id] = {
          menuItem,
          quantity,
          specialInstructions,
        };
      }
      saveCartToStorage(state.items);
    },
    updateQuantity(
      state,
      action: PayloadAction<{ menuItemId: string; quantity: number }>
    ) {
      const { menuItemId, quantity } = action.payload;
      if (quantity <= 0) {
        delete state.items[menuItemId];
      } else if (state.items[menuItemId]) {
        state.items[menuItemId].quantity = quantity;
      }
      saveCartToStorage(state.items);
    },
    updateInstructions(
      state,
      action: PayloadAction<{ menuItemId: string; instructions: string }>
    ) {
      const { menuItemId, instructions } = action.payload;
      if (state.items[menuItemId]) {
        state.items[menuItemId].specialInstructions = instructions;
      }
      saveCartToStorage(state.items);
    },
    removeItem(state, action: PayloadAction<string>) {
      delete state.items[action.payload];
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

export const selectCartSubtotalMinor = (state: { cart: CartState }) =>
  Object.values(state.cart.items).reduce(
    (acc, item) => acc + item.menuItem.price.amount_minor_units * item.quantity,
    0
  );

export default cartSlice.reducer;
