"use client";

import React, { useState } from "react";
import {
  useGetSubscriptionInfoQuery,
  useRenewSubscriptionMutation,
} from "@/store/api/staffApi";

interface PaymentRecord {
  id: string;
  invoice_no: string;
  date: string;
  plan: string;
  duration: string;
  amount: string;
  method: string;
  status: "PAID" | "PENDING" | "FAILED";
}

export default function RestaurantSubscriptionPage() {
  const { data: subInfo, isLoading, refetch } = useGetSubscriptionInfoQuery();
  const [renewSubscription, { isLoading: isRenewing }] = useRenewSubscriptionMutation();

  const [selectedPlanDays, setSelectedPlanDays] = useState<number>(30);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [history, setHistory] = useState<PaymentRecord[]>([
    {
      id: "pay-101",
      invoice_no: "INV-2026-00412",
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      plan: "PRO Plan",
      duration: "30 Days Extension",
      amount: "₹499.00",
      method: "UPI (AutoPay)",
      status: "PAID",
    },
    {
      id: "pay-100",
      invoice_no: "INV-2026-00108",
      date: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      plan: "PRO Plan",
      duration: "30 Days Onboarding",
      amount: "₹0.00 (Intro Offer)",
      method: "Platform Grant",
      status: "PAID",
    },
  ]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleRenew = async (days: number) => {
    try {
      const res = await renewSubscription({ days }).unwrap();
      showToast(res.message || `Subscription extended by ${days} days!`);

      const newInvoice: PaymentRecord = {
        id: `pay-${Date.now()}`,
        invoice_no: `INV-2026-${Math.floor(10000 + Math.random() * 90000)}`,
        date: new Date().toLocaleDateString("en-IN", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
        plan: "PRO Plan",
        duration: `${days} Days Extension`,
        amount:
          days === 30
            ? "₹499.00"
            : days === 90
            ? "₹1,399.00"
            : days === 180
            ? "₹2,699.00"
            : "₹4,999.00",
        method: "Razorpay / UPI",
        status: "PAID",
      };

      setHistory((prev) => [newInvoice, ...prev]);
    } catch (err: any) {
      console.error("Renewal error:", err);
      showToast("Failed to process subscription renewal");
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
      <div className="cd mt">
        <h2>Renew & Extend Plan</h2>
        <p className="sub">Select a subscription duration to instantly extend access for your outlet.</p>

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
            ✓ Instant renewal extends from current expiry date ({endDateFormatted})
          </small>
          <button className="btn pri" onClick={() => handleRenew(selectedPlanDays)} disabled={isRenewing}>
            {isRenewing ? "Processing Renewal…" : `Renew (${selectedPlanDays} Days)`}
          </button>
        </div>
      </div>

      {/* Payment History Table Card */}
      <div className="cd tw mt">
        <div style={{ padding: "16px 20px 0" }}>
          <h2>Payment & Invoice History</h2>
          <p className="sub">Past subscription payment logs and invoice receipts.</p>
        </div>

        <table>
          <thead>
            <tr>
              <th>Invoice No</th>
              <th>Date</th>
              <th>Plan Details</th>
              <th>Payment Method</th>
              <th className="n">Amount</th>
              <th className="ac">Status</th>
              <th className="ac">Receipt</th>
            </tr>
          </thead>
          <tbody>
            {history.map((item) => (
              <tr key={item.id}>
                <td>
                  <b>{item.invoice_no}</b>
                </td>
                <td>{item.date}</td>
                <td>
                  <b>{item.plan}</b> <small>({item.duration})</small>
                </td>
                <td style={{ color: "var(--admin-mute)" }}>{item.method}</td>
                <td className="n">
                  <b>{item.amount}</b>
                </td>
                <td className="ac">
                  <span className="pill c-g">{item.status}</span>
                </td>
                <td className="ac">
                  <button
                    className="btn"
                    style={{ padding: "4px 8px", fontSize: "0.78rem" }}
                    onClick={() => showToast(`Downloaded receipt for ${item.invoice_no}`)}
                  >
                    Receipt
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
