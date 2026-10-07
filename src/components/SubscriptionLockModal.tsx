"use client";

import React, { useState } from "react";
import { useGetSubscriptionInfoQuery, useRenewSubscriptionMutation } from "@/store/api/staffApi";
import { useAppSelector } from "@/store";
import { Lock, CheckCircle2, ArrowRight, KeyRound } from "lucide-react";

const RENEW_ROLES = new Set([
  "RESTAURANT_OWNER",
  "RESTAURANT_ADMIN",
  "FRANCHISE_OWNER",
  "MANAGER",
  "SUPER_ADMIN",
]);

export function SubscriptionLockModal() {
  const { data: subInfo, isLoading, refetch } = useGetSubscriptionInfoQuery();
  const [renewSubscription, { isLoading: isRenewing }] = useRenewSubscriptionMutation();
  const userRole = useAppSelector((state) => state.auth.staffRole);
  const [otp, setOtp] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  if (isLoading || !subInfo) {
    return null; // Let app load normally
  }

  // Only show modal if subscription is explicitly inactive/expired
  if (subInfo.is_active !== false && subInfo.days_remaining > 0) {
    return null;
  }

  const canRenew = RENEW_ROLES.has((userRole || "").toUpperCase());

  const handleRenew = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const code = otp.trim();
    if (!/^\d{6}$/.test(code)) {
      setErr("Enter the 6-digit activation OTP shared by TableOS support.");
      return;
    }
    setErr("");
    setMsg("");
    try {
      const res = await renewSubscription({ otp: code }).unwrap();
      setMsg(res.message || "Subscription successfully renewed!");
      refetch();
    } catch (e2: any) {
      setErr(
        e2?.data?.error ||
          (e2?.status === 429
            ? "Too many failed attempts — OTP locked. Request a new one."
            : "Renewal failed. Please try again.")
      );
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-2xl text-slate-100 relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3 mb-4">
          <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Lock className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-white">Subscription Expired</h3>
            <p className="text-xs text-amber-400/90 font-medium">Operational Access Locked</p>
          </div>
        </div>

        <p className="text-sm text-slate-300 mb-6 leading-relaxed">
          Your restaurant's <span className="font-semibold text-white">{subInfo.subscription_plan || "PRO"}</span> subscription ended.
          Floor staff, POS ordering, and kitchen operations are paused until payment renewal.
        </p>

        {msg && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{msg}</span>
          </div>
        )}

        <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800 mb-6 space-y-2 text-xs">
          <div className="flex justify-between text-slate-400">
            <span>Restaurant Name</span>
            <span className="font-semibold text-white">{subInfo.restaurant_name}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Status</span>
            <span className="font-semibold text-red-400">Expired</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Days Remaining</span>
            <span className="font-semibold text-amber-400">{subInfo.days_remaining} Days</span>
          </div>
        </div>

        {canRenew ? (
          <form onSubmit={handleRenew} className="space-y-3">
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Pay TableOS for the selected plan; our team will share a 6-digit activation OTP.
            </p>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="Activation OTP"
              className="w-full py-2.5 px-4 rounded-xl bg-slate-950/60 border border-slate-700 text-center text-lg tracking-[0.4em] font-mono text-amber-300 focus:outline-none focus:border-amber-400"
            />
            {err && (
              <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                {err}
              </div>
            )}
            <button
              type="submit"
              disabled={isRenewing || otp.length !== 6}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isRenewing ? (
                "Activating..."
              ) : (
                <>
                  <KeyRound className="h-4 w-4" />
                  Activate Subscription
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-700 text-xs text-slate-400 text-center">
            Contact your restaurant owner or manager to activate the subscription with a TableOS OTP.
          </div>
        )}
      </div>
    </div>
  );
}
