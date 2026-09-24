import { baseApi } from "./baseApi";
import { VerifyExitRequest, VerifyExitResponse } from "@/types/api";

export const guardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    verifyExit: builder.mutation<VerifyExitResponse, VerifyExitRequest>({
      query: (body) => ({
        url: "/api/v1/guard/verify-exit",
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { session_id }) => [
        { type: "ExitPass", id: session_id },
        { type: "Session", id: session_id },
        "Table",
      ],
    }),
  }),
});

export const { useVerifyExitMutation } = guardApi;
