import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface FranchiseOutlet {
  id: string;
  name: string;
  slug?: string;
  status: string;
  subscription_plan?: string;
  subscription_status?: string;
  days_remaining?: number;
  is_active?: boolean;
}

export interface FranchiseState {
  franchiseName: string;
  selectedOutletId: string; // 'ALL' or specific restaurant ID
  outlets: FranchiseOutlet[];
  isLoading: boolean;
  error: string | null;
}

const initialState: FranchiseState = {
  franchiseName: "",
  selectedOutletId: "ALL",
  outlets: [],
  isLoading: false,
  error: null,
};

export const franchiseSlice = createSlice({
  name: "franchise",
  initialState,
  reducers: {
    setSelectedOutlet: (state, action: PayloadAction<string>) => {
      state.selectedOutletId = action.payload;
    },
    setFranchiseOutlets: (state, action: PayloadAction<FranchiseOutlet[]>) => {
      state.outlets = action.payload;
    },
    addFranchiseOutlet: (state, action: PayloadAction<FranchiseOutlet>) => {
      state.outlets.push(action.payload);
    },
  },
});

export const { setSelectedOutlet, setFranchiseOutlets, addFranchiseOutlet } = franchiseSlice.actions;
export default franchiseSlice.reducer;
