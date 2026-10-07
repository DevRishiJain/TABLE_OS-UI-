"use client";

import React, { useState, useEffect } from "react";
import { useLinkRestaurantToFranchiseMutation } from "@/store/api/staffApi";
import { useRestaurantTheme, THEME_OPTIONS } from "@/components/providers/RestaurantThemeProvider";
import { Sun, Moon, Check } from "lucide-react";
import {
  useGetRestaurantSettingsQuery,
  useUpdateRestaurantSettingsMutation,
  useGetRestaurantTablesQuery,
  useGetMenuItemsQuery,
  useGetStaffRosterQuery,
} from "@/store/api/restaurantApi";

export default function RestaurantSettingsPage() {
  const { data: settings } = useGetRestaurantSettingsQuery();
  const { data: tables } = useGetRestaurantTablesQuery();
  const { data: menuItems } = useGetMenuItemsQuery();
  const { data: staffList } = useGetStaffRosterQuery();

  const [updateSettings, { isLoading }] = useUpdateRestaurantSettingsMutation();
  const { currentTheme, setTheme, colorMode, setColorMode } = useRestaurantTheme();

  const [firstOrderOtpTtl, setFirstOrderOtpTtl] = useState(15);
  const [exitPassOtpTtl, setExitPassOtpTtl] = useState(120);
  const [exitMode, setExitMode] = useState("guard");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [linkFranchise, { isLoading: isLinking }] = useLinkRestaurantToFranchiseMutation();
  const [franchiseCode, setFranchiseCode] = useState("");
  const [linkPassword, setLinkPassword] = useState("");
  const [linkedFranchise, setLinkedFranchise] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      if (settings.first_order_otp_ttl_minutes) {
        setFirstOrderOtpTtl(settings.first_order_otp_ttl_minutes);
      }
      if (settings.exit_pass_otp_ttl_minutes) {
        setExitPassOtpTtl(settings.exit_pass_otp_ttl_minutes);
      }
      if (settings.exit_verification_mode) {
        setExitMode(settings.exit_verification_mode === "EXPRESS_AUTO" ? "self" : "guard");
      }
    }
  }, [settings]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2400);
  };

  const handleSave = async () => {
    try {
      await updateSettings({
        first_order_otp_ttl_minutes: Number(firstOrderOtpTtl),
        exit_pass_otp_ttl_minutes: Number(exitPassOtpTtl),
        exit_verification_mode: exitMode === "self" ? "EXPRESS_AUTO" : "GUARD_ENFORCED",
      }).unwrap();

      showToast("Settings saved");
    } catch (err) {
      console.error(err);
      showToast("Failed to save settings");
    }
  };

  const checklist = [
    { name: "Brand & legal details", status: "Verified" },
    { name: "Tables & QR codes", status: `${tables?.length || 4} live` },
    { name: "Menu & tax rules", status: `${menuItems?.length || 8} dishes` },
    { name: "Staff roster", status: `${staffList?.length || 6} people` },
    { name: "Payout bank account", status: "Verified" },
  ];

  return (
    <>
      {/* Toast Notification */}
      <div className={`toast ${toastMessage ? "on" : ""}`} role="status">
        {toastMessage}
      </div>

      {/* Header Bar */}
      <div className="hd">
        <div>
          <h1>Settings</h1>
          <p>Security, timers and setup</p>
        </div>
        <div className="sp"></div>
        <button className="btn" onClick={handleSave} disabled={isLoading}>
          {isLoading ? "Saving…" : "Save changes"}
        </button>
      </div>

      {/* Settings Grid */}
      <div className="g g2">
        {/* Code Timers Card */}
        <div className="cd">
          <h2>Code timers</h2>
          <p className="sub">How long codes stay valid, in minutes.</p>
          <div className="mf">
            <label>
              Guest order code (mins)
              <input
                type="number"
                value={firstOrderOtpTtl}
                onChange={(e) => setFirstOrderOtpTtl(Number(e.target.value))}
              />
            </label>
            <label>
              Exit pass (mins)
              <input
                type="number"
                value={exitPassOtpTtl}
                onChange={(e) => setExitPassOtpTtl(Number(e.target.value))}
              />
            </label>
          </div>
        </div>

        {/* Setup Checklist Card */}
        <div className="cd">
          <h2>Setup checklist</h2>
          <p className="sub">100% complete. The restaurant is live.</p>
          {checklist.map((c, i) => (
            <div key={i} className="row">
              <div>
                <b>{c.name}</b>
              </div>
              <span className="pill c-g">{c.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Exit Verification Options */}
      <div className="cd mt">
        <h2>Exit verification</h2>
        <p className="sub">What happens after a guest pays.</p>
        <div className="cho">
          <button
            type="button"
            aria-pressed={exitMode === "guard"}
            onClick={() => setExitMode("guard")}
          >
            <b>Guard checks exit pass</b>
            <small>
              A security guard verifies the pass at the door. Table remains occupied until exit scan.
            </small>
          </button>
          <button
            type="button"
            aria-pressed={exitMode === "self"}
            onClick={() => setExitMode("self")}
          >
            <b>Express self-checkout</b>
            <small>
              Session closes automatically as soon as payment is confirmed. Suitable for fast casual.
            </small>
          </button>
        </div>
      </div>

      {/* Brand Theme & System Appearance Card */}
      <div className="cd mt">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2>Brand Theme & Appearance</h2>
            <p className="sub">
              Configured during onboarding. Dynamically alters TableOS accents, buttons, chips, and visual modes.
            </p>
          </div>
          <div className="mode-toggle">
            <button
              type="button"
              className={`mode-btn ${colorMode === "light" ? "active" : ""}`}
              onClick={() => {
                setColorMode("light");
                showToast("Parchment Light mode applied");
              }}
              aria-pressed={colorMode === "light"}
            >
              <Sun style={{ width: 14, height: 14 }} />
              <span>Light</span>
            </button>
            <button
              type="button"
              className={`mode-btn ${colorMode === "dark" ? "active" : ""}`}
              onClick={() => {
                setColorMode("dark");
                showToast("Noir Dark mode applied");
              }}
              aria-pressed={colorMode === "dark"}
            >
              <Moon style={{ width: 14, height: 14 }} />
              <span>Dark</span>
            </button>
          </div>
        </div>

        <div className="theme-palette-grid">
          {THEME_OPTIONS.map((opt) => {
            const isSelected =
              (currentTheme === "" && (opt.id === "" || opt.key === "")) ||
              currentTheme === opt.id ||
              currentTheme === opt.key;
            return (
              <div
                key={opt.name}
                className={`theme-card-option ${isSelected ? "active" : ""}`}
                onClick={() => {
                  setTheme(opt.key);
                  showToast(`${opt.name} theme applied system-wide`);
                }}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
              >
                <div
                  className="theme-card-preview"
                  style={{
                    background: `linear-gradient(135deg, ${opt.primaryColor}, ${opt.hoverColor})`,
                  }}
                >
                  {isSelected && (
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Check style={{ width: 14, height: 14 }} />
                      Active
                    </span>
                  )}
                </div>
                <div>
                  <b style={{ display: "block", fontSize: "0.95rem" }}>{opt.name}</b>
                  <small style={{ color: "var(--admin-mute)", fontSize: "0.8rem", marginTop: 2, display: "block" }}>
                    {opt.description}
                  </small>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Franchise Association Section */}
      <div className="cd mt">
        <div className="hd">
          <h2>Franchise Association &amp; Governance</h2>
          <p>Link your independent restaurant to a registered Franchise Network using a 6-digit OTP code.</p>
        </div>

        {linkedFranchise && (
          <div className="pill c-g" style={{ display: "inline-block", padding: "8px 14px", marginTop: 12 }}>
            ✓ Part of {linkedFranchise}
          </div>
        )}
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              const res = await linkFranchise({
                code: franchiseCode.trim(),
                password: linkPassword,
              }).unwrap();
              setLinkedFranchise(res.franchise_name || "the franchise");
              showToast(res.message || "Restaurant successfully linked to Franchise Network!");
              setFranchiseCode("");
              setLinkPassword("");
            } catch (err: any) {
              showToast(err?.data?.error || "Failed to link — check the code and your password.");
            }
          }}
          style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16, maxWidth: 460 }}
        >
          <div>
            <label style={{ fontSize: "0.8rem", fontWeight: 700, display: "block", marginBottom: 4 }}>
              Franchise Link OTP Code
            </label>
            <input
              type="text"
              placeholder="e.g. FRN-982415"
              value={franchiseCode}
              onChange={(e) => setFranchiseCode(e.target.value.toUpperCase())}
              required
              className="font-mono text-xs"
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid var(--admin-bd)",
                background: "var(--admin-bg)",
                color: "var(--admin-fg)",
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: "0.8rem", fontWeight: 700, display: "block", marginBottom: 4 }}>
              Confirm Store Owner Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={linkPassword}
              onChange={(e) => setLinkPassword(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid var(--admin-bd)",
                background: "var(--admin-bg)",
                color: "var(--admin-fg)",
              }}
            />
          </div>

          <button className="btn pri sm" type="submit" disabled={isLinking} style={{ alignSelf: "flex-start", marginTop: 4 }}>
            {isLinking ? "Verifying…" : "Authorize & Link Restaurant"}
          </button>
        </form>
      </div>
    </>
  );
}
