"use client";

import React, { useState } from "react";
import { useGetSubscriptionInfoQuery, useRenewSubscriptionMutation } from "@/store/api/staffApi";
import { Lock, ShieldAlert, CheckCircle2, ArrowRight, Sparkles } from "lucide-react";

export function SubscriptionLockModal() {
  const { data: subInfo, isLoading } = useGetSubscriptionInfoQuery();
  const [renewSubscription, { isLoading: isRenewing }] = useRenewSubscriptionMutation();
  const [msg, setMsg] = useState("");

  if (isLoading || !subInfo) {
    return null; // Let app load normally
  }

  // Only show modal if subscription is explicitly inactive/expired
  if (subInfo.is_active !== false && subInfo.days_remaining > 0) {
    return null;
  }

  const handleRenew = async () => {
    try {
      const res = await renewSubscription({ days: 30 }).unwrap();
      setMsg(res.message || "Subscription successfully renewed!");
    } catch (err: any) {
      console.error("Renewal failed:", err);
      setMsg("Renewal failed. Please try again.");
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

        <button
          type="button"
          onClick={handleRenew}
          disabled={isRenewing}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isRenewing ? (
            "Processing Renewal..."
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Renew Subscription (30 Days)
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
