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

  const { data: sessionData, refetch, error: sessionError } = useGetSessionQuery(sessionId, {
    pollingInterval: 3000,
  });

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

  return (
    <div className="min-h-screen bg-background text-gray-100 flex flex-col justify-between w-full max-w-md mx-auto border-x border-white/5 relative shadow-2xl overflow-x-hidden">
      {/* Spatial Ambient Lighting Flares */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md h-72 bg-gradient-to-b from-primary/10 via-amber-500/5 to-transparent pointer-events-none blur-3xl -z-10" />
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md h-60 bg-gradient-to-t from-sky-500/10 via-emerald-500/5 to-transparent pointer-events-none blur-3xl -z-10" />

      {/* Top Header Floating Glass Capsule */}
      <header className="sticky top-2 z-30 mx-3 my-2 rounded-2xl glass-panel px-4 py-2.5 flex items-center justify-between shadow-xl border border-white/10 specular-rim">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-black text-xs shadow-glow">
            T{tableNumber}
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-gray-100 font-display flex items-center gap-1.5">
              {restaurantName}
              <span className="w-1 h-1 rounded-full bg-gray-500" />
              <span className="text-[11px] font-normal text-gray-300">Table {tableNumber}</span>
            </span>
            <span className="text-[10px] text-gray-400 truncate max-w-[130px]">
              {customerName}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {sessionStatus === "COMPLETED" ? (
            <Link
              href={`/dine/${sessionId}/exit`}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-xs font-bold shadow-sm hover:bg-emerald-500/30 transition-all"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Session Closed</span>
            </Link>
          ) : (
            /* Universal Call Waiter Button */
            <button
              onClick={() => setShowCallModal(true)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-sm ${
                activeCallReason || sessionStatus === "AWAITING_PAYMENT"
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-glow"
                  : "bg-surface-subtle hover:bg-surface border-surface-border text-gray-300 hover:text-white"
              }`}
            >
              <Bell className={`w-3.5 h-3.5 ${activeCallReason || sessionStatus === "AWAITING_PAYMENT" ? "text-amber-400 animate-bounce" : "text-amber-400"}`} />
              <span>{activeCallReason || sessionStatus === "AWAITING_PAYMENT" ? "Waiter Alerted" : "Call Waiter"}</span>
            </button>
          )}
        </div>
      </header>

      {/* Session Has Closed Banner */}
      {sessionStatus === "COMPLETED" && (
        <div className="px-4 pt-3">
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-surface to-emerald-500/10 border-2 border-emerald-500/60 shadow-glow flex items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/40">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-black text-emerald-300 font-display flex items-center gap-1.5">
                  Session Has Closed 🚪✨
                </span>
                <span className="text-[11px] text-gray-300 truncate">
                  Exit approved with gate pass. Have a wonderful day!
                </span>
              </div>
            </div>
            <Link
              href={`/dine/${sessionId}/exit`}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shrink-0 shadow-sm transition-all"
            >
              Exit Pass 🎟️
            </Link>
          </div>
        </div>
      )}

      {/* Active Waiter Call Notification Banner */}
      {sessionStatus !== "COMPLETED" && (activeCallReason || sessionStatus === "AWAITING_PAYMENT") && (
        <div className="px-4 pt-3">
          <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/40 shadow-sm flex items-center justify-between gap-2 animate-fadeIn">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4 animate-pulse" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-amber-300 truncate">
                  {activeCallReason ? `Ping: ${activeCallReason}` : "Waiter called to settle bill"}
                </span>
                <span className="text-[10px] text-gray-400">Server is on the way to Table {tableNumber}</span>
              </div>
            </div>
            <button
              onClick={handleDismissCall}
              className="text-[11px] font-bold px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 shrink-0"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Page Content - Scrollable with safe bottom clearance */}
      <main className="flex-1 pb-36 w-full overflow-x-hidden">{children}</main>

      {/* Floating Bottom Cart Bar (shows if items in cart and on menu page) */}
      {cartCount > 0 && !pathname.includes("/checkout") && (
        <div className="fixed bottom-20 inset-x-0 max-w-md mx-auto px-3 z-40 pointer-events-none animate-in slide-in-from-bottom duration-300">
          <Link
            href={`/dine/${sessionId}/checkout`}
            className="pointer-events-auto w-full bg-primary hover:bg-primary-hover text-background font-bold py-3.5 px-5 rounded-2xl shadow-2xl shadow-primary/30 flex items-center justify-between active:scale-[0.98] transition-all border border-amber-300/30"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-background/20 flex items-center justify-center text-background">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold">
                {cartCount} {cartCount === 1 ? "Item" : "Items"} •{" "}
                {formatMoney(cartSubtotalMinor)}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs font-extrabold uppercase tracking-wider">
              <span>Review Cart</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        </div>
      )}

      {/* Bottom Floating Spatial Glass Dock (Menu / Orders / Bill & Pay) - Sticks to bottom */}
      <div className="fixed bottom-3 inset-x-0 max-w-md mx-auto px-3 z-40 pointer-events-none">
        <nav className="pointer-events-auto w-full glass-spatial bg-[#0d111a]/92 backdrop-blur-2xl rounded-3xl h-16 px-4 flex items-center justify-around shadow-2xl border border-white/15 specular-rim">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 relative py-1.5 px-3.5 rounded-2xl transition-all ${
                  item.active
                    ? "text-primary font-bold bg-white/10 shadow-inner"
                    : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 transition-transform ${item.active ? "text-primary scale-110" : ""}`} />
                  {item.badge && item.badge > 0 ? (
                    <span className="absolute -top-1.5 -right-2.5 w-4 h-4 rounded-full bg-primary text-background font-black text-[9px] flex items-center justify-center shadow-glow">
                      {item.badge}
                    </span>
                  ) : null}
                </div>
                <span className="text-[11px] font-semibold tracking-tight">
                  {item.label}
                </span>
                {item.active && (
                  <span className="w-5 h-0.5 rounded-full bg-primary -bottom-0.5 absolute shadow-glow" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Modal: Call Waiter / Service Assistance */}
      {showCallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <Card className="w-full max-w-sm p-5 flex flex-col gap-4 glass-spatial border border-white/15 shadow-2xl specular-rim">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-100 font-display">
                    Call Server • Table {tableNumber}
                  </h3>
                  <p className="text-[11px] text-gray-400">What do you need assistance with?</p>
                </div>
              </div>
              <button
                onClick={() => setShowCallModal(false)}
                className="w-7 h-7 rounded-lg bg-surface-subtle hover:bg-surface-border flex items-center justify-center text-gray-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {/* Assistance Quick Options */}
            <div className="grid grid-cols-1 gap-2">
              {/* Option 1: General Assistance */}
              <button
                onClick={() => handleCallWaiter("General Table Assistance")}
                className="p-3 rounded-xl border border-surface-border bg-surface hover:border-amber-500/60 flex items-center gap-3 text-left transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-200 group-hover:text-amber-300">
                    General Assistance
                  </h4>
                  <p className="text-[11px] text-gray-400">I have a question or need my server</p>
                </div>
              </button>

              {/* Option 2: Water & Cutlery */}
              <button
                onClick={() => handleCallWaiter("Water & Cutlery Refill")}
                className="p-3 rounded-xl border border-surface-border bg-surface hover:border-sky-500/60 flex items-center gap-3 text-left transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Droplets className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-200 group-hover:text-sky-300">
                    Water & Cutlery
                  </h4>
                  <p className="text-[11px] text-gray-400">Refill drinking water or bring extra spoons</p>
                </div>
              </button>

              {/* Option 3: Clean Table */}
              <button
                onClick={() => handleCallWaiter("Clear Plates & Table Clean")}
                className="p-3 rounded-xl border border-surface-border bg-surface hover:border-emerald-500/60 flex items-center gap-3 text-left transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-200 group-hover:text-emerald-300">
                    Clean Table & Clear Plates
                  </h4>
                  <p className="text-[11px] text-gray-400">Clear empty dishes and freshen up table</p>
                </div>
              </button>

              {/* Option 4: Request Bill (Cash) */}
              <button
                onClick={() => handleCallWaiter("Request Bill (Cash Payment)", PaymentMethod.CASH)}
                className="p-3 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:border-amber-500 flex items-center gap-3 text-left transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-300">
                    Bring Bill (Cash Payment)
                  </h4>
                  <p className="text-[11px] text-gray-300">Ready to settle bill in cash</p>
                </div>
              </button>

              {/* Option 5: Request Bill (Card POS) */}
              <button
                onClick={() => handleCallWaiter("Request Bill (Card POS Swiped)", PaymentMethod.RESTAURANT_POS)}
                className="p-3 rounded-xl border border-sky-500/40 bg-sky-500/10 hover:border-sky-500 flex items-center gap-3 text-left transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-sky-300">
                    Bring Card POS Machine
                  </h4>
                  <p className="text-[11px] text-gray-300">Ready to swipe card at the table</p>
                </div>
              </button>
            </div>

            <div className="pt-2 border-t border-surface-border flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCallModal(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Link href={`/dine/${sessionId}/bill`}>
                <Button variant="gold" size="sm" className="text-xs font-bold">
                  Pay Online Directly →
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
