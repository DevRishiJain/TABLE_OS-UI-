"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppDispatch } from "@/store";
import { logoutStaff } from "@/store/slices/authSlice";
import {
  Building2,
  LineChart,
  ShieldAlert,
  LogOut,
  Sparkles,
  QrCode,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export default function PlatformAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const handleLogout = () => {
    dispatch(logoutStaff());
    router.push("/login");
  };

  const navLinks = [
    {
      href: "/admin/restaurants",
      label: "Tenant Directory",
      icon: Building2,
      active: pathname === "/admin/restaurants",
    },
    {
      href: "/admin/analytics",
      label: "Network Analytics",
      icon: LineChart,
      active: pathname.includes("/admin/analytics"),
    },
    {
      href: "/admin/fraud-review",
      label: "Fraud & Risk Queue",
      icon: ShieldAlert,
      active: pathname.includes("/admin/fraud-review"),
    },
  ];

  return (
    <div className="min-h-screen bg-[#0A0C0E] text-gray-100 flex flex-col">
      {/* Super Admin Gold/Charcoal Header */}
      <header className="sticky top-0 z-40 bg-[#121418] border-b border-[#2A303C] px-6 py-3.5 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <Link href="/admin/restaurants" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center justify-center font-bold shadow-[0_0_15px_rgba(251,191,36,0.2)]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-extrabold text-sm text-amber-300">
                TableOS Governance
              </span>
              <span className="text-[10px] text-gray-400 font-mono tracking-wider uppercase">
                Platform Super-Admin
              </span>
            </div>
          </Link>
          <Badge variant="gold" size="sm">
            Cross-Tenant Scope
          </Badge>
        </div>

        {/* Links */}
        <nav className="hidden md:flex items-center gap-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  link.active
                    ? "bg-amber-400 text-black shadow-md shadow-amber-400/20"
                    : "text-gray-300 hover:text-white hover:bg-surface-hover"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Link
            href="/restaurant/dashboard"
            className="text-xs text-gray-400 hover:text-gray-200 px-3 py-1.5 rounded-lg bg-surface border border-surface-border"
          >
            Switch to Tenant View
          </Link>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-2 text-gray-400 hover:text-red-400 rounded-lg hover:bg-surface-hover"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Admin Content */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">{children}</main>
    </div>
  );
}
