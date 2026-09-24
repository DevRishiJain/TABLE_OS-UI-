import { baseApi } from "./baseApi";
import {
  StaffTableSummary,
  VerifyFirstOrderRequest,
  ConfirmPaymentRequest,
  ForceCloseSessionRequest,
} from "@/types/api";
import { Order, Payment, DiningSession } from "@/types/domain";
import { generateUUID } from "@/lib/idempotency";

export const staffApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getStaffTables: builder.query<StaffTableSummary[], void>({
      query: () => "/api/v1/staff/dashboard/tables",
      providesTags: ["Table", "Session"],
    }),

    verifyFirstOrder: builder.mutation<
      DiningSession,
      { sessionId: string; data: VerifyFirstOrderRequest }
    >({
      query: ({ sessionId, data }) => ({
        url: `/api/v1/staff/sessions/${sessionId}/verify-first-order`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { sessionId }) => [
        { type: "Session", id: sessionId },
        { type: "Order", id: sessionId },
        "Table",
        "KitchenQueue",
      ],
    }),

    acceptOrder: builder.mutation<Order, { orderId: string }>({
      query: ({ orderId }) => ({
        url: `/api/v1/staff/orders/${orderId}/accept`,
        method: "POST",
      }),
      invalidatesTags: (result, error, { orderId }) => [
        { type: "Order", id: orderId },
        "KitchenQueue",
        "Table",
      ],
    }),

    confirmPayment: builder.mutation<
      Payment,
      { paymentId?: string; data: ConfirmPaymentRequest; idempotencyKey?: string }
    >({
      query: ({ paymentId, data, idempotencyKey }) => {
        const url = paymentId
          ? `/api/v1/staff/payments/${paymentId}/confirm`
          : `/api/v1/staff/payments/confirm`;
        return {
          url,
          method: "POST",
          body: data,
          headers: {
            "Idempotency-Key": idempotencyKey || generateUUID(),
          },
        };
      },
      invalidatesTags: (result, error, { data }) => [
        { type: "Payment", id: data.session_id },
        { type: "Session", id: data.session_id },
        { type: "ExitPass", id: data.session_id },
        "Table",
        "Ledger",
      ],
    }),

    forceCloseSession: builder.mutation<
      DiningSession,
      { sessionId: string; data: ForceCloseSessionRequest; idempotencyKey?: string }
    >({
      query: ({ sessionId, data, idempotencyKey }) => ({
        url: `/api/v1/staff/sessions/${sessionId}/force-close`,
        method: "POST",
        body: data,
        headers: {
          "Idempotency-Key": idempotencyKey || generateUUID(),
        },
      }),
      invalidatesTags: (result, error, { sessionId }) => [
        { type: "Session", id: sessionId },
        "Table",
        "KitchenQueue",
        "FraudRisk",
      ],
    }),
  }),
});

export const {
  useGetStaffTablesQuery,
  useVerifyFirstOrderMutation,
  useAcceptOrderMutation,
  useConfirmPaymentMutation,
  useForceCloseSessionMutation,
} = staffApi;
