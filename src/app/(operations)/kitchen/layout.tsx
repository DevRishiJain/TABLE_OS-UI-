"use client";

import React from "react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { StaffRole } from "@/types/enums";

export default function KitchenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard
      allowedRoles={[
        StaffRole.KITCHEN,
        StaffRole.MANAGER,
        StaffRole.RESTAURANT_ADMIN,
        StaffRole.RESTAURANT_OWNER,
        StaffRole.SUPER_ADMIN,
      ]}
      portalName="Kitchen Display System (KDS)"
      fallbackRedirect="/staff/orders"
    >
      <div className="kitchen-root-wrapper w-full min-h-screen">
        {children}
      </div>
    </RoleGuard>
  );
}
