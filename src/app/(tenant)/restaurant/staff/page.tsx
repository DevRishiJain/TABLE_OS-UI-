"use client";

import React, { useState } from "react";
import {
  useGetStaffRosterQuery,
  useCreateStaffMemberMutation,
  useUpdateStaffPasswordMutation,
} from "@/store/api/restaurantApi";
import { StaffUser } from "@/types/domain";

export default function RestaurantStaffPage() {
  const { data: staffList, isLoading, refetch } = useGetStaffRosterQuery();
  const [createStaffMember, { isLoading: isCreating }] = useCreateStaffMemberMutation();
  const [updateStaffPassword, { isLoading: isUpdatingPassword }] = useUpdateStaffPasswordMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [passwordModalStaff, setPasswordModalStaff] = useState<StaffUser | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("WAITER");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const roster = staffList || [];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2400);
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !role) return;

    try {
      await createStaffMember({
        name: name.trim(),
        role: role as any,
        phone: phone.trim() || "",
        email: email.trim() || "",
        password: password.trim() || "tableos123",
      }).unwrap();

      setIsModalOpen(false);
      setName("");
      setPhone("");
      setEmail("");
      setPassword("");
      showToast("Staff added. Login ID generated.");
      refetch();
    } catch (err) {
      console.error("Failed to create staff:", err);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalStaff || !newPassword.trim()) return;

    try {
      await updateStaffPassword({
        staffId: passwordModalStaff.id,
        password: newPassword.trim(),
      }).unwrap();

      showToast(`Password updated for ${passwordModalStaff.name}`);
      setPasswordModalStaff(null);
      setNewPassword("");
    } catch (err) {
      console.error("Failed to update password:", err);
    }
  };

  const getRoleBadge = (r: string) => {
    switch (r?.toUpperCase()) {
      case "ADMIN":
      case "RESTAURANT_ADMIN":
      case "OWNER":
      case "RESTAURANT_OWNER":
        return <span className="pill c-a">Admin</span>;
      case "MANAGER":
        return <span className="pill c-v">Manager</span>;
      case "CHEF":
      case "KITCHEN":
      case "KITCHEN_STAFF":
        return <span className="pill c-r">Kitchen</span>;
      case "WAITER":
      case "FLOOR_STAFF":
        return <span className="pill c-b">Waiter</span>;
      case "CASHIER":
        return <span className="pill c-g">Cashier</span>;
      case "GUARD":
      case "SECURITY":
        return <span className="pill c-g">Security</span>;
      default:
        return <span className="pill">{r}</span>;
    }
  };

  return (
    <>
      {/* Toast Notification */}
      <div className={`toast ${toastMessage ? "on" : ""}`} role="status">
        {toastMessage}
      </div>

      {/* Header Bar */}
      <div className="hd">
        <div>
          <h1>Staff</h1>
          <p>Team, roles and logins · {roster.length} registered members</p>
        </div>
        <div className="sp"></div>
        <button className="btn" onClick={() => setIsModalOpen(true)}>
          <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
          Add staff
        </button>
      </div>

      {/* Roster Table */}
      <div className="cd tw">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Role</th>
              <th>Status</th>
              <th className="ac">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="em">
                  <b>Loading staff roster…</b>
                </td>
              </tr>
            ) : roster.length === 0 ? (
              <tr>
                <td colSpan={5} className="em">
                  <b>No staff members registered</b>
                  Add waiters, kitchen staff, managers, and security guards to generate logins.
                </td>
              </tr>
            ) : (
              roster.map((s) => (
                <tr key={s.id}>
                  <td>
                    <code>{s.employee_id || s.id.slice(0, 10)}</code>
                  </td>
                  <td>
                    <b>{s.name}</b>
                    <small>{s.email || s.phone || "No direct contact"}</small>
                  </td>
                  <td>{getRoleBadge(s.role)}</td>
                  <td>
                    <span className={`pill ${s.is_active ? "c-g" : "c-r"}`}>
                      {s.is_active ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="ac">
                    <button
                      className="btn s sm"
                      onClick={() => setPasswordModalStaff(s)}
                    >
                      Reset password
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Staff Modal */}
      {isModalOpen && (
        <div
          className="ov on"
          onClick={(e) => {
            if ((e.target as HTMLElement).classList.contains("ov")) setIsModalOpen(false);
          }}
        >
          <div className="md">
            <h3>Add staff member</h3>
            <form onSubmit={handleCreateStaff}>
              <div className="mf">
                <label className="w">
                  Full Name
                  <input
                    required
                    placeholder="e.g. Aman Verma, Chef Rajesh"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </label>

                <label>
                  Role
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="WAITER">Waiter (Floor Staff)</option>
                    <option value="KITCHEN">Kitchen Chef</option>
                    <option value="CASHIER">Cashier</option>
                    <option value="GUARD">Security Guard</option>
                    <option value="MANAGER">Manager</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </label>

                <label>
                  Email
                  <input
                    type="email"
                    placeholder="e.g. aman@spiceroute.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>

                <label>
                  Phone Number
                  <input
                    placeholder="e.g. +91 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </label>

                <label className="w">
                  Temporary Password
                  <input
                    type="password"
                    placeholder="Leave empty for default (tableos123)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </label>
              </div>

              <div className="ac" style={{ marginTop: 20 }}>
                <button
                  type="button"
                  className="btn s"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn" disabled={isCreating}>
                  {isCreating ? "Adding…" : "Add Staff"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {passwordModalStaff && (
        <div
          className="ov on"
          onClick={(e) => {
            if ((e.target as HTMLElement).classList.contains("ov")) setPasswordModalStaff(null);
          }}
        >
          <div className="md">
            <h3>Reset password</h3>
            <p className="sub" style={{ marginTop: -6, color: "var(--admin-mute)" }}>
              {passwordModalStaff.name} ({passwordModalStaff.employee_id || "Staff"})
            </p>
            <form onSubmit={handleResetPassword}>
              <div className="mf">
                <label className="w">
                  New Password
                  <input
                    required
                    type="password"
                    placeholder="Enter new login password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </label>
              </div>

              <div className="ac" style={{ marginTop: 20 }}>
                <button
                  type="button"
                  className="btn s"
                  onClick={() => setPasswordModalStaff(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn"
                  disabled={isUpdatingPassword}
                >
                  {isUpdatingPassword ? "Updating…" : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
