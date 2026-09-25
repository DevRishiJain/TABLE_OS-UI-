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
  CheckCircle2,
  QrCode,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export default function RestaurantAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const restaurantName = useAppSelector((state) => state.auth.restaurantName) || "{restaurantName}";
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [isAnalyticsExpanded, setIsAnalyticsExpanded] = useState(true);

  const handleLogout = () => {
    dispatch(logoutStaff());
    router.push("/login");
  };

  const analyticsSubLinks = [
    { href: "/restaurant/analytics/today", label: "Today's Curve", icon: Clock },
    {
      href: "/restaurant/analytics/month-to-date",
      label: "Month-to-Date",
      icon: TrendingUp,
    },
    {
      href: "/restaurant/analytics/compare",
      label: "Period Compare",
      icon: Calendar,
    },
    {
      href: "/restaurant/analytics/peak-hours",
      label: "Peak Hours Heatmap",
      icon: Flame,
    },
    {
      href: "/restaurant/analytics/forecast",
      label: "Sales Forecast",
      icon: Sparkles,
    },
    {
      href: "/restaurant/analytics/table-performance",
      label: "Table Turn-Time",
      icon: Layers2,
    },
    {
      href: "/restaurant/analytics/menu-performance",
      label: "Menu Velocity",
      icon: PieChart,
    },
  ];

  return (
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

            {/* Analytics Accordion */}
            <div className="flex flex-col gap-1 pt-2">
              <button
                onClick={() => setIsAnalyticsExpanded(!isAnalyticsExpanded)}
                className="flex items-center justify-between px-3.5 py-2 text-gray-400 hover:text-gray-200 text-xs font-bold uppercase tracking-wider"
              >
                <div className="flex items-center gap-2">
                  <LineChart className="w-4 h-4 text-primary" />
                  <span>Analytics Suite (7)</span>
                </div>
                <ChevronRight
                  className={`w-3.5 h-3.5 transition-transform ${
                    isAnalyticsExpanded ? "rotate-90" : ""
                  }`}
                />
              </button>

              {isAnalyticsExpanded && (
                <div className="flex flex-col gap-1 pl-4 border-l border-surface-border/60 ml-3 my-1">
                  {analyticsSubLinks.map((sub) => {
                    const SubIcon = sub.icon;
                    const isActive = pathname === sub.href;
                    return (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] transition-colors ${
                          isActive
                            ? "text-primary font-bold bg-primary/10"
                            : "text-gray-400 hover:text-gray-200 hover:bg-surface-hover"
                        }`}
                      >
                        <SubIcon className="w-3.5 h-3.5" />
                        <span>{sub.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

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

            {/* Platform Fee Ledger */}
            <Link
              href="/restaurant/ledger"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors ${
                pathname.includes("/restaurant/ledger")
                  ? "bg-primary text-background font-bold shadow-md shadow-primary/20"
                  : "text-gray-300 hover:text-white hover:bg-surface-hover"
              }`}
            >
              <Receipt className="w-4 h-4 text-emerald-400" />
              <span>1% Platform Fee Ledger</span>
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
            <span className="text-xs font-bold text-gray-200">Vikram Mehta</span>
            <span className="text-[10px] text-gray-500 font-mono">
              admin@spiceroute.com
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
              Host: 54.146.192.20:8088
            </span>
            <Badge variant="success" size="sm">
              Online
            </Badge>
          </div>
        </header>

        <main className="p-6 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
