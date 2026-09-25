"use client";

import React, { useState } from "react";
import { useGetStaffRosterQuery, useCreateStaffMemberMutation } from "@/store/api/restaurantApi";
import { useAppDispatch } from "@/store";
import { addToast } from "@/store/slices/uiSlice";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Users,
  Plus,
  ShieldCheck,
  ChefHat,
  Utensils,
  CreditCard,
  Briefcase,
  KeyRound,
  X,
  CheckCircle2,
  Copy,
} from "lucide-react";

export default function RestaurantStaffPage() {
  const dispatch = useAppDispatch();
  const { data: staffList, isLoading, refetch } = useGetStaffRosterQuery();
  const [createStaffMember, { isLoading: isCreating }] = useCreateStaffMemberMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("WAITER");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const roster = staffList || [];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
    dispatch(
      addToast({
        type: "success",
        title: "Copied to Clipboard",
        message: text,
      })
    );
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      dispatch(
        addToast({
          type: "error",
          title: "Validation Error",
          message: "Please fill in Name, Email/Username, and Password.",
        })
      );
      return;
    }

    try {
      const created = await createStaffMember({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        password: password.trim(),
        role,
      }).unwrap();

      dispatch(
        addToast({
          type: "success",
          title: "Staff Member Provisioned!",
          message: `${created.name} assigned Employee ID: ${created.employee_id || "Generated"}`,
        })
      );

      // Reset and close
      setName("");
      setPhone("");
      setEmail("");
      setPassword("");
      setRole("WAITER");
      setIsModalOpen(false);
      refetch();
    } catch (err: any) {
      console.error("Staff creation error:", err);
      dispatch(
        addToast({
          type: "error",
          title: "Provisioning Failed",
          message: err?.data?.error || "Could not add staff member. Check credentials.",
        })
      );
    }
  };

  const getRoleBadge = (r: string) => {
    switch (r) {
      case "RESTAURANT_ADMIN":
      case "RESTAURANT_OWNER":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <Briefcase className="w-3 h-3" /> Restaurant Admin
          </span>
        );
      case "MANAGER":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
            <Users className="w-3 h-3" /> Floor Manager
          </span>
        );
      case "WAITER":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-500/15 text-sky-300 border border-sky-500/30">
            <Utensils className="w-3 h-3" /> Floor Waiter
          </span>
        );
      case "CASHIER":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <CreditCard className="w-3 h-3" /> Cashier
          </span>
        );
      case "KITCHEN":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
            <ChefHat className="w-3 h-3" /> Kitchen Staff
          </span>
        );
      case "GUARD":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-green-500/15 text-green-300 border border-green-500/30">
            <ShieldCheck className="w-3 h-3" /> Security Guard
          </span>
        );
      default:
        return <Badge variant="default">{r}</Badge>;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-gray-100 flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Staff & Employee Roster
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Provision waiters, floor captains, chefs, and cashiers with auto-generated Employee IDs and login access
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setIsModalOpen(true)}
        >
          Add Staff Member
        </Button>
      </div>

      {/* Staff Roster Card */}
      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-surface-border text-gray-400 uppercase tracking-wider text-[11px]">
                <th className="pb-3 font-semibold">Employee ID</th>
                <th className="pb-3 font-semibold">Name & Contact</th>
                <th className="pb-3 font-semibold">Assigned Role</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500">
                    Loading staff roster...
                  </td>
                </tr>
              ) : roster.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-14 text-center text-gray-400">
                    <Users className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                    <p className="font-bold text-sm text-gray-300">No staff registered yet</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Click "Add Staff Member" to create your first employee login.
                    </p>
                  </td>
                </tr>
              ) : (
                roster.map((staff, idx) => {
                  const empId = staff.employee_id || `EMP-${staff.role.slice(0, 3)}-${String(idx + 1).padStart(3, "0")}`;
                  return (
                    <tr
                      key={staff.id}
                      className="hover:bg-surface-subtle/50 transition-colors group"
                    >
                      <td className="py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-surface border border-surface-border text-primary">
                            {empId}
                          </span>
                          <button
                            onClick={() => handleCopy(empId)}
                            className="p-1 text-gray-500 hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                            title="Copy Employee ID"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5">
                        <span className="font-bold text-gray-100 block text-sm">
                          {staff.name}
                        </span>
                        <span className="text-[11px] text-gray-400 font-mono">
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
                        <span className="text-[11px] text-gray-500 font-mono">
                          {new Date(staff.created_at || Date.now()).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-surface-elevated border border-surface-border rounded-2xl p-6 shadow-2xl flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-100 font-display">
                    Add New Staff Member
                  </h3>
                  <p className="text-xs text-gray-400">
                    Generates an Employee ID and configures login credentials
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-surface-border transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="flex flex-col gap-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                    Full Name *
                  </label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Arjun Sharma"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                    Assigned Role *
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-surface border border-surface-border text-gray-200 text-xs focus:outline-none focus:border-primary"
                  >
                    <option value="WAITER">Floor Waiter (Accepts Orders & Collects Payments)</option>
                    <option value="MANAGER">Floor Manager (Full Shift Control)</option>
                    <option value="CASHIER">Cashier (POS & Bill Settlements)</option>
                    <option value="KITCHEN">Kitchen Staff (KDS Preparation Queue)</option>
                    <option value="GUARD">Exit Security Guard (Exit Verification)</option>
                    <option value="RESTAURANT_ADMIN">Restaurant Admin</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                    Login Email / Username *
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="arjun@spiceroute.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                    Phone Number
                  </label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-300 mb-1 flex items-center justify-between">
                  <span>Login Password *</span>
                  <button
                    type="button"
                    onClick={() => setPassword("Pass" + Math.floor(100000 + Math.random() * 900000) + "!")}
                    className="text-[10px] text-primary hover:underline"
                  >
                    Generate Random
                  </button>
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                />
              </div>

              {/* Employee ID Preview Banner */}
              <div className="p-3 rounded-xl bg-surface border border-surface-border flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-gray-400 block">Auto-Generated Employee ID</span>
                  <span className="text-xs font-mono font-bold text-primary">
                    EMP-{role.slice(0, 3)}-00{roster.filter(s => s.role === role).length + 1}
                  </span>
                </div>
                <span className="text-[10px] text-gray-500 italic">
                  Assigned automatically upon creation
                </span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-surface-border mt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isCreating}
                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                >
                  Provision Staff Member
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
