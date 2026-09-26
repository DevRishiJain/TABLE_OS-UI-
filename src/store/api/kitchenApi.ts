import { baseApi } from "./baseApi";
import { KitchenOrderQueueItem, UpdateKitchenStatusRequest } from "@/types/api";
import { Order } from "@/types/domain";

export const kitchenApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getKitchenQueue: builder.query<KitchenOrderQueueItem[], string | void>({
      query: (restaurantId) =>
        restaurantId
          ? `/api/v1/kitchen/orders/queue?restaurant_id=${restaurantId}`
          : "/api/v1/kitchen/orders/queue",
      providesTags: ["KitchenQueue"],
    }),

    updateKitchenStatus: builder.mutation<
      Order,
      { orderId: string; data: UpdateKitchenStatusRequest }
    >({
      query: ({ orderId, data }) => ({
        url: `/api/v1/kitchen/orders/${orderId}/status`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["KitchenQueue", "Order", "Session"],
    }),
  }),
});

export const { useGetKitchenQueueQuery, useUpdateKitchenStatusMutation } =
  kitchenApi;
