import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { clearCustomerSession, logoutGuard, logoutStaff } from "../slices/authSlice";

// In the browser, use same-origin relative URL ("") so requests are transparently
// proxied by Next.js rewrites, completely bypassing browser CORS restrictions.
const API_BASE_URL =
  typeof window !== "undefined"
    ? ""
    : process.env.NEXT_PUBLIC_API_BASE_URL || "http://54.146.192.20:8088";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
    prepareHeaders: (headers, { getState, endpoint }) => {
      // Access state
      const state = getState() as {
        auth: {
          sessionToken: string | null;
          staffToken: string | null;
          guardToken: string | null;
        };
      };

      // Customer Session Token
      const sessionToken =
        state.auth?.sessionToken ||
        (typeof window !== "undefined"
          ? localStorage.getItem("tableos_session_token")
          : null);

      if (sessionToken) {
        headers.set("X-Session-Token", sessionToken);
      }

      // Guard Token priority for guard endpoints
      if (endpoint.toLowerCase().includes("guard")) {
        const guardToken =
          state.auth?.guardToken ||
          (typeof window !== "undefined"
            ? localStorage.getItem("tableos_guard_token")
            : null);
        if (guardToken) {
          headers.set("Authorization", `Bearer ${guardToken}`);
          return headers;
        }
      }

      // Staff / Admin Token
      const staffToken =
        state.auth?.staffToken ||
        (typeof window !== "undefined"
          ? localStorage.getItem("tableos_staff_token")
          : null);

      if (staffToken && !headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${staffToken}`);
      }

      return headers;
    },
  });

export const baseApi = createApi({
  reducerPath: "api",
  refetchOnFocus: false,
  refetchOnReconnect: false,
  refetchOnMountOrArgChange: false,
  baseQuery: async (args, api, extraOptions) => {
    const result = await rawBaseQuery(args, api, extraOptions);
    if (
      result.error?.status === 401 &&
      typeof window !== "undefined" &&
      !/login|signup|forgot/i.test(api.endpoint)
    ) {
      const auth = (api.getState() as { auth?: { staffToken?: string | null; guardToken?: string | null; sessionToken?: string | null } }).auth;
      if (auth?.staffToken || localStorage.getItem("tableos_staff_token")) {
        api.dispatch(logoutStaff());
      }
      if (auth?.guardToken || localStorage.getItem("tableos_guard_token")) {
        api.dispatch(logoutGuard());
      }
      if (auth?.sessionToken || localStorage.getItem("tableos_session_token")) {
        api.dispatch(clearCustomerSession());
      }
    }
    return result;
  },
  tagTypes: [
    "Session",
    "Order",
    "PendingOrder",
    "Payment",
    "ExitPass",
    "Table",
    "MenuItem",
    "MenuCategory",
    "KitchenQueue",
    "Staff",
    "Analytics",
    "Ledger",
    "Settlement",
    "Onboarding",
    "Tenant",
    "FraudRisk",
    "Expense",
    "Inventory",
    "Recipe",
    "Subscription",
    "Franchise",
  ],
  endpoints: () => ({}),
});
