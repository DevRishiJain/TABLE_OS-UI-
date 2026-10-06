import { baseApi } from "./baseApi";
import {
  StartSessionRequest,
  SessionDetailResponse,
  CreateOrderRequest,
  CreateOrderResponse,
  CustomerPayRequest,
} from "@/types/api";
import { DiningSession, ExitPass, Payment, Order } from "@/types/domain";
import { generateUUID } from "@/lib/idempotency";

export const customerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    startSession: builder.mutation<DiningSession, StartSessionRequest>({
      query: (body) => ({
        url: "/api/v1/session/start",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Session"],
    }),

    getSession: builder.query<SessionDetailResponse, string>({
      query: (sessionId) => `/api/v1/session/${sessionId}`,
      providesTags: (result, error, id) => [
        { type: "Session", id },
        { type: "Order", id },
        { type: "Payment", id },
        { type: "ExitPass", id },
      ],
    }),

    placeOrder: builder.mutation<
      CreateOrderResponse,
      { sessionId: string; data: CreateOrderRequest; idempotencyKey?: string }
    >({
      query: ({ sessionId, data, idempotencyKey }) => ({
        url: `/api/v1/session/${sessionId}/orders`,
        method: "POST",
        body: data,
        headers: {
          "Idempotency-Key": idempotencyKey || generateUUID(),
        },
      }),
      invalidatesTags: (result, error, { sessionId }) => [
        { type: "Session", id: sessionId },
        { type: "Order", id: sessionId },
        "PendingOrder",
        "KitchenQueue",
        "Table",
      ],
    }),

    customerPay: builder.mutation<
      Payment,
      { sessionId: string; data: CustomerPayRequest; idempotencyKey?: string }
    >({
      query: ({ sessionId, data, idempotencyKey }) => ({
        url: `/api/v1/session/${sessionId}/pay`,
        method: "POST",
        body: data,
        headers: {
          "Idempotency-Key": idempotencyKey || generateUUID(),
        },
      }),
      invalidatesTags: (result, error, { sessionId }) => [
        { type: "Session", id: sessionId },
        { type: "Payment", id: sessionId },
        "Table",
      ],
    }),

    getExitPass: builder.query<ExitPass, string>({
      query: (sessionId) => `/api/v1/session/${sessionId}/exit-pass`,
      providesTags: (result, error, id) => [{ type: "ExitPass", id }],
    }),

    requestAssistance: builder.mutation<
      { status: string; assistance_reason?: string },
      { sessionId: string; reason: string }
    >({
      query: ({ sessionId, reason }) => ({
        url: `/api/v1/session/${sessionId}/assistance`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: (result, error, { sessionId }) => [
        { type: "Session", id: sessionId },
        "Table",
      ],
    }),

    dismissAssistance: builder.mutation<
      { status: string },
      { sessionId: string }
    >({
      query: ({ sessionId }) => ({
        url: `/api/v1/session/${sessionId}/assistance/dismiss`,
        method: "POST",
      }),
      invalidatesTags: (result, error, { sessionId }) => [
        { type: "Session", id: sessionId },
        "Table",
      ],
    }),

    cancelOrder: builder.mutation<
      Order,
      { sessionId: string; orderId: string; reason?: string }
    >({
      query: ({ sessionId, orderId, reason }) => ({
        url: `/api/v1/session/${sessionId}/orders/${orderId}/cancel`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: (result, error, { sessionId }) => [
        { type: "Session", id: sessionId },
        "Table",
      ],
    }),
  }),
});

export const {
  useStartSessionMutation,
  useGetSessionQuery,
  usePlaceOrderMutation,
  useCustomerPayMutation,
  useGetExitPassQuery,
  useRequestAssistanceMutation,
  useDismissAssistanceMutation,
  useCancelOrderMutation,
} = customerApi;
