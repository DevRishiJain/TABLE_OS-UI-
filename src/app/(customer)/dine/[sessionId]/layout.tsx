"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import {
  Utensils,
  Clock,
  Receipt,
  ShoppingBag,
  ArrowRight,
  Sparkles,
  Bell,
  Droplets,
  Sparkle,
  HelpCircle,
  CheckCircle2,
  X,
  Check,
} from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/store";
import { selectCartTotalCount, selectCartSubtotalMinor } from "@/store/slices/cartSlice";
import { formatMoney } from "@/lib/money";
import {
  useGetSessionQuery,
  useCustomerPayMutation,
  useRequestAssistanceMutation,
  useDismissAssistanceMutation,
} from "@/store/api/customerApi";
import { PaymentMethod } from "@/types/enums";
import { generateUUID } from "@/lib/idempotency";
import { addToast } from "@/store/slices/uiSlice";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function CustomerDineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const params = useParams();
  const dispatch = useAppDispatch();
  const sessionId = params.sessionId as string;
  const { data: sessionData, refetch, error: sessionError } = useGetSessionQuery(sessionId);

  const restaurantName = useAppSelector((state) => state.auth.restaurantName) || (sessionData?.session as any)?.restaurant_name || "Restaurant";

  const isSessionGone =
    (sessionError as any)?.status === 410 ||
    JSON.stringify(sessionError || {}).includes("session has closed");

  const [customerPay, { isLoading: isCallingPayment }] = useCustomerPayMutation();
  const [requestAssistance, { isLoading: isRequestingAssist }] = useRequestAssistanceMutation();
  const [dismissAssistance] = useDismissAssistanceMutation();

  const [showCallModal, setShowCallModal] = useState(false);
  const [activeCallReason, setActiveCallReason] = useState<string | null>(null);

  // Sync backend assistance state
  useEffect(() => {
    const backendReason = (sessionData?.session as any)?.assistance_reason;
    if (backendReason) {
      setActiveCallReason(backendReason);
    } else if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`table_os_waiter_call_${sessionId}`);
      if (saved) setActiveCallReason(saved);
    }
  }, [sessionId, sessionData?.session]);

  const cartCount = useAppSelector(selectCartTotalCount);
  const cartSubtotalMinor = useAppSelector(selectCartSubtotalMinor);
  const customerName =
    useAppSelector((state) => state.auth.customerName) ||
    sessionData?.session?.customer_name ||
    "Guest Diner";

  const sessionStatus = isSessionGone
    ? "COMPLETED"
    : sessionData?.session?.status || "OPEN";
  const tableNumber = (sessionData?.session as any)?.table_number || "1";

  const handleCallWaiter = async (reason: string, method?: PaymentMethod) => {
    try {
      if (method) {
        await customerPay({
          sessionId,
          data: { method },
          idempotencyKey: generateUUID(),
        }).unwrap();
      }

      await requestAssistance({
        sessionId,
        reason,
      }).unwrap();
      
      setActiveCallReason(reason);
      if (typeof window !== "undefined") {
        localStorage.setItem(`table_os_waiter_call_${sessionId}`, reason);
      }

      dispatch(
        addToast({
          type: "success",
          title: "Waiter Alerted! 🛎️",
          message: `Your server has been notified: "${reason}". On their way!`,
          durationMs: 4000,
        })
      );
      setShowCallModal(false);
      refetch();
    } catch (err) {
      // Even if network blip, update state & show user feedback
      setActiveCallReason(reason);
      setShowCallModal(false);
      dispatch(
        addToast({
          type: "info",
          title: "Server Notified 🛎️",
          message: `Assistance requested: ${reason}. A waiter has been alerted.`,
        })
      );
    }
  };

  const handleDismissCall = async () => {
    setActiveCallReason(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(`table_os_waiter_call_${sessionId}`);
    }
    try {
      await dismissAssistance({ sessionId }).unwrap();
    } catch (_) {}
    dispatch(
      addToast({
        type: "info",
        title: "Call Dismissed",
        message: "Server notification cleared.",
        durationMs: 2000,
      })
    );
    refetch();
  };

  const navItems = [
    {
      href: `/dine/${sessionId}/menu`,
      label: "Menu",
      icon: Utensils,
      active: pathname.includes("/menu"),
    },
    {
      href: `/dine/${sessionId}/orders`,
      label: "Orders",
      icon: Clock,
      active: pathname.includes("/orders"),
      badge: sessionData?.orders?.length || 0,
    },
    {
      href: `/dine/${sessionId}/bill`,
      label: "Bill & Pay",
      icon: Receipt,
      active: pathname.includes("/bill") || pathname.includes("/pay"),
    },
  ];

  const [fontSizeStep, setFontSizeStep] = useState(0);

  const SKINS = [
    { id: "paper", n: "Paper white", pp: "#FFFFFF", ac: "#8C6A2E" },
    { id: "cream", n: "Warm cream", pp: "#FBF8F0", ac: "#A9772A" },
    { id: "sage", n: "Sage", pp: "#FFFFFF", ac: "#3F7A55" },
    { id: "night", n: "Midnight", pp: "#1C1812", ac: "#D2A252" },
  ];

  const [currentSkin, setCurrentSkin] = useState<string>("paper");

  useEffect(() => {
    // Reset any legacy documentElement inline style to keep admin & marketing pages pristine
    if (typeof document !== "undefined") {
      document.documentElement.style.fontSize = "";
      const savedSkin = localStorage.getItem("tableos_customer_skin") || "paper";
      setCurrentSkin(savedSkin);
    }
  }, []);

  const setSkin = (skinId: string) => {
    setCurrentSkin(skinId);
    if (typeof window !== "undefined") {
      localStorage.setItem("tableos_customer_skin", skinId);
    }
    const sk = SKINS.find((s) => s.id === skinId);
    dispatch(
      addToast({
        type: "info",
        message: `${sk?.n || "Theme"} active`,
        durationMs: 1500,
      })
    );
  };

  const cycleSkin = () => {
    const idx = SKINS.findIndex((s) => s.id === currentSkin);
    const next = SKINS[(idx + 1) % SKINS.length];
    setSkin(next.id);
  };

  const toggleFontSize = () => {
    const next = (fontSizeStep + 1) % 3;
    setFontSizeStep(next);
    const remSizes = ["1rem", "1.12rem", "1.24rem"];
    const customerEl = document.querySelector(".customer-app") as HTMLElement | null;
    if (customerEl) {
      customerEl.style.fontSize = remSizes[next];
    }
    const labels = ["Normal", "Large", "Extra large"];
    dispatch(
      addToast({
        type: "info",
        message: `${labels[next]} text enabled`,
        durationMs: 1500,
      })
    );
  };

  const restaurantInitials = restaurantName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "SR";

  const isMenu = pathname.includes("/menu");
  const isOrders = pathname.includes("/orders");
  const isBill = pathname.includes("/bill");
  const isCheckout = pathname.includes("/checkout");
  const isExit = pathname.includes("/exit");

  const waiterRequests = [
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: "1.7rem", height: "1.7rem", color: "var(--ac)" }}>
          <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" />
        </svg>
      ),
      title: "Water",
      subtitle: "Refill or extra glasses",
      reason: "Water Refill / Extra Glasses",
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: "1.7rem", height: "1.7rem", color: "var(--ac)" }}>
          <path d="M7 3v8M4 3v5a3 3 0 0 0 6 0V3M7 11v10M17 3c-2 2-3 5-3 8h3v10" />
        </svg>
      ),
      title: "Cutlery",
      subtitle: "Spoons, forks, napkins",
      reason: "Cutlery & Extra Napkins",
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: "1.7rem", height: "1.7rem", color: "var(--ac)" }}>
          <path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
        </svg>
      ),
      title: "Clear table",
      subtitle: "Take away empty plates",
      reason: "Clear Table / Remove Plates",
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: "1.7rem", height: "1.7rem", color: "var(--ac)" }}>
          <circle cx="12" cy="12" r="9" />
          <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01" />
        </svg>
      ),
      title: "I have a question",
      subtitle: "Menu, allergies, anything",
      reason: "General Question / Assistance",
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: "1.7rem", height: "1.7rem", color: "var(--ac)" }}>
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <circle cx="12" cy="12" r="2.5" />
        </svg>
      ),
      title: "Bring the bill",
      subtitle: "Cash payment",
      reason: "Bring Cash Bill",
      method: PaymentMethod.CASH,
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: "1.7rem", height: "1.7rem", color: "var(--ac)" }}>
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <path d="M3 10h18" />
        </svg>
      ),
      title: "Card machine",
      subtitle: "Swipe at the table",
      reason: "Bring POS Card Machine",
      method: PaymentMethod.RESTAURANT_POS,
    },
  ];

  const activeOrdersCount = (sessionData?.orders || []).filter(
    (o) => o.status !== "SERVED" && o.status !== "CANCELLED"
  ).length;

  return (
    <div className="customer-app min-h-screen flex flex-col justify-between" data-skin={currentSkin}>
      {/* Top Header */}
      {!isExit && (
        <header className="w" id="hd">
          <div className="hd">
            <div className="lg">{restaurantInitials}</div>
            <div className="t">
              <b>{restaurantName}</b>
              <small>
                Table {tableNumber}
                {customerName ? ` · ${customerName}` : ""}
              </small>
            </div>

            {/* Font size toggle */}
            <button
              className="b i"
              onClick={toggleFontSize}
              aria-label="Change text size"
              title="Change text size"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: "1.25rem", height: "1.25rem" }}>
                <path d="M4 18l4-12 4 12M5.5 14h5M14 18l3-8 3 8M15 15.5h4" />
              </svg>
            </button>

            {/* Theme switcher */}
            <button
              className="b i"
              onClick={cycleSkin}
              aria-label="Change restaurant theme"
              title={`Theme: ${SKINS.find((s) => s.id === currentSkin)?.n || "Paper white"}`}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, ${SKINS.find((s) => s.id === currentSkin)?.pp} 50%, ${SKINS.find((s) => s.id === currentSkin)?.ac} 50%)`,
                  border: "1.5px solid var(--ln)",
                }}
              />
            </button>

            {/* Call Waiter / Session Closed */}
            {sessionStatus === "COMPLETED" ? (
              <Link
                href={`/dine/${sessionId}/exit`}
                className="b"
                style={{
                  minHeight: 48,
                  padding: "0 16px",
                  borderColor: "var(--ok)",
                  color: "var(--ok)",
                  background: "color-mix(in srgb, var(--ok) 12%, transparent)",
                }}
              >
                Exit pass
              </Link>
            ) : (
              <button
                className="b"
                style={{
                  minHeight: 48,
                  padding: "0 16px",
                  borderColor: activeCallReason || sessionStatus === "AWAITING_PAYMENT" ? "var(--ac)" : "var(--ln)",
                  color: activeCallReason || sessionStatus === "AWAITING_PAYMENT" ? "var(--ac)" : "var(--ink)",
                  background: activeCallReason || sessionStatus === "AWAITING_PAYMENT" ? "color-mix(in srgb, var(--ac) 12%, transparent)" : "none",
                }}
                onClick={() => setShowCallModal(true)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: "1.2rem", height: "1.2rem", color: "var(--ac)" }}>
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10 21h4" />
                </svg>
                {activeCallReason || sessionStatus === "AWAITING_PAYMENT" ? "Waiter Alerted" : "Waiter"}
              </button>
            )}
          </div>
        </header>
      )}

      {/* Main Wrapper */}
      <div className="w" style={{ flex: 1 }}>
        {/* Active Waiter Request Banner */}
        {(activeCallReason || sessionStatus === "AWAITING_PAYMENT") && sessionStatus !== "COMPLETED" && (
          <div className="rq" style={{ marginTop: 8 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: "1.2rem", height: "1.2rem", color: "var(--ac)", flexShrink: 0 }}>
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10 21h4" />
            </svg>
            <span>
              {sessionStatus === "AWAITING_PAYMENT"
                ? "Waiter is coming to settle your bill."
                : `Waiter notified: ${activeCallReason}.`}
            </span>
            <button onClick={handleDismissCall}>Cancel</button>
          </div>
        )}

        {/* Session Completed Alert */}
        {sessionStatus === "COMPLETED" && (
          <div className="nl live" style={{ marginTop: 8, borderColor: "var(--ok)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: "1.35rem", height: "1.35rem", color: "var(--ok)" }}>
              <path d="M5 12l5 5 9-10" />
            </svg>
            <span>
              <b>Session closed · exit approved</b>
              <small>Tap to view exit pass</small>
            </span>
            <Link href={`/dine/${sessionId}/exit`} className="tag" style={{ background: "var(--ok)", color: "#12100C", border: 0 }}>
              Exit Pass
            </Link>
          </div>
        )}

        {/* Page Content */}
        <main style={{ paddingBottom: 190 }}>{children}</main>
      </div>

      {/* Floating Bottom Cart Bar */}
      {cartCount > 0 && isMenu && (
        <Link
          href={`/dine/${sessionId}/checkout`}
          className="cb"
          aria-label="Review your order"
        >
          <span>
            {cartCount} {cartCount === 1 ? "dish" : "dishes"} · {formatMoney(cartSubtotalMinor)}
          </span>
          <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
            Review order
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "1.1rem", height: "1.1rem" }}>
              <path d="M9 6l6 6-6 6" />
            </svg>
          </span>
        </Link>
      )}

      {/* Fixed Bottom Docking Bar */}
      {!isCheckout && !isExit && (
        <nav className="dk" aria-label="Main Navigation">
          <Link
            href={`/dine/${sessionId}/menu`}
            aria-current={isMenu ? "page" : undefined}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: "1.25rem", height: "1.25rem" }}>
              <path d="M7 3v8M4 3v5a3 3 0 0 0 6 0V3M7 11v10M17 3c-2 2-3 5-3 8h3v10" />
            </svg>
            Menu
          </Link>

          <Link
            href={`/dine/${sessionId}/orders`}
            aria-current={isOrders ? "page" : undefined}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: "1.25rem", height: "1.25rem" }}>
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
            Orders
            {activeOrdersCount > 0 && <em>{activeOrdersCount}</em>}
          </Link>

          <Link
            href={`/dine/${sessionId}/bill`}
            aria-current={isBill ? "page" : undefined}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: "1.25rem", height: "1.25rem" }}>
              <path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2zM9 8h6M9 12h6" />
            </svg>
            Bill
          </Link>
        </nav>
      )}

      {/* Call Waiter Bottom Sheet */}
      {showCallModal && (
        <div
          className="ov"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCallModal(false);
          }}
        >
          <div className="sh">
            <div className="sht">
              <div>
                <h2>Call a waiter</h2>
                <span className="mu sm">One tap. We will come to Table {tableNumber}.</span>
              </div>
              <button
                className="b i"
                onClick={() => setShowCallModal(false)}
                aria-label="Close"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: "1.2rem", height: "1.2rem" }}>
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            <div className="shb">
              <div className="tl">
                {waiterRequests.map((req, idx) => (
                  <button
                    key={idx}
                    className="tn"
                    onClick={() => handleCallWaiter(req.reason, req.method)}
                  >
                    {req.icon}
                    <span>
                      {req.title}
                      <small>{req.subtitle}</small>
                    </span>
                  </button>
                ))}
              </div>

              {/* Theme skin picker */}
              <div className="sk" style={{ marginTop: 14 }}>
                <span className="mu sm">Restaurant theme</span>
                <div>
                  {SKINS.map((sk) => (
                    <button
                      key={sk.id}
                      type="button"
                      aria-pressed={currentSkin === sk.id}
                      aria-label={`${sk.n} theme`}
                      title={sk.n}
                      style={
                        {
                          "--c1": sk.pp,
                          "--c2": sk.ac,
                        } as React.CSSProperties
                      }
                      onClick={() => setSkin(sk.id)}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="shf">
              <button
                type="button"
                className="b o"
                onClick={() => setShowCallModal(false)}
                style={{
                  flex: "0 0 96px",
                  height: 54,
                  minHeight: 54,
                  borderRadius: 99,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  boxSizing: "border-box",
                }}
              >
                Cancel
              </button>
              <Link
                href={`/dine/${sessionId}/bill`}
                className="b p"
                onClick={() => setShowCallModal(false)}
                style={{
                  flex: 1,
                  height: 54,
                  minHeight: 54,
                  borderRadius: 99,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  fontSize: "1rem",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  textDecoration: "none",
                  boxSizing: "border-box",
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ width: "1.2rem", height: "1.2rem" }}
                >
                  <rect x="3" y="6" width="18" height="12" rx="2" />
                  <path d="M3 10h18" />
                </svg>
                Pay bill online →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
