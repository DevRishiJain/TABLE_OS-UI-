"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store";
import { logoutStaff } from "@/store/slices/authSlice";
import {
  LayoutDashboard,
  LineChart,
  UtensilsCrossed,
  Users,
  Settings,
  Receipt,
  Layers,
  Sparkles,
  LogOut,
  ChevronRight,
  TrendingUp,
  Clock,
  Flame,
  Calendar,
  Layers2,
  PieChart,
  ShieldCheck,
  QrCode,
  ShoppingBag,
  CheckCircle2,
  Package,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { StaffRole } from "@/types/enums";

export default function RestaurantAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const restaurantName = useAppSelector((state) => state.auth.restaurantName) || "Restaurant";
  const router = useRouter();
  const dispatch = useAppDispatch();

  const handleLogout = () => {
    dispatch(logoutStaff());
    router.push("/login");
  };

  return (
    <RoleGuard
      allowedRoles={[
        StaffRole.RESTAURANT_ADMIN,
        StaffRole.RESTAURANT_OWNER,
        StaffRole.MANAGER,
        StaffRole.SUPER_ADMIN,
      ]}
      portalName="Restaurant Management & Analytics Hub"
      fallbackRedirect="/staff/orders"
    >
      <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ink)", display: "flex", flexDirection: "row" }}>
      {/* Sidebar Navigation */}
      <aside style={{ width: 240, background: "var(--panel)", borderRight: "1px solid var(--line)", display: "flex", flexDirection: "column", justifyContent: "space-between", flexShrink: 0, overflowY: "auto" }} className="hidden lg:flex">
        <div className="flex flex-col">
          {/* Brand Header */}
          <div style={{ padding: "20px 16px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Link href="/restaurant/dashboard" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "var(--ink)" }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(115deg, var(--b), var(--b2))", display: "flex", alignItems: "center", justifyContent: "center", color: "#1b1206" }}>
                <UtensilsCrossed style={{ width: 16, height: 16 }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontFamily: "var(--serif)", fontSize: "1.1rem", color: "var(--ink)", lineHeight: 1 }}>
                  Table<em>OS</em>
                </span>
                <span style={{ fontSize: 9, color: "var(--mute)", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700, marginTop: 2 }}>
                  {restaurantName}
                </span>
              </div>
            </Link>
            <span style={{ fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 99, background: "linear-gradient(115deg, var(--b), var(--b2))", color: "#1b1206" }}>Live</span>
          </div>

          {/* Nav Links */}
          <nav style={{ padding: "12px", display: "flex", flexDirection: "column", gap: 2 }}>
            {([
              { href: "/restaurant/dashboard", label: "Executive Overview", Icon: LayoutDashboard, exact: true },
              { href: "/restaurant/orders",    label: "Order History",       Icon: ShoppingBag,    exact: true },
              { href: "/restaurant/analytics", label: "Analytics & P&L",    Icon: LineChart,      exact: true },
              { href: "/restaurant/expenses",  label: "Expenses & Bills",    Icon: Wallet,         exact: true },
              { href: "/restaurant/inventory", label: "Stock & Inventory",   Icon: Package,        exact: true },
              { href: "/restaurant/menu",      label: "Menu & AI Studio",    Icon: Sparkles,       exact: false },
              { href: "/restaurant/tables",    label: "Tables & QR",         Icon: QrCode,         exact: false },
              { href: "/restaurant/staff",     label: "Staff & Roles",       Icon: Users,          exact: false },
              { href: "/restaurant/settlements",label: "Settlements",        Icon: ShieldCheck,    exact: false },
              { href: "/restaurant/onboarding",label: "Onboarding",          Icon: CheckCircle2,   exact: false },
              { href: "/restaurant/settings",  label: "Settings",            Icon: Settings,       exact: false },
            ] as const).map(({ href, label, Icon, exact }) => {
              const active = exact ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    padding: "8px 10px",
                    borderRadius: 10,
                    fontSize: "0.78rem",
                    fontWeight: active ? 700 : 500,
                    textDecoration: "none",
                    transition: "background 0.15s, color 0.15s",
                    color: active ? "#1b1206" : "var(--mute)",
                    background: active ? "linear-gradient(115deg, var(--b), var(--b2))" : "transparent",
                  }}
                  onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = "rgba(244,236,221,0.05)"; (e.currentTarget as HTMLElement).style.color = "var(--ink)"; }}}
                  onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--mute)"; }}}
                >
                  <Icon style={{ width: 14, height: 14, flexShrink: 0 }} />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer info & Logout */}
        <div style={{ padding: "12px 16px", borderTop: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--ink)" }}>{useAppSelector((state) => state.auth.userName) || "Admin"}</span>
            <span style={{ fontSize: 9, color: "var(--mute)", fontFamily: "monospace" }}>
              {useAppSelector((state) => state.auth.employeeId) || "Staff"}
            </span>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            style={{ padding: 7, background: "none", border: 0, color: "var(--mute)", cursor: "pointer", borderRadius: 8, transition: "color 0.2s" }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--late)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--mute)")}
          >
            <LogOut style={{ width: 14, height: 14 }} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflowY: "auto" }}>
        <header style={{ padding: "12px 24px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(20,16,12,0.7)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link
              href="/staff/tables"
              style={{ fontSize: "0.75rem", padding: "6px 12px", borderRadius: 8, background: "rgba(244,236,221,0.05)", border: "1px solid var(--line)", color: "var(--mute)", display: "flex", alignItems: "center", gap: 6, textDecoration: "none", transition: "color 0.2s" }}
            >
              <Layers style={{ width: 13, height: 13, color: "var(--b)" }} />
              <span>Floor Grid</span>
            </Link>
            <Link
              href="/kitchen/queue"
              style={{ fontSize: "0.75rem", padding: "6px 12px", borderRadius: 8, background: "rgba(244,236,221,0.05)", border: "1px solid var(--line)", color: "var(--mute)", display: "flex", alignItems: "center", gap: 6, textDecoration: "none" }}
            >
              Kitchen KDS
            </Link>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: "0.72rem", color: "var(--mute)", fontFamily: "monospace" }}>API Connected</span>
            <span style={{ fontSize: 9, fontWeight: 800, padding: "3px 10px", borderRadius: 99, background: "rgba(91,214,138,0.15)", border: "1px solid rgba(91,214,138,0.4)", color: "var(--ok)" }}>Online</span>
          </div>
        </header>

        <main style={{ padding: 24, flex: 1 }}>{children}</main>
      </div>
    </div>
    </RoleGuard>
  );
}
