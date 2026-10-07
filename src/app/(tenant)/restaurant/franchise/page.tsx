"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store";
import { setRestaurantInfo } from "@/store/slices/authSlice";
import { addFranchiseOutlet } from "@/store/slices/franchiseSlice";
import {
  useGetFranchiseOutletsQuery,
  useGetFranchiseSummaryQuery,
  useGenerateFranchiseInviteCodeMutation,
} from "@/store/api/staffApi";
import { formatCurrencyMinor } from "@/lib/formatters";
import { LinkOutletModal } from "@/components/franchise/LinkOutletModal";

export default function FranchiseDashboardPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  
  const { data: apiOutlets = [], isLoading: isLoadingOutlets, refetch } = useGetFranchiseOutletsQuery();
  const { data: summary, isLoading: isLoadingSummary } = useGetFranchiseSummaryQuery();
  const [generateInviteCode, { isLoading: isGeneratingCode }] = useGenerateFranchiseInviteCodeMutation();

  const [selectedOutletFilter, setSelectedOutletFilter] = useState<string>("ALL");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeLinkCode, setActiveLinkCode] = useState<string | null>(null);
  const [linkCodeExpiry, setLinkCodeExpiry] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<string>("");
  const [isCopied, setIsCopied] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Outlets come only from the API — no fabricated fallback
  const combinedOutlets = apiOutlets;

  // Expiry countdown ticker for the active invite code
  useEffect(() => {
    if (!linkCodeExpiry) return;
    const tick = () => {
      const ms = linkCodeExpiry - Date.now();
      if (ms <= 0) {
        setCountdown("expired");
        return;
      }
      const m = Math.floor(ms / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setCountdown(`${m}:${String(s).padStart(2, "0")}`);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [linkCodeExpiry]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleGenerateLinkCode = async () => {
    try {
      const res = await generateInviteCode().unwrap();
      setActiveLinkCode(res.code);
      setLinkCodeExpiry(res.expires_at ? new Date(res.expires_at).getTime() : Date.now() + 15 * 60 * 1000);
      showToast("Single-use 15-minute Link OTP Code generated!");
    } catch (err: any) {
      showToast(err?.data?.error || "Failed to generate invite code");
    }
  };

  const handleCopyCode = () => {
    if (activeLinkCode) {
      navigator.clipboard.writeText(activeLinkCode);
      setIsCopied(true);
      showToast("OTP Code copied to clipboard!");
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleSwitchToOutlet = (outletId: string, outletName: string, outletSlug?: string) => {
    dispatch(
      setRestaurantInfo({
        restaurantId: outletId,
        restaurantName: outletName,
        restaurantSlug: outletSlug || "",
      })
    );
    showToast(`Switched context to ${outletName}`);
    setTimeout(() => {
      router.push("/restaurant/dashboard");
    }, 600);
  };

  const filteredOutlets = combinedOutlets.filter(
    (o) => selectedOutletFilter === "ALL" || o.id === selectedOutletFilter
  );

  const totalActive = summary?.active_subscriptions ?? combinedOutlets.filter((o) => o.is_active).length;
  const totalExpired = summary?.expired_subscriptions ?? combinedOutlets.filter((o) => !o.is_active).length;
  const totalRev = summary?.total_revenue_minor ?? 0;

  return (
    <>
      {/* Toast Notification */}
      <div className={`toast ${toastMessage ? "on" : ""}`} role="status">
        {toastMessage}
      </div>

      {/* Header Bar */}
      <div className="hd">
        <div>
          <h1>Franchise Governance Suite</h1>
          <p>Multi-outlet aggregated performance, store link requests & 1-click context switching</p>
        </div>
        <div className="sp"></div>

        {/* Top Outlet Filter Dropdown & Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <select
            value={selectedOutletFilter}
            onChange={(e) => setSelectedOutletFilter(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid var(--admin-bd)",
              background: "var(--admin-pa)",
              color: "var(--admin-fg)",
              fontWeight: 600,
            }}
          >
            <option value="ALL">All Franchise Outlets ({combinedOutlets.length})</option>
            {combinedOutlets.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name} ({o.days_remaining ?? 30}d left)
              </option>
            ))}
          </select>

          <button className="btn pri" onClick={() => setIsModalOpen(true)}>
            <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
            Link / Create Outlet
          </button>

          <button className="btn" onClick={() => refetch()}>
            <svg viewBox="0 0 24 24">
              <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            Sync
          </button>
        </div>
      </div>

      {/* 4 Executive KPI Cards */}
      <div className="g g4">
        <div className="cd st" style={{ "--c": "var(--admin-am)" } as any}>
          <small>Franchise Combined Sales</small>
          <b>{formatCurrencyMinor(totalRev)}</b>
          <span>Aggregated today across outlets</span>
        </div>

        <div className="cd st" style={{ "--c": "var(--admin-grn)" } as any}>
          <small>Active Outlet Subscriptions</small>
          <b>{totalActive} Outlets Live</b>
          <span>Unrestricted POS &amp; QR service</span>
        </div>

        <div className="cd st" style={{ "--c": totalExpired > 0 ? "var(--admin-red)" : "var(--admin-grn)" } as any}>
          <small>Expired Subscriptions</small>
          <b>{totalExpired} Outlets</b>
          <span>{totalExpired > 0 ? "Action required for renewal" : "All outlets fully active"}</span>
        </div>

        <div className="cd st" style={{ "--c": "var(--admin-vio)" } as any}>
          <small>Top Performing Location</small>
          <b>{summary?.top_performing_outlet || "—"}</b>
          <span>Highest revenue outlet (30 days)</span>
        </div>
      </div>

      {/* Franchise Attachment & Link Requests Manager Card */}
      <div className="cd mt">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2>Store Linking &amp; Authorization Requests</h2>
            <p className="sub">
              Generate single-use 15-minute OTP invite codes or link independent venues securely using 2-factor mutual verification.
            </p>
          </div>

          <button className="btn pri s" onClick={handleGenerateLinkCode} disabled={isGeneratingCode}>
            <svg viewBox="0 0 24 24"><path d="M21 2l-2 2m-2-2l2 2M3 7v6h6M21 17v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
            Generate Link OTP Code
          </button>
        </div>

        {activeLinkCode ? (
          <div
            style={{
              marginTop: 16,
              padding: "16px",
              borderRadius: "12px",
              background: "var(--admin-pa)",
              border: "1px solid var(--admin-am)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div>
              <span className="pill c-g" style={{ fontSize: "0.75rem", marginBottom: 4 }}>
                🔒 Single-Use Franchise Link OTP
              </span>
              <div style={{ fontSize: "1.6rem", fontWeight: 900, fontFamily: "monospace", color: "var(--admin-am)", letterSpacing: "2px", margin: "4px 0" }}>
                {activeLinkCode}
              </div>
              <small style={{ color: "var(--admin-mute)", fontSize: "0.78rem" }}>
                ⏱️ Expires in {countdown || "…"}. Transmit to Store Owner to enter under Settings → Franchise Association.
              </small>
            </div>

            <button className="btn s" onClick={handleCopyCode}>
              {isCopied ? "✓ Copied!" : "📋 Copy Code"}
            </button>
          </div>
        ) : (
          <div
            style={{
              marginTop: 16,
              padding: "14px 16px",
              borderRadius: "12px",
              background: "var(--admin-pa)",
              border: "1px dashed var(--admin-bd)",
              fontSize: "0.82rem",
              color: "var(--admin-mute)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span>No active invite link codes. Click <b>"Generate Link OTP Code"</b> to issue a new 15-minute token.</span>
            <span className="pill">Dual-Handshake Protected</span>
          </div>
        )}
      </div>

      {/* Outlet Performance & Governance Table Card */}
      <div className="cd tw mt">
        <div style={{ padding: "16px 20px 0" }}>
          <h2>Franchise Outlet Comparison</h2>
          <p className="sub">
            Real-time outlet operational status, subscription expiry, and 1-click Manager portal drill-down.
          </p>
        </div>

        {isLoadingOutlets || isLoadingSummary ? (
          <div className="em">
            <b>Loading franchise outlets…</b>
            Syncing multi-outlet metrics.
          </div>
        ) : filteredOutlets.length === 0 ? (
          <div className="em">
            <b>No outlets found</b>
            No restaurant outlets match the selected filter criteria.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Outlet Name</th>
                <th>Location / Slug</th>
                <th>Plan Tier</th>
                <th>Days Remaining</th>
                <th className="ac">Subscription Status</th>
                <th className="ac">Context Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredOutlets.map((outlet) => (
                <tr key={outlet.id}>
                  <td>
                    <b>{outlet.name}</b>
                    <small style={{ color: "var(--admin-mute)", display: "block" }}>
                      ID: {outlet.id.substring(0, 8)}…
                    </small>
                  </td>
                  <td>
                    <code style={{ fontSize: "0.8rem", color: "var(--admin-mute)" }}>
                      /{outlet.slug || "main"}
                    </code>
                  </td>
                  <td>
                    <b>{outlet.subscription_plan || "PRO"} Edition</b>
                  </td>
                  <td>
                    <b
                      style={{
                        color:
                          (outlet.days_remaining ?? 30) <= 5
                            ? "var(--admin-red)"
                            : (outlet.days_remaining ?? 30) <= 10
                            ? "var(--admin-am)"
                            : "var(--admin-grn)",
                      }}
                    >
                      {outlet.days_remaining ?? 30} Days
                    </b>
                  </td>
                  <td className="n"><b>{outlet.table_count ?? 0}</b></td>
                  <td className="n"><b>{outlet.active_sessions ?? 0}</b></td>
                  <td className="n"><b>{formatCurrencyMinor(outlet.revenue_today_minor ?? 0)}</b></td>
                  <td className="n"><b>{formatCurrencyMinor(outlet.revenue_30d_minor ?? 0)}</b></td>
                  <td className="ac">
                    <span className={`pill ${outlet.is_active ?? true ? "c-g" : "c-r"}`}>
                      {outlet.subscription_status || (outlet.is_active ?? true ? "ACTIVE" : "EXPIRED")}
                    </span>
                  </td>
                  <td className="ac">
                    <button
                      className="btn pri"
                      style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                      onClick={() => handleSwitchToOutlet(outlet.id, outlet.name, outlet.slug)}
                    >
                      Enter Manager View →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Link Outlet Modal */}
      <LinkOutletModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={() => refetch()}
      />
    </>
  );
}
