"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store";
import { StaffRole } from "@/types/enums";
import { ShieldAlert, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface RoleGuardProps {
  allowedRoles: StaffRole[];
  fallbackRedirect?: string;
  portalName?: string;
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  allowedRoles,
  fallbackRedirect,
  portalName = "Restricted Operations Portal",
  children,
}) => {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const auth = useAppSelector((state) => state.auth);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine current effective role (check Redux first, fallback to localStorage)
  const currentRole: StaffRole | null = ((): StaffRole | null => {
    if (auth.staffRole) return auth.staffRole;
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("tableos_staff_role");
      if (stored) return stored as StaffRole;
    }
    return null;
  })();

  const token = ((): string | null => {
    if (auth.staffToken) return auth.staffToken;
    if (typeof window !== "undefined") {
      return localStorage.getItem("tableos_staff_token");
    }
    return null;
  })();

  const isPlatformAdmin = auth.isPlatformAdmin || (typeof window !== "undefined" && localStorage.getItem("tableos_is_platform") === "true");

  // Determine authorization
  const isAuthorized = ((): boolean => {
    if (!token) return false;
    // Platform super admin can access all portals
    if (isPlatformAdmin) return true;
    if (!currentRole) return false;
    return allowedRoles.includes(currentRole);
  })();

  // Suggested redirect destination based on current role
  const getRoleRedirectUrl = (role: StaffRole | null): string => {
    if (fallbackRedirect) return fallbackRedirect;
    if (!role) return "/login";
    switch (role) {
      case StaffRole.WAITER:
        return "/staff/orders";
      case StaffRole.CASHIER:
        return "/staff/payments";
      case StaffRole.KITCHEN:
        return "/kitchen/queue";
      case StaffRole.FRANCHISE_OWNER:
        return "/restaurant/franchise";
      case StaffRole.MANAGER:
      case StaffRole.RESTAURANT_ADMIN:
      case StaffRole.RESTAURANT_OWNER:
        return "/restaurant/dashboard";
      case StaffRole.SUPER_ADMIN:
        return "/spadmin";
      case StaffRole.GUARD:
        return "/guard/scan";
      default:
        return "/login";
    }
  };

  useEffect(() => {
    if (!mounted) return;
    if (!isAuthorized) {
      const target = getRoleRedirectUrl(currentRole);
      const timer = setTimeout(() => {
        router.replace(target);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [mounted, isAuthorized, currentRole]);

  // Loading state during SSR / hydration
  if (!mounted) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-gray-400">
        <Loader2 className="w-7 h-7 animate-spin text-primary" />
        <span className="text-xs font-mono">Verifying staff authorization...</span>
      </div>
    );
  }

  // Unauthorized Access Screen
  if (!isAuthorized) {
    const redirectUrl = getRoleRedirectUrl(currentRole);
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mb-4 shadow-lg shadow-red-500/10 animate-bounce">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold font-display text-gray-100">
          Access Restricted
        </h2>
        <p className="text-xs text-gray-400 mt-2 leading-relaxed">
          Your current profile (<strong>{currentRole || "Unauthenticated"}</strong>) does not have permission to view the <strong>{portalName}</strong>.
        </p>

        <div className="mt-6 flex flex-col gap-2 w-full">
          <Button
            variant="gold"
            onClick={() => router.replace(redirectUrl)}
            className="w-full font-bold"
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Go to {currentRole ? `${currentRole} Station` : "Staff Login"}
          </Button>
          <Button
            variant="ghost"
            onClick={() => router.replace("/login")}
            className="w-full text-xs text-gray-400 hover:text-white"
          >
            Switch Staff Account
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
