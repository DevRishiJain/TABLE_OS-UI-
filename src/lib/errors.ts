/**
 * Centralized mapping of backend error responses & codes to clear, friendly user messages.
 */

const ERROR_MAP: Record<string, string> = {
  // Session & Order Errors
  "active session already exists on this table": "This table currently has an active dining session.",
  "session not found": "Dining session could not be found or has expired.",
  "session already closed": "This dining session has already concluded.",
  "invalid or expired authorization token": "Your session has expired. Please scan the table QR code again.",
  "unauthorized staff token": "Unauthorized staff access. Please log in with valid credentials.",
  "unauthorized guard token": "Unauthorized guard credentials.",
  "forbidden: platform super-admin credentials required": "Platform super-admin privileges required for this view.",
  "first order verification required": "Please show your 4-digit code to your server to verify your order.",
  "invalid verification code": "The verification code entered does not match. Please check and retry.",
  "idempotency conflict": "A request is already being processed with this action key. Please wait.",

  // Guard & Exit Pass Errors
  PASS_EXPIRED: "Exit Pass has expired. Please contact restaurant reception.",
  PASS_ALREADY_USED: "This Exit Pass has already been validated.",
  PASS_LOCKED: "Exit verification locked due to consecutive failed attempts.",
  INVALID_OTP: "Invalid 4-digit Exit Pass code.",
  SESSION_UNPAID: "Cannot generate exit pass: unpaid dining bill remaining.",
};

export function translateBackendError(error: unknown): string {
  if (!error) return "An unexpected error occurred. Please try again.";

  if (typeof error === "string") {
    for (const [key, msg] of Object.entries(ERROR_MAP)) {
      if (error.toLowerCase().includes(key.toLowerCase())) return msg;
    }
    return error;
  }

  if (typeof error === "object" && error !== null) {
    const errObj = error as { data?: { error?: string; reason?: string; code?: string }; message?: string };
    const errText = errObj.data?.error || errObj.data?.reason || errObj.data?.code || errObj.message || "";
    for (const [key, msg] of Object.entries(ERROR_MAP)) {
      if (errText.toLowerCase().includes(key.toLowerCase())) return msg;
    }
    if (errText) return errText;
  }

  return "An unexpected error occurred. Please try again.";
}
