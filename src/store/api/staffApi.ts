import { baseApi } from "./baseApi";
import {
  StaffTableSummary,
  VerifyFirstOrderRequest,
  ConfirmPaymentRequest,
  ForceCloseSessionRequest,
} from "@/types/api";
import { CartItem, Order, Payment, DiningSession, StaffUser } from "@/types/domain";
import { generateUUID } from "@/lib/idempotency";

export interface PendingOrderEntry {
  order: Order;
  table_number: string;
  customer_name?: string;
  customer_phone?: string;
  guest_count?: number;
  vehicle_number?: string;
}

export const staffApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getStaffTables: builder.query<StaffTableSummary[], string | void>({
      query: () => "/api/v1/staff/dashboard/tables",
      providesTags: ["Table", "Session"],
    }),

    getPendingOrders: builder.query<PendingOrderEntry[], void>({
      query: () => "/api/v1/staff/orders/pending",
      providesTags: ["PendingOrder"],
    }),

    placeStaffOrder: builder.mutation<
      { order: Order; first_order_verification_otp?: string },
      { sessionId: string; items: CartItem[] }
    >({
      query: ({ sessionId, items }) => ({
        url: `/api/v1/staff/sessions/${sessionId}/orders`,
        method: "POST",
        body: { items },
      }),
      invalidatesTags: (result, error, { sessionId }) => [
        { type: "Session", id: sessionId },
        { type: "Order", id: sessionId },
        "KitchenQueue",
        "Table",
      ],
    }),

    staffLogin: builder.mutation<
      { token: string; staff: StaffUser },
      { identifier: string; password: string; restaurant_id?: string }
    >({
      query: (body) => ({
        url: "/api/v1/staff/login",
        method: "POST",
        body,
      }),
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
        "PendingOrder",
        "KitchenQueue",
        "Table",
      ],
    }),

    cancelStaffOrder: builder.mutation<
      Order,
      { orderId: string; reason?: string }
    >({
      query: ({ orderId, reason }) => ({
        url: `/api/v1/staff/orders/${orderId}/cancel`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: (result, error, { orderId }) => [
        { type: "Order", id: orderId },
        "PendingOrder",
        "KitchenQueue",
        "Table",
        "Session",
        "Ledger",
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

    staffVerifyExit: builder.mutation<
      { result: string; reason?: string },
      { sessionId: string; otpCode: string }
    >({
      query: ({ sessionId, otpCode }) => ({
        url: `/api/v1/staff/sessions/${sessionId}/verify-exit`,
        method: "POST",
        body: { otp_code: otpCode },
      }),
      invalidatesTags: (result, error, { sessionId }) => [
        { type: "Session", id: sessionId },
        { type: "ExitPass", id: sessionId },
        "Table",
      ],
    }),

    staffDismissAssistance: builder.mutation<
      { status: string },
      { sessionId: string }
    >({
      query: ({ sessionId }) => ({
        url: `/api/v1/staff/sessions/${sessionId}/assistance/dismiss`,
        method: "POST",
      }),
      invalidatesTags: (result, error, { sessionId }) => [
        { type: "Session", id: sessionId },
        "Table",
      ],
    }),

    startStaffSession: builder.mutation<
      DiningSession,
      {
        table_id?: string;
        table_number?: string;
        table_token?: string;
        customer_name?: string;
        customer_phone?: string;
        guest_count?: number;
        vehicle_number?: string;
      }
    >({
      query: (body) => ({
        url: "/api/v1/staff/sessions/start",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Table", "Session"],
    }),

    voidPayment: builder.mutation<Payment, { paymentId: string; reason?: string }>({
      query: ({ paymentId, reason }) => ({
        url: `/api/v1/staff/payments/${paymentId}/void`,
        method: "POST",
        body: { reason: reason || "Voided by manager" },
      }),
      invalidatesTags: ["Payment", "Session", "Table", "Analytics"],
    }),

    forgotPassword: builder.mutation<
      { message: string; reset_token?: string },
      { identifier: string; restaurant_id?: string }
    >({
      query: (body) => ({
        url: "/api/v1/auth/forgot-password",
        method: "POST",
        body,
      }),
    }),

    resetPassword: builder.mutation<
      { message: string },
      { token: string; new_password: string }
    >({
      query: (body) => ({
        url: "/api/v1/auth/reset-password",
        method: "POST",
        body,
      }),
    }),

    getSubscriptionInfo: builder.query<{
      restaurant_id: string;
      restaurant_name: string;
      subscription_plan: string;
      subscription_status: string;
      subscription_end_at: string;
      days_remaining: number;
      is_active: boolean;
    }, void>({
      query: () => "/api/v1/restaurant/subscription",
      providesTags: ["Subscription" as any],
    }),

    renewSubscription: builder.mutation<
      {
        message: string;
        subscription_end_at: string;
        days_remaining: number;
        is_active: boolean;
      },
      { days?: number } | void
    >({
      query: (body) => ({
        url: "/api/v1/restaurant/subscription/renew",
        method: "POST",
        body: body || { days: 30 },
      }),
      invalidatesTags: ["Subscription" as any],
    }),

    getFranchiseOutlets: builder.query<
      Array<{
        id: string;
        name: string;
        slug: string;
        status: string;
        subscription_plan: string;
        subscription_status: string;
        subscription_end_at: string;
        days_remaining: number;
        is_active: boolean;
      }>,
      void
    >({
      query: () => "/api/v1/franchise/outlets",
    }),

    getFranchiseSummary: builder.query<{
      total_outlets: number;
      active_subscriptions: number;
      expired_subscriptions: number;
      top_performing_outlet: string;
      total_revenue_minor: number;
    }, void>({
      query: () => "/api/v1/franchise/summary",
    }),
  }),
});

export const {
  useGetStaffTablesQuery,
  useGetPendingOrdersQuery,
  usePlaceStaffOrderMutation,
  useStaffLoginMutation,
  useVerifyFirstOrderMutation,
  useAcceptOrderMutation,
  useCancelStaffOrderMutation,
  useConfirmPaymentMutation,
  useVoidPaymentMutation,
  useForceCloseSessionMutation,
  useStaffVerifyExitMutation,
  useStaffDismissAssistanceMutation,
  useStartStaffSessionMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useGetSubscriptionInfoQuery,
  useRenewSubscriptionMutation,
  useGetFranchiseOutletsQuery,
  useGetFranchiseSummaryQuery,
} = staffApi;

