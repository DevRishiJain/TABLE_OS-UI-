import { useEffect, useState } from "react";
import { baseApi } from "@/store/api/baseApi";
import { wsClient, WSConnectionStatus } from "./ws";
import { WSEnvelope } from "@/types/api";
import type { AppDispatch } from "@/store";

let isBridgeInitialized = false;
const pendingTags = new Set<string>();
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function debouncedInvalidateTags(dispatch: AppDispatch, tags: string[]) {
  tags.forEach((tag) => pendingTags.add(tag));
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(() => {
    if (pendingTags.size > 0) {
      const tagsToInvalidate = Array.from(pendingTags);
      pendingTags.clear();
      dispatch(baseApi.util.invalidateTags(tagsToInvalidate as any));
    }
  }, 200);
}

/**
 * Initializes global event listener that invalidates RTK Query cache tags
 * on incoming real-time events with debouncing to prevent connection floods.
 */
export function initWebSocketBridge(dispatch: AppDispatch) {
  if (isBridgeInitialized) return;
  isBridgeInitialized = true;

  wsClient.on("*", (envelope: WSEnvelope) => {
    const { t } = envelope;

    switch (t) {
      case "ORDER_PLACED":
        debouncedInvalidateTags(dispatch, [
          "PendingOrder",
          "Order",
          "Session",
          "Table",
        ]);
        break;

      case "ORDER_ACCEPTED":
      case "ORDER_CANCELLED":
        debouncedInvalidateTags(dispatch, [
          "PendingOrder",
          "Order",
          "KitchenQueue",
          "Session",
          "Table",
        ]);
        break;

      case "ORDER_STATUS_CHANGED":
        debouncedInvalidateTags(dispatch, ["KitchenQueue", "Session"]);
        break;

      case "SESSION_STARTED":
      case "SESSION_CLOSED":
      case "BILL_REQUESTED":
        debouncedInvalidateTags(dispatch, ["Session", "Table", "Analytics"]);
        break;

      case "ASSISTANCE_REQUESTED":
      case "ASSISTANCE_DISMISSED":
        debouncedInvalidateTags(dispatch, ["Session", "Table"]);
        break;

      case "PAYMENT_INITIATED":
      case "PAYMENT_CONFIRMED":
      case "PAYMENT_VOIDED":
        debouncedInvalidateTags(dispatch, [
          "Payment",
          "Session",
          "ExitPass",
          "Analytics",
          "Table",
        ]);
        break;

      default:
        // Generic fallback for any domain entity update
        debouncedInvalidateTags(dispatch, ["Session"]);
        break;
    }
  });
}

/**
 * React hook to observe WebSocket lifecycle and trigger connection.
 */
export function useWebSocket() {
  const [status, setStatus] = useState<WSConnectionStatus>(wsClient.getStatus());

  useEffect(() => {
    wsClient.connect();
    const unsub = wsClient.onStatusChange((newStatus) => {
      setStatus(newStatus);
    });
    return () => {
      unsub();
    };
  }, []);

  return {
    status,
    isConnected: status === "OPEN",
    reconnect: () => wsClient.connect(),
    lastEventId: wsClient.getLastEventId(),
  };
}

/**
 * Polling is completely disabled; real-time updates are driven entirely by WebSockets.
 */
export function useDynamicPollingInterval(_fallbackIntervalMs = 25000): number | undefined {
  return undefined;
}
