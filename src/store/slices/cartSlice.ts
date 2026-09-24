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

const initialState: CartState = {
  items: {},
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
    },
    updateInstructions(
      state,
      action: PayloadAction<{ menuItemId: string; instructions: string }>
    ) {
      const { menuItemId, instructions } = action.payload;
      if (state.items[menuItemId]) {
        state.items[menuItemId].specialInstructions = instructions;
      }
    },
    removeItem(state, action: PayloadAction<string>) {
      delete state.items[action.payload];
    },
    clearCart(state) {
      state.items = {};
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
