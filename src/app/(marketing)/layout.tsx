"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PolicyModals, ModalType } from "@/components/marketing/PolicyModals";
import { useAppDispatch, useAppSelector } from "@/store";
import { logoutStaff, clearCustomerSession } from "@/store/slices/authSlice";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const dispatch = useAppDispatch();
  const staffToken = useAppSelector((state) => state.auth?.staffToken);
  const sessionToken = useAppSelector((state) => state.auth?.sessionToken);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const hasLocal =
      typeof window !== "undefined" &&
      !!(
        localStorage.getItem("tableos_staff_token") ||
        localStorage.getItem("tableos_session_token") ||
        localStorage.getItem("tableos_guard_token")
      );
    setIsLoggedIn(!!staffToken || !!sessionToken || hasLocal);
  }, [staffToken, sessionToken]);

  const handleLogout = () => {
    dispatch(logoutStaff());
    dispatch(clearCustomerSession());
    setIsLoggedIn(false);
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Handle Escape key and lock body scroll while mobile menu is open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };
    if (mobileMenuOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

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

        {/* Desktop Nav Links (Book a demo is a plain text link here) */}
        <div className="nav-links">
          <a href="/#orders">Orders</a>
          <a href="/#kds">Kitchen</a>
          <a href="/#waiter">Waiter calls</a>
          <a href="/#waste">Wastage</a>
          <a href="/#venues">Venues</a>
          <a href="/#themes">Themes</a>
          <a href="/#contact">Book a demo</a>
        </div>

        {/* Desktop Auth Shortcuts */}
        <div className="nav-auth-desktop">
          {isLoggedIn ? (
            <>
              <Link href="/restaurant/dashboard" className="btn-signup">
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="btn-login"
                style={{ padding: "8px 16px", fontSize: "0.82rem" }}
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-login">
                Log in
              </Link>
              <Link href="/signup" className="btn-signup">
                Sign up
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          className="nav-hamburger"
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((prev) => !prev)}
        >
          {mobileMenuOpen ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="4" y1="7" x2="20" y2="7" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="17" x2="20" y2="17" />
            </svg>
          )}
        </button>
      </nav>

      {/* ── Mobile Fullscreen Menu ── */}
      {mobileMenuOpen && (
        <div
          className="mobile-menu-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation Menu"
        >
          <div className="mobile-menu-header">
            <Link
              href="/"
              className="logo"
              style={{ fontFamily: "var(--serif)" }}
              onClick={() => setMobileMenuOpen(false)}
            >
              Table<em>OS</em>
            </Link>
            <button
              className="nav-hamburger"
              aria-label="Close menu"
              onClick={() => setMobileMenuOpen(false)}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <nav className="mobile-menu-links">
            <a href="/#orders" onClick={() => setMobileMenuOpen(false)}>
              Orders
            </a>
            <a href="/#kds" onClick={() => setMobileMenuOpen(false)}>
              Kitchen
            </a>
            <a href="/#waiter" onClick={() => setMobileMenuOpen(false)}>
              Waiter calls
            </a>
            <a href="/#waste" onClick={() => setMobileMenuOpen(false)}>
              Wastage
            </a>
            <a href="/#venues" onClick={() => setMobileMenuOpen(false)}>
              Venues
            </a>
            <a href="/#themes" onClick={() => setMobileMenuOpen(false)}>
              Themes
            </a>
            <a href="/#contact" onClick={() => setMobileMenuOpen(false)}>
              Book a demo
            </a>
          </nav>

          <div className="mobile-menu-actions">
            {isLoggedIn ? (
              <>
                <Link
                  href="/restaurant/dashboard"
                  className="btn-signup"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="btn-login"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="btn-login"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="btn-signup"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      )}

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
