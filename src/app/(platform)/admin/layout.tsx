"use client";

import React from "react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { StaffRole } from "@/types/enums";

export default function PlatformAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard
      allowedRoles={[StaffRole.SUPER_ADMIN]}
      portalName="Platform Super-Admin Governance Suite"
      fallbackRedirect="/spadmin/login"
    >
      {children}
    </RoleGuard>
  );
}
