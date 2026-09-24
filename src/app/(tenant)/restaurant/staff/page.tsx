"use client";

import React from "react";
import { useGetStaffRosterQuery } from "@/store/api/restaurantApi";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Users, Plus } from "lucide-react";

export default function RestaurantStaffPage() {
  const { data: staffList, isLoading } = useGetStaffRosterQuery();

  const roster = staffList || [];

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "RESTAURANT_ADMIN":
        return <Badge variant="gold">Restaurant Admin</Badge>;
      case "WAITER":
        return <Badge variant="blue">Floor Waiter</Badge>;
      case "KITCHEN":
        return <Badge variant="amber">Head Chef</Badge>;
      case "GUARD":
        return <Badge variant="success">Security Guard</Badge>;
      default:
        return <Badge variant="default">{role}</Badge>;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-gray-100 flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Staff Roster & Permissions
          </h1>
          <p className="text-xs text-gray-400">
            Waiters, kitchen line chefs, and security personnel
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Invite Staff Member
        </Button>
      </div>

      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-surface-border text-gray-400 uppercase tracking-wider">
                <th className="pb-3 font-semibold">Name & Contact</th>
                <th className="pb-3 font-semibold">Assigned Role</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/50">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-500">
                    Loading staff roster...
                  </td>
                </tr>
              ) : roster.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-gray-500">
                    No staff members found. Use the invite button above to add
                    team members.
                  </td>
                </tr>
              ) : (
                roster.map((staff) => (
                  <tr
                    key={staff.id}
                    className="hover:bg-surface-subtle/50 transition-colors"
                  >
                    <td className="py-3.5">
                      <span className="font-bold text-gray-200 block text-sm">
                        {staff.name}
                      </span>
                      <span className="text-[11px] text-gray-500 font-mono">
                        {staff.email} {staff.phone ? `• ${staff.phone}` : ""}
                      </span>
                    </td>
                    <td className="py-3.5">{getRoleBadge(staff.role)}</td>
                    <td className="py-3.5">
                      <Badge
                        variant={staff.is_active ? "success" : "default"}
                        size="sm"
                        dot
                      >
                        {staff.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="py-3.5 text-right">
                      <button className="text-xs text-primary hover:underline font-semibold">
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
