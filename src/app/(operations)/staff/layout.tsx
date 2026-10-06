"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store";
import { logoutStaff } from "@/store/slices/authSlice";
import { addToast } from "@/store/slices/uiSlice";
import { useGetStaffTablesQuery } from "@/store/api/staffApi";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { StaffRole } from "@/types/enums";
import {
  Layers,
  ClipboardList,
  Banknote,
  LogOut,
  Utensils,
  ChefHat,
  LayoutDashboard,
  Bell,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { wsClient } from "@/lib/ws";
import { playWaiterBell } from "@/lib/audio";

function playNotificationChime() {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch (e) {
    // Autoplay policy fallback
  }
}

export default function StaffOperationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const userName = useAppSelector((state) => state.auth.userName) || "Floor Staff";
  const restaurantName = useAppSelector((state) => state.auth.restaurantName) || "Restaurant";
  const restaurantSlug = useAppSelector((state) => state.auth.restaurantSlug);
  const staffRole = useAppSelector((state) => state.auth.staffRole) || "WAITER";
  const employeeId = useAppSelector((state) => state.auth.employeeId);
  const restaurantId = useAppSelector((state) => state.auth.restaurantId) || undefined;
  const { data: tablesData } = useGetStaffTablesQuery();

  const activeAssistanceTables = (tablesData || []).filter(
    (t) => Boolean(t.assistance_reason)
  );
  const serviceCallsCount = activeAssistanceTables.length;

  // Track previous count to sound alert on new calls
  const prevCallsCountRef = useRef(serviceCallsCount);
  useEffect(() => {
    if (mounted && serviceCallsCount > prevCallsCountRef.current) {
      playNotificationChime();
      const latest = activeAssistanceTables[0];
      const tableLabel = latest ? `Table ${latest.table_number}` : "Diner";
      const reason = latest?.assistance_reason || "Assistance Requested";
      dispatch(
        addToast({
          type: "warning",
          title: `🛎️ ${tableLabel} Calling Waiter!`,
          message: `Reason: "${reason}" • Please attend immediately.`,
          durationMs: 6000,
        })
      );
    }
    prevCallsCountRef.current = serviceCallsCount;
  }, [mounted, serviceCallsCount, activeAssistanceTables, dispatch]);

  // Real-time assistance alerts via direct WebSocket push
  useEffect(() => {
    wsClient.connect();

    const unsubAssistance = wsClient.on("ASSISTANCE_REQUESTED", (env) => {
      playWaiterBell();
      const reason = (env?.d as any)?.assistance_reason || "Assistance Requested";
      const tableNumber = (env?.d as any)?.table_number || "Diner";
      dispatch(
        addToast({
          type: "warning",
          title: `🛎️ Table ${tableNumber} Calling Waiter!`,
          message: `Reason: "${reason}" • Please attend immediately.`,
          durationMs: 6000,
        })
      );
    });

    const unsubOrderPlaced = wsClient.on("ORDER_PLACED", (env) => {
      playWaiterBell();
      const tableNumber = (env?.d as any)?.table_number || "Diner";
      dispatch(
        addToast({
          type: "info",
          title: `📋 New Order from ${tableNumber}`,
          message: `New order placed. Needs review/acceptance.`,
          durationMs: 4000,
        })
      );
    });

    return () => {
      unsubAssistance();
      unsubOrderPlaced();
    };
  }, [dispatch]);

  const handleLogout = () => {
    dispatch(logoutStaff());
    router.push("/staff/login");
  };

  const isManagerOrAdmin = [
    StaffRole.MANAGER,
    StaffRole.RESTAURANT_ADMIN,
    StaffRole.RESTAURANT_OWNER,
    StaffRole.SUPER_ADMIN,
  ].includes(staffRole as StaffRole);

  const isKitchen = staffRole === StaffRole.KITCHEN;

  const navLinks = [
    {
      href: "/staff/tables",
      label: "Tables Floor",
      icon: Layers,
      active: pathname.includes("/staff/tables"),
    },
    {
      href: "/staff/orders",
      label: "Order Queue",
      icon: ClipboardList,
      active: pathname.includes("/staff/orders"),
    },
    {
      href: "/staff/payments",
      label: "Cash / POS Payments",
      icon: Banknote,
      active: pathname.includes("/staff/payments"),
    },
  ];

  // If on /staff/orders or /staff/tables, Floor Final provides its own complete top bar and mobile navigation
  const isFloorView =
    pathname.startsWith("/staff/orders") || pathname.startsWith("/staff/tables");

  return (
    <RoleGuard
      allowedRoles={[
        StaffRole.WAITER,
        StaffRole.CASHIER,
        StaffRole.MANAGER,
        StaffRole.RESTAURANT_ADMIN,
        StaffRole.RESTAURANT_OWNER,
        StaffRole.SUPER_ADMIN,
      ]}
      portalName="Floor Waiter & POS Operations Suite"
      fallbackRedirect="/staff/login"
    >
      {isFloorView ? (
        <div className="w-full min-h-screen">
          {children}
        </div>
      ) : (
        <div className="min-h-screen bg-background text-gray-100 flex flex-col">
          {/* Staff Operational Topbar */}
          <header className="sticky top-0 z-40 glass-panel border-b border-surface-border px-4 sm:px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/staff/orders" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary shadow-glow">
                  <Utensils className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-gray-100 font-display">
                      {mounted ? restaurantName : "Restaurant"}
                    </span>
                    {mounted && restaurantSlug && (
                      <span className="text-[10px] text-amber-400 font-mono bg-amber-500/10 px-1.5 py-0.5 rounded-md border border-amber-500/20">
                        @{restaurantSlug}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono">
                    Floor Operations Suite
                  </span>
                </div>
              </Link>
              <Badge variant="amber" size="sm" suppressHydrationWarning>
                {mounted ? staffRole : "WAITER"}
              </Badge>
              {mounted && employeeId && (
                <span className="hidden sm:inline px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-primary/20 text-primary border border-primary/40">
                  {employeeId}
                </span>
              )}
            </div>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      link.active
                        ? "bg-primary text-background font-bold shadow-md shadow-primary/20"
                        : "text-gray-300 hover:text-gray-100 hover:bg-surface-hover"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Cross-Link Tools, Live Waiter Bell & Logout */}
            <div className="flex items-center gap-2.5">
              {serviceCallsCount > 0 && (
                <Link
                  href="/staff/orders"
                  title="Active customer assistance requests"
                  className="px-3 py-1.5 rounded-xl bg-red-500/20 text-red-300 border border-red-500/50 text-xs font-bold flex items-center gap-1.5 animate-pulse shadow-lg shadow-red-500/20 hover:bg-red-500/30 transition-colors"
                >
                  <Bell className="w-4 h-4 text-red-400 animate-bounce" />
                  <span className="font-mono">
                    {serviceCallsCount} CALL{serviceCallsCount > 1 ? "S" : ""}
                  </span>
                </Link>
              )}

              {(isManagerOrAdmin || isKitchen) && (
                <Link
                  href="/kitchen/queue"
                  title="Open Kitchen KDS"
                  className="p-2 rounded-xl bg-surface-subtle hover:bg-surface-hover border border-surface-border text-amber-400 text-xs flex items-center gap-1"
                >
                  <ChefHat className="w-4 h-4" />
                  <span className="hidden sm:inline">KDS</span>
                </Link>
              )}

              {isManagerOrAdmin && (
                <Link
                  href="/restaurant/dashboard"
                  title="Open Admin Dashboard"
                  className="p-2 rounded-xl bg-surface-subtle hover:bg-surface-hover border border-surface-border text-gray-300 text-xs flex items-center gap-1"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden sm:inline">Admin</span>
                </Link>
              )}

              <button
                onClick={handleLogout}
                title="Sign out"
                className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* Mobile Sub-Navigation */}
          <div className="md:hidden glass-panel border-b border-surface-border px-4 py-2 flex items-center justify-around text-xs">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`py-1 px-2.5 rounded-lg ${
                  link.active
                    ? "bg-primary text-background font-bold"
                    : "text-gray-400"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Main Operations Body */}
          <main className="flex-1 p-4 sm:p-6 w-full">{children}</main>
        </div>
      )}
    </RoleGuard>
  );
}
