import { baseApi } from "./baseApi";
import { Restaurant } from "@/types/domain";
import {
  AdminOverview,
  AdminRestaurantEntry,
  AdminFranchise,
  AdminActivityFeedItem,
  AdminRestaurantActivity,
  SubscriptionOTPInfo,
  SubscriptionOTPResponse,
} from "@/types/api";

export interface PlatformAnalytics {
  total_restaurants?: number;
  active_restaurants?: number;
  total_network_gmv_minor?: number;
  total_platform_fees_minor?: number;
  platform_gross_sales?: number;
  platform_fee_revenue?: number;
  active_tenants_count?: number;
  total_sessions_count?: number;
  currency?: string;
  [key: string]: any;
}

export interface FraudRiskItem {
  session_id?: string;
  restaurant_id: string;
  restaurant_name?: string;
  flag_type?: string;
  flag_reason?: string;
  description?: string;
  risk_score?: number;
  amount_minor?: number;
  created_at?: string;
}

export interface TableQRExportItem {
  table_id: string;
  table_number: string;
  table_token: string;
  qr_url: string;
}

export const adminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminOverview: builder.query<AdminOverview, void>({
      query: () => "/api/v1/admin/overview",
      providesTags: ["Tenant", "Analytics"],
    }),

    getAdminRestaurants: builder.query<
      AdminRestaurantEntry[],
      { type?: "FRANCHISE" | "SINGLE"; q?: string } | void
    >({
      query: (params) => {
        const qp = new URLSearchParams();
        if (params?.type) qp.set("type", params.type);
        if (params?.q) qp.set("q", params.q);
        const qs = qp.toString();
        return `/api/v1/admin/restaurants${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["Tenant"],
    }),

    getAdminFranchises: builder.query<AdminFranchise[], void>({
      query: () => "/api/v1/admin/franchises",
      providesTags: ["Tenant"],
    }),

    getAdminRestaurantActivity: builder.query<AdminRestaurantActivity, string>({
      query: (id) => `/api/v1/admin/restaurants/${id}/activity`,
      providesTags: (result, error, id) => [{ type: "Tenant", id }],
    }),

    getAdminActivityFeed: builder.query<AdminActivityFeedItem[], { limit?: number } | void>({
      query: (params) =>
        `/api/v1/admin/activity/feed${params?.limit ? `?limit=${params.limit}` : ""}`,
      providesTags: ["Analytics"],
    }),

    generateSubscriptionOtp: builder.mutation<
      SubscriptionOTPResponse,
      { restaurantId: string; days: number; plan?: string }
    >({
      query: ({ restaurantId, days, plan }) => ({
        url: `/api/v1/admin/restaurants/${restaurantId}/subscription-otp`,
        method: "POST",
        body: { days, plan },
      }),
      invalidatesTags: (result, error, { restaurantId }) => [
        { type: "Tenant", id: restaurantId },
      ],
    }),

    getSubscriptionOtps: builder.query<SubscriptionOTPInfo[], string>({
      query: (restaurantId) =>
        `/api/v1/admin/restaurants/${restaurantId}/subscription-otps`,
      providesTags: (result, error, restaurantId) => [
        { type: "Tenant", id: restaurantId },
      ],
    }),

    getAdminRestaurantDetail: builder.query<Restaurant, string>({
      query: (id) => `/api/v1/admin/restaurants/${id}`,
      providesTags: (result, error, id) => [{ type: "Tenant", id }],
    }),

    getPlatformAnalytics: builder.query<PlatformAnalytics, void>({
      query: () => "/api/v1/admin/analytics/platform",
      providesTags: ["Analytics"],
    }),

    getFraudReviewQueue: builder.query<FraudRiskItem[], void>({
      query: () => "/api/v1/admin/fraud-review",
      providesTags: ["FraudRisk"],
    }),

    overrideCommissionRate: builder.mutation<
      Restaurant,
      { restaurantId: string; new_rate_bps: number; reason?: string }
    >({
      query: ({ restaurantId, new_rate_bps, reason }) => ({
        url: `/api/v1/admin/restaurants/${restaurantId}/commission-rate`,
        method: "POST",
        body: { new_rate_bps, reason },
      }),
      invalidatesTags: (result, error, { restaurantId }) => [
        { type: "Tenant", id: restaurantId },
        "Tenant",
      ],
    }),

    suspendRestaurant: builder.mutation<
      Restaurant,
      { restaurantId: string; reason: string }
    >({
      query: ({ restaurantId, reason }) => ({
        url: `/api/v1/admin/restaurants/${restaurantId}/suspend`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: (result, error, { restaurantId }) => [
        { type: "Tenant", id: restaurantId },
        "Tenant",
      ],
    }),

    reactivateRestaurant: builder.mutation<Restaurant, { restaurantId: string }>({
      query: ({ restaurantId }) => ({
        url: `/api/v1/admin/restaurants/${restaurantId}/reactivate`,
        method: "POST",
      }),
      invalidatesTags: (result, error, { restaurantId }) => [
        { type: "Tenant", id: restaurantId },
        "Tenant",
      ],
    }),

    exportTableQRs: builder.query<TableQRExportItem[], string>({
      query: (restaurantId) => `/api/v1/admin/restaurants/${restaurantId}/tables/qr-export`,
    }),

    adminExtendSubscription: builder.mutation<
      Restaurant,
      { restaurantId: string; days: number; plan?: string }
    >({
      query: ({ restaurantId, days, plan }) => ({
        url: `/api/v1/admin/restaurants/${restaurantId}/extend-subscription`,
        method: "POST",
        body: { days, plan },
      }),
      invalidatesTags: (result, error, { restaurantId }) => [
        { type: "Tenant", id: restaurantId },
        "Tenant",
      ],
    }),
  }),
});

export const {
  useGetAdminOverviewQuery,
  useGetAdminRestaurantsQuery,
  useGetAdminFranchisesQuery,
  useGetAdminRestaurantActivityQuery,
  useGetAdminActivityFeedQuery,
  useGenerateSubscriptionOtpMutation,
  useGetSubscriptionOtpsQuery,
  useGetAdminRestaurantDetailQuery,
  useGetPlatformAnalyticsQuery,
  useGetFraudReviewQueueQuery,
  useOverrideCommissionRateMutation,
  useSuspendRestaurantMutation,
  useReactivateRestaurantMutation,
  useExportTableQRsQuery,
  useAdminExtendSubscriptionMutation,
} = adminApi;
