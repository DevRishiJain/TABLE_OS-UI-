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
  CreateExpenseRequest,
  InventorySummaryResponse,
  CreateInventoryItemRequest,
  LogStockRequest,
  SaveRecipeItemRequest,
} from "@/types/api";
import {
  MenuCategory,
  MenuItem,
  StaffUser,
  RestaurantSettings,
  PlatformFeeLedgerEntry,
  RestaurantSettlement,
  Order,
  Expense,
  ExpenseLineItem,
  InventoryItem,
  InventoryLog,
  RecipeIngredient,
  DishMargin,
  ExecutiveAnalytics,
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
        variants?: Array<{ name: string; price_minor?: number; price?: number; is_available?: boolean }>;
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

    updateStaffPassword: builder.mutation<
      { status: string; message: string },
      { staffId: string; password: string }
    >({
      query: ({ staffId, password }) => ({
        url: `/api/v1/restaurant/staff/${staffId}/password`,
        method: "PUT",
        body: { password },
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
      { table_number: string; table_token?: string; capacity: number }
    >({
      query: (body) => ({
        url: "/api/v1/restaurant/tables",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Table"],
    }),

    updateRestaurantTable: builder.mutation<
      any,
      { id: string; capacity?: number; table_number?: string; is_active?: boolean }
    >({
      query: ({ id, ...body }) => ({
        url: `/api/v1/restaurant/tables/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Table"],
    }),

    replaceMenuItemVariants: builder.mutation<
      MenuItem,
      { id: string; variants: Array<{ name: string; price_minor?: number; price?: number; is_available?: boolean }> }
    >({
      query: ({ id, variants }) => ({
        url: `/api/v1/restaurant/menu/items/${id}/variants`,
        method: "PUT",
        body: { variants },
      }),
      invalidatesTags: ["MenuItem"],
    }),

    getRestaurantOrders: builder.query<
      Order[],
      { restaurantId?: string; limit?: number; startDate?: string; endDate?: string } | void
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.restaurantId) queryParams.set("restaurant_id", params.restaurantId);
        if (params?.limit) queryParams.set("limit", String(params.limit));
        if (params?.startDate) queryParams.set("start_date", params.startDate);
        if (params?.endDate) queryParams.set("end_date", params.endDate);
        const qs = queryParams.toString();
        return `/api/v1/restaurant/orders${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["Analytics", "Session"],
    }),

    onboardRestaurant: builder.mutation<any, any>({
      query: (body) => ({
        url: "/api/v1/public/onboard",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Onboarding", "Tenant", "Table", "MenuItem", "MenuCategory", "Staff"],
    }),

    // Executive Unified Analytics & P&L Dashboard
    getExecutiveDashboardAnalytics: builder.query<
      ExecutiveAnalytics,
      { restaurantId?: string; startDate?: string; endDate?: string } | void
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.restaurantId) queryParams.set("restaurant_id", params.restaurantId);
        if (params?.startDate) queryParams.set("start_date", params.startDate);
        if (params?.endDate) queryParams.set("end_date", params.endDate);
        const qs = queryParams.toString();
        return `/api/v1/restaurant/analytics/dashboard${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["Analytics", "Expense", "Inventory"],
    }),

    // Expense Management
    getExpenses: builder.query<
      Expense[],
      { restaurantId?: string; type?: string; category?: string; startDate?: string; endDate?: string } | void
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.restaurantId) queryParams.set("restaurant_id", params.restaurantId);
        if (params?.type) queryParams.set("type", params.type);
        if (params?.category) queryParams.set("category", params.category);
        if (params?.startDate) queryParams.set("start_date", params.startDate);
        if (params?.endDate) queryParams.set("end_date", params.endDate);
        const qs = queryParams.toString();
        return `/api/v1/restaurant/expenses${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["Expense"],
    }),

    createExpense: builder.mutation<Expense, CreateExpenseRequest & { restaurantId?: string }>({
      query: ({ restaurantId, ...body }) => ({
        url: `/api/v1/restaurant/expenses${restaurantId ? `?restaurant_id=${restaurantId}` : ""}`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Expense", "Analytics", "Inventory"],
    }),

    getExpenseLineItems: builder.query<ExpenseLineItem[], { id: string; restaurantId?: string }>({
      query: ({ id, restaurantId }) =>
        `/api/v1/restaurant/expenses/${id}/items${restaurantId ? `?restaurant_id=${restaurantId}` : ""}`,
      providesTags: ["Expense"],
    }),

    deleteExpense: builder.mutation<{ status: string }, { id: string; restaurantId?: string }>({
      query: ({ id, restaurantId }) => ({
        url: `/api/v1/restaurant/expenses/${id}${restaurantId ? `?restaurant_id=${restaurantId}` : ""}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Expense", "Analytics", "Inventory"],
    }),

    // Inventory & Stock Management
    getInventory: builder.query<InventorySummaryResponse, { restaurantId?: string } | void>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.restaurantId) queryParams.set("restaurant_id", params.restaurantId);
        const qs = queryParams.toString();
        return `/api/v1/restaurant/inventory${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["Inventory"],
    }),

    createInventoryItem: builder.mutation<InventoryItem, CreateInventoryItemRequest & { restaurantId?: string }>({
      query: ({ restaurantId, ...body }) => ({
        url: `/api/v1/restaurant/inventory${restaurantId ? `?restaurant_id=${restaurantId}` : ""}`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Inventory", "Recipe"],
    }),

    updateInventoryItem: builder.mutation<
      InventoryItem,
      { id: string; restaurantId?: string } & Partial<CreateInventoryItemRequest>
    >({
      query: ({ id, restaurantId, ...body }) => ({
        url: `/api/v1/restaurant/inventory/${id}${restaurantId ? `?restaurant_id=${restaurantId}` : ""}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Inventory", "Recipe"],
    }),

    deleteInventoryItem: builder.mutation<{ status: string }, { id: string; restaurantId?: string }>({
      query: ({ id, restaurantId }) => ({
        url: `/api/v1/restaurant/inventory/${id}${restaurantId ? `?restaurant_id=${restaurantId}` : ""}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Inventory", "Recipe"],
    }),

    logStockMovement: builder.mutation<InventoryLog, { itemId: string; restaurantId?: string } & LogStockRequest>({
      query: ({ itemId, restaurantId, ...body }) => ({
        url: `/api/v1/restaurant/inventory/${itemId}/stock${restaurantId ? `?restaurant_id=${restaurantId}` : ""}`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Inventory", "Analytics", "Expense"],
    }),

    getInventoryLogs: builder.query<
      InventoryLog[],
      { restaurantId?: string; inventoryItemId?: string; limit?: number } | void
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.restaurantId) queryParams.set("restaurant_id", params.restaurantId);
        if (params?.inventoryItemId) queryParams.set("inventory_item_id", params.inventoryItemId);
        if (params?.limit) queryParams.set("limit", String(params.limit));
        const qs = queryParams.toString();
        return `/api/v1/restaurant/inventory/logs${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["Inventory"],
    }),

    // Recipe Costing & Dish Margins
    getRecipe: builder.query<RecipeIngredient[], { menuItemId: string; restaurantId?: string }>({
      query: ({ menuItemId, restaurantId }) =>
        `/api/v1/restaurant/recipes/${menuItemId}${restaurantId ? `?restaurant_id=${restaurantId}` : ""}`,
      providesTags: ["Recipe"],
    }),

    saveRecipe: builder.mutation<
      RecipeIngredient[],
      { menuItemId: string; restaurantId?: string; ingredients: SaveRecipeItemRequest[] }
    >({
      query: ({ menuItemId, restaurantId, ingredients }) => ({
        url: `/api/v1/restaurant/recipes/${menuItemId}${restaurantId ? `?restaurant_id=${restaurantId}` : ""}`,
        method: "POST",
        body: ingredients,
      }),
      invalidatesTags: ["Recipe", "Analytics"],
    }),

    getDishMargins: builder.query<DishMargin[], { restaurantId?: string } | void>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.restaurantId) queryParams.set("restaurant_id", params.restaurantId);
        const qs = queryParams.toString();
        return `/api/v1/restaurant/recipes/margins${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["Recipe", "MenuItem"],
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
  useUpdateStaffPasswordMutation,
  useGetRestaurantSettingsQuery,
  useUpdateRestaurantSettingsMutation,
  useGetPlatformFeeLedgerQuery,
  useGetSettlementsQuery,
  useGetOnboardingQuery,
  useGoLiveOnboardingMutation,
  useGetRestaurantTablesQuery,
  useCreateRestaurantTableMutation,
  useUpdateRestaurantTableMutation,
  useReplaceMenuItemVariantsMutation,
  useGetRestaurantOrdersQuery,
  useOnboardRestaurantMutation,
  useGetExecutiveDashboardAnalyticsQuery,
  useGetExpensesQuery,
  useGetExpenseLineItemsQuery,
  useCreateExpenseMutation,
  useDeleteExpenseMutation,
  useGetInventoryQuery,
  useCreateInventoryItemMutation,
  useUpdateInventoryItemMutation,
  useDeleteInventoryItemMutation,
  useLogStockMovementMutation,
  useGetInventoryLogsQuery,
  useGetRecipeQuery,
  useSaveRecipeMutation,
  useGetDishMarginsQuery,
} = restaurantApi;

