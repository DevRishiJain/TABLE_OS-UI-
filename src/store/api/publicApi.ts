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
  }),
});

export const {
  useGetHealthQuery,
  useAiMenuQueryMutation,
  useUploadPublicAiMenuCatalogMutation,
  useGetPublicMenuCategoriesQuery,
  useGetPublicMenuItemsQuery,
} = publicApi;
