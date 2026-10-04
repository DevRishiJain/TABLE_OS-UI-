"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { PolicyModals, ModalType } from "@/components/marketing/PolicyModals";
import { useRestaurantTheme } from "@/components/providers/RestaurantThemeProvider";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const { currentTheme } = useRestaurantTheme?.() ?? { currentTheme: null };
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className="grain"
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        color: "var(--ink)",
        fontFamily: "var(--sans)",
      }}
    >
      {/* ── Fixed Navbar ── */}
      <nav className="tos-nav" style={{ backdropFilter: scrolled ? "blur(12px)" : "none" }}>
        <Link href="/" className="logo" style={{ fontFamily: "var(--serif)" }}>
          Table<em>OS</em>
        </Link>

        <div className="nav-links">
          <a href="#orders">Orders</a>
          <a href="#kds">Kitchen</a>
          <a href="#waiter">Waiter calls</a>
          <a href="#waste">Wastage</a>
          <a href="#venues">Venues</a>
          <a href="#themes">Themes</a>
        </div>

        <a href="#contact" className="btn-brand-sm">
          Book a demo
        </a>
      </nav>

      {/* ── Page content ── */}
      <main style={{ flex: 1 }}>{children}</main>

      {/* ── Footer ── */}
      <footer className="tos-footer">
        <span>
          <strong style={{ color: "var(--ink)", fontFamily: "var(--serif)" }}>
            TableOS
          </strong>{" "}
          · All systems running
        </span>
        <span style={{ display: "flex", gap: 20 }}>
          <button
            style={{ background: "none", border: 0, color: "var(--mute)", cursor: "pointer", font: "inherit" }}
            onClick={() => setActiveModal("privacy")}
          >
            Privacy
          </button>
          <button
            style={{ background: "none", border: 0, color: "var(--mute)", cursor: "pointer", font: "inherit" }}
            onClick={() => setActiveModal("security")}
          >
            Security
          </button>
          <button
            style={{ background: "none", border: 0, color: "var(--mute)", cursor: "pointer", font: "inherit" }}
            onClick={() => setActiveModal("terms")}
          >
            Terms
          </button>
        </span>
      </footer>

      <PolicyModals
        activeModal={activeModal}
        onClose={() => setActiveModal(null)}
      />
    </div>
  );
}
