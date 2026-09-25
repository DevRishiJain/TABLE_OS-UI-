import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { StaffRole } from "@/types/enums";

interface AuthState {
  staffToken: string | null;
  guardToken: string | null;
  staffRole: StaffRole | null;
  isPlatformAdmin: boolean;
  staffId: string | null;
  employeeId: string | null;
  restaurantId: string;
  restaurantName: string | null;
  userName: string | null;
  // Customer session state
  sessionToken: string | null;
  activeSessionId: string | null;
  customerName: string | null;
  deviceFingerprint: string | null;
}

const DEFAULT_RESTAURANT_ID =
  process.env.NEXT_PUBLIC_DEFAULT_RESTAURANT_ID || "b1000000-0000-0000-0000-000000000001";

// Safely load from localStorage if available in browser
function getInitialState(): AuthState {
  if (typeof window === "undefined") {
    return {
      staffToken: null,
      guardToken: null,
      staffRole: null,
      isPlatformAdmin: false,
      staffId: null,
      employeeId: null,
      restaurantId: DEFAULT_RESTAURANT_ID,
      restaurantName: "The Spice Route",
      userName: null,
      sessionToken: null,
      activeSessionId: null,
      customerName: null,
      deviceFingerprint: null,
    };
  }

  return {
    staffToken: localStorage.getItem("tableos_staff_token"),
    guardToken: localStorage.getItem("tableos_guard_token"),
    staffRole: (localStorage.getItem("tableos_staff_role") as StaffRole) || null,
    isPlatformAdmin: localStorage.getItem("tableos_is_platform") === "true",
    staffId: localStorage.getItem("tableos_staff_id"),
    employeeId: localStorage.getItem("tableos_employee_id"),
    restaurantId: localStorage.getItem("tableos_restaurant_id") || DEFAULT_RESTAURANT_ID,
    restaurantName: localStorage.getItem("tableos_restaurant_name") || "The Spice Route",
    userName: localStorage.getItem("tableos_user_name"),
    sessionToken: localStorage.getItem("tableos_session_token"),
    activeSessionId: localStorage.getItem("tableos_session_id"),
    customerName: localStorage.getItem("tableos_customer_name"),
    deviceFingerprint: localStorage.getItem("tableos_device_fingerprint"),
  };
}

const authSlice = createSlice({
  name: "auth",
  initialState: getInitialState(),
  reducers: {
    setStaffAuth(
      state,
      action: PayloadAction<{
        token: string;
        role: StaffRole;
        isPlatformAdmin?: boolean;
        staffId: string;
        employeeId?: string;
        restaurantId?: string;
        restaurantName?: string;
        userName: string;
      }>
    ) {
      state.staffToken = action.payload.token;
      state.staffRole = action.payload.role;
      state.isPlatformAdmin = !!action.payload.isPlatformAdmin;
      state.staffId = action.payload.staffId;
      state.employeeId = action.payload.employeeId || null;
      state.restaurantId = action.payload.restaurantId || state.restaurantId;
      if (action.payload.restaurantName) state.restaurantName = action.payload.restaurantName;
      state.userName = action.payload.userName;

      if (typeof window !== "undefined") {
        localStorage.setItem("tableos_staff_token", action.payload.token);
        localStorage.setItem("tableos_staff_role", action.payload.role);
        localStorage.setItem("tableos_is_platform", String(!!action.payload.isPlatformAdmin));
        localStorage.setItem("tableos_staff_id", action.payload.staffId);
        if (action.payload.employeeId) {
          localStorage.setItem("tableos_employee_id", action.payload.employeeId);
        }
        localStorage.setItem("tableos_restaurant_id", state.restaurantId);
        if (state.restaurantName) localStorage.setItem("tableos_restaurant_name", state.restaurantName);
        localStorage.setItem("tableos_user_name", action.payload.userName);
      }
    },
    setGuardAuth(
      state,
      action: PayloadAction<{
        token: string;
        restaurantId?: string;
        restaurantName?: string;
        userName: string;
      }>
    ) {
      state.guardToken = action.payload.token;
      state.userName = action.payload.userName;
      if (action.payload.restaurantId) {
        state.restaurantId = action.payload.restaurantId;
      }
      if (typeof window !== "undefined") {
        localStorage.setItem("tableos_guard_token", action.payload.token);
        localStorage.setItem("tableos_user_name", action.payload.userName);
      }
    },
    setCustomerSession(
      state,
      action: PayloadAction<{
        sessionId: string;
        sessionToken: string;
        customerName: string;
        deviceFingerprint: string;
      }>
    ) {
      state.activeSessionId = action.payload.sessionId;
      state.sessionToken = action.payload.sessionToken;
      state.customerName = action.payload.customerName;
      state.deviceFingerprint = action.payload.deviceFingerprint;

      if (typeof window !== "undefined") {
        localStorage.setItem("tableos_session_id", action.payload.sessionId);
        localStorage.setItem("tableos_session_token", action.payload.sessionToken);
        localStorage.setItem("tableos_customer_name", action.payload.customerName);
        localStorage.setItem("tableos_device_fingerprint", action.payload.deviceFingerprint);
      }
    },
    logoutStaff(state) {
      state.staffToken = null;
      state.staffRole = null;
      state.isPlatformAdmin = false;
      state.staffId = null;
      state.employeeId = null;
      state.userName = null;
      if (typeof window !== "undefined") {
        localStorage.removeItem("tableos_staff_token");
        localStorage.removeItem("tableos_staff_role");
        localStorage.removeItem("tableos_is_platform");
        localStorage.removeItem("tableos_staff_id");
        localStorage.removeItem("tableos_employee_id");
        localStorage.removeItem("tableos_user_name");
      }
    },
    logoutGuard(state) {
      state.guardToken = null;
      if (typeof window !== "undefined") {
        localStorage.removeItem("tableos_guard_token");
      }
    },
    clearCustomerSession(state) {
      state.sessionToken = null;
      state.activeSessionId = null;
      state.customerName = null;
      if (typeof window !== "undefined") {
        localStorage.removeItem("tableos_session_token");
        localStorage.removeItem("tableos_session_id");
        localStorage.removeItem("tableos_customer_name");
      }
    },
  },
});

export const {
  setStaffAuth,
  setGuardAuth,
  setCustomerSession,
  logoutStaff,
  logoutGuard,
  clearCustomerSession,
} = authSlice.actions;

export default authSlice.reducer;
