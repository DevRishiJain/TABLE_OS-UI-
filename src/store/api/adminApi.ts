import { baseApi } from "./baseApi";
import { Restaurant } from "@/types/domain";

export interface PlatformAnalytics {
  total_network_gmv_minor: number;
  total_platform_fees_minor: number;
  active_tenants_count: number;
  total_sessions_count: number;
  currency: string;
}

export interface FraudRiskItem {
  session_id: string;
  restaurant_id: string;
  restaurant_name?: string;
  flag_reason: string;
  risk_score: number;
  amount_minor: number;
  created_at: string;
}

export interface TableQRExportItem {
  table_id: string;
  table_number: string;
  table_token: string;
  qr_url: string;
}

export const adminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminRestaurants: builder.query<Restaurant[], void>({
      query: () => "/api/v1/admin/restaurants",
      providesTags: ["Tenant"],
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
      { restaurantId: string; commission_rate_bps: number }
    >({
      query: ({ restaurantId, commission_rate_bps }) => ({
        url: `/api/v1/admin/restaurants/${restaurantId}/commission-rate`,
        method: "POST",
        body: { commission_rate_bps },
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
  }),
});

export const {
  useGetAdminRestaurantsQuery,
  useGetAdminRestaurantDetailQuery,
  useGetPlatformAnalyticsQuery,
  useGetFraudReviewQueueQuery,
  useOverrideCommissionRateMutation,
  useSuspendRestaurantMutation,
  useReactivateRestaurantMutation,
  useExportTableQRsQuery,
} = adminApi;
