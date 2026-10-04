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
      <div className="min-h-screen bg-background text-gray-100 flex flex-col lg:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full lg:w-72 bg-[#12151B] border-r border-surface-border flex flex-col justify-between shrink-0">
        <div className="flex flex-col">
          {/* Brand Header */}
          <div className="p-6 border-b border-surface-border flex items-center justify-between">
            <Link href="/restaurant/dashboard" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary shadow-glow">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-sm font-display text-gray-100">
                  {restaurantName}
                </span>
                <span className="text-[10px] text-gray-400 font-mono tracking-widest uppercase">
                  Tenant Portal
                </span>
              </div>
            </Link>
            <Badge variant="gold" size="sm">
              Live
            </Badge>
          </div>

          {/* Nav Links */}
          <nav className="p-4 flex flex-col gap-1.5 text-xs font-semibold overflow-y-auto max-h-[calc(100vh-140px)]">
            <Link
              href="/restaurant/dashboard"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors ${
                pathname === "/restaurant/dashboard"
                  ? "bg-primary text-background font-bold shadow-md shadow-primary/20"
                  : "text-gray-300 hover:text-white hover:bg-surface-hover"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Executive Overview</span>
            </Link>

            {/* Order History & Logs */}
            <Link
              href="/restaurant/orders"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors ${
                pathname === "/restaurant/orders"
                  ? "bg-primary text-background font-bold shadow-md shadow-primary/20"
                  : "text-gray-300 hover:text-white hover:bg-surface-hover"
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-emerald-400" />
              <span>Order History & Logs</span>
            </Link>

            {/* Consolidated Analytics & P&L */}
            <Link
              href="/restaurant/analytics"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors ${
                pathname === "/restaurant/analytics"
                  ? "bg-primary text-background font-bold shadow-md shadow-primary/20"
                  : "text-gray-300 hover:text-white hover:bg-surface-hover"
              }`}
            >
              <LineChart className="w-4 h-4 text-primary" />
              <span>Analytics & P&L</span>
            </Link>

            {/* Expenses & Bills */}
            <Link
              href="/restaurant/expenses"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors ${
                pathname === "/restaurant/expenses"
                  ? "bg-primary text-background font-bold shadow-md shadow-primary/20"
                  : "text-gray-300 hover:text-white hover:bg-surface-hover"
              }`}
            >
              <Wallet className="w-4 h-4 text-rose-400" />
              <span>Expenses & Bills</span>
            </Link>

            {/* Stock & Inventory */}
            <Link
              href="/restaurant/inventory"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors ${
                pathname === "/restaurant/inventory"
                  ? "bg-primary text-background font-bold shadow-md shadow-primary/20"
                  : "text-gray-300 hover:text-white hover:bg-surface-hover"
              }`}
            >
              <Package className="w-4 h-4 text-cyan-400" />
              <span>Stock & Inventory</span>
            </Link>

            {/* Menu Studio */}
            <Link
              href="/restaurant/menu"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors ${
                pathname.includes("/restaurant/menu")
                  ? "bg-primary text-background font-bold shadow-md shadow-primary/20"
                  : "text-gray-300 hover:text-white hover:bg-surface-hover"
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Menu & AI OCR Studio</span>
            </Link>

            {/* Tables & QR Standees */}
            <Link
              href="/restaurant/tables"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors ${
                pathname.includes("/restaurant/tables")
                  ? "bg-primary text-background font-bold shadow-md shadow-primary/20"
                  : "text-gray-300 hover:text-white hover:bg-surface-hover"
              }`}
            >
              <QrCode className="w-4 h-4 text-primary" />
              <span>Tables & QR Standees</span>
            </Link>

            {/* Staff */}
            <Link
              href="/restaurant/staff"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors ${
                pathname.includes("/restaurant/staff")
                  ? "bg-primary text-background font-bold shadow-md shadow-primary/20"
                  : "text-gray-300 hover:text-white hover:bg-surface-hover"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Staff & Roles</span>
            </Link>


            {/* Settlements */}
            <Link
              href="/restaurant/settlements"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors ${
                pathname.includes("/restaurant/settlements")
                  ? "bg-primary text-background font-bold shadow-md shadow-primary/20"
                  : "text-gray-300 hover:text-white hover:bg-surface-hover"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Settlement Payouts</span>
            </Link>

            {/* Onboarding */}
            <Link
              href="/restaurant/onboarding"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors ${
                pathname.includes("/restaurant/onboarding")
                  ? "bg-primary text-background font-bold shadow-md shadow-primary/20"
                  : "text-gray-300 hover:text-white hover:bg-surface-hover"
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-sky-400" />
              <span>Onboarding Pipeline</span>
            </Link>

            {/* Settings */}
            <Link
              href="/restaurant/settings"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors ${
                pathname.includes("/restaurant/settings")
                  ? "bg-primary text-background font-bold shadow-md shadow-primary/20"
                  : "text-gray-300 hover:text-white hover:bg-surface-hover"
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Restaurant Settings</span>
            </Link>
          </nav>
        </div>

        {/* Footer info & Logout */}
        <div className="p-4 border-t border-surface-border flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-gray-200">{useAppSelector((state) => state.auth.userName) || "Admin"}</span>
            <span className="text-[10px] text-gray-500 font-mono">
              {useAppSelector((state) => state.auth.employeeId) || "Staff"}
            </span>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-2 text-gray-400 hover:text-red-400 rounded-lg hover:bg-surface-hover"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="px-6 py-4 glass-panel border-b border-surface-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/staff/tables"
              className="text-xs px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-hover border border-surface-border text-gray-300 flex items-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5 text-primary" />
              <span>Open Floor Grid</span>
            </Link>
            <Link
              href="/kitchen/queue"
              className="text-xs px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-hover border border-surface-border text-gray-300 flex items-center gap-1.5"
            >
              <span>Kitchen KDS</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 font-mono hidden sm:inline">
              API Connected
            </span>
            <Badge variant="success" size="sm">
              Online
            </Badge>
          </div>
        </header>

        <main className="p-6 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
    </RoleGuard>
  );
}
