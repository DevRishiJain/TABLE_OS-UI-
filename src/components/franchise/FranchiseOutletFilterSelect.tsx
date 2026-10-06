"use client";

import React from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import { setSelectedOutlet } from "@/store/slices/franchiseSlice";
import { StaffRole } from "@/types/enums";

export const FranchiseOutletFilterSelect: React.FC = () => {
  const dispatch = useAppDispatch();
  const staffRole = useAppSelector((state) => state.auth.staffRole);
  const { selectedOutletId, outlets } = useAppSelector(
    (state) => state.franchise
  );

  const isFranchiseOrSuper =
    staffRole === StaffRole.FRANCHISE_OWNER ||
    staffRole === StaffRole.SUPER_ADMIN ||
    (staffRole || "").toUpperCase().includes("FRANCHISE") ||
    (staffRole || "").toUpperCase().includes("SUPER");

  if (!isFranchiseOrSuper) return null;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--admin-mute)" }}>
        Store Filter:
      </label>
      <select
        value={selectedOutletId}
        onChange={(e) => dispatch(setSelectedOutlet(e.target.value))}
        style={{
          padding: "6px 10px",
          borderRadius: "8px",
          border: "1px solid var(--admin-bd)",
          background: "var(--admin-pa)",
          color: "var(--admin-fg)",
          fontSize: "0.78rem",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        <option value="ALL">🌐 All Franchise Outlets (Combined)</option>
        {outlets.map((o) => (
          <option key={o.id} value={o.id}>
            📍 {o.name}
          </option>
        ))}
      </select>
    </div>
  );
};
