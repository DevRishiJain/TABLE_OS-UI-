import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title?: string;
  message: string;
  durationMs?: number;
}

interface UiState {
  isAiDrawerOpen: boolean;
  activeDishModalId: string | null;
  toasts: ToastMessage[];
}

const initialState: UiState = {
  isAiDrawerOpen: false,
  activeDishModalId: null,
  toasts: [],
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setAiDrawerOpen(state, action: PayloadAction<boolean>) {
      state.isAiDrawerOpen = action.payload;
    },
    setActiveDishModalId(state, action: PayloadAction<string | null>) {
      state.activeDishModalId = action.payload;
    },
    addToast(state, action: PayloadAction<Omit<ToastMessage, "id"> & { id?: string }>) {
      const id = action.payload.id || Math.random().toString(36).substring(2, 9);
      state.toasts.push({ ...action.payload, id });
    },
    removeToast(state, action: PayloadAction<string>) {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
  },
});

export const { setAiDrawerOpen, setActiveDishModalId, addToast, removeToast } =
  uiSlice.actions;

export default uiSlice.reducer;
