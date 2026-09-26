import { baseApi } from "./baseApi";
import {
  TodayAnalytics,
  MonthToDateAnalytics,
  PeriodComparison,
  PeakHoursMatrix,
  SalesForecast,
  TablePerformance,
  MenuPerformance,
  AICatalogResponse,
  OnboardingStatus,
} from "@/types/api";
import {
  MenuCategory,
  MenuItem,
  StaffUser,
  RestaurantSettings,
  PlatformFeeLedgerEntry,
  RestaurantSettlement,
} from "@/types/domain";

export const restaurantApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRestaurantOverview: builder.query<Record<string, unknown>, void>({
      query: () => "/api/v1/restaurant/dashboard/overview",
      providesTags: ["Analytics", "Session", "Table"],
    }),

    getTodayAnalytics: builder.query<TodayAnalytics, void>({
      query: () => "/api/v1/restaurant/analytics/today",
      providesTags: ["Analytics"],
    }),

    getMonthToDateAnalytics: builder.query<MonthToDateAnalytics, void>({
      query: () => "/api/v1/restaurant/analytics/month-to-date",
      providesTags: ["Analytics"],
    }),

    getPeriodComparison: builder.query<PeriodComparison, void>({
      query: () => "/api/v1/restaurant/analytics/compare",
      providesTags: ["Analytics"],
    }),

    getPeakHours: builder.query<PeakHoursMatrix, void>({
      query: () => "/api/v1/restaurant/analytics/peak-hours",
      providesTags: ["Analytics"],
    }),

    getSalesForecast: builder.query<SalesForecast, void>({
      query: () => "/api/v1/restaurant/analytics/forecast",
      providesTags: ["Analytics"],
    }),

    getTablePerformance: builder.query<TablePerformance, void>({
      query: () => "/api/v1/restaurant/analytics/table-performance",
      providesTags: ["Analytics", "Table"],
    }),

    getMenuPerformance: builder.query<MenuPerformance, void>({
      query: () => "/api/v1/restaurant/analytics/menu-performance",
      providesTags: ["Analytics", "MenuItem"],
    }),

    getMenuCategories: builder.query<MenuCategory[], void>({
      query: () => "/api/v1/restaurant/menu/categories",
      providesTags: ["MenuCategory"],
    }),

    createMenuCategory: builder.mutation<
      MenuCategory,
      { name: string; display_order?: number }
    >({
      query: (body) => ({
        url: "/api/v1/restaurant/menu/categories",
        method: "POST",
        body,
      }),
      invalidatesTags: ["MenuCategory"],
    }),

    getMenuItems: builder.query<MenuItem[], void>({
      query: () => "/api/v1/restaurant/menu/items",
      providesTags: ["MenuItem"],
    }),

    createMenuItem: builder.mutation<
      MenuItem,
      {
        category_id: string;
        name: string;
        description?: string;
        price?: number;
        price_minor?: number;
        cgst_rate_bps?: number;
        sgst_rate_bps?: number;
      }
    >({
      query: (body) => ({
        url: "/api/v1/restaurant/menu/items",
        method: "POST",
        body: {
          ...body,
          price_minor: body.price_minor || body.price || 0,
          price: body.price || body.price_minor || 0,
        },
      }),
      invalidatesTags: ["MenuItem"],
    }),

    uploadAiMenuCatalog: builder.mutation<AICatalogResponse, FormData>({
      query: (formData) => ({
        url: "/api/v1/restaurant/menu/ai-catalog",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["MenuCategory", "MenuItem"],
    }),

    getStaffRoster: builder.query<StaffUser[], void>({
      query: () => "/api/v1/restaurant/staff",
      providesTags: ["Staff"],
    }),

    createStaffMember: builder.mutation<
      StaffUser,
      {
        name: string;
        phone: string;
        email: string;
        password: string;
        role: string;
      }
    >({
      query: (body) => ({
        url: "/api/v1/restaurant/staff",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Staff"],
    }),

    getRestaurantSettings: builder.query<RestaurantSettings, void>({
      query: () => "/api/v1/restaurant/settings",
      providesTags: ["Onboarding"],
    }),

    updateRestaurantSettings: builder.mutation<
      RestaurantSettings,
      Partial<RestaurantSettings>
    >({
      query: (body) => ({
        url: "/api/v1/restaurant/settings",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Onboarding"],
    }),

    getPlatformFeeLedger: builder.query<PlatformFeeLedgerEntry[], void>({
      query: () => "/api/v1/restaurant/ledger",
      providesTags: ["Ledger"],
    }),

    getSettlements: builder.query<RestaurantSettlement[], void>({
      query: () => "/api/v1/restaurant/settlements",
      providesTags: ["Settlement"],
    }),

    getOnboarding: builder.query<OnboardingStatus, void>({
      query: () => "/api/v1/restaurant/onboarding",
      providesTags: ["Onboarding"],
    }),

    goLiveOnboarding: builder.mutation<OnboardingStatus, void>({
      query: () => ({
        url: "/api/v1/restaurant/onboarding/go-live",
        method: "POST",
      }),
      invalidatesTags: ["Onboarding", "Tenant"],
    }),

    getRestaurantTables: builder.query<any[], void>({
      query: () => "/api/v1/restaurant/tables",
      providesTags: ["Table"],
    }),

    createRestaurantTable: builder.mutation<
      any,
      { table_number: string; table_token?: string; capacity?: number }
    >({
      query: (body) => ({
        url: "/api/v1/restaurant/tables",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Table"],
    }),

    onboardRestaurant: builder.mutation<any, any>({
      query: (body) => ({
        url: "/api/v1/public/onboard",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Onboarding", "Tenant", "Table", "MenuItem", "MenuCategory", "Staff"],
    }),
  }),
});

export const {
  useGetRestaurantOverviewQuery,
  useGetTodayAnalyticsQuery,
  useGetMonthToDateAnalyticsQuery,
  useGetPeriodComparisonQuery,
  useGetPeakHoursQuery,
  useGetSalesForecastQuery,
  useGetTablePerformanceQuery,
  useGetMenuPerformanceQuery,
  useGetMenuCategoriesQuery,
  useCreateMenuCategoryMutation,
  useGetMenuItemsQuery,
  useCreateMenuItemMutation,
  useUploadAiMenuCatalogMutation,
  useGetStaffRosterQuery,
  useCreateStaffMemberMutation,
  useGetRestaurantSettingsQuery,
  useUpdateRestaurantSettingsMutation,
  useGetPlatformFeeLedgerQuery,
  useGetSettlementsQuery,
  useGetOnboardingQuery,
  useGoLiveOnboardingMutation,
  useGetRestaurantTablesQuery,
  useCreateRestaurantTableMutation,
  useOnboardRestaurantMutation,
} = restaurantApi;
