"use client";

import React, { useState } from "react";
import {
  useGetSubscriptionInfoQuery,
  useRenewSubscriptionMutation,
} from "@/store/api/staffApi";
import { useAppSelector } from "@/store";
import { Modal } from "@/components/ui/Modal";

const RENEW_ROLES = new Set([
  "RESTAURANT_OWNER",
  "RESTAURANT_ADMIN",
  "FRANCHISE_OWNER",
  "MANAGER",
  "SUPER_ADMIN",
]);

export default function RestaurantSubscriptionPage() {
  const { data: subInfo, isLoading, refetch } = useGetSubscriptionInfoQuery();
  const [renewSubscription, { isLoading: isRenewing }] = useRenewSubscriptionMutation();
  const userRole = useAppSelector((state) => state.auth.staffRole);

  const [selectedPlanDays, setSelectedPlanDays] = useState<number>(30);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Activation OTP step
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const canRenew = RENEW_ROLES.has((userRole || "").toUpperCase());

  const openOtpStep = () => {
    setOtpValue("");
    setOtpError(null);
    setOtpModalOpen(true);
  };

  const handleConfirmOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otp = otpValue.trim();
    if (!/^\d{6}$/.test(otp)) {
      setOtpError("Enter the 6-digit activation OTP.");
      return;
    }
    try {
      const res = await renewSubscription({ otp, days: selectedPlanDays }).unwrap();
      setOtpModalOpen(false);
      showToast(res.message || `Subscription extended by ${selectedPlanDays} days!`);
      refetch();
    } catch (err: any) {
      const msg =
        err?.data?.error ||
        (err?.status === 429
          ? "Too many failed attempts — this OTP has been locked. Request a new OTP."
          : "Failed to process subscription renewal");
      setOtpError(msg);
    }
  };

  const daysRemaining = subInfo?.days_remaining ?? 30;
  const isActive = subInfo?.is_active ?? true;
  const endDateFormatted = subInfo?.subscription_end_at
    ? new Date(subInfo.subscription_end_at).toLocaleDateString("en-IN", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "N/A";

  return (
    <>
      {/* Toast Notification */}
      <div className={`toast ${toastMessage ? "on" : ""}`} role="status">
        {toastMessage}
      </div>

      {/* Header Bar */}
      <div className="hd">
        <div>
          <h1>Subscription & Billing</h1>
          <p>Track pending days, extend plan access, and inspect billing history</p>
        </div>
        <div className="sp"></div>
        <button className="btn" onClick={() => refetch()} disabled={isLoading}>
          <svg viewBox="0 0 24 24">
            <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          {isLoading ? "Syncing…" : "Refresh"}
        </button>
      </div>

      {/* 4 KPI Cards */}
      <div className="g g4">
        <div
          className="cd st"
          style={
            {
              "--c":
                daysRemaining <= 5
                  ? "var(--admin-red)"
                  : daysRemaining <= 10
                  ? "var(--admin-am)"
                  : "var(--admin-grn)",
            } as any
          }
        >
          <small>Days Pending / Left</small>
          <b>{daysRemaining} Days</b>
          <span>Expires on {endDateFormatted}</span>
        </div>

        <div className="cd st" style={{ "--c": "var(--admin-vio)" } as any}>
          <small>Active Tier</small>
          <b>{subInfo?.subscription_plan || "PRO"} Edition</b>
          <span>Unlimited POS, QR & KDS enabled</span>
        </div>

        <div className="cd st" style={{ "--c": "var(--admin-am)" } as any}>
          <small>Platform Fee Savings</small>
          <b>0% Commission</b>
          <span>100% Flat Subscription Model</span>
        </div>

        <div
          className="cd st"
          style={{ "--c": isActive ? "var(--admin-blu)" : "var(--admin-red)" } as any}
        >
          <small>Billing & Access</small>
          <b>{isActive ? "ACTIVE" : "EXPIRED"}</b>
          <span>{isActive ? "Auto-renew & Receipts Ready" : "Renewal Required"}</span>
        </div>
      </div>

      {/* Renewal Plan Selector Card */}
      {canRenew && (
        <div className="cd mt">
          <h2>Renew & Extend Plan</h2>
          <p className="sub">Select a subscription duration, then activate it with the OTP provided by TableOS support.</p>

          <div className="g g4 mt">
            {/* Plan 1 */}
            <div
              onClick={() => setSelectedPlanDays(30)}
              style={{
                padding: "16px",
                borderRadius: "12px",
                border:
                  selectedPlanDays === 30
                    ? "2px solid var(--admin-am)"
                    : "1px solid var(--admin-ln)",
                background: selectedPlanDays === 30 ? "var(--admin-s2)" : "transparent",
                cursor: "pointer",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="pill c-b">Monthly</span>
                <span style={{ fontSize: "0.75rem", color: "var(--admin-mute)" }}>30 Days</span>
              </div>
              <div
                style={{
                  fontSize: "1.6rem",
                  fontWeight: 800,
                  marginTop: "8px",
                  color: "var(--admin-ink)",
                }}
              >
                ₹499
              </div>
              <small style={{ color: "var(--admin-mute)" }}>Standard ₹499/mo rate</small>
            </div>

            {/* Plan 2 */}
            <div
              onClick={() => setSelectedPlanDays(90)}
              style={{
                padding: "16px",
                borderRadius: "12px",
                border:
                  selectedPlanDays === 90
                    ? "2px solid var(--admin-am)"
                    : "1px solid var(--admin-ln)",
                background: selectedPlanDays === 90 ? "var(--admin-s2)" : "transparent",
                cursor: "pointer",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="pill c-v">Quarterly</span>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--admin-vio)" }}>
                  Save 7%
                </span>
              </div>
              <div
                style={{
                  fontSize: "1.6rem",
                  fontWeight: 800,
                  marginTop: "8px",
                  color: "var(--admin-ink)",
                }}
              >
                ₹1,399
              </div>
              <small style={{ color: "var(--admin-mute)" }}>90 Days (₹466/mo)</small>
            </div>

            {/* Plan 3 */}
            <div
              onClick={() => setSelectedPlanDays(180)}
              style={{
                padding: "16px",
                borderRadius: "12px",
                border:
                  selectedPlanDays === 180
                    ? "2px solid var(--admin-am)"
                    : "1px solid var(--admin-ln)",
                background: selectedPlanDays === 180 ? "var(--admin-s2)" : "transparent",
                cursor: "pointer",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="pill c-a">Half-Yearly</span>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--admin-am)" }}>
                  Save 10%
                </span>
              </div>
              <div
                style={{
                  fontSize: "1.6rem",
                  fontWeight: 800,
                  marginTop: "8px",
                  color: "var(--admin-ink)",
                }}
              >
                ₹2,699
              </div>
              <small style={{ color: "var(--admin-mute)" }}>180 Days (₹449/mo)</small>
            </div>

            {/* Plan 4 */}
            <div
              onClick={() => setSelectedPlanDays(365)}
              style={{
                padding: "16px",
                borderRadius: "12px",
                border:
                  selectedPlanDays === 365
                    ? "2px solid var(--admin-am)"
                    : "1px solid var(--admin-ln)",
                background: selectedPlanDays === 365 ? "var(--admin-s2)" : "transparent",
                cursor: "pointer",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="pill c-g">Annual Plan</span>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--admin-grn)" }}>
                  Save 16%
                </span>
              </div>
              <div
                style={{
                  fontSize: "1.6rem",
                  fontWeight: 800,
                  marginTop: "8px",
                  color: "var(--admin-ink)",
                }}
              >
                ₹4,999
              </div>
              <small style={{ color: "var(--admin-mute)" }}>365 Days (₹416/mo)</small>
            </div>
          </div>

          <div
            style={{
              marginTop: "20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <small style={{ color: "var(--admin-mute)" }}>
              ✓ Activation extends from current expiry date ({endDateFormatted})
            </small>
            <button className="btn pri" onClick={openOtpStep}>
              Renew ({selectedPlanDays} Days)
            </button>
          </div>
        </div>
      )}

      {/* Payment History — no restaurant-side invoice endpoint exists; empty state */}
      <div className="cd tw mt">
        <div style={{ padding: "16px 20px 0" }}>
          <h2>Payment & Invoice History</h2>
          <p className="sub">Subscription payment logs and invoice receipts.</p>
        </div>
        <div className="em">
          <b>No invoices to show</b>
          Payment receipts are issued by TableOS support after activation.
        </div>
      </div>

      {/* Activation OTP Modal */}
      {otpModalOpen && (
        <Modal
          isOpen={otpModalOpen}
          onClose={() => setOtpModalOpen(false)}
          title="Enter activation OTP"
          description={`Pay TableOS for the selected ${selectedPlanDays}-day plan; our team will share a 6-digit activation OTP. Enter it below to activate your subscription.`}
          closeDisabled={isRenewing}
        >
            <form onSubmit={handleConfirmOtp}>
              <div className="mf">
                <label className="w">
                  6-digit Activation OTP
                  <input
                    required
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    pattern="\\d{6}"
                    placeholder="••••••"
                    value={otpValue}
                    onChange={(e) => {
                      setOtpValue(e.target.value.replace(/\D/g, "").slice(0, 6));
                      setOtpError(null);
                    }}
                    style={{ letterSpacing: "0.4em", fontSize: "1.3rem", textAlign: "center" }}
                  />
                </label>
                {otpError && (
                  <div
                    className="pill c-r"
                    style={{ display: "block", padding: "10px 14px", marginTop: 8 }}
                  >
                    {otpError}
                  </div>
                )}
              </div>
              <div className="ac" style={{ marginTop: 20 }}>
                <button
                  type="button"
                  className="btn s"
                  onClick={() => setOtpModalOpen(false)}
                  disabled={isRenewing}
                >
                  Cancel
                </button>
                <button type="submit" className="btn pri" disabled={isRenewing}>
                  {isRenewing ? "Activating…" : `Activate ${selectedPlanDays}-day plan`}
                </button>
              </div>
            </form>
        </Modal>
      )}
    </>
  );
}
