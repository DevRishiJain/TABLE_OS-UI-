import { baseApi } from "./baseApi";
import { AIQueryRequest, AIQueryResponse, AICatalogResponse } from "@/types/api";
import { MenuItem, MenuCategory } from "@/types/domain";

export const publicApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getHealth: builder.query<{ status: string; service: string; version: string }, void>({
      query: () => "/healthz",
    }),

    aiMenuQuery: builder.mutation<AIQueryResponse, AIQueryRequest>({
      query: (body) => ({
        url: "/api/v1/public/menu/ai-query",
        method: "POST",
        body,
      }),
    }),

    uploadPublicAiMenuCatalog: builder.mutation<AICatalogResponse, FormData>({
      query: (formData) => ({
        url: "/api/v1/public/menu/ai-catalog",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["MenuItem", "MenuCategory"],
    }),

    getPublicMenuCategories: builder.query<MenuCategory[], { restaurantId?: string }>({
      query: ({ restaurantId }) => {
        const queryParam = restaurantId ? `?restaurant_id=${restaurantId}` : "";
        return `/api/v1/restaurant/menu/categories${queryParam}`;
      },
      providesTags: ["MenuCategory"],
    }),

    getPublicMenuItems: builder.query<MenuItem[], { restaurantId?: string }>({
      query: ({ restaurantId }) => {
        const queryParam = restaurantId ? `?restaurant_id=${restaurantId}` : "";
        return `/api/v1/restaurant/menu/items${queryParam}`;
      },
      providesTags: ["MenuItem"],
    }),

    lookupRestaurant: builder.query<{
      id: string;
      name: string;
      slug: string;
      venue_type: string;
      status: string;
    }, string>({
      query: (identifier) => `/api/v1/public/restaurant/${identifier}`,
    }),

    checkHandleAvailability: builder.query<{
      handle: string;
      available: boolean;
      exists: boolean;
      message?: string;
      restaurant?: {
        id: string;
        name: string;
        slug: string;
        venue_type?: string;
        status?: string;
      };
    }, string>({
      query: (handle) => `/api/v1/public/restaurant/check-handle?handle=${encodeURIComponent(handle)}`,
    }),
  }),
});

export const {
  useGetHealthQuery,
  useAiMenuQueryMutation,
  useUploadPublicAiMenuCatalogMutation,
  useGetPublicMenuCategoriesQuery,
  useGetPublicMenuItemsQuery,
  useLookupRestaurantQuery,
  useLazyLookupRestaurantQuery,
  useCheckHandleAvailabilityQuery,
  useLazyCheckHandleAvailabilityQuery,
} = publicApi;
