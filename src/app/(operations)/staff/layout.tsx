"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store";
import { logoutStaff } from "@/store/slices/authSlice";
import {
  Layers,
  ClipboardList,
  Banknote,
  LogOut,
  Utensils,
  ChefHat,
  Shield,
  LayoutDashboard,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export default function StaffOperationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const userName = useAppSelector((state) => state.auth.userName) || "Floor Staff";
  const staffRole = useAppSelector((state) => state.auth.staffRole) || "WAITER";
  const employeeId = useAppSelector((state) => state.auth.employeeId);

  const handleLogout = () => {
    dispatch(logoutStaff());
    router.push("/login");
  };

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

  return (
    <div className="min-h-screen bg-background text-gray-100 flex flex-col">
      {/* Staff Operational Topbar */}
      <header className="sticky top-0 z-40 glass-panel border-b border-surface-border px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/staff/tables" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary shadow-glow">
              <Utensils className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-gray-100 font-display">
                The Spice Route
              </span>
              <span className="text-[10px] text-gray-400 font-mono">
                Floor Operations Suite
              </span>
            </div>
          </Link>
          <Badge variant="amber" size="sm" suppressHydrationWarning>
            {mounted ? staffRole : "WAITER"}
          </Badge>
          {mounted && employeeId && (
            <span
              className="hidden sm:inline px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-primary/20 text-primary border border-primary/40"
            >
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

        {/* Cross-Link Tools & Logout */}
        <div className="flex items-center gap-3">
          <Link
            href="/kitchen/queue"
            title="Open Kitchen KDS"
            className="p-2 rounded-xl bg-surface-subtle hover:bg-surface-hover border border-surface-border text-amber-400 text-xs flex items-center gap-1"
          >
            <ChefHat className="w-4 h-4" />
            <span className="hidden sm:inline">KDS</span>
          </Link>

          <Link
            href="/restaurant/dashboard"
            title="Open Admin Dashboard"
            className="p-2 rounded-xl bg-surface-subtle hover:bg-surface-hover border border-surface-border text-gray-300 text-xs flex items-center gap-1"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="hidden sm:inline">Admin</span>
          </Link>

          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400"
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
              link.active ? "bg-primary text-background font-bold" : "text-gray-400"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>

      {/* Main Operations Body */}
      <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
