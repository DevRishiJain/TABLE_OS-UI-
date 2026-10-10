"use client";

import React, { useState } from "react";
import { useGetSubscriptionInfoQuery, useRenewSubscriptionMutation } from "@/store/api/staffApi";
import { useAppSelector } from "@/store";
import { Lock, CheckCircle2, ArrowRight, KeyRound } from "lucide-react";
import { Modal } from "@/components/ui/Modal";

const RENEW_ROLES = new Set([
  "RESTAURANT_OWNER",
  "RESTAURANT_ADMIN",
  "FRANCHISE_OWNER",
  "MANAGER",
  "SUPER_ADMIN",
]);

export function SubscriptionLockModal() {
  const { data: subInfo, isLoading, refetch } = useGetSubscriptionInfoQuery();
  const [renewSubscription, { isLoading: isRenewing }] = useRenewSubscriptionMutation();
  const userRole = useAppSelector((state) => state.auth.staffRole);
  const [otp, setOtp] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  if (isLoading || !subInfo) {
    return null; // Let app load normally
  }

  // Only show modal if subscription is explicitly inactive/expired
  if (subInfo.is_active !== false && subInfo.days_remaining > 0) {
    return null;
  }

  const canRenew = RENEW_ROLES.has((userRole || "").toUpperCase());

  const handleRenew = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const code = otp.trim();
    if (!/^\d{6}$/.test(code)) {
      setErr("Enter the 6-digit activation OTP shared by TableOS support.");
      return;
    }
    setErr("");
    setMsg("");
    try {
      const res = await renewSubscription({ otp: code }).unwrap();
      setMsg(res.message || "Subscription successfully renewed!");
      refetch();
    } catch (e2: any) {
      setErr(
        e2?.data?.error ||
          (e2?.status === 429
            ? "Too many failed attempts — OTP locked. Request a new one."
            : "Renewal failed. Please try again.")
      );
    }
  };

  return (
    <Modal
      isOpen
      onClose={() => {}}
      title="Subscription Expired"
      description="Operational Access Locked"
      size="md"
      dismissible={false}
      overlayStyle={{ zIndex: 9999 }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 14,
          marginTop: -4,
        }}
      >
        <div
          style={{
            height: 44,
            width: 44,
            borderRadius: 14,
            background: "color-mix(in srgb, var(--admin-am) 12%, var(--admin-pa))",
            border: "1.5px solid var(--admin-am)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--admin-am)",
            flexShrink: 0,
          }}
        >
          <Lock size={20} />
        </div>
        <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--admin-mute)", lineHeight: 1.45 }}>
          Your restaurant's{" "}
          <b style={{ color: "var(--admin-ink)" }}>
            {subInfo.subscription_plan || "PRO"}
          </b>{" "}
          subscription ended. Floor staff, POS ordering, and kitchen operations are paused
          until payment renewal.
        </p>
      </div>

      {msg && (
        <div className="al" style={{ "--c": "var(--admin-grn)", marginBottom: 14 } as React.CSSProperties}>
          <CheckCircle2 size={18} style={{ flexShrink: 0, color: "var(--admin-grn)" }} />
          <div>
            <small style={{ color: "var(--admin-grn)", fontWeight: 700 }}>{msg}</small>
          </div>
        </div>
      )}

      <div
        style={{
          background: "var(--admin-s2)",
          borderRadius: 14,
          padding: "12px 16px",
          border: "1.5px solid var(--admin-ln)",
          marginBottom: 18,
          fontSize: "0.82rem",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", color: "var(--admin-mute)" }}>
          <span>Restaurant Name</span>
          <b style={{ color: "var(--admin-ink)" }}>{subInfo.restaurant_name}</b>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", color: "var(--admin-mute)" }}>
          <span>Status</span>
          <b style={{ color: "var(--admin-red)" }}>Expired</b>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", color: "var(--admin-mute)" }}>
          <span>Days Remaining</span>
          <b style={{ color: "var(--admin-am)" }}>{subInfo.days_remaining} Days</b>
        </div>
      </div>

      {canRenew ? (
        <form onSubmit={handleRenew} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--admin-mute)", lineHeight: 1.5 }}>
            Pay TableOS for the selected plan; our team will share a 6-digit activation OTP.
          </p>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="Activation OTP"
            style={{
              width: "100%",
              textAlign: "center",
              letterSpacing: "0.4em",
              fontSize: "1.2rem",
              fontWeight: 800,
            }}
          />
          {err && (
            <div
              className="pill c-r"
              style={{ display: "block", padding: "8px 12px" }}
            >
              {err}
            </div>
          )}
          <button
            type="submit"
            className="btn"
            disabled={isRenewing || otp.length !== 6}
            style={{ width: "100%" }}
          >
            {isRenewing ? (
              "Activating..."
            ) : (
              <>
                <KeyRound size={16} />
                Activate Subscription
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      ) : (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 14,
            background: "var(--admin-s2)",
            border: "1.5px solid var(--admin-ln)",
            fontSize: "0.82rem",
            color: "var(--admin-mute)",
            textAlign: "center",
          }}
        >
          Contact your restaurant owner or manager to activate the subscription with a TableOS
          OTP.
        </div>
      )}
    </Modal>
  );
}
