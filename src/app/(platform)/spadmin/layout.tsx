"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppDispatch } from "@/store";
import { logoutStaff } from "@/store/slices/authSlice";
import {
  LayoutDashboard,
  Building2,
  Store,
  Activity,
  ShieldAlert,
  LogOut,
  Sparkles,
} from "lucide-react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { StaffRole } from "@/types/enums";

export default function SpAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();

  // Login page lives under /spadmin but must render without the guard/nav
  if (pathname === "/spadmin/login") {
    return <>{children}</>;
  }

  const handleLogout = () => {
    dispatch(logoutStaff());
    router.push("/spadmin/login");
  };

  const navLinks = [
    { href: "/spadmin", label: "Overview", icon: LayoutDashboard, active: pathname === "/spadmin" },
    {
      href: "/spadmin/restaurants",
      label: "Restaurants",
      icon: Building2,
      active: pathname.startsWith("/spadmin/restaurants"),
    },
    {
      href: "/spadmin/franchises",
      label: "Franchises",
      icon: Store,
      active: pathname.startsWith("/spadmin/franchises"),
    },
    {
      href: "/spadmin/activity",
      label: "Live Activity",
      icon: Activity,
      active: pathname.startsWith("/spadmin/activity"),
    },
    {
      href: "/spadmin/fraud",
      label: "Fraud & Risk",
      icon: ShieldAlert,
      active: pathname.startsWith("/spadmin/fraud"),
    },
  ];

  return (
    <RoleGuard
      allowedRoles={[StaffRole.SUPER_ADMIN]}
      portalName="Platform Super-Admin Governance Suite"
      fallbackRedirect="/spadmin/login"
    >
      <div className="min-h-screen bg-[#0A0C0E] text-gray-100 flex flex-col">
        <header className="sticky top-0 z-40 bg-[#121418] border-b border-[#2A303C] px-6 py-3.5 flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-3">
            <Link href="/spadmin" className="flex items-center gap-2.5">
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
          </div>

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
                      : "text-gray-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              title="Sign out"
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-400 px-3 py-1.5 rounded-lg hover:bg-white/5"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Mobile nav */}
        <nav className="md:hidden flex gap-1 overflow-x-auto px-4 py-2 border-b border-[#2A303C] bg-[#121418]">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${
                  link.active ? "bg-amber-400 text-black" : "text-gray-400"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <main className="flex-1 p-6 w-full max-w-[1400px] mx-auto">{children}</main>
      </div>
    </RoleGuard>
  );
}
