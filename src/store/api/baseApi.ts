import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// In the browser, use same-origin relative URL ("") so requests are transparently
// proxied by Next.js rewrites, completely bypassing browser CORS restrictions.
const API_BASE_URL =
  typeof window !== "undefined"
    ? ""
    : process.env.NEXT_PUBLIC_API_BASE_URL || "http://54.146.192.20:8088";

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
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
  }),
  tagTypes: [
    "Session",
    "Order",
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
  ],
  endpoints: () => ({}),
});
