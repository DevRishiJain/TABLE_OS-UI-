"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/store";
import { setStaffAuth, logoutStaff } from "@/store/slices/authSlice";
import { useStaffLoginMutation } from "@/store/api/staffApi";
import { Sparkles, Lock, Mail, ArrowRight, ShieldCheck } from "lucide-react";

export default function SpAdminLoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [staffLogin, { isLoading }] = useStaffLoginMutation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    try {
      const res = await staffLogin({
        identifier: email.trim(),
        password,
      }).unwrap();

      const role = res?.staff?.role;
      if (role !== "SUPER_ADMIN" && !(res.staff as any)?.is_platform) {
        // Reject non-super-admin tokens — do not keep their session
        dispatch(logoutStaff());
        setError("Platform super-admin credentials required.");
        return;
      }

      dispatch(
        setStaffAuth({
          token: res.token,
          role: "SUPER_ADMIN" as any,
          isPlatformAdmin: true,
          staffId: res.staff.id,
          employeeId: res.staff.employee_id || "",
          restaurantId: res.staff.restaurant_id || "",
          restaurantName: (res.staff as any).restaurant_name || "TableOS Platform",
          userName: res.staff.name || email.split("@")[0],
        })
      );
      router.replace("/spadmin");
    } catch (err: any) {
      setError(err?.data?.error || "Sign-in failed. Check your credentials.");
    }
  };

  const inputCls =
    "w-full px-4 py-3 rounded-xl bg-[#0A0C0E] border border-[#2A303C] text-sm text-gray-100 focus:outline-none focus:border-amber-400 transition-colors";

  return (
    <div className="min-h-screen bg-[#0A0C0E] text-gray-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#121418] border border-[#2A303C] rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="font-display font-extrabold text-amber-300 text-sm">
              TableOS Governance
            </div>
            <div className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">
              Platform Super-Admin
            </div>
          </div>
        </div>

        <h1 className="text-lg font-bold text-white mb-1">Sign in</h1>
        <p className="text-xs text-gray-400 mb-6">
          Cross-tenant console — restricted to TableOS platform staff.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold text-gray-300 block mb-1.5">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@tableos.com"
                className={`${inputCls} pl-10`}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-300 block mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`${inputCls} pl-10`}
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="mt-1 py-3 w-full rounded-xl bg-amber-400 text-black font-extrabold text-sm flex items-center justify-center gap-2 hover:bg-amber-300 transition-all disabled:opacity-50"
          >
            {isLoading ? "Verifying…" : "Access Console"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 flex items-center gap-2 text-[10px] text-gray-500 font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          Non-super-admin accounts are rejected automatically.
        </div>
      </div>

      <Link
        href="/login"
        className="mt-6 text-xs text-gray-500 hover:text-gray-300 transition-colors"
      >
        ← Staff login
      </Link>
    </div>
  );
}
