"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAppSelector } from "@/store";
import { useRestaurantTheme, THEME_OPTIONS } from "@/components/providers/RestaurantThemeProvider";
import { Sun, Moon, Check } from "lucide-react";

export default function RestaurantOnboardingPipelinePage() {
  const restaurantName = useAppSelector((state) => state.auth.restaurantName) || "The Spice Route";
  const { currentTheme, setTheme, colorMode, setColorMode } = useRestaurantTheme();

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2400);
  };

  const storedCount =
    typeof window !== "undefined"
      ? Number(localStorage.getItem("tableos_table_count")) || 4
      : 4;

  const activeThemeOption =
    THEME_OPTIONS.find((t) => (currentTheme === "" && (t.id === "" || t.key === "")) || currentTheme === t.id || currentTheme === t.key) ||
    THEME_OPTIONS[0];

  const steps = [
    {
      id: 1,
      title: "Restaurant Brand Identity & Legal Details",
      description: `Entity profile configured for ${restaurantName}, GSTIN 07AABCG1234F1Z5, Connaught Place location. Theme: ${activeThemeOption.name}.`,
      status: "Verified",
      link: "/restaurant/settings",
      linkText: "Edit Profile",
    },
    {
      id: 2,
      title: "Table Provisioning & Scannable QR Cards",
      description: `${storedCount} dining tables provisioned with vector QR codes and direct ordering tokens.`,
      status: "Active",
      link: "/restaurant/tables",
      linkText: "View & Print QRs",
    },
    {
      id: 3,
      title: "Digital Menu Catalog & Tax Rules",
      description: "Dishes and categories configured with 5% GST (2.5% CGST + 2.5% SGST) applied.",
      status: "Cataloged",
      link: "/restaurant/menu",
      linkText: "Menu Studio",
    },
    {
      id: 4,
      title: "Staff Roster & Auto Employee IDs",
      description: "Key operational roles provisioned with Employee IDs (Waiters, Chefs, Cashier, Guard).",
      status: "Provisioned",
      link: "/restaurant/staff",
      linkText: "Manage Team",
    },
    {
      id: 5,
      title: "Settlement Payout Account",
      description: "Automated direct bank settlements via Razorpay Route / Cashfree for gross dining sales.",
      status: "Connected",
      link: "/restaurant/settlements",
      linkText: "Settlement Config",
    },
    {
      id: 6,
      title: "Live Operations SLA Thresholds",
      description: "First-order OTP TTL set to 15m, Exit pass to 120m, Kitchen prep alert SLA at 12m.",
      status: "Live & Protected",
      link: "/restaurant/settings",
      linkText: "Tweak Rules",
    },
  ];

  return (
    <>
      {/* Toast Notification */}
      <div className={`toast ${toastMsg ? "on" : ""}`} role="status">
        {toastMsg}
      </div>

      {/* Header Bar */}
      <div className="hd">
        <div>
          <h1>Onboarding</h1>
          <p>Brand theme, system readiness and operations verification</p>
        </div>
        <div className="sp"></div>
        <span className="pill c-g">100% Ready · Live</span>
      </div>

      {/* Step 0: Onboarding Brand Theme & Color Mode Selection */}
      <div className="cd" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2>Brand Theme & System Palette</h2>
            <p className="sub">
              Selected during onboarding to style the TableOS logo, buttons, table active states, and system accents.
            </p>
          </div>
          <div className="mode-toggle">
            <button
              type="button"
              className={`mode-btn ${colorMode === "light" ? "active" : ""}`}
              onClick={() => {
                setColorMode("light");
                showToast("Parchment Light mode selected");
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
                showToast("Noir Dark mode selected");
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
                  showToast(`${opt.name} selected as restaurant theme`);
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

      {/* Onboarding Checklist Card */}
      <div className="cd">
        <h2>Setup Checklist</h2>
        <p className="sub">All 6 foundational pillars are verified and ready for live dining operations.</p>

        {steps.map((st) => (
          <div key={st.id} className="row" style={{ padding: "14px 0" }}>
            <div style={{ paddingRight: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <b>
                  {st.id}. {st.title}
                </b>
                <span className="pill c-g">{st.status}</span>
              </div>
              <small style={{ marginTop: 4 }}>{st.description}</small>
            </div>
            <div style={{ flex: "none" }}>
              <Link href={st.link} className="btn s sm">
                {st.linkText}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
