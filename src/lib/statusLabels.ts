export const ORDER_STATUS_LABELS: Record<string, string> = {
  PLACED_UNVERIFIED: "Pending Verification",
  ACCEPTED: "Accepted",
  PREPARING: "Being Prepared",
  READY: "Ready for Pickup",
  SERVED: "Served",
  CANCELLED: "Cancelled",
};

export const SESSION_STATUS_LABELS: Record<string, string> = {
  OPEN: "Needs Verification",
  OPEN_VERIFIED: "Active Dining",
  AWAITING_PAYMENT: "Bill Requested",
  PAID: "Paid",
  COMPLETED: "Completed",
  WALKOUT: "Walkout",
  EXPIRED: "Expired",
  FORCE_CLOSED: "Closed by Manager",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING_CONFIRMATION: "Awaiting Confirmation",
  CONFIRMED: "Confirmed",
  FAILED: "Failed",
  REFUNDED: "Refunded",
};

export function humanizeStatus(status?: string | null): string {
  if (!status) return "";
  return (
    ORDER_STATUS_LABELS[status] ||
    SESSION_STATUS_LABELS[status] ||
    PAYMENT_STATUS_LABELS[status] ||
    status
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase())
  );
}
