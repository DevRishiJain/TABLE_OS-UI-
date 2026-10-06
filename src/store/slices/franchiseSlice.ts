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
  franchiseName: "Spice Route Franchise",
  selectedOutletId: "ALL",
  outlets: [
    {
      id: "b1000000-0000-0000-0000-000000000001",
      name: "The Spice Route - Connaught Place",
      slug: "spiceroute-cp",
      status: "ACTIVE",
      days_remaining: 28,
      is_active: true,
    },
    {
      id: "b1000000-0000-0000-0000-000000000002",
      name: "The Spice Route - Cyber Hub",
      slug: "spiceroute-cyberhub",
      status: "ACTIVE",
      days_remaining: 24,
      is_active: true,
    },
    {
      id: "b1000000-0000-0000-0000-000000000003",
      name: "The Spice Route - Indiranagar",
      slug: "spiceroute-indiranagar",
      status: "ACTIVE",
      days_remaining: 19,
      is_active: true,
    },
    {
      id: "b1000000-0000-0000-0000-000000000004",
      name: "The Spice Route - BKC Mumbai",
      slug: "spiceroute-bkc",
      status: "ACTIVE",
      days_remaining: 30,
      is_active: true,
    },
  ],
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
