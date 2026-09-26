"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { Utensils, Clock, Receipt, ShoppingBag, ArrowRight, Sparkles } from "lucide-react";
import { useAppSelector } from "@/store";
import { selectCartTotalCount, selectCartSubtotalMinor } from "@/store/slices/cartSlice";
import { formatMoney } from "@/lib/money";
import { useGetSessionQuery } from "@/store/api/customerApi";
import { Badge } from "@/components/ui/Badge";

export default function CustomerDineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const params = useParams();
  const sessionId = params.sessionId as string;

  const { data: sessionData } = useGetSessionQuery(sessionId, {
    pollingInterval: 10000,
  });

  const cartCount = useAppSelector(selectCartTotalCount);
  const cartSubtotalMinor = useAppSelector(selectCartSubtotalMinor);
  const customerName = useAppSelector((state) => state.auth.customerName) || "Guest Diner";

  const sessionStatus = sessionData?.session?.status || "OPEN";

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
    <div className="min-h-screen bg-background text-gray-100 flex flex-col justify-between w-full max-w-md mx-auto border-x border-surface-border/40 relative shadow-2xl overflow-x-hidden">
      {/* Top Header */}
      <header className="sticky top-0 z-30 glass-panel border-b border-surface-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-bold text-xs shadow-glow">
            T1
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-gray-100 font-display flex items-center gap-1.5">
              The Spice Route
              <span className="w-1 h-1 rounded-full bg-gray-500" />
              <span className="text-[11px] font-normal text-gray-300">Table 1</span>
            </span>
            <span className="text-[10px] text-gray-400">
              Welcome, {customerName}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {sessionStatus === "OPEN" && (
            <Badge variant="amber" size="sm" dot>
              Active Session
            </Badge>
          )}
          {sessionStatus === "OPEN_VERIFIED" && (
            <Badge variant="success" size="sm" dot>
              Verified Active
            </Badge>
          )}
          {sessionStatus === "AWAITING_PAYMENT" && (
            <Badge variant="gold" size="sm" dot>
              Awaiting Payment
            </Badge>
          )}
          {sessionStatus === "PAID" && (
            <Badge variant="success" size="sm">
              Bill Paid
            </Badge>
          )}
        </div>
      </header>

      {/* Main Page Content */}
      <main className="flex-1 pb-32 w-full overflow-x-hidden">{children}</main>

      {/* Floating Bottom Cart Bar (shows if items in cart and on menu page) */}
      {cartCount > 0 && !pathname.includes("/checkout") && (
        <div className="fixed bottom-16 left-0 right-0 max-w-md mx-auto px-4 z-40 animate-in slide-in-from-bottom duration-300">
          <Link
            href={`/dine/${sessionId}/checkout`}
            className="w-full bg-primary hover:bg-primary-hover text-background font-bold py-3.5 px-5 rounded-2xl shadow-xl shadow-primary/25 flex items-center justify-between active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-background/20 flex items-center justify-center text-background">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <span className="text-sm">
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

      {/* Bottom Sticky Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto glass-panel border-t border-surface-border h-16 z-30 px-6 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 relative py-1 px-3 rounded-xl transition-all ${
                item.active
                  ? "text-primary font-bold"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${item.active ? "text-primary scale-110" : ""}`} />
                {item.badge && item.badge > 0 ? (
                  <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-primary text-background font-black text-[9px] flex items-center justify-center">
                    {item.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[11px] font-medium tracking-tight">
                {item.label}
              </span>
              {item.active && (
                <span className="w-4 h-0.5 rounded-full bg-primary -bottom-1 absolute" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
